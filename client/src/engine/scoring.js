import { SCORE_WEIGHTS, DIFFICULTY_MULTIPLIER, TOOLS } from "../constants.js";

/**
 * SCORING ENGINE — Step 2
 *
 * Calculates the round score from five components:
 *
 *   1. Buildings saved   — percentage of clean buildings × weight
 *   2. Tool efficiency   — bonus for each tool NOT used
 *   3. Waves survived    — reward for lasting longer
 *   4. Speed bonus       — reward for containing the outbreak quickly
 *   5. Difficulty mult   — entire score multiplied by difficulty factor
 *
 * Design intent:
 *   - A perfect score (all buildings clean, no tools used, fast) should
 *     feel genuinely difficult to achieve
 *   - Casual play (hospital survived, some buildings lost, tools used) should
 *     still give a satisfying score in the thousands
 *   - Hard mode should reward players ~2.5× more than easy mode
 */

// ─── MAIN SCORE CALCULATION ──────────────────────────────────────────────────
/**
 * @param {{
 *   difficulty:    string,
 *   pctClean:      number,   - 0–100, percentage of buildings uninfected
 *   toolsLeft:     { wall: number, hazmat: number, flare: number },
 *   toolBudgets:   { wall: number, hazmat: number, flare: number },
 *   wavesSurvived: number,
 *   secsRemaining: number,   - seconds left when the round ended
 * }} params
 * @returns {number}  final rounded score
 */
export function calculateScore({
  difficulty,
  pctClean,
  toolsLeft,
  toolBudgets,
  wavesSurvived,
  secsRemaining,
}) {
  const w = SCORE_WEIGHTS;

  // 1. Buildings saved
  const buildingScore = Math.round(pctClean * w.buildingSaved);

  // 2. Tool efficiency — unused tools give a bonus
  const wallBonus   = (toolsLeft.wall   ?? 0) * w.toolUnused_wall;
  const hazmatBonus = (toolsLeft.hazmat ?? 0) * w.toolUnused_hazmat;
  const flareBonus  = (toolsLeft.flare  ?? 0) * w.toolUnused_flare;
  const toolScore   = wallBonus + hazmatBonus + flareBonus;

  // 3. Waves survived
  const waveScore = (wavesSurvived ?? 0) * w.waveSurvived;

  // 4. Speed bonus — rewards fast containment
  const speedScore = Math.round((secsRemaining ?? 0) * w.speedBonus);

  // 5. Sum then apply difficulty multiplier
  const rawScore = buildingScore + toolScore + waveScore + speedScore;
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1.0;
  const finalScore = Math.round(rawScore * multiplier);

  return Math.max(0, finalScore);
}

// ─── SCORE BREAKDOWN ────────────────────────────────────────────────────────
/**
 * Returns the same score but split into labelled components.
 * Used by the GameOver screen to show the player exactly how they scored.
 *
 * @param {Object} params  - same as calculateScore
 * @returns {{
 *   breakdown: Array<{ label: string, value: number, raw: number }>,
 *   multiplier: number,
 *   total: number
 * }}
 */
export function getScoreBreakdown({
  difficulty,
  pctClean,
  toolsLeft,
  toolBudgets,
  wavesSurvived,
  secsRemaining,
}) {
  const w = SCORE_WEIGHTS;
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1.0;

  const components = [
    {
      label: "Buildings saved",
      raw:   Math.round(pctClean * w.buildingSaved),
      detail: `${pctClean}% clean × ${w.buildingSaved}`,
    },
    {
      label: "Walls saved",
      raw:   (toolsLeft.wall ?? 0) * w.toolUnused_wall,
      detail: `${toolsLeft.wall} unused × ${w.toolUnused_wall}`,
    },
    {
      label: "Hazmat saved",
      raw:   (toolsLeft.hazmat ?? 0) * w.toolUnused_hazmat,
      detail: `${toolsLeft.hazmat} unused × ${w.toolUnused_hazmat}`,
    },
    {
      label: "Flares saved",
      raw:   (toolsLeft.flare ?? 0) * w.toolUnused_flare,
      detail: `${toolsLeft.flare} unused × ${w.toolUnused_flare}`,
    },
    {
      label: "Waves survived",
      raw:   (wavesSurvived ?? 0) * w.waveSurvived,
      detail: `${wavesSurvived} waves × ${w.waveSurvived}`,
    },
    {
      label: "Speed bonus",
      raw:   Math.round((secsRemaining ?? 0) * w.speedBonus),
      detail: `${secsRemaining}s remaining × ${w.speedBonus}`,
    },
  ];

  const rawTotal = components.reduce((s, c) => s + c.raw, 0);
  const total    = Math.round(rawTotal * multiplier);

  const breakdown = components.map(c => ({
    label:  c.label,
    raw:    c.raw,
    value:  Math.round(c.raw * multiplier),
    detail: c.detail,
  }));

  return { breakdown, multiplier, rawTotal, total };
}

// ─── GRADE ───────────────────────────────────────────────────────────────────
/**
 * Returns a letter grade based on percentage of max possible score.
 * Used on the win screen for a satisfying summary.
 *
 * @param {number} score
 * @param {string} difficulty
 * @returns {{ grade: string, label: string, color: string }}
 */
export function getGrade(score, difficulty) {
  const maxScore = getMaxPossibleScore(difficulty);
  const pct = (score / maxScore) * 100;

  if (pct >= 90) return { grade: "S",  label: "PERFECT CONTAINMENT", color: "#f59e0b" };
  if (pct >= 75) return { grade: "A",  label: "EXCELLENT RESPONSE",   color: "#22c55e" };
  if (pct >= 55) return { grade: "B",  label: "GOOD RESPONSE",        color: "#3b82f6" };
  if (pct >= 35) return { grade: "C",  label: "ADEQUATE RESPONSE",    color: "#a855f7" };
  return              { grade: "D",  label: "POOR CONTAINMENT",       color: "#ef4444" };
}

/**
 * Estimates the theoretical maximum score for a difficulty.
 * Assumes: 100% buildings clean, all tools saved, 30 waves, full speed bonus.
 */
function getMaxPossibleScore(difficulty) {
  const w = SCORE_WEIGHTS;
  const budgets = { wall: TOOLS.wall.budget[difficulty], hazmat: TOOLS.hazmat.budget[difficulty], flare: TOOLS.flare.budget[difficulty] };
  const mult = DIFFICULTY_MULTIPLIER[difficulty] ?? 1;

  const raw =
    100 * w.buildingSaved +
    budgets.wall   * w.toolUnused_wall +
    budgets.hazmat * w.toolUnused_hazmat +
    budgets.flare  * w.toolUnused_flare +
    30 * w.waveSurvived +
    120 * w.speedBonus;

  return Math.round(raw * mult);
}

// ─── LEADERBOARD HELPERS ────────────────────────────────────────────────────
/**
 * Formats a score number for display — adds commas and rounds.
 * @param {number} score
 * @returns {string}
 */
export function formatScore(score) {
  return Math.round(score).toLocaleString();
}

/**
 * Returns medal info for leaderboard rank.
 * @param {number} rank  - 0-indexed
 * @returns {{ emoji: string, color: string }}
 */
export function getRankMedal(rank) {
  if (rank === 0) return { emoji: "🥇", color: "#f59e0b" };
  if (rank === 1) return { emoji: "🥈", color: "#94a3b8" };
  if (rank === 2) return { emoji: "🥉", color: "#b45309" };
  return { emoji: `#${rank + 1}`, color: "#475569" };
}