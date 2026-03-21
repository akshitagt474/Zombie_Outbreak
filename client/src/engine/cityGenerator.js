import { GRID_SIZES, BUILDING_TYPES, TOOLS } from "../constants.js";
import { cellKey } from "../algorithms/Bfs.js";

/**
 * CITY GENERATOR — Step 2
 *
 * Procedurally generates a city grid for each round.
 *
 * Responsibilities:
 *   - Place buildings of varying types across the grid
 *   - Guarantee the hospital is never on the grid edge (harder to wall off)
 *   - Pick a Patient Zero location far from the hospital
 *   - Seed the grid differently every round using a random seed
 *   - Return the full grid Map, hospital key, patientZero key, and tool budgets
 *
 * Grid coordinate system:
 *   - Top-left is (row=0, col=0)
 *   - Buildings are identified by their "row,col" key
 *   - Adjacency is 4-directional (up/down/left/right)
 */

// ─── SEEDED PRNG ─────────────────────────────────────────────────────────────
// Simple mulberry32 — fast, seedable, good distribution.
// Using a seeded PRNG means we can recreate any city from its seed number,
// which is useful for server-side validation in Step 4.
function createRng(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── BUILDING TYPE DISTRIBUTION ──────────────────────────────────────────────
// Weighted random pick — apartments are most common, industrial least.
const TYPE_WEIGHTS = [
  { type: "apartment",  weight: 40 },
  { type: "market",     weight: 25 },
  { type: "park",       weight: 20 },
  { type: "industrial", weight: 15 },
];
const TOTAL_WEIGHT = TYPE_WEIGHTS.reduce((s, t) => s + t.weight, 0);

function pickBuildingType(rng) {
  let roll = rng() * TOTAL_WEIGHT;
  for (const { type, weight } of TYPE_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return "apartment";
}

// ─── DISTANCE HELPER ─────────────────────────────────────────────────────────
// Manhattan distance between two grid positions.
function manhattan(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

// ─── MAIN GENERATOR ──────────────────────────────────────────────────────────
/**
 * Generates a complete city grid ready for the outbreak engine.
 *
 * @param {string}  difficulty  - "easy" | "medium" | "hard"
 * @param {number}  [seed]      - optional seed; random if omitted
 * @returns {{
 *   grid:         Map<string, Building>,
 *   rows:         number,
 *   cols:         number,
 *   hospitalKey:  string,
 *   patientZeroKey: string,
 *   seed:         number,
 *   toolBudgets:  { wall: number, hazmat: number, flare: number }
 * }}
 */
export function generateCity(difficulty = "medium", seed = null) {
  const { rows, cols } = GRID_SIZES[difficulty];
  const actualSeed = seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = createRng(actualSeed);

  const grid = new Map();

  // ── Step 1: Fill every cell with a building ──
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = cellKey(r, c);
      const type = pickBuildingType(rng);
      const typeDef = BUILDING_TYPES[type];

      grid.set(key, {
        row:         r,
        col:         c,
        type,
        label:       typeDef.label,
        color:       typeDef.color,
        spreadDelay: typeDef.spreadDelay,
        infected:    false,
        immune:      false,
        isHospital:  false,
        isPatientZero: false,
        infectedAt:  null,
        flared:      false,       // true if a flare has been applied
      });
    }
  }

  // ── Step 2: Place the hospital ──
  // Must be in the inner grid (not on the edge) so the player has
  // space to build walls around it. At least 3 cells from every border.
  const margin = 3;
  const hospitalCandidates = [];
  for (let r = margin; r < rows - margin; r++) {
    for (let c = margin; c < cols - margin; c++) {
      hospitalCandidates.push({ r, c });
    }
  }
  // Pick a roughly central hospital position — not fully random,
  // so it doesn't end up in a corner of the inner zone
  const hIdx = Math.floor(hospitalCandidates.length * (0.35 + rng() * 0.3));
  const { r: hr, c: hc } = hospitalCandidates[hIdx];
  const hospitalKey = cellKey(hr, hc);

  const hospitalBuilding = grid.get(hospitalKey);
  hospitalBuilding.type       = "hospital";
  hospitalBuilding.label      = "Hospital";
  hospitalBuilding.color      = BUILDING_TYPES.hospital.color;
  hospitalBuilding.spreadDelay = BUILDING_TYPES.hospital.spreadDelay;
  hospitalBuilding.isHospital = true;

  // ── Step 3: Place Patient Zero ──
  // Must be far from the hospital — at least half the grid's diagonal distance.
  // Prefer grid edges for dramatic effect.
  const minDist = Math.floor(Math.max(rows, cols) * 0.55);

  const pzCandidates = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = cellKey(r, c);
      if (key === hospitalKey) continue;
      const dist = manhattan(r, c, hr, hc);
      if (dist >= minDist) {
        // Prefer edge cells for drama
        const isEdge = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
        pzCandidates.push({ r, c, priority: isEdge ? 2 : 1 });
      }
    }
  }

  if (pzCandidates.length === 0) {
    // Fallback: just pick the cell furthest from hospital
    let best = null, bestDist = -1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = cellKey(r, c);
        if (key === hospitalKey) continue;
        const d = manhattan(r, c, hr, hc);
        if (d > bestDist) { bestDist = d; best = { r, c }; }
      }
    }
    pzCandidates.push({ ...best, priority: 1 });
  }

  // Weight by priority then pick randomly
  const edgeCandidates = pzCandidates.filter(p => p.priority === 2);
  const pool = edgeCandidates.length > 0 ? edgeCandidates : pzCandidates;
  const pzIdx = Math.floor(rng() * pool.length);
  const { r: pzr, c: pzc } = pool[pzIdx];
  const patientZeroKey = cellKey(pzr, pzc);

  const pzBuilding = grid.get(patientZeroKey);
  pzBuilding.infected      = true;
  pzBuilding.isPatientZero = true;
  pzBuilding.infectedAt    = 0;   // infected at t=0

  // ── Step 4: Compute tool budgets ──
  const toolBudgets = {
    wall:   TOOLS.wall.budget[difficulty],
    hazmat: TOOLS.hazmat.budget[difficulty],
    flare:  TOOLS.flare.budget[difficulty],
  };

  return {
    grid,
    rows,
    cols,
    hospitalKey,
    patientZeroKey,
    seed: actualSeed,
    toolBudgets,
  };
}

