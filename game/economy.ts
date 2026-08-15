import type { CommandResult, GameEvent, GameState, PlayerId } from "./types";
import { resolveSpecialSpace } from "./effects";
import { endTurn } from "./turn";

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

function liquidateAssets(state: GameState, playerId: PlayerId, requiredCash: number): { state: GameState; events: GameEvent[] } {
  const original = state.players[playerId];
  let cash = original.cash;
  const stocks = { ...original.stocks };
  let propertyIds = [...original.propertyIds];
  let properties = state.properties;
  let raised = 0;

  for (const [stockId, quantity] of Object.entries(stocks)) {
    if (cash >= requiredCash) break;
    const value = Math.round((state.stocks[stockId]?.price ?? 0) * quantity * 100) / 100;
    cash += value;
    raised += value;
    delete stocks[stockId];
  }

  for (const propertyId of [...propertyIds]) {
    if (cash >= requiredCash) break;
    const property = properties[propertyId];
    if (!property || property.ownerId !== playerId) continue;
    const value = Math.round(property.price * (0.6 + property.level * 0.15));
    cash += value;
    raised += value;
    propertyIds = propertyIds.filter((id) => id !== propertyId);
    properties = { ...properties, [propertyId]: { ...property, ownerId: null, level: 0 } };
  }

  if (raised <= 0) return { state, events: [] };
  const liquidated: GameEvent = {
    id: `${state.turn}-ASSETS_LIQUIDATED-0`,
    type: "ASSETS_LIQUIDATED",
    message: `${original.name}变现资产筹得 ¥${raised.toLocaleString("zh-CN")}`,
    playerId,
    amount: raised,
  };
  return {
    state: {
      ...state,
      players: { ...state.players, [playerId]: { ...original, cash, stocks, propertyIds } },
      properties,
      eventLog: [...state.eventLog, liquidated],
    },
    events: [liquidated],
  };
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
    const liquidation = player.cash < toll ? liquidateAssets(state, playerId, toll) : { state, events: [] };
    const fundedState = liquidation.state;
    const fundedPlayer = fundedState.players[playerId];
    const fundedOwner = fundedState.players[owner.id];
    const paid = Math.min(fundedPlayer.cash, toll);
    const paidEvent: GameEvent = {
      id: `${state.turn}-TOLL_PAID-0`,
      type: "TOLL_PAID",
      message: `${player.name}向${owner.name}支付 ¥${paid.toLocaleString("zh-CN")}`,
      playerId,
      amount: paid,
      data: { propertyId: property.id, ownerId: owner.id },
    };
    const paidState: GameState = {
      ...fundedState,
      players: {
        ...fundedState.players,
        [playerId]: { ...fundedPlayer, cash: fundedPlayer.cash - paid },
        [owner.id]: { ...fundedOwner, cash: fundedOwner.cash + paid },
      },
      eventLog: [...fundedState.eventLog, paidEvent],
      phase: "turn-end",
      pending: null,
    };
    const revenge = fundedPlayer.statuses.find((status) => status.id === "revenge");
    if (revenge) {
      const reflected: GameEvent = {
        id: `${state.turn}-REVENGE_TRIGGERED-0`,
        type: "REVENGE_TRIGGERED",
        message: `${player.name}发动复仇卡，返还通行费损失`,
        playerId,
        amount: paid,
      };
      return {
        state: {
          ...paidState,
          players: {
            ...paidState.players,
            [playerId]: { ...paidState.players[playerId], cash: paidState.players[playerId].cash + paid, statuses: paidState.players[playerId].statuses.filter((status) => status !== revenge) },
            [owner.id]: { ...paidState.players[owner.id], cash: paidState.players[owner.id].cash - paid },
          },
          eventLog: [...paidState.eventLog, reflected],
        },
        events: [...liquidation.events, paidEvent, reflected],
      };
    }
    if (paid < toll) {
      const bankruptcy = resolveBankruptcy(paidState, playerId);
      const progressed = endTurn(bankruptcy.state);
      return { state: progressed.state, events: [...liquidation.events, paidEvent, ...bankruptcy.events, ...progressed.events] };
    }
    return { state: paidState, events: [...liquidation.events, paidEvent] };
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
    message: `${player.name}花 ¥${property.price.toLocaleString("zh-CN")} 买下${property.name}`,
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
