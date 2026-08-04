import { createProperties, createStocks } from "./content";
import { buyProperty, resolveLanding, upgradeProperty } from "./economy";
import { mainlandMap } from "./map";
import { endTurn, rollAndMove } from "./turn";
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
    pending: null,
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

  switch (command.type) {
    case "ROLL_DICE":
      return rollAndMove(state, command.playerId);
    case "RESOLVE_LANDING":
      return resolveLanding(state, command.playerId);
    case "BUY_PROPERTY":
      return buyProperty(state, command.playerId, command.propertyId);
    case "UPGRADE_PROPERTY":
      return upgradeProperty(state, command.playerId, command.propertyId);
    case "SKIP_PURCHASE":
      return {
        state: { ...state, phase: "turn-end", pending: null },
        events: [],
      };
    case "END_TURN":
      return endTurn(state);
    default:
      return {
        state,
        events: [],
        error: { code: "COMMAND_NOT_READY", message: "这个动作尚未开放" },
      };
  }
}
