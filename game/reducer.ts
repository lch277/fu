import { createProperties, createStocks } from "./content";
import { mainlandMap } from "./map";
import type {
  CommandResult,
  GameCommand,
  GameConfig,
  GameState,
  PlayerState,
} from "./types";

export function createInitialState(config: GameConfig): GameState {
  if (config.players.length < 2 || config.players.length > 4) {
    throw new Error("玩家数量必须为 2–4");
  }

  const ids = config.players.map((player) => player.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("玩家编号不能重复");
  }

  const startingCash = config.mode === "quick" ? 28_000 : 50_000;
  const players = Object.fromEntries(
    config.players.map((setup) => {
      const player: PlayerState = {
        ...setup,
        cash: startingCash,
        position: mainlandMap.nodes[0].id,
        active: true,
        propertyIds: [],
        cards: ["purchase-card", "turn-card"],
        tools: [],
        stocks: {},
        statuses: [],
        god: null,
      };
      return [setup.id, player];
    }),
  );

  return {
    version: 1,
    config: structuredClone(config),
    seed: config.seed >>> 0,
    rngState: config.seed >>> 0,
    round: 1,
    turn: 1,
    currentPlayerId: ids[0],
    turnOrder: ids,
    phase: "action",
    players,
    map: structuredClone(mainlandMap),
    properties: createProperties(),
    stocks: createStocks(),
    hazards: [],
    lastRoll: null,
    eventLog: [],
    winnerIds: [],
  };
}

export function dispatchCommand(state: GameState, command: GameCommand): CommandResult {
  if (command.playerId !== state.currentPlayerId) {
    return {
      state,
      events: [],
      error: {
        code: "NOT_CURRENT_PLAYER",
        message: `现在轮到${state.players[state.currentPlayerId].name}行动`,
      },
    };
  }

  return {
    state,
    events: [],
    error: { code: "COMMAND_NOT_READY", message: "这个动作尚未开放" },
  };
}
