import { useState, useEffect, useRef, useCallback } from "react";
import { createGameState, tick, applyTool, setActiveTool, nextRound } from "../engine/outbreakEngine.js";
import { TICK_INTERVAL_MS, MAX_LIVES } from "../constants.js";

export function useGameLoop() {
  const [screen,      setScreen]      = useState("menu");
  const [gameState,   setGameState]   = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);

  const tickRef  = useRef(null);
  const stateRef = useRef(null);

  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  const startGame = useCallback((playerName, difficulty) => {
    clearInterval(tickRef.current);
    const initial = createGameState(difficulty, playerName, MAX_LIVES, 0, 1);
    stateRef.current = initial;
    setGameState(initial);
    setSelectedKey(null);
    setScreen("game");
  }, []);

  // Drive the tick interval
  useEffect(() => {
    if (screen !== "game") return;
    const gs = stateRef.current;
    if (!gs || (gs.phase !== "prep" && gs.phase !== "outbreak")) return;

    tickRef.current = setInterval(() => {
      const cur = stateRef.current;
      if (!cur || (cur.phase !== "prep" && cur.phase !== "outbreak")) {
        clearInterval(tickRef.current);
        return;
      }
      const next = tick(cur);
      stateRef.current = next;
      setGameState({ ...next });
      if (next.phase === "gameover") {
        clearInterval(tickRef.current);
        setTimeout(() => setScreen("gameover"), 1500);
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(tickRef.current);
  }, [screen, gameState?.phase]);

  const clickBuilding = useCallback((key) => {
    const state = stateRef.current;
    if (!state) return;
    if (state.phase !== "prep" && state.phase !== "outbreak") return;

    if (state.activeTool === "wall") {
      if (!selectedKey) {
        setSelectedKey(key);
      } else if (selectedKey === key) {
        setSelectedKey(null);
      } else {
        const next = applyTool(state, selectedKey, key);
        stateRef.current = next;
        setGameState({ ...next });
        setSelectedKey(null);
      }
    } else {
      const next = applyTool(state, key, null);
      stateRef.current = next;
      setGameState({ ...next });
    }
  }, [selectedKey]);

  const selectTool = useCallback((tool) => {
    setSelectedKey(null);
    setGameState(prev => {
      if (!prev) return prev;
      const next = setActiveTool(prev, tool);
      stateRef.current = next;
      return { ...next };
    });
  }, []);

  const startNextRound = useCallback(() => {
    clearInterval(tickRef.current);
    const cur = stateRef.current;
    if (!cur) return;
    const next = nextRound(cur);
    stateRef.current = next;
    setGameState({ ...next });
    setSelectedKey(null);
  }, []);

  const restartRound = useCallback(() => {
    clearInterval(tickRef.current);
    const cur = stateRef.current;
    if (!cur) return;
    const restarted = createGameState(cur.difficulty, cur.playerName, cur.lives, cur.totalScore, cur.round);
    stateRef.current = restarted;
    setGameState({ ...restarted });
    setSelectedKey(null);
  }, []);

  const goToMenu = useCallback(() => {
    clearInterval(tickRef.current);
    setGameState(null);
    setSelectedKey(null);
    setScreen("menu");
  }, []);

  return {
    screen, setScreen, gameState, selectedKey,
    actions: { startGame, clickBuilding, selectTool, startNextRound, restartRound, goToMenu },
  };
}