// ─── CITY STATS HELPER ───────────────────────────────────────────────────────
/**
 * Returns a summary of the current city state.
 * Used by the HUD and scoring system.
 *
 * @param {Map<string, Building>} grid
 * @returns {{
 *   total:     number,
 *   infected:  number,
 *   immune:    number,
 *   clean:     number,
 *   pctClean:  number
 * }}
 */
export function getCityStats(grid) {
  let infected = 0, immune = 0;
  const total = grid.size;

  for (const building of grid.values()) {
    if (building.infected) infected++;
    else if (building.immune) immune++;
  }

  const clean = total - infected - immune;
  const pctClean = Math.round((clean / total) * 100);

  return { total, infected, immune, clean, pctClean };
}

/**
 * Returns all building keys adjacent to a given key that have no wall between them.
 * Used to highlight valid wall placement targets in the UI.
 *
 * @param {string}                key
 * @param {Map<string, Building>} grid
 * @param {Set<string>}           walls
 * @param {number}                rows
 * @param {number}                cols
 * @returns {string[]}
 */
export function getOpenNeighbourKeys(key, grid, walls, rows, cols) {
  const { row, col } = grid.get(key);
  const result = [];

  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr, nc = col + dc;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
    const nKey = cellKey(nr, nc);
    const wKey = [key, nKey].sort().join("|");
    if (!walls.has(wKey)) result.push(nKey);
  }

  return result;
}