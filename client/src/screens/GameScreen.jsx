/**
 * GAME SCREEN — Step 5
 *
 * Updated to pass the Firebase player object down to GameOver
 * so scores can be submitted to Firestore.
 */

import { C }       from "../constants.js";
import CityGrid    from "../components/CityGrid.jsx";
import HUD         from "../components/HUD.jsx";
import ToolBar     from "../components/Toolbar.jsx";
import GameOver    from "../components/GameOver.jsx";

export default function GameScreen({ gameState, selectedKey, actions, player }) {
  if (!gameState) return null;

  const { phase, playerName, round, difficulty } = gameState;
  const showOverlay = phase === "won" || phase === "lost" || phase === "gameover";

  return (
    <div style={S.page}>

      {/* Top bar */}
      <div style={S.topBar}>
        <button onClick={actions.goToMenu} style={S.menuBtn}>← MENU</button>
        <div style={S.topMid}>
          <span style={S.topName}>{playerName}</span>
          <span style={S.topSep}>·</span>
          <span style={S.topDiff}>{difficulty.toUpperCase()}</span>
          <span style={S.topSep}>·</span>
          <span style={S.topRound}>ROUND {round}</span>
        </div>
        <div style={S.topRight} />
      </div>

      {/* Main layout */}
      <div style={S.main}>
        <div style={S.left}>
          <HUD gameState={gameState} />
          <ToolBar gameState={gameState} onSelectTool={actions.selectTool} />
        </div>

        <div style={S.centre}>
          <CityGrid
            gameState={gameState}
            selectedKey={selectedKey}
            onClickBuilding={actions.clickBuilding}
          />
          {gameState.activeTool === "wall" && selectedKey && (
            <div style={S.wallHint}>
              Building {selectedKey} selected — click an adjacent building to place wall. Hospital edges are off-limits.
            </div>
          )}
        </div>
      </div>

      {/* Round end overlay */}
      {showOverlay && (
        <GameOver
          gameState={gameState}
          player={player}
          onNextRound={actions.startNextRound}
          onRestart={actions.restartRound}
          onMenu={actions.goToMenu}
        />
      )}
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh", background: C.bg,
    display: "flex", flexDirection: "column",
    fontFamily: "'Rajdhani',sans-serif", color: C.text,
  },
  topBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 20px", borderBottom: `1px solid ${C.panelBorder}`,
    background: C.panel, position: "sticky", top: 0, zIndex: 10,
  },
  menuBtn: {
    background: "transparent", border: `1px solid ${C.panelBorder}`,
    borderRadius: 6, padding: "6px 12px", color: C.dim,
    cursor: "pointer", fontFamily: "'Share Tech Mono',monospace",
    fontSize: 11, letterSpacing: 1,
  },
  topMid:   { display: "flex", alignItems: "center", gap: 10 },
  topName:  { fontSize: 15, fontWeight: 700, color: C.text },
  topSep:   { color: C.panelBorder },
  topDiff:  { fontSize: 11, color: C.accent, fontFamily: "'Share Tech Mono',monospace", letterSpacing: 2 },
  topRound: { fontSize: 11, color: C.dim,    fontFamily: "'Share Tech Mono',monospace", letterSpacing: 2 },
  topRight: { width: 80 },
  main: {
    flex: 1, display: "flex", gap: 16,
    padding: 16, alignItems: "flex-start", flexWrap: "wrap",
  },
  left: { display: "flex", flexDirection: "column", gap: 12, width: 220, flexShrink: 0 },
  centre: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  wallHint: {
    fontSize: 11, color: C.wall,
    fontFamily: "'Share Tech Mono',monospace",
    letterSpacing: 1, textAlign: "center",
    background: `${C.wall}11`, border: `1px solid ${C.wall}44`,
    borderRadius: 6, padding: "6px 14px",
  },
};
