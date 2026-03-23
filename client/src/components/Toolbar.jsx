import { useEffect } from "react";
import { C, TOOLS } from "../constants.js";

export default function ToolBar({ gameState, onSelectTool }) {
  if (!gameState) return null;

  const { activeTool, toolsLeft, phase } = gameState;
  const canUse = phase === "prep" || phase === "outbreak";

  // Keyboard shortcuts
  useEffect(() => {
    if (!canUse) return;
    const handler = (e) => {
      const key = e.key.toUpperCase();
      const match = Object.entries(TOOLS).find(([, def]) => def.key === key);
      if (match) onSelectTool(match[0]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canUse, onSelectTool]);

  return (
    <div style={S.wrap}>
      <div style={S.heading}>TOOLS</div>
      <div style={S.tools}>
        {Object.entries(TOOLS).map(([id, def]) => {
          const remaining = toolsLeft[id] ?? 0;
          const isActive  = activeTool === id;
          const depleted  = remaining <= 0;

          return (
            <button
              key={id}
              onClick={() => canUse && !depleted && onSelectTool(id)}
              disabled={!canUse || depleted}
              style={{
                ...S.btn,
                borderColor: isActive ? def.color : depleted ? C.panelBorder : C.panelBorder,
                background:  isActive ? `${def.color}22` : "transparent",
                opacity:     depleted ? 0.35 : 1,
                cursor:      !canUse || depleted ? "not-allowed" : "pointer",
              }}
            >
              {/* Color indicator bar */}
              <div style={{ ...S.colorBar, background: isActive ? def.color : C.panelBorder }} />

              <div style={S.btnBody}>
                <div style={S.btnTop}>
                  <span style={{ ...S.btnLabel, color: isActive ? def.color : C.text }}>
                    {def.label}
                  </span>
                  <span style={{
                    ...S.kbdBadge,
                    borderColor: isActive ? def.color : C.panelBorder,
                    color: isActive ? def.color : C.dim,
                  }}>
                    {def.key}
                  </span>
                </div>
                <div style={S.btnDesc}>{def.description}</div>
                <div style={S.budgetRow}>
                  {Array.from({ length: toolsLeft[id] + (gameState.toolsLeft[id] !== undefined ? 0 : 0) }).map((_, i) => (
                    <div key={i} style={{ ...S.pip, background: def.color }} />
                  ))}
                  {Array.from({ length: Math.max(0, (TOOLS[id].budget[gameState.difficulty] ?? 0) - remaining) }).map((_, i) => (
                    <div key={`u${i}`} style={{ ...S.pip, background: C.panelBorder }} />
                  ))}
                  <span style={{ ...S.budgetNum, color: remaining <= 1 ? C.danger : def.color }}>
                    {remaining} left
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Instructions */}
      <div style={S.tip}>
        {activeTool === "wall"
          ? "Click a building, then click a neighbour to place a wall"
          : activeTool === "hazmat"
          ? "Click any building to clear infection + immunise"
          : "Click any building to slow its BFS spread by +2s"}
      </div>
    </div>
  );
}

const S = {
  wrap: {
    background: C.panel, border: `1px solid ${C.panelBorder}`,
    borderRadius: 10, padding: "14px 16px",
    fontFamily: "'Rajdhani', sans-serif",
    display: "flex", flexDirection: "column", gap: 10,
  },
  heading: {
    fontSize: 10, letterSpacing: 4, color: C.dim,
    fontFamily: "'Share Tech Mono', monospace",
  },
  tools: { display: "flex", flexDirection: "column", gap: 8 },
  btn: {
    display: "flex", gap: 0, padding: 0,
    border: "1px solid", borderRadius: 8,
    textAlign: "left", transition: "all 0.15s",
    overflow: "hidden", background: "transparent",
    width: "100%",
  },
  colorBar: { width: 3, flexShrink: 0, transition: "background 0.15s" },
  btnBody: { flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 },
  btnTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  btnLabel: { fontSize: 14, fontWeight: 600, transition: "color 0.15s" },
  kbdBadge: {
    fontSize: 10, fontFamily: "'Share Tech Mono', monospace",
    border: "1px solid", borderRadius: 3, padding: "1px 5px",
    transition: "color 0.15s, border-color 0.15s",
  },
  btnDesc: { fontSize: 11, color: C.dim, lineHeight: 1.4 },
  budgetRow: { display: "flex", alignItems: "center", gap: 4, marginTop: 2 },
  pip: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  budgetNum: {
    fontSize: 10, fontFamily: "'Share Tech Mono', monospace",
    marginLeft: 4, letterSpacing: 1,
  },
  tip: {
    fontSize: 11, color: C.dim, lineHeight: 1.5,
    background: "#070d14", borderRadius: 6,
    padding: "8px 10px",
    border: `1px solid ${C.panelBorder}`,
  },
};