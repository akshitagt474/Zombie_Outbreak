import { useState, useEffect } from "react";
import { C } from "../constants.js";
import { getRankMedal, formatScore } from "../engine/scoring.js";

const LB_KEY = "zombie_outbreak_lb_v1";

export function saveToLeaderboard(entry) {
  try {
    const raw  = localStorage.getItem(LB_KEY);
    const all  = raw ? JSON.parse(raw) : [];
    all.push({ ...entry, date: new Date().toLocaleDateString() });
    all.sort((a, b) => b.totalScore - a.totalScore);
    localStorage.setItem(LB_KEY, JSON.stringify(all.slice(0, 100)));
  } catch {}
}

export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export default function Leaderboard({ onClose }) {
  const [entries, setEntries] = useState([]);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    setEntries(loadLeaderboard());
  }, []);

  const difficulties = ["all", "easy", "medium", "hard"];
  const filtered = filter === "all"
    ? entries
    : entries.filter(e => e.difficulty === filter);

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.badge}>GLOBAL RANKINGS</div>
          <h2 style={S.title}>Leaderboard</h2>
        </div>
        {onClose && (
          <button onClick={onClose} style={S.closeBtn}>✕ CLOSE</button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={S.tabs}>
        {difficulties.map(d => (
          <button key={d} onClick={() => setFilter(d)} style={{
            ...S.tab,
            borderColor: filter === d ? C.accent : C.panelBorder,
            color:       filter === d ? C.accent : C.dim,
            background:  filter === d ? `${C.accent}11` : "transparent",
          }}>
            {d.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div style={S.list}>
        {filtered.length === 0 ? (
          <div style={S.empty}>No scores yet — be the first to contain the outbreak.</div>
        ) : (
          filtered.slice(0, 20).map((e, i) => {
            const medal = getRankMedal(i);
            return (
              <div key={i} style={{
                ...S.row,
                background: i < 3 ? `${medal.color}0d` : "transparent",
                borderColor: i < 3 ? `${medal.color}33` : C.panelBorder,
              }}>
                <div style={{ ...S.rank, color: medal.color, fontSize: i < 3 ? 16 : 12 }}>
                  {medal.emoji}
                </div>
                <div style={S.info}>
                  <div style={S.name}>{e.playerName}</div>
                  <div style={S.meta}>
                    {e.difficulty} · Rnd {e.round} · {e.date}
                  </div>
                </div>
                <div style={{ ...S.score, color: i < 3 ? medal.color : C.accent }}>
                  {formatScore(e.totalScore)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const S = {
  wrap: {
    background: C.panel, border: `1px solid ${C.panelBorder}`,
    borderRadius: 12, padding: "20px 22px",
    fontFamily: "'Rajdhani', sans-serif",
    display: "flex", flexDirection: "column", gap: 14,
    maxHeight: "80vh", overflow: "hidden",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  badge: { fontSize: 9, letterSpacing: 5, color: C.accent, fontFamily: "'Share Tech Mono', monospace", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 700, color: C.text, margin: 0, letterSpacing: -0.5 },
  closeBtn: {
    background: "transparent", border: `1px solid ${C.panelBorder}`,
    borderRadius: 6, padding: "6px 12px", color: C.dim,
    cursor: "pointer", fontSize: 11, fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: 1,
  },
  tabs: { display: "flex", gap: 6 },
  tab: {
    padding: "5px 12px", borderRadius: 6, border: "1px solid",
    cursor: "pointer", fontSize: 11,
    fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1,
    transition: "all 0.15s",
  },
  list: { display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" },
  empty: { color: C.dim, fontSize: 13, textAlign: "center", padding: "24px 0" },
  row: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 12px", borderRadius: 8,
    border: "1px solid", transition: "background 0.2s",
  },
  rank: { width: 28, textAlign: "center", fontWeight: 700, flexShrink: 0 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: 600, color: C.text },
  meta: { fontSize: 11, color: C.dim, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 },
  score: { fontSize: 18, fontWeight: 700, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 },
};