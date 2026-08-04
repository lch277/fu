import type { CommandResult, GameEvent, GameState, PlayerId } from "./types";
import { resolveSpecialSpace } from "./effects";

const levelMultipliers = [1, 2, 3.5, 5.5, 8, 12];

function append(state: GameState, events: GameEvent[], changes: Partial<GameState>): CommandResult {
  return {
    state: { ...state, ...changes, eventLog: [...state.eventLog, ...events] },
    events,
  };
}

export function calculateToll(state: GameState, propertyId: string): number {
  const property = state.properties[propertyId];
  if (!property) return 0;
  const multiplier = levelMultipliers[Math.min(property.level, levelMultipliers.length - 1)];
  return Math.round(property.baseToll * multiplier);
}

export function resolveBankruptcy(state: GameState, playerId: PlayerId): CommandResult {
  const player = state.players[playerId];
  const released = Object.fromEntries(
    Object.entries(state.properties).map(([id, property]) => [
      id,
      property.ownerId === playerId ? { ...property, ownerId: null, level: 0 } : property,
    ]),
  );
  const bankrupt: GameEvent = {
    id: `${state.turn}-PLAYER_BANKRUPT-0`,
    type: "PLAYER_BANKRUPT",
    message: `${player.name}破产退出本局`,
    playerId,
  };

  return append(state, [bankrupt], {
    players: {
      ...state.players,
      [playerId]: { ...player, cash: 0, active: false, propertyIds: [], stocks: {}, cards: [], tools: [] },
    },
    properties: released,
    phase: "turn-end",
    pending: null,
  });
}

export function resolveLanding(state: GameState, playerId: PlayerId): CommandResult {
  const player = state.players[playerId];
  const node = state.map.nodes.find((entry) => entry.id === player.position);
  if (!node) {
    return { state, events: [], error: { code: "INVALID_POSITION", message: "角色所在位置无效" } };
  }

  if (node.propertyId) {
    const property = state.properties[node.propertyId];
    if (!property.ownerId) {
      const offered: GameEvent = {
        id: `${state.turn}-PROPERTY_OFFERED-0`,
        type: "PROPERTY_OFFERED",
        message: `是否以 ¥${property.price.toLocaleString("zh-CN")} 购买${property.name}？`,
        playerId,
        amount: property.price,
        data: { propertyId: property.id },
      };
      return append(state, [offered], { pending: { type: "purchase", propertyId: property.id }, phase: "resolving" });
    }

    if (property.ownerId === playerId) {
      if (property.level < property.maxLevel) {
        const offered: GameEvent = {
          id: `${state.turn}-UPGRADE_OFFERED-0`,
          type: "UPGRADE_OFFERED",
          message: `可以升级${property.name}`,
          playerId,
          data: { propertyId: property.id },
        };
        return append(state, [offered], { pending: { type: "upgrade", propertyId: property.id }, phase: "resolving" });
      }
      return append(state, [], { pending: null, phase: "turn-end" });
    }

    const owner = state.players[property.ownerId];
    const toll = calculateToll(state, property.id);
    const paid = Math.min(player.cash, toll);
    const paidEvent: GameEvent = {
      id: `${state.turn}-TOLL_PAID-0`,
      type: "TOLL_PAID",
      message: `${player.name}向${owner.name}支付 ¥${paid.toLocaleString("zh-CN")}`,
      playerId,
      amount: paid,
      data: { propertyId: property.id, ownerId: owner.id },
    };
    const paidState: GameState = {
      ...state,
      players: {
        ...state.players,
        [playerId]: { ...player, cash: player.cash - paid },
        [owner.id]: { ...owner, cash: owner.cash + paid },
      },
      eventLog: [...state.eventLog, paidEvent],
      phase: "turn-end",
      pending: null,
    };
    if (paid < toll) {
      const bankruptcy = resolveBankruptcy(paidState, playerId);
      return { state: bankruptcy.state, events: [paidEvent, ...bankruptcy.events] };
    }
    return { state: paidState, events: [paidEvent] };
  }

  return resolveSpecialSpace(state, playerId);
}

export function buyProperty(state: GameState, playerId: PlayerId, propertyId: string): CommandResult {
  const property = state.properties[propertyId];
  const player = state.players[playerId];
  if (state.pending?.type !== "purchase" || state.pending.propertyId !== propertyId || property?.ownerId) {
    return { state, events: [], error: { code: "INVALID_PURCHASE", message: "当前不能购买这块地产" } };
  }
  if (player.cash < property.price) {
    return { state, events: [], error: { code: "INSUFFICIENT_CASH", message: "现金不足，无法购买" } };
  }

  const bought: GameEvent = {
    id: `${state.turn}-PROPERTY_BOUGHT-0`,
    type: "PROPERTY_BOUGHT",
    message: `${player.name}买下${property.name}`,
    playerId,
    amount: property.price,
    data: { propertyId },
  };
  return append(state, [bought], {
    players: {
      ...state.players,
      [playerId]: { ...player, cash: player.cash - property.price, propertyIds: [...player.propertyIds, propertyId] },
    },
    properties: { ...state.properties, [propertyId]: { ...property, ownerId: playerId } },
    phase: "turn-end",
    pending: null,
  });
}

export function upgradeProperty(state: GameState, playerId: PlayerId, propertyId: string): CommandResult {
  const property = state.properties[propertyId];
  const player = state.players[playerId];
  const cost = Math.round(property.price * 0.5);
  if (state.pending?.type !== "upgrade" || property.ownerId !== playerId || property.level >= property.maxLevel) {
    return { state, events: [], error: { code: "INVALID_UPGRADE", message: "当前不能升级这块地产" } };
  }
  if (player.cash < cost) {
    return { state, events: [], error: { code: "INSUFFICIENT_CASH", message: "现金不足，无法升级" } };
  }
  const upgraded: GameEvent = {
    id: `${state.turn}-PROPERTY_UPGRADED-0`,
    type: "PROPERTY_UPGRADED",
    message: `${property.name}升级到 ${property.level + 1} 级`,
    playerId,
    amount: cost,
    data: { propertyId, level: property.level + 1 },
  };
  return append(state, [upgraded], {
    players: { ...state.players, [playerId]: { ...player, cash: player.cash - cost } },
    properties: { ...state.properties, [propertyId]: { ...property, level: property.level + 1 } },
    phase: "turn-end",
    pending: null,
  });
}
