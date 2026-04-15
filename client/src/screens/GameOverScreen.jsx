import { C } from "../constants.js";
import { formatScore } from "../engine/scoring.js";
import Leaderboard from "../components/Leaderboard.jsx";
import { useState } from "react";

export default function GameOverScreen({ gameState, onMenu }) {
  const [showLb, setShowLb] = useState(false);
  if (!gameState) return null;

  const { playerName, difficulty, round, totalScore } = gameState;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.redBadge}>ALL LIVES LOST</div>
        <h1 style={S.heading}>MISSION<br />FAILED</h1>
        <p style={S.sub}>The city has fallen. The outbreak is uncontained.</p>

        <div style={S.scoreBox}>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: 4, marginBottom: 4 }}>FINAL SCORE</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: C.danger, fontFamily: "'Share Tech Mono',monospace", letterSpacing: 2 }}>
            {formatScore(totalScore)}
          </div>
          <div style={{ fontSize: 13, color: C.dim }}>
            {difficulty} · {round - 1} round{round > 2 ? "s" : ""} completed
          </div>
        </div>

        <div style={S.actions}>
          <button onClick={onMenu} style={{ ...S.btn, borderColor: C.accent, color: C.accent, background: `${C.accent}11` }}>
            ← RETURN TO BASE
          </button>
          <button onClick={() => setShowLb(true)} style={{ ...S.btn, borderColor: C.panelBorder, color: C.dim }}>
            🏆 LEADERBOARD
          </button>
        </div>
      </div>

      {showLb && (
        <div style={S.lbOverlay}>
          <div style={{ width: "100%", maxWidth: 480 }}>
            <Leaderboard onClose={() => setShowLb(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh", background: C.bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Rajdhani',sans-serif", padding: 24,
  },
  card: {
    width: "100%", maxWidth: 400, textAlign: "center",
    display: "flex", flexDirection: "column", gap: 20,
    alignItems: "center",
  },
  redBadge: {
    fontSize: 10, letterSpacing: 5, color: C.danger,
    border: `1px solid ${C.danger}`, borderRadius: 4,
    padding: "2px 10px", fontFamily: "'Share Tech Mono',monospace",
  },
  heading: {
    fontSize: "clamp(3rem,10vw,5rem)", fontWeight: 700,
    letterSpacing: -3, color: C.text,
    textShadow: `0 0 40px ${C.danger}55`, margin: 0, lineHeight: 0.9,
  },
  sub: { fontSize: 14, color: C.dim, margin: 0 },
  scoreBox: {
    background: C.panel, border: `1px solid ${C.panelBorder}`,
    borderRadius: 12, padding: "20px 24px", width: "100%",
  },
  actions: { display: "flex", flexDirection: "column", gap: 10, width: "100%" },
  btn: {
    width: "100%", padding: "13px", borderRadius: 10,
    border: "1px solid", background: "transparent",
    cursor: "pointer", fontFamily: "'Rajdhani',sans-serif",
    fontSize: 14, fontWeight: 700, letterSpacing: 2,
  },
  lbOverlay: {
    position: "fixed", inset: 0, background: "rgba(6,10,15,0.9)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 50, padding: 24,
  },
};