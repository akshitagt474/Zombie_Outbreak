import { C, MAX_ROUND_SEC } from "../constants.js";
import { getCityStats } from "../engine/cityGenerator.js";
import { isHospitalReachable } from "../algorithms/Bfs.js";

export default function HUD({ gameState }) {
  if (!gameState) return null;

  const {
    phase, prepSecsLeft, elapsedSec,
    lives, round, waveCount,
    hospitalKey, walls, rows, cols, grid,
    totalScore, roundScore, difficulty, log,
  } = gameState;

  const stats    = getCityStats(grid);
  const timeLeft = Math.max(0, MAX_ROUND_SEC - elapsedSec);
  const atRisk   = phase === "outbreak"
    ? isHospitalReachable(grid, walls, hospitalKey, rows, cols)
    : false;

  const phaseColor =
    phase === "prep"     ? C.accent :
    phase === "outbreak" ? (atRisk ? C.danger : C.warn) :
    phase === "won"      ? C.accent : C.danger;

  const phaseLabel =
    phase === "prep"     ? `PREP — ${prepSecsLeft}s` :
    phase === "outbreak" ? (atRisk ? "⚠ HOSPITAL AT RISK" : "OUTBREAK ACTIVE") :
    phase === "won"      ? "CONTAINED" :
    phase === "lost"     ? "HOSPITAL INFECTED" :
    phase === "gameover" ? "GAME OVER" : phase.toUpperCase();

  return (
    <div style={S.wrap}>

      {/* Top row — phase + round + lives */}
      <div style={S.topRow}>
        <div style={{ ...S.phaseBadge, borderColor: phaseColor, color: phaseColor }}>
          {phaseLabel}
        </div>
        <div style={S.roundLives}>
          <span style={S.dim}>RND {round}</span>
          <div style={S.lives}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: "50%",
                background: i < lives ? C.danger : C.textMuted,
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={S.statsRow}>
        <Stat label="WAVE"    value={waveCount}          color={C.warn} />
        <Stat label="TIME"    value={fmtTime(timeLeft)}  color={phase === "prep" ? C.accent : timeLeft < 30 ? C.danger : C.text} />
        <Stat label="CLEAN"   value={`${stats.pctClean}%`} color={stats.pctClean > 70 ? C.accent : stats.pctClean > 40 ? C.warn : C.danger} />
        <Stat label="SCORE"   value={fmtScore(totalScore)} color={C.text} />
      </div>

      {/* Infection bar */}
      <div style={S.barWrap}>
        <div style={S.barLabel}>
          <span style={{ color: C.dim, fontSize: 10, letterSpacing: 2 }}>INFECTION</span>
          <span style={{ color: C.danger, fontSize: 11, fontFamily: "monospace" }}>
            {stats.infected}/{stats.total}
          </span>
        </div>
        <div style={S.barTrack}>
          <div style={{
            ...S.barFill,
            width: `${(stats.infected / stats.total) * 100}%`,
            background: stats.infected / stats.total > 0.4 ? C.danger : C.warn,
          }} />
          {stats.immune > 0 && (
            <div style={{
              ...S.barFill,
              width: `${(stats.immune / stats.total) * 100}%`,
              background: C.info,
              opacity: 0.6,
            }} />
          )}
        </div>
      </div>

      {/* Event log */}
      <div style={S.log}>
        {[...log].reverse().slice(0, 6).map((entry, i) => (
          <div key={i} style={{
            fontSize: 11,
            fontFamily: "'Share Tech Mono', monospace",
            color: i === 0 ? C.text : C.dim,
            opacity: 1 - i * 0.15,
            lineHeight: 1.6,
            borderBottom: i === 0 ? `1px solid ${C.panelBorder}` : "none",
            paddingBottom: i === 0 ? 4 : 0,
          }}>
            {i === 0 && <span style={{ color: C.accent, marginRight: 6 }}>›</span>}
            {entry.message}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={S.legend}>
        <LegItem color={C.patientZero} label="Patient Zero" />
        <LegItem color={C.hospital}    label="Hospital" />
        <LegItem color={C.danger}      label="Infected" />
        <LegItem color={C.info}        label="Immune" />
        <LegItem color={C.wall}        label="Wall" />
        <LegItem color={C.flare}       label="Flared" />
      </div>

    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, letterSpacing: 3, color: C.dim, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
        {value}
      </div>
    </div>
  );
}

function LegItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.dim }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
      {label}
    </div>
  );
}

function fmtTime(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

function fmtScore(n) {
  return Number(n || 0).toLocaleString();
}

const S = {
  wrap: {
    display: "flex", flexDirection: "column", gap: 10,
    background: C.panel, border: `1px solid ${C.panelBorder}`,
    borderRadius: 10, padding: "14px 16px",
    fontFamily: "'Rajdhani', sans-serif",
    minWidth: 200,
  },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  phaseBadge: {
    fontSize: 11, fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: 2, border: "1px solid",
    borderRadius: 4, padding: "2px 8px",
    transition: "color 0.3s, border-color 0.3s",
  },
  roundLives: { display: "flex", alignItems: "center", gap: 8 },
  dim: { fontSize: 11, color: C.dim, fontFamily: "'Share Tech Mono', monospace" },
  lives: { display: "flex", gap: 4, alignItems: "center" },
  statsRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: 4, background: "#070d14",
    borderRadius: 8, padding: "10px 8px",
    border: `1px solid ${C.panelBorder}`,
  },
  barWrap: { display: "flex", flexDirection: "column", gap: 4 },
  barLabel: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  barTrack: {
    height: 6, borderRadius: 3, background: C.panelBorder,
    overflow: "hidden", display: "flex",
  },
  barFill: { height: "100%", borderRadius: 3, transition: "width 0.6s ease" },
  log: {
    background: "#070d14", borderRadius: 8,
    border: `1px solid ${C.panelBorder}`,
    padding: "10px 12px",
    display: "flex", flexDirection: "column", gap: 3,
    minHeight: 80,
  },
  legend: {
    display: "flex", flexWrap: "wrap", gap: "6px 14px",
    paddingTop: 4,
  },
};