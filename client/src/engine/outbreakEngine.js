import { bfsTick, bfsDistance, isHospitalReachable, wallKey } from "../algorithms/Bfs.js";
import { generateCity, getCityStats } from "./cityGenerator.js";
import { calculateScore } from "./scoring.js";
import {
  TICK_INTERVAL_MS,
  PREP_TIME_SEC,
  MAX_ROUND_SEC,
  MAX_LIVES,
  TOOLS,
} from "../constants.js";

/**
 * OUTBREAK ENGINE — Step 2
 *
 * The central game state machine. Manages everything that happens
 * during a round: prep countdown, BFS ticks, tool use, win/loss detection.
 *
 * Architecture:
 *   - Pure functions only — no React state, no side effects
 *   - The React hook (useGameLoop.js, Step 3) drives the engine by calling
 *     tick() on a setInterval and dispatching tool actions
 *   - All state is in a single plain object (GameState) that gets
 *     replaced on every update (immutable-style updates)
 *
 * State machine phases:
 *   "idle"      → waiting for player to start
 *   "prep"      → countdown before outbreak begins (player places walls)
 *   "outbreak"  → BFS ticking, player can still use tools
 *   "won"       → hospital survived, outbreak burned out
 *   "lost"      → hospital was infected
 *   "gameover"  → all lives spent
 */

// ─── INITIAL STATE ───────────────────────────────────────────────────────────
/**
 * Creates a fresh GameState for a new round.
 *
 * @param {string} difficulty
 * @param {string} playerName
 * @param {number} lives       - remaining lives (carries over between rounds)
 * @param {number} totalScore  - cumulative score (carries over)
 * @param {number} round       - current round number (1-indexed)
 * @returns {GameState}
 */
export function createGameState(
  difficulty = "medium",
  playerName = "Player",
  lives = MAX_LIVES,
  totalScore = 0,
  round = 1
) {
  const city = generateCity(difficulty);

  return {
    // Identity
    playerName,
    difficulty,
    round,

    // City
    grid:           city.grid,
    rows:           city.rows,
    cols:           city.cols,
    hospitalKey:    city.hospitalKey,
    patientZeroKey: city.patientZeroKey,
    seed:           city.seed,

    // Tools — remaining budget
    toolsLeft: { ...city.toolBudgets },
    activeTool: "wall",              // which tool the player has selected

    // Walls — Set of normalised "keyA|keyB" strings
    walls: new Set(),

    // Phase + timing
    phase:        "prep",            // see phases above
    prepSecsLeft: PREP_TIME_SEC,
    elapsedSec:   0,
    waveCount:    0,                 // how many BFS waves have fired

    // Lives + score
    lives,
    totalScore,
    roundScore:   0,

    // Outcome
    hospitalHit:  false,

    // Log — array of { sec, message } entries shown in HUD
    log: [
      { sec: 0, message: "Outbreak detected. Prepare defences." },
    ],
  };
}

// ─── TICK — called every TICK_INTERVAL_MS ────────────────────────────────────
/**
 * Advances the game by one tick. Returns a new state object.
 *
 * During "prep":   counts down the prep timer, then switches to "outbreak"
 * During "outbreak": fires one BFS wave, checks win/loss conditions
 *
 * Immutable update pattern:
 *   const next = tick(current);
 *   setState(next);
 *
 * @param {GameState} state
 * @returns {GameState}
 */
export function tick(state) {
  if (state.phase === "prep") return tickPrep(state);
  if (state.phase === "outbreak") return tickOutbreak(state);
  return state;
}

function tickPrep(state) {
  const prepSecsLeft = state.prepSecsLeft - 1;

  if (prepSecsLeft <= 0) {
    return {
      ...state,
      phase: "outbreak",
      prepSecsLeft: 0,
      log: addLog(state.log, state.elapsedSec, "Outbreak started! BFS wave 1."),
    };
  }

  return {
    ...state,
    prepSecsLeft,
    elapsedSec: state.elapsedSec + 1,
  };
}

