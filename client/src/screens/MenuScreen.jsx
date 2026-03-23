import { useState } from "react";
import { C } from "../constants.js";
import Leaderboard from "../components/Leaderboard.jsx";

const DIFFICULTIES = [
  { id: "easy",   label: "Easy",   sub: "12×10 · 10 walls · 4 hazmat" },
  { id: "medium", label: "Medium", sub: "16×13 · 8 walls · 3 hazmat"  },
  { id: "hard",   label: "Hard",   sub: "20×16 · 5 walls · 2 hazmat"  },
];

export default function MenuScreen({ onStart }) {
  const [name,       setName]       = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [showLb,     setShowLb]     = useState(false);

  const canStart = name.trim().length > 0;

  return (
    <div style={S.page}>
      <GridBg />

      {showLb && (
        <div style={S.lbOverlay}>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <Leaderboard onClose={() => setShowLb(false)} />
          </div>
        </div>
      )}

      <div style={S.center}>
        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoBadge}>CDC CRISIS RESPONSE SYSTEM</div>
          <h1 style={S.logoTitle}>ZOMBIE<br />OUTBREAK</h1>
          <p style={S.logoSub}>BFS CONTAINMENT PROTOCOL</p>
        </div>

        {/* Brief rules */}
        <div style={S.rulesCard}>
          <div style={S.rulesTitle}>MISSION BRIEFING</div>
          <div style={S.rulesGrid}>
            <Rule icon="🟠" text="Patient Zero infects the city via BFS waves" />
            <Rule icon="🟡" text="Place quarantine walls to sever BFS connections" />
            <Rule icon="🔵" text="Deploy hazmat teams to clear infected buildings" />
            <Rule icon="🟣" text="Use flares to slow BFS spread from a building" />
            <Rule icon="🔴" text="If the hospital is infected — you lose a life" />
            <Rule icon="🟢" text="Contain the outbreak before it reaches the hospital" />
          </div>
        </div>

        {/* Name + difficulty */}
        <div style={S.formCard}>
          <label style={S.label}>OPERATIVE CODENAME</label>
          <input
            value={name}
            onChange={e => setName(e.target.value.slice(0, 24))}
            placeholder="Enter your name..."
            style={S.input}
            onKeyDown={e => e.key === "Enter" && canStart && onStart(name.trim(), difficulty)}
            autoFocus
          />

          <label style={{ ...S.label, marginTop: 14 }}>DIFFICULTY</label>
          <div style={S.diffRow}>
            {DIFFICULTIES.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                style={{
                  ...S.diffBtn,
                  borderColor: difficulty === d.id ? C.accent : C.panelBorder,
                  color:       difficulty === d.id ? C.accent : C.dim,
                  background:  difficulty === d.id ? `${C.accent}11` : "transparent",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700 }}>{d.label}</div>
                <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1.4 }}>{d.sub}</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => canStart && onStart(name.trim(), difficulty)}
            disabled={!canStart}
            style={{
              ...S.startBtn,
              opacity: canStart ? 1 : 0.4,
              cursor:  canStart ? "pointer" : "not-allowed",
            }}
          >
            ▶ DEPLOY TO FIELD
          </button>
        </div>

        <button onClick={() => setShowLb(true)} style={S.lbBtn}>
          🏆 VIEW LEADERBOARD
        </button>
      </div>
    </div>
  );
}

function Rule({ icon, text }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: C.dim, lineHeight: 1.5 }}>
      <span style={{ fontSize: 12, flexShrink: 0 }}>{icon}</span>
      {text}
    </div>
  );
}

function GridBg() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      backgroundImage: `linear-gradient(rgba(34,197,94,0.03) 1px,transparent 1px),
                        linear-gradient(90deg,rgba(34,197,94,0.03) 1px,transparent 1px)`,
      backgroundSize: "48px 48px",
    }} />
  );
}

const S = {
  page: {
    minHeight: "100vh", background: C.bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 24, position: "relative", fontFamily: "'Rajdhani', sans-serif",
  },
  lbOverlay: {
    position: "fixed", inset: 0, background: "rgba(6,10,15,0.9)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 50, padding: 24,
  },
  center: {
    position: "relative", zIndex: 1,
    width: "100%", maxWidth: 480,
    display: "flex", flexDirection: "column", gap: 20,
  },
  logo: { textAlign: "center" },
  logoBadge: { fontSize: 10, letterSpacing: 6, color: C.accent, fontFamily: "'Share Tech Mono',monospace", marginBottom: 10 },
  logoTitle: {
    fontSize: "clamp(2.8rem,9vw,4.5rem)", fontWeight: 700,
    lineHeight: 0.88, letterSpacing: -3, color: C.text,
    textShadow: `0 0 40px ${C.danger}33`, margin: "0 0 10px",
  },
  logoSub: { fontSize: 11, letterSpacing: 5, color: C.dim, fontFamily: "'Share Tech Mono',monospace", margin: 0 },
  rulesCard: {
    background: C.panel, border: `1px solid ${C.panelBorder}`,
    borderRadius: 10, padding: "14px 16px",
  },
  rulesTitle: { fontSize: 9, letterSpacing: 4, color: C.accent, fontFamily: "'Share Tech Mono',monospace", marginBottom: 10 },
  rulesGrid: { display: "flex", flexDirection: "column", gap: 6 },
  formCard: {
    background: C.panel, border: `1px solid ${C.panelBorder}`,
    borderRadius: 10, padding: "18px 20px",
  },
  label: { display: "block", fontSize: 9, letterSpacing: 4, color: C.dim, fontFamily: "'Share Tech Mono',monospace", marginBottom: 8 },
  input: {
    width: "100%", padding: "11px 14px", borderRadius: 8,
    border: `1px solid ${C.panelBorder}`, background: "#070d14",
    color: C.text, fontSize: 16, fontFamily: "'Rajdhani',sans-serif",
    outline: "none", boxSizing: "border-box",
  },
  diffRow: { display: "flex", gap: 8, marginBottom: 16 },
  diffBtn: {
    flex: 1, padding: "10px 8px", borderRadius: 8,
    border: "1px solid", background: "transparent",
    cursor: "pointer", transition: "all 0.15s", textAlign: "center",
    fontFamily: "'Rajdhani',sans-serif",
  },
  startBtn: {
    width: "100%", padding: "14px", borderRadius: 10,
    border: `1px solid ${C.accent}`, background: `${C.accent}22`,
    color: C.accent, fontSize: 16, fontWeight: 700,
    fontFamily: "'Rajdhani',sans-serif", letterSpacing: 3,
    transition: "all 0.15s",
  },
  lbBtn: {
    background: "transparent", border: `1px solid ${C.panelBorder}`,
    borderRadius: 10, padding: "12px", color: C.dim, cursor: "pointer",
    fontFamily: "'Rajdhani',sans-serif", fontSize: 14, fontWeight: 600,
    letterSpacing: 2, width: "100%",
  },
};