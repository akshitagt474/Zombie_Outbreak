import { useState, useEffect } from "react";
import { C } from "../constants.js";
import { getRankMedal, formatScore } from "../engine/scoring.js";

const LB_KEY = "zombie_outbreak_lb_v1";

export function saveToLeaderboard(entry) {
  try {
    const raw = localStorage.getItem(LB_KEY);
    const all = raw ? JSON.parse(raw) : [];

    const existingIdx = all.findIndex(
      e => (e.playerName ?? e.player_name) === entry.playerName
    );

    if (existingIdx >= 0) {
      const existing = all[existingIdx];
      const existingScore = existing.totalScore ?? existing.total_score ?? 0;
      if (entry.totalScore > existingScore) {
        all[existingIdx] = {
          playerName:  entry.playerName,
          difficulty:  entry.difficulty,
          round:       entry.round,
          totalScore:  entry.totalScore,
          roundScore:  entry.roundScore,
          date:        new Date().toLocaleDateString(),
        };
      }
    } else {
      all.push({
        playerName:  entry.playerName,
        difficulty:  entry.difficulty,
        round:       entry.round,
        totalScore:  entry.totalScore,
        roundScore:  entry.roundScore,
        date:        new Date().toLocaleDateString(),
      });
    }

    all.sort((a, b) =>
      (b.totalScore ?? b.total_score ?? 0) - (a.totalScore ?? a.total_score ?? 0)
    );
    localStorage.setItem(LB_KEY, JSON.stringify(all.slice(0, 100)));
  } catch {}
}

export function loadLeaderboard(difficulty = "all") {
  try {
    const raw = localStorage.getItem(LB_KEY);
    const all = raw ? JSON.parse(raw) : [];

    const filtered = difficulty === "all"
      ? all
      : all.filter(e => e.difficulty === difficulty);

    // Deduplicate by playerName — keep highest score per player
    const best = {};
    for (const e of filtered) {
      const name  = e.playerName ?? e.player_name;
      const score = e.totalScore ?? e.total_score ?? 0;
      if (!name) continue;
      if (!best[name] || score > (best[name].totalScore ?? 0)) {
        best[name] = { ...e, playerName: name, totalScore: score };
      }
    }

    return Object.values(best)
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
      .slice(0, 20);
  } catch {
    return [];
  }
}

export default function Leaderboard({ onClose }) {
  const [entries, setEntries] = useState([]);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    setEntries(loadLeaderboard(filter));
  }, [filter]);

  const difficulties = ["all", "easy", "medium", "hard"];

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

      <div style={S.list}>
        {entries.length === 0 ? (
          <div style={S.empty}>No scores yet — be the first to contain the outbreak.</div>
        ) : (
          entries.map((e, i) => {
            const medal = getRankMedal(i);
            return (
              <div key={`${e.playerName}-${i}`} style={{
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
                  {formatScore(e.totalScore ?? 0)}
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