function tickOutbreak(state) {
  const elapsedSec = state.elapsedSec + 1;

  // Run one BFS wave
  const now = elapsedSec * TICK_INTERVAL_MS;
  const result = bfsTick(state.grid, state.walls, state.rows, state.cols, now);

  // Apply newly infected buildings to the grid (immutable map copy)
  const newGrid = new Map(state.grid);
  for (const key of result.newlyInfected) {
    const building = { ...newGrid.get(key) };
    building.infected   = true;
    building.infectedAt = now;
    newGrid.set(key, building);
  }

  const waveCount = state.waveCount + 1;
  let log = state.log;

  if (result.newlyInfected.length > 0) {
    log = addLog(log, elapsedSec,
      `Wave ${waveCount}: ${result.newlyInfected.length} building${result.newlyInfected.length > 1 ? "s" : ""} infected.`
    );
  }

  // ── Loss condition: hospital infected ──
  if (result.hospitalHit) {
    const newLives = state.lives - 1;
    const phase = newLives <= 0 ? "gameover" : "lost";
    return {
      ...state,
      grid: newGrid,
      waveCount,
      elapsedSec,
      hospitalHit: true,
      lives: newLives,
      phase,
      log: addLog(log, elapsedSec, "HOSPITAL INFECTED. Round lost."),
    };
  }

  // ── Win condition: no more BFS expansion possible ──
  const stats = getCityStats(newGrid);
  const outbreakDead = result.newlyInfected.length === 0 &&
    !canStillSpread(newGrid, state.walls, state.rows, state.cols);

  if (outbreakDead || elapsedSec >= MAX_ROUND_SEC) {
    const roundScore = calculateScore({
      difficulty:    state.difficulty,
      pctClean:      stats.pctClean,
      toolsLeft:     state.toolsLeft,
      toolBudgets:   state.toolsLeft,
      wavessurvived: waveCount,
      secsRemaining: Math.max(0, MAX_ROUND_SEC - elapsedSec),
    });

    return {
      ...state,
      grid: newGrid,
      waveCount,
      elapsedSec,
      phase: "won",
      roundScore,
      totalScore: state.totalScore + roundScore,
      log: addLog(log, elapsedSec,
        `Outbreak contained! +${roundScore.toLocaleString()} pts`
      ),
    };
  }

  // ── Warn if hospital is now reachable ──
  const atRisk = isHospitalReachable(
    newGrid, state.walls, state.hospitalKey, state.rows, state.cols
  );
  if (atRisk && waveCount % 3 === 0) {
    const dist = bfsDistance(state.hospitalKey, newGrid, state.walls, state.rows, state.cols);
    if (dist !== null && dist <= 3) {
      log = addLog(log, elapsedSec,
        `⚠ Hospital at risk — ${dist} wave${dist > 1 ? "s" : ""} away!`
      );
    }
  }

  return {
    ...state,
    grid: newGrid,
    waveCount,
    elapsedSec,
    log,
  };
}

// ─── TOOL ACTIONS ─────────────────────────────────────────────────────────────
/**
 * Places a quarantine wall between two adjacent buildings.
 * Severs the BFS edge — the outbreak cannot cross this wall.
 *
 * @param {GameState} state
 * @param {string}    keyA
 * @param {string}    keyB
 * @returns {GameState}
 */
export function placeWall(state, keyA, keyB) {
  if (state.toolsLeft.wall <= 0) return state;
  if (state.phase !== "prep" && state.phase !== "outbreak") return state;

  const wKey = wallKey(keyA, keyB);
  if (state.walls.has(wKey)) return state;  // already walled

  const newWalls = new Set(state.walls);
  newWalls.add(wKey);

  return {
    ...state,
    walls: newWalls,
    toolsLeft: { ...state.toolsLeft, wall: state.toolsLeft.wall - 1 },
    log: addLog(state.log, state.elapsedSec,
      `Wall placed between ${keyA} and ${keyB}.`
    ),
  };
}

/**
 * Removes a wall between two buildings (player can undo wall placement).
 *
 * @param {GameState} state
 * @param {string}    keyA
 * @param {string}    keyB
 * @returns {GameState}
 */
export function removeWall(state, keyA, keyB) {
  const wKey = wallKey(keyA, keyB);
  if (!state.walls.has(wKey)) return state;

  const newWalls = new Set(state.walls);
  newWalls.delete(wKey);

  // Refund the wall
  return {
    ...state,
    walls: newWalls,
    toolsLeft: { ...state.toolsLeft, wall: state.toolsLeft.wall + 1 },
    log: addLog(state.log, state.elapsedSec, `Wall removed.`),
  };
}

/**
 * Deploys a hazmat team to a building.
 * If the building is infected: clears the infection and immunises it.
 * If the building is clean: pre-immunises it (BFS will skip it entirely).
 *
 * @param {GameState} state
 * @param {string}    key
 * @returns {GameState}
 */
