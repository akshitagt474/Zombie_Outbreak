import { useState } from "react";
import { GAME_STATE } from "./constants.js";

/**
 * App.jsx — root component and screen router.
 *
 * Step 1 renders a placeholder for each screen so we can verify
 * the app boots cleanly. Real screens are wired in Step 3.
 *
 * State that lives here (passed down as props):
 *   screen       — current GAME_STATE value
 *   playerName   — set on the menu screen, used everywhere
 *   difficulty   — "easy" | "medium" | "hard"
 *   score        — cumulative score across rounds
 *   lives        — remaining lives (starts at MAX_LIVES)
 */
export default function App() {
  const [screen,     setScreen]     = useState(GAME_STATE.MENU);
  const [playerName, setPlayerName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [score,      setScore]      = useState(0);
  const [lives,      setLives]      = useState(3);

  // Shared navigation helper passed to every screen
  const navigate = (nextScreen, patches = {}) => {
    if (patches.score      !== undefined) setScore(patches.score);
    if (patches.lives      !== undefined) setLives(patches.lives);
    if (patches.playerName !== undefined) setPlayerName(patches.playerName);
    if (patches.difficulty !== undefined) setDifficulty(patches.difficulty);
    setScreen(nextScreen);
  };

  const sharedProps = { playerName, difficulty, score, lives, navigate };

  return (
    <div style={styles.root}>
      {screen === GAME_STATE.MENU      && <PlaceholderScreen label="Menu Screen"      color="#0d3320" {...sharedProps} />}
      {screen === GAME_STATE.PREP      && <PlaceholderScreen label="Prep Phase"       color="#1a2e0a" {...sharedProps} />}
      {screen === GAME_STATE.RUNNING   && <PlaceholderScreen label="Game Running"     color="#1a0a0a" {...sharedProps} />}
      {screen === GAME_STATE.ROUND_WIN && <PlaceholderScreen label="Round Win"        color="#0a1a2e" {...sharedProps} />}
      {screen === GAME_STATE.GAME_OVER && <PlaceholderScreen label="Game Over"        color="#1a0000" {...sharedProps} />}
      {screen === GAME_STATE.WIN       && <PlaceholderScreen label="Victory!"         color="#0a2e0a" {...sharedProps} />}
    </div>
  );
}

// ─── STEP 1 PLACEHOLDER ───────────────────────────────────────────────────────
// Replaced with real screens in Step 3.
// Shows BFS is importable and all constants load correctly.
function PlaceholderScreen({ label, color, navigate, playerName, difficulty, score, lives }) {
  const [bfsLog, setBfsLog] = useState([]);

  const runBfsDemo = async () => {
    // Dynamically import so the test is real — same path the engine will use
    const {
      createBfsState,
      bfsStep,
      placeWall,
      dropFlare,
      deployHazmat,
      bfsShortestPath,
      edgeKey,
    } = await import("./algorithms/Bfs.js");

    const ROWS = 4, COLS = 4;
    const state = createBfsState([0], ROWS, COLS); // Patient Zero = top-left

    // Place a wall between node 1 and node 2 to test wall blocking
    placeWall(state, 1, 2);

    // Drop a flare on node 5 — 2 extra wave delay
    dropFlare(state, 5, 2);

    const log = [`Created BFS state. Patient Zero = node 0 (4×4 grid)`];
    log.push(`Wall placed: edge ${edgeKey(1, 2)} severed`);
    log.push(`Flare on node 5 — 2 wave delay`);

    for (let wave = 1; wave <= 6; wave++) {
      const { newlyInfected, done } = bfsStep(state);
      log.push(
        `Wave ${wave}: newly infected = [${[...newlyInfected].join(", ") || "none"}]` +
        (done ? "  ← BFS complete" : "")
      );
      if (done) break;
    }

    // Hazmat demo: clear node 4
    deployHazmat(state, 4);
    log.push(`Hazmat deployed on node 4 — removed from infected set`);
    log.push(`Infected set: [${[...state.infected].sort((a,b)=>a-b).join(", ")}]`);

    // Shortest path demo
    const path = bfsShortestPath(0, 15, ROWS, COLS);
    log.push(`Shortest path 0→15: [${path?.join(" → ") ?? "none"}]`);

    setBfsLog(log);
  };

  return (
    <div style={{ ...styles.placeholder, background: color }}>
      <div style={styles.badge}>STEP 1 — FOUNDATION</div>
      <h1 style={styles.heading}>{label}</h1>

      <div style={styles.infoRow}>
        <Chip label="Player"     value={playerName || "—"} />
        <Chip label="Difficulty" value={difficulty}        />
        <Chip label="Score"      value={score}             />
        <Chip label="Lives"      value={lives}             />
      </div>

      <div style={styles.btnRow}>
        <NavBtn onClick={() => navigate("menu")}      label="→ Menu"       />
        <NavBtn onClick={() => navigate("prep")}      label="→ Prep"       />
        <NavBtn onClick={() => navigate("running")}   label="→ Running"    />
        <NavBtn onClick={() => navigate("round_win")} label="→ Round Win"  />
        <NavBtn onClick={() => navigate("game_over")} label="→ Game Over"  />
        <NavBtn onClick={() => navigate("win")}       label="→ Victory"    />
      </div>

      <button onClick={runBfsDemo} style={styles.bfsBtn}>
        ▶ RUN BFS DEMO (check console + output below)
      </button>

      {bfsLog.length > 0 && (
        <div style={styles.log}>
          {bfsLog.map((line, i) => (
            <div key={i} style={{ color: line.includes("Wave") ? "#4ade80" : "#94a3b8" }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────
const Chip = ({ label, value }) => (
  <div style={styles.chip}>
    <span style={{ color: "#64748b", fontSize: 10, letterSpacing: 2 }}>{label}</span>
    <span style={{ color: "#e2ffe8", fontWeight: 700 }}>{String(value)}</span>
  </div>
);

const NavBtn = ({ onClick, label }) => (
  <button onClick={onClick} style={styles.navBtn}>{label}</button>
);

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#060a0c",
    fontFamily: "'Barlow', sans-serif",
    padding: 16,
  },
  placeholder: {
    width: "100%",
    maxWidth: 680,
    borderRadius: 16,
    border: "1px solid #1a3a2a",
    padding: 32,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  badge: {
    display: "inline-block",
    fontSize: 10,
    letterSpacing: 4,
    color: "#4ade80",
    background: "#0a2a1a",
    border: "1px solid #1a4a2a",
    borderRadius: 4,
    padding: "3px 10px",
    alignSelf: "flex-start",
  },
  heading: {
    fontSize: 28,
    fontWeight: 900,
    color: "#e2ffe8",
    letterSpacing: -1,
    margin: 0,
  },
  infoRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  chip: {
    background: "#0d1a14",
    border: "1px solid #1a3a2a",
    borderRadius: 8,
    padding: "8px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  btnRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  navBtn: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid #1a3a2a",
    background: "transparent",
    color: "#64748b",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    letterSpacing: 1,
  },
  bfsBtn: {
    padding: "12px 20px",
    borderRadius: 10,
    border: "1px solid #4ade80",
    background: "#0a2a1a",
    color: "#4ade80",
    cursor: "pointer",
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 13,
    letterSpacing: 1,
    alignSelf: "flex-start",
  },
  log: {
    background: "#070d0a",
    border: "1px solid #1a3a2a",
    borderRadius: 8,
    padding: "14px 16px",
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 12,
    lineHeight: 1.8,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
};