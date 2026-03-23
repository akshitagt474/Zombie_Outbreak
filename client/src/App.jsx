import { useGameLoop }    from "./hooks/useGameLoop.js";
import MenuScreen         from "./screens/MenuScreen.jsx";
import GameScreen         from "./screens/GameScreen.jsx";
import GameOverScreen     from "./screens/GameOverScreen.jsx";

export default function App() {
  const { screen, gameState, selectedKey, actions } = useGameLoop();

  if (screen === "menu")     return <MenuScreen onStart={actions.startGame} />;
  if (screen === "game")     return <GameScreen gameState={gameState} selectedKey={selectedKey} actions={actions} />;
  if (screen === "gameover") return <GameOverScreen gameState={gameState} onMenu={actions.goToMenu} />;
  return null;
}