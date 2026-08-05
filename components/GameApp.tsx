"use client";

import { useEffect, useSyncExternalStore } from "react";
import { chooseAiCommand } from "@/game/ai";
import { loadGame } from "@/game/save";
import { GameScreen } from "./GameScreen";
import { InventoryDrawer } from "./InventoryDrawer";
import { ResultScreen } from "./ResultScreen";
import { StartScreen } from "./StartScreen";
import { StockDrawer } from "./StockDrawer";
import { SettingsDrawer } from "./SettingsDrawer";
import { useGameStore } from "@/store/gameStore";

export function GameApp() {
  const store = useGameStore();
  const { game, scene, settings, command } = store;
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const canContinue = mounted && loadGame("auto").ok;

  useEffect(() => {
    if (!game || scene !== "game" || game.phase === "game-over") return;
    const current = game.players[game.currentPlayerId];
    const automaticLanding = game.phase === "resolving" && !game.pending;
    const automaticAi = current.kind === "ai";
    if (!automaticLanding && !automaticAi) return;
    const timer = window.setTimeout(() => {
      if (automaticLanding) command({ type: "RESOLVE_LANDING", playerId: current.id });
      else command(chooseAiCommand(game, current.id, current.difficulty ?? "standard"));
    }, (automaticLanding ? 520 : 680) / settings.speed);
    return () => window.clearTimeout(timer);
  }, [command, game, scene, settings.speed]);

  if (store.scene === "start" || !store.game) return <StartScreen onStart={store.start} canContinue={canContinue} onContinue={store.continueGame} />;
  if (store.scene === "result") return <ResultScreen state={store.game} onRestart={store.restart} />;
  return <>
    <GameScreen state={store.game} events={store.events} onCommand={store.command} onOpenInventory={() => store.setInventory(true)} onOpenStocks={() => store.setStocks(true)} onOpenSettings={() => store.setSettingsOpen(true)} />
    <InventoryDrawer open={store.inventoryOpen} state={store.game} onClose={() => store.setInventory(false)} onUse={store.useEffect} />
    <StockDrawer open={store.stocksOpen} state={store.game} onClose={() => store.setStocks(false)} onTrade={store.trade} />
    <SettingsDrawer open={store.settingsOpen} settings={store.settings} onChange={store.setSettings} onClose={() => store.setSettingsOpen(false)} onExit={store.exitToStart} />
    {store.error && <button className="error-toast" onClick={() => useGameStore.setState({ error: null })}>{store.error}<span>×</span></button>}
  </>;
}