export function deployHazmat(state, key) {
  if (state.toolsLeft.hazmat <= 0) return state;
  if (state.phase !== "prep" && state.phase !== "outbreak") return state;

  const building = state.grid.get(key);
  if (!building) return state;
  if (building.isHospital) return state;  // can't hazmat the hospital
  if (building.immune) return state;       // already immune

  const newGrid = new Map(state.grid);
  newGrid.set(key, {
    ...building,
    infected:  false,
    immune:    true,
    infectedAt: null,
  });

  const wasInfected = building.infected;

  return {
    ...state,
    grid: newGrid,
    toolsLeft: { ...state.toolsLeft, hazmat: state.toolsLeft.hazmat - 1 },
    log: addLog(state.log, state.elapsedSec,
      wasInfected
        ? `Hazmat cleared infection at ${key}.`
        : `Hazmat immunised ${key}.`
    ),
  };
}

/**
 * Drops a flare on a building.
 * Increases its spreadDelay by 2000ms — BFS waves from this building
 * happen less frequently, buying the player time.
 *
 * @param {GameState} state
 * @param {string}    key
 * @returns {GameState}
 */
export function deployFlare(state, key) {
  if (state.toolsLeft.flare <= 0) return state;
  if (state.phase !== "prep" && state.phase !== "outbreak") return state;

  const building = state.grid.get(key);
  if (!building) return state;
  if (building.flared) return state;   // one flare per building

  const newGrid = new Map(state.grid);
  newGrid.set(key, {
    ...building,
    spreadDelay: building.spreadDelay + 2000,
    flared: true,
  });

  return {
    ...state,
    grid: newGrid,
    toolsLeft: { ...state.toolsLeft, flare: state.toolsLeft.flare - 1 },
    log: addLog(state.log, state.elapsedSec,
      `Flare slowing spread from ${key}.`
    ),
  };
}

/**
 * Dispatches a tool action based on the currently active tool.
 * Called when the player clicks a building on the grid.
 *
 * @param {GameState} state
 * @param {string}    clickedKey
 * @param {string|null} adjacentKey  - required for wall placement
 * @returns {GameState}
 */
export function applyTool(state, clickedKey, adjacentKey = null) {
  switch (state.activeTool) {
    case "wall":
      if (!adjacentKey) return state;
      // Toggle: if wall exists, remove it; otherwise place it
      const wKey = wallKey(clickedKey, adjacentKey);
      if (state.walls.has(wKey)) return removeWall(state, clickedKey, adjacentKey);
      return placeWall(state, clickedKey, adjacentKey);

    case "hazmat":
      return deployHazmat(state, clickedKey);

    case "flare":
      return deployFlare(state, clickedKey);

    default:
      return state;
  }
}

/**
 * Changes the active tool.
 * @param {GameState} state
 * @param {"wall"|"hazmat"|"flare"} tool
 * @returns {GameState}
 */
export function setActiveTool(state, tool) {
  if (!TOOLS[tool]) return state;
  return { ...state, activeTool: tool };
}

// ─── ROUND TRANSITION ────────────────────────────────────────────────────────
/**
 * Starts the next round, keeping lives and total score.
 * Difficulty scales up every 2 rounds.
 *
 * @param {GameState} state
 * @returns {GameState}
 */
export function nextRound(state) {
  const round = state.round + 1;
  const difficulty =
    round <= 2 ? "easy" :
    round <= 4 ? "medium" : "hard";

  return createGameState(
    difficulty,
    state.playerName,
    state.lives,
    state.totalScore,
    round
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
/**
 * Returns true if any infected building can still spread to an uninfected
 * neighbour (i.e. the outbreak is not yet contained).
 */
function canStillSpread(grid, walls, rows, cols) {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [key, building] of grid.entries()) {
    if (!building.infected) continue;
    const { row, col } = building;
    for (const [dr, dc] of dirs) {
      const nr = row + dr, nc = col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nKey = `${nr},${nc}`;
      const neighbour = grid.get(nKey);
      if (!neighbour || neighbour.infected || neighbour.immune) continue;
      const wKey = [key, nKey].sort().join("|");
      if (!walls.has(wKey)) return true;
    }
  }
  return false;
}

/**
 * Appends a timestamped message to the event log.
 * Keeps the log capped at 20 entries to avoid memory bloat.
 */
function addLog(log, sec, message) {
  const entry = { sec, message };
  const updated = [...log, entry];
  return updated.length > 20 ? updated.slice(updated.length - 20) : updated;
}