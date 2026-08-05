"use client";

import { create } from "zustand";
import { applyEffect } from "@/game/effects";
import { createInitialState, dispatchCommand } from "@/game/reducer";
import { loadGame, saveGame } from "@/game/save";
import { tradeStock } from "@/game/stocks";
import { playEventSound } from "@/game/audio";
import type { UiSettings } from "@/components/SettingsDrawer";
import type { EffectRequest, GameCommand, GameConfig, GameEvent, GameState, StockOrder } from "@/game/types";

interface GameStore {
  scene: "start" | "game" | "result";
  game: GameState | null;
  events: GameEvent[];
  inventoryOpen: boolean;
  stocksOpen: boolean;
  settingsOpen: boolean;
  settings: UiSettings;
  error: string | null;
  start(config: GameConfig): void;
  continueGame(): void;
  restart(): void;
  command(command: GameCommand): void;
  useEffect(request: EffectRequest): void;
  trade(order: StockOrder): void;
  setInventory(open: boolean): void;
  setStocks(open: boolean): void;
  setSettingsOpen(open: boolean): void;
  setSettings(settings: UiSettings): void;
  exitToStart(): void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  scene: "start",
  game: null,
  events: [],
  inventoryOpen: false,
  stocksOpen: false,
  settingsOpen: false,
  settings: { sound: true, speed: 1 },
  error: null,
  start(config) {
    const state = createInitialState(config);
    saveGame("auto", state);
    set({ game: state, scene: "game", events: [], error: null });
  },
  continueGame() {
    const loaded = loadGame("auto");
    if (loaded.ok) set({ game: loaded.state, scene: loaded.state.phase === "game-over" ? "result" : "game", events: loaded.state.eventLog.slice(-8), error: null });
    else set({ error: loaded.message });
  },
  restart() { set({ scene: "start", game: null, events: [], error: null, inventoryOpen: false, stocksOpen: false }); },
  command(command) {
    const game = get().game;
    if (!game) return;
    const result = dispatchCommand(game, command);
    if (result.error) set({ error: result.error.message });
    else {
      saveGame("auto", result.state);
      playEventSound(result.events, get().settings.sound);
      set({ game: result.state, events: [...get().events, ...result.events].slice(-12), scene: result.state.phase === "game-over" ? "result" : "game", error: null });
    }
  },
  useEffect(request) {
    const game = get().game;
    if (!game) return;
    const result = applyEffect(game, request);
    if (result.error) set({ error: result.error.message });
    else { saveGame("auto", result.state); playEventSound(result.events, get().settings.sound); set({ game: result.state, events: [...get().events, ...result.events].slice(-12), inventoryOpen: false, error: null }); }
  },
  trade(order) {
    const game = get().game;
    if (!game) return;
    const result = tradeStock(game, order);
    if (result.error) set({ error: result.error.message });
    else { saveGame("auto", result.state); playEventSound(result.events, get().settings.sound); set({ game: result.state, events: [...get().events, ...result.events].slice(-12), error: null }); }
  },
  setInventory(open) { set({ inventoryOpen: open, stocksOpen: false, settingsOpen: false }); },
  setStocks(open) { set({ stocksOpen: open, inventoryOpen: false, settingsOpen: false }); },
  setSettingsOpen(open) { set({ settingsOpen: open, inventoryOpen: false, stocksOpen: false }); },
  setSettings(settings) {
    if (typeof window !== "undefined") window.localStorage.setItem("richman-ui-settings", JSON.stringify(settings));
    set({ settings });
  },
  exitToStart() { set({ scene: "start", settingsOpen: false, inventoryOpen: false, stocksOpen: false }); },
}));
