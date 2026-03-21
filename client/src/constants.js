// ─── GRID ─────────────────────────────────────────────────────────────────────
export const GRID_COLS = 18;
export const GRID_ROWS = 14;
export const CELL_PX   = 48;

// ─── BUILDING TYPES ───────────────────────────────────────────────────────────
// Each type has a label, spread delay (ms between BFS waves), and colour tokens.
export const BUILDING_TYPES = {
  APARTMENT:   { label: "APT",  spreadMs: 1000, color: "#1a3a4a", infected: "#7f1d1d" },
  MARKET:      { label: "MKT",  spreadMs: 1800, color: "#1a2e1a", infected: "#7f1d1d" },
  INDUSTRIAL:  { label: "IND",  spreadMs: 2800, color: "#2a2416", infected: "#7f1d1d" },
  PARK:        { label: "PARK", spreadMs: 2200, color: "#0f2a14", infected: "#7f1d1d" },
  HOSPITAL:    { label: "HOSP", spreadMs: null,  color: "#0a1f3a", infected: "#7f0000" },
};

// ─── TOOLS ────────────────────────────────────────────────────────────────────
export const TOOLS = {
  WALL:   { label: "Quarantine Wall", key: "Q", budget: { easy: 10, medium: 7, hard: 5 } },
  HAZMAT: { label: "Hazmat Team",     key: "H", budget: { easy: 4,  medium: 3, hard: 2 } },
  FLARE:  { label: "Flare",           key: "F", budget: { easy: 7,  medium: 5, hard: 3 } },
};

// ─── DIFFICULTY ───────────────────────────────────────────────────────────────
export const DIFFICULTY = {
  easy:   { label: "Easy",   bfsIntervalMs: 1600, rounds: 3, multiOutbreak: false },
  medium: { label: "Medium", bfsIntervalMs: 1100, rounds: 5, multiOutbreak: false },
  hard:   { label: "Hard",   bfsIntervalMs: 750,  rounds: 5, multiOutbreak: true  },
};

// ─── SCORING ──────────────────────────────────────────────────────────────────
export const SCORE = {
  buildingSaved:    50,   // per clean building at end of round
  toolUnused:      150,   // per unused tool charge remaining
  waveBonus:        30,   // per BFS wave survived
  hospitalBonus:  1000,   // awarded if hospital never infected
  roundClear:      500,   // base bonus for winning a round
};

// ─── GAME STATES ──────────────────────────────────────────────────────────────
export const GAME_STATE = {
  MENU:      "menu",
  PREP:      "prep",       // placement phase before outbreak starts
  RUNNING:   "running",    // outbreak active
  ROUND_WIN: "round_win",
  GAME_OVER: "game_over",
  WIN:       "win",        // all rounds cleared
};

// ─── MISC ─────────────────────────────────────────────────────────────────────
export const MAX_LIVES    = 3;
export const PREP_TIME_MS = 8000;  // 8 seconds to place tools before outbreak
export const API_BASE     = "/api"; // proxied to FastAPI via vite.config.js