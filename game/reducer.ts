import { createProperties, createStocks } from "./content";
import { buyProperty, resolveLanding, upgradeProperty } from "./economy";
import { mainlandMap } from "./map";
import { tradeStock } from "./stocks";
import { endTurn, rollAndMove } from "./turn";
import { applyEffect, getEffectTargets } from "./effects";
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
    // 开局第一条就是“轮到X行动”,保证第一个玩家的回合与其他回合一样有段头
    eventLog: [{
      id: "1-TURN_STARTED-0",
      type: "TURN_STARTED",
      message: `轮到${players[ids[0]].name}行动`,
      playerId: ids[0],
      round: 1,
    }],
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
    case "USE_EFFECT": {
      if (state.phase !== "action") return { state, events: [], error: { code: "INVALID_PHASE", message: "只能在行动准备阶段使用卡片或道具" } };
      const target = getEffectTargets(state, command.effectId, command.playerId).find((item) => item.id === command.targetId);
      return target ? applyEffect(state, { playerId: command.playerId, effectId: command.effectId, target }) : { state, events: [], error: { code: "INVALID_EFFECT", message: "当前目标不可用" } };
    }
    case "BUY_STOCK":
      if (state.phase !== "action") return { state, events: [], error: { code: "INVALID_PHASE", message: "只能在行动准备阶段交易股票" } };
      return tradeStock(state, { playerId: command.playerId, stockId: command.stockId, quantity: command.quantity, side: "buy" });
    case "SELL_STOCK":
      if (state.phase !== "action") return { state, events: [], error: { code: "INVALID_PHASE", message: "只能在行动准备阶段交易股票" } };
      return tradeStock(state, { playerId: command.playerId, stockId: command.stockId, quantity: command.quantity, side: "sell" });
    default:
      return {
        state,
        events: [],
        error: { code: "COMMAND_NOT_READY", message: "这个动作尚未开放" },
      };
  }
}
