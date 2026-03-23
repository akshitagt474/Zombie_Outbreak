import { useEffect } from "react";
import { C } from "../constants.js";
import { getScoreBreakdown, getGrade, formatScore } from "../engine/scoring.js";
import { getCityStats } from "../engine/cityGenerator.js";
import { saveToLeaderboard } from "./Leaderboard.jsx";

export default function GameOver({ gameState, onNextRound, onRestart, onMenu }) {
  if (!gameState) return null;

  const { phase, playerName, difficulty, round, lives,
          totalScore, toolsLeft, waveCount, elapsedSec, grid } = gameState;

  const won      = phase === "won";
  const lost     = phase === "lost" || phase === "gameover";
  const gameOver = phase === "gameover";
  const stats    = getCityStats(grid);

  const breakdown = getScoreBreakdown({
    difficulty,
    pctClean:      stats.pctClean,
    toolsLeft,
    toolBudgets:   toolsLeft,
    wavesSurvived: waveCount,
    secsRemaining: Math.max(0, 120 - elapsedSec),
  });

  const grade = getGrade(gameState.roundScore ?? 0, difficulty);

  // Save to leaderboard on mount
  useEffect(() => {
    if (won || gameOver) {
      saveToLeaderboard({ playerName, difficulty, round, totalScore, roundScore: gameState.roundScore ?? 0 });
    }
  }, []);

  const accentColor = won ? C.accent : C.danger;

  return (
    <div style={S.overlay}>
      <div style={S.card}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ ...S.badge, color: accentColor, borderColor: accentColor }}>
            {won ? "OUTBREAK CONTAINED" : gameOver ? "MISSION FAILED" : "HOSPITAL INFECTED"}
          </div>
          <div style={{ ...S.grade, color: grade.color }}>
            {grade.grade}
          </div>
          <div style={{ fontSize: 13, color: C.dim, letterSpacing: 2 }}>
            {grade.label}
          </div>
        </div>

        {/* Score */}
        <div style={S.scoreBox}>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: 4, marginBottom: 4 }}>ROUND SCORE</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: accentColor, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2 }}>
            {formatScore(gameState.roundScore ?? 0)}
          </div>
          <div style={{ fontSize: 13, color: C.dim }}>
            Total: {formatScore(totalScore)} pts · {difficulty} · Round {round}
          </div>
        </div>

        {/* Breakdown */}
        <div style={S.breakdown}>
          <div style={S.breakTitle}>SCORE BREAKDOWN</div>
          {breakdown.breakdown.map((b, i) => (
            <div key={i} style={S.breakRow}>
              <span style={{ color: C.dim, fontSize: 12 }}>{b.label}</span>
              <span style={{ color: b.value > 0 ? C.text : C.textMuted, fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>
                +{formatScore(b.value)}
              </span>
            </div>
          ))}
          <div style={{ ...S.breakRow, borderTop: `1px solid ${C.panelBorder}`, paddingTop: 8, marginTop: 4 }}>
            <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>×{breakdown.multiplier} ({difficulty})</span>
            <span style={{ color: accentColor, fontSize: 14, fontWeight: 700, fontFamily: "'Share Tech Mono', monospace" }}>
              {formatScore(gameState.roundScore ?? 0)}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={S.statsRow}>
          <MiniStat label="Buildings saved" value={`${stats.pctClean}%`} />
          <MiniStat label="Waves survived"  value={waveCount} />
          <MiniStat label="Lives left"      value={lives} />
        </div>

        {/* Actions */}
        <div style={S.actions}>
          {won && !gameOver && (
            <ActionBtn onClick={onNextRound} primary label="NEXT ROUND →" color={C.accent} />
          )}
          {!gameOver && (
            <ActionBtn onClick={onRestart} label="↺ RETRY" color={C.warn} />
          )}
          <ActionBtn onClick={onMenu} label="← MENU" color={C.dim} />
        </div>

      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, letterSpacing: 3, color: C.dim, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "'Share Tech Mono', monospace" }}>
        {value}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, label, color, primary }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "12px 16px", borderRadius: 8,
      border: `1px solid ${color}`,
      background: primary ? `${color}22` : "transparent",
      color, cursor: "pointer",
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: 14, fontWeight: 700, letterSpacing: 2,
      transition: "all 0.15s",
    }}>
      {label}
    </button>
  );
}

const S = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(6,10,15,0.88)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, padding: 16,
  },
  card: {
    background: C.panel, border: `1px solid ${C.panelBorder}`,
    borderRadius: 16, padding: "28px 28px",
    width: "100%", maxWidth: 420,
    fontFamily: "'Rajdhani', sans-serif",
    display: "flex", flexDirection: "column", gap: 16,
  },
  badge: {
    display: "inline-block", fontSize: 10, letterSpacing: 4,
    border: "1px solid", borderRadius: 4, padding: "2px 10px",
    fontFamily: "'Share Tech Mono', monospace", marginBottom: 10,
  },
  grade: {
    fontSize: 72, fontWeight: 900, lineHeight: 1,
    letterSpacing: -4, margin: "4px 0",
  },
  scoreBox: {
    background: "#070d14", borderRadius: 10,
    border: `1px solid ${C.panelBorder}`,
    padding: "14px 16px", textAlign: "center",
  },
  breakdown: {
    background: "#070d14", borderRadius: 10,
    border: `1px solid ${C.panelBorder}`,
    padding: "12px 14px",
    display: "flex", flexDirection: "column", gap: 6,
  },
  breakTitle: {
    fontSize: 9, letterSpacing: 4, color: C.dim,
    fontFamily: "'Share Tech Mono', monospace", marginBottom: 4,
  },
  breakRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statsRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8, background: "#070d14", borderRadius: 10,
    border: `1px solid ${C.panelBorder}`, padding: "12px 8px",
  },
  actions: { display: "flex", gap: 8 },
};