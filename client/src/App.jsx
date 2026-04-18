import { useEffect }      from "react";
import { useAuth }        from "./hooks/useAuth.js";
import { useGameLoop }    from "./hooks/useGameLoop.js";
import { upsertPlayer }   from "./api/firestore.js";
import AuthScreen         from "./screens/AuthScreen.jsx";
import MenuScreen         from "./screens/MenuScreen.jsx";
import GameScreen         from "./screens/GameScreen.jsx";
import GameOverScreen     from "./screens/GameOverScreen.jsx";
import { C }              from "./constants.js";

export default function App() {
  const { player, authLoading, authError, register, login, logout } = useAuth();
  const { screen, gameState, selectedKey, actions } = useGameLoop();

  useEffect(() => {
    if (player?.uid) {
      upsertPlayer(player.uid, player.displayName, player.regNumber)
        .catch(err => console.error("Profile upsert failed:", err));
    }
  }, [player?.uid]);

  if (authLoading) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:16, fontFamily:"'Rajdhani',sans-serif" }}>
        <div style={{ width:10, height:10, borderRadius:"50%", background:C.accent }} />
        <div style={{ fontSize:11, color:C.dim, letterSpacing:4, fontFamily:"'Share Tech Mono',monospace" }}>
          CONNECTING...
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <AuthScreen
        authError={authError}
        authLoading={authLoading}
        onAuth={async ({ mode, regNumber, username, password }) => {
          if (mode === "register") await register(regNumber, username, password);
          else await login(regNumber, password);
        }}
      />
    );
  }

  if (screen === "menu") {
    return (
      <MenuScreen
        player={player}
        onStart={(_, difficulty) => actions.startGame(player.displayName, difficulty)}
        onLogout={logout}
      />
    );
  }

  if (screen === "game") {
    return (
      <GameScreen
        gameState={gameState}
        selectedKey={selectedKey}
        actions={actions}
        player={player}
      />
    );
  }

  if (screen === "gameover") {
    return <GameOverScreen gameState={gameState} onMenu={actions.goToMenu} />;
  }

  return null;
}