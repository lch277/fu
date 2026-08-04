"use client";

import { create } from "zustand";
import { applyEffect } from "@/game/effects";
import { createInitialState, dispatchCommand } from "@/game/reducer";
import { loadGame, saveGame } from "@/game/save";
import { tradeStock } from "@/game/stocks";
import type { EffectRequest, GameCommand, GameConfig, GameEvent, GameState, StockOrder } from "@/game/types";

interface GameStore {
  scene: "start" | "game" | "result";
  game: GameState | null;
  events: GameEvent[];
  inventoryOpen: boolean;
  stocksOpen: boolean;
  error: string | null;
  start(config: GameConfig): void;
  continueGame(): void;
  restart(): void;
  command(command: GameCommand): void;
  useEffect(request: EffectRequest): void;
  trade(order: StockOrder): void;
  setInventory(open: boolean): void;
  setStocks(open: boolean): void;
}

function persisted(state: GameState, events: GameEvent[]) {
  saveGame("auto", state);
  return { game: state, events: [...events, ...state.eventLog.slice(-1)], scene: state.phase === "game-over" ? "result" as const : "game" as const };
}

export const useGameStore = create<GameStore>((set, get) => ({
  scene: "start",
  game: null,
  events: [],
  inventoryOpen: false,
  stocksOpen: false,
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
      set({ game: result.state, events: [...get().events, ...result.events].slice(-12), scene: result.state.phase === "game-over" ? "result" : "game", error: null });
    }
  },
  useEffect(request) {
    const game = get().game;
    if (!game) return;
    const result = applyEffect(game, request);
    if (result.error) set({ error: result.error.message });
    else { saveGame("auto", result.state); set({ game: result.state, events: [...get().events, ...result.events].slice(-12), inventoryOpen: false, error: null }); }
  },
  trade(order) {
    const game = get().game;
    if (!game) return;
    const result = tradeStock(game, order);
    if (result.error) set({ error: result.error.message });
    else { saveGame("auto", result.state); set({ game: result.state, events: [...get().events, ...result.events].slice(-12), error: null }); }
  },
  setInventory(open) { set({ inventoryOpen: open, stocksOpen: false }); },
  setStocks(open) { set({ stocksOpen: open, inventoryOpen: false }); },
}));
