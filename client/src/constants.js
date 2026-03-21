// ─── GRID ─────────────────────────────────────────────────────────────────────
export const GRID_SIZES = {
  easy:   { cols: 12, rows: 10 },
  medium: { cols: 16, rows: 13 },
  hard:   { cols: 20, rows: 16 },
};

// ─── BUILDING TYPES ───────────────────────────────────────────────────────────
export const BUILDING_TYPES = {
  apartment:  { label: "Apartment",  spreadDelay: 1000, color: "#1e3a5f", infected: "#7f1d1d" },
  market:     { label: "Market",     spreadDelay: 1800, color: "#1a3a2a", infected: "#7f1d1d" },
  industrial: { label: "Industrial", spreadDelay: 3000, color: "#2a2a1a", infected: "#7f1d1d" },
  hospital:   { label: "Hospital",   spreadDelay: 2000, color: "#1a2a3a", infected: "#7f1d1d" },
  park:       { label: "Park",       spreadDelay: 2500, color: "#14291a", infected: "#7f1d1d" },
};

// ─── GAME TIMING ─────────────────────────────────────────────────────────────
export const TICK_INTERVAL_MS = 1000;
export const PREP_TIME_SEC    = 15;
export const MAX_ROUND_SEC    = 120;

// ─── TOOLS ────────────────────────────────────────────────────────────────────
export const TOOLS = {
  wall: {
    label:       "Quarantine Wall",
    description: "Severs BFS connection between two adjacent buildings",
    key:         "Q",
    budget:      { easy: 10, medium: 8, hard: 5 },
    color:       "#f59e0b",
  },
  hazmat: {
    label:       "Hazmat Team",
    description: "Clears infection and immunises a building",
    key:         "H",
    budget:      { easy: 4, medium: 3, hard: 2 },
    color:       "#3b82f6",
  },
  flare: {
    label:       "Flare",
    description: "Slows BFS spread from a building by +2 seconds",
    key:         "F",
    budget:      { easy: 6, medium: 5, hard: 3 },
    color:       "#a855f7",
  },
};

// ─── SCORING ──────────────────────────────────────────────────────────────────
export const SCORE_WEIGHTS = {
  buildingSaved:     50,
  toolUnused_wall:   200,
  toolUnused_hazmat: 300,
  toolUnused_flare:  100,
  waveSurvived:      150,
  speedBonus:        10,
};

// ─── BFS ──────────────────────────────────────────────────────────────────────
export const ADJACENCY_DIRS = [
  { dr: -1, dc:  0 },
  { dr:  1, dc:  0 },
  { dr:  0, dc: -1 },
  { dr:  0, dc:  1 },
];

// ─── LIVES ────────────────────────────────────────────────────────────────────
export const MAX_LIVES = 3;

// ─── DIFFICULTY MULTIPLIERS ──────────────────────────────────────────────────
export const DIFFICULTY_MULTIPLIER = {
  easy:   1.0,
  medium: 1.5,
  hard:   2.5,
};

// ─── COLORS ───────────────────────────────────────────────────────────────────
export const C = {
  bg:          "#060a0f",
  panel:       "#0d1117",
  panelBorder: "#1a2332",
  accent:      "#22c55e",
  accentDim:   "#14532d",
  danger:      "#ef4444",
  dangerDim:   "#7f1d1d",
  warn:        "#f59e0b",
  warnDim:     "#451a03",
  info:        "#3b82f6",
  infoDim:     "#1e3a5f",
  text:        "#e2e8f0",
  textDim:     "#64748b",
  textMuted:   "#334155",
  infected:    "#dc2626",
  immune:      "#0ea5e9",
  hospital:    "#06b6d4",
  wall:        "#f59e0b",
  hazmat:      "#3b82f6",
  flare:       "#a855f7",
  patientZero: "#ff6b35",
};

// ─── API ──────────────────────────────────────────────────────────────────────
export const API_BASE = "/api";