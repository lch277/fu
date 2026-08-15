import { CARD_DEFINITIONS, GOD_DEFINITIONS, TOOL_DEFINITIONS } from "./content";
import { createRng } from "./rng";
import type {
  CommandResult,
  EffectRequest,
  GameEvent,
  GameState,
  PlayerId,
  TargetRef,
} from "./types";

const cardIds = new Set(CARD_DEFINITIONS.map((card) => card.id));
const toolIds = new Set(TOOL_DEFINITIONS.map((tool) => tool.id));

function makeEvent(state: GameState, type: string, message: string, playerId: PlayerId, amount?: number): GameEvent {
  return { id: `${state.turn}-${type}-${state.eventLog.length}`, type, message, playerId, amount };
}

function finish(state: GameState, events: GameEvent[], changes: Partial<GameState>): CommandResult {
  return { state: { ...state, ...changes, eventLog: [...state.eventLog, ...events] }, events };
}

export function getEffectTargets(state: GameState, effectId: string, playerId: PlayerId): TargetRef[] {
  const player = state.players[playerId];
  if (!player?.active) return [];

  if (effectId === "purchase-card") {
    const node = state.map.nodes.find((entry) => entry.id === player.position);
    const property = node?.propertyId ? state.properties[node.propertyId] : null;
    return property && !property.ownerId && player.cash >= property.price
      ? [{ type: "property", id: property.id }]
      : [];
  }
  if (effectId === "send-god-card") {
    return player.god ? [{ type: "player", id: playerId }] : [];
  }
  if (effectId === "swap-card") {
    if (!player.propertyIds.length) return [];
    return Object.values(state.properties).filter((property) => property.ownerId && property.ownerId !== playerId).map((property) => ({ type: "property" as const, id: property.id }));
  }
  if (effectId === "remodel-card") {
    return player.propertyIds.map((id) => ({ type: "property" as const, id }));
  }
  if (["stop-card", "tax-card", "equal-poor-card", "devil-card", "turn-card"].includes(effectId)) {
    return state.turnOrder
      .filter((id) => id !== playerId && state.players[id].active)
      .map((id) => ({ type: "player" as const, id }));
  }
  if (effectId === "bomb") {
    return state.turnOrder
      .filter((id) => id !== playerId && state.players[id].active)
      .map((id) => ({ type: "player" as const, id }));
  }
  if (["roadblock", "mine"].includes(effectId)) {
    const occupied = new Set(state.hazards.map((hazard) => hazard.nodeId));
    return state.map.nodes
      .filter((node) => node.id !== player.position && !occupied.has(node.id) && node.type !== "hospital" && node.type !== "jail")
      .map((node) => ({ type: "road" as const, id: node.id }));
  }
  if (["red-card", "black-card"].includes(effectId)) {
    return Object.keys(state.stocks).map((id) => ({ type: "stock" as const, id }));
  }
  return [{ type: "player", id: playerId }];
}

function consume(player: GameState["players"][string], effectId: string) {
  if (cardIds.has(effectId)) {
    const index = player.cards.indexOf(effectId);
    return index < 0 ? null : { ...player, cards: player.cards.filter((_, cardIndex) => cardIndex !== index) };
  }
  if (toolIds.has(effectId)) {
    const index = player.tools.indexOf(effectId);
    return index < 0 ? null : { ...player, tools: player.tools.filter((_, toolIndex) => toolIndex !== index) };
  }
  return null;
}

export function applyEffect(state: GameState, request: EffectRequest): CommandResult {
  const actor = state.players[request.playerId];
  const consumed = consume(actor, request.effectId);
  const legal = getEffectTargets(state, request.effectId, request.playerId).some(
    (target) => target.type === request.target.type && target.id === request.target.id,
  );
  if (!consumed || !legal) {
    return { state, events: [], error: { code: "INVALID_EFFECT", message: "当前不能对这个目标使用该物品" } };
  }

  let players = { ...state.players, [request.playerId]: consumed };
  let properties = state.properties;
  let stocks = state.stocks;
  let hazards = state.hazards;
  const events: GameEvent[] = [];
  const targetPlayer = request.target.type === "player" ? state.players[request.target.id] : null;

  switch (request.effectId) {
    case "purchase-card": {
      const property = state.properties[request.target.id];
      players = {
        ...players,
        [request.playerId]: {
          ...consumed,
          cash: consumed.cash - property.price,
          propertyIds: [...consumed.propertyIds, property.id],
        },
      };
      properties = { ...properties, [property.id]: { ...property, ownerId: request.playerId } };
      events.push(makeEvent(state, "PROPERTY_BOUGHT", `${actor.name}使用购地卡买下${property.name}`, actor.id, property.price));
      break;
    }
    case "stop-card": {
      const stopped = { id: "stopped", name: "原地停留", remainingTurns: 1, tone: "negative" as const };
      players = { ...players, [targetPlayer!.id]: { ...targetPlayer!, statuses: [...targetPlayer!.statuses.filter((status) => status.id !== "stopped"), stopped] } };
      events.push(makeEvent(state, "STATUS_ADDED", `${targetPlayer!.name}将停留一回合`, targetPlayer!.id));
      break;
    }
    case "send-god-card": {
      players = { ...players, [targetPlayer!.id]: { ...targetPlayer!, god: null } };
      events.push(makeEvent(state, "GOD_LEFT", `${targetPlayer!.god?.name}离开了${targetPlayer!.name}`, targetPlayer!.id));
      break;
    }
    case "invite-god-card": {
      players = { ...players, [request.playerId]: { ...consumed, god: { id: "wealth-god", name: "财神", remainingTurns: 4, tone: "positive" } } };
      events.push(makeEvent(state, "GOD_JOINED", `财神附身${actor.name}`, actor.id));
      break;
    }
    case "tax-card": {
      const tax = Math.min(targetPlayer!.cash, Math.max(500, Math.round(targetPlayer!.cash * 0.1)));
      players = {
        ...players,
        [request.playerId]: { ...consumed, cash: consumed.cash + tax },
        [targetPlayer!.id]: { ...targetPlayer!, cash: targetPlayer!.cash - tax },
      };
      events.push(makeEvent(state, "TAX_COLLECTED", `${actor.name}向${targetPlayer!.name}查税`, actor.id, tax));
      break;
    }
    case "equal-poor-card": {
      const average = Math.floor((consumed.cash + targetPlayer!.cash) / 2);
      players = {
        ...players,
        [request.playerId]: { ...consumed, cash: average },
        [targetPlayer!.id]: { ...targetPlayer!, cash: average },
      };
      events.push(makeEvent(state, "CASH_EQUALIZED", `${actor.name}与${targetPlayer!.name}的现金被平均`, actor.id));
      break;
    }
    case "swap-card": {
      const targetProperty = properties[request.target.id];
      const ownProperty = properties[actor.propertyIds[0]];
      const targetOwner = state.players[targetProperty.ownerId!];
      properties = {
        ...properties,
        [ownProperty.id]: { ...ownProperty, ownerId: targetOwner.id },
        [targetProperty.id]: { ...targetProperty, ownerId: actor.id },
      };
      players = {
        ...players,
        [actor.id]: { ...consumed, propertyIds: actor.propertyIds.map((id) => id === ownProperty.id ? targetProperty.id : id) },
        [targetOwner.id]: { ...targetOwner, propertyIds: targetOwner.propertyIds.map((id) => id === targetProperty.id ? ownProperty.id : id) },
      };
      events.push(makeEvent(state, "PROPERTIES_SWAPPED", `${actor.name}与${targetOwner.name}交换地产`, actor.id));
      break;
    }
    case "remodel-card": {
      const property = properties[request.target.id];
      properties = { ...properties, [property.id]: { ...property, level: Math.min(property.maxLevel, property.level + 1) } };
      events.push(makeEvent(state, "PROPERTY_REMODELED", `${property.name}完成改建`, actor.id));
      break;
    }
    case "equal-rich-card": {
      const active = state.turnOrder.filter((id) => state.players[id].active);
      const average = Math.floor(active.reduce((sum, id) => sum + state.players[id].cash, 0) / active.length);
      players = Object.fromEntries(Object.entries(players).map(([id, player]) => [id, active.includes(id) ? { ...player, cash: average } : player]));
      events.push(makeEvent(state, "CASH_EQUALIZED", "所有玩家的现金被重新平均", actor.id));
      break;
    }
    case "angel-card": {
      properties = Object.fromEntries(Object.entries(properties).map(([id, property]) => [id, property.ownerId === actor.id ? { ...property, level: Math.min(property.maxLevel, property.level + 1) } : property]));
      events.push(makeEvent(state, "PROPERTIES_BLESSED", `${actor.name}的地产全部升级`, actor.id));
      break;
    }
    case "devil-card": {
      properties = Object.fromEntries(Object.entries(properties).map(([id, property]) => [id, property.ownerId === targetPlayer!.id ? { ...property, level: Math.max(0, property.level - 1) } : property]));
      events.push(makeEvent(state, "PROPERTIES_CURSED", `${targetPlayer!.name}的地产全部降级`, targetPlayer!.id));
      break;
    }
    case "red-card":
    case "black-card": {
      const stock = stocks[request.target.id];
      const delta = request.effectId === "red-card" ? 0.1 : -0.1;
      const price = Math.round(stock.price * (1 + delta) * 100) / 100;
      stocks = { ...stocks, [stock.id]: { ...stock, previousPrice: stock.price, price: Math.min(stock.limitUp, Math.max(stock.limitDown, price)) } };
      events.push(makeEvent(state, "STOCK_MANIPULATED", `${stock.name}${delta > 0 ? "涨停" : "跌停"}`, actor.id));
      break;
    }
    case "bomb": {
      const status = { id: "bomb", name: "定时炸弹（6）", remainingTurns: 6, tone: "negative" as const };
      players = {
        ...players,
        [targetPlayer!.id]: {
          ...targetPlayer!,
          statuses: [...targetPlayer!.statuses.filter((item) => item.id !== "bomb"), status],
        },
      };
      events.push(makeEvent(state, "BOMB_ATTACHED", `${actor.name}把定时炸弹交给${targetPlayer!.name}，移动六格后爆炸`, actor.id));
      break;
    }
    case "roadblock":
    case "mine": {
      const type = request.effectId === "roadblock" ? "roadblock" : request.effectId;
      hazards = [...hazards, { id: `${state.turn}-${type}-${request.target.id}`, nodeId: request.target.id, ownerId: actor.id, type }];
      events.push(makeEvent(state, "HAZARD_PLACED", `${actor.name}放置了${request.effectId === "roadblock" ? "路障" : request.effectId === "mine" ? "地雷" : "定时炸弹"}`, actor.id));
      break;
    }
    case "machine-doll": {
      const currentIndex = state.map.nodes.findIndex((node) => node.id === actor.position);
      const forward = new Set(Array.from({ length: 6 }, (_, index) => state.map.nodes[(currentIndex + index + 1) % state.map.nodes.length].id));
      hazards = hazards.filter((hazard) => !forward.has(hazard.nodeId));
      events.push(makeEvent(state, "ROAD_CLEARED", "机器娃娃清除了前方障碍", actor.id));
      break;
    }
    case "turn-card": {
      const status = { id: "reversed", name: "反向行进", remainingTurns: 1, tone: "negative" as const };
      players = { ...players, [targetPlayer!.id]: { ...targetPlayer!, statuses: [...targetPlayer!.statuses.filter((item) => item.id !== status.id), status] } };
      events.push(makeEvent(state, "STATUS_ADDED", `${targetPlayer!.name}下一次将反向行进`, targetPlayer!.id));
      break;
    }
    case "remote-die":
    case "motorbike":
    case "car":
    case "immunity-card":
    case "revenge-card": {
      const statusId = request.effectId.replace("-card", "");
      const status: StatusEffect = { id: statusId, name: CARD_DEFINITIONS.concat(TOOL_DEFINITIONS).find((item) => item.id === request.effectId)?.name ?? "特殊状态", remainingTurns: 1, tone: "positive" as const, value: statusId === "remote-die" ? request.value : undefined };
      players = { ...players, [actor.id]: { ...consumed, statuses: [...consumed.statuses.filter((item) => item.id !== statusId), status] } };
      events.push(makeEvent(state, "STATUS_ADDED", `${actor.name}获得${status.name}`, actor.id));
      break;
    }
    default:
      events.push(makeEvent(state, "EFFECT_USED", `${actor.name}使用了${request.effectId}`, actor.id));
  }

  return finish(state, events, { players, properties, stocks, hazards });
}

export function tickStatuses(state: GameState, playerId: PlayerId): CommandResult {
  const player = state.players[playerId];
  const events: GameEvent[] = [];
  let cash = player.cash;
  let god = player.god;

  if (god?.id === "wealth-god") {
    cash += 1_200;
    events.push(makeEvent(state, "GOD_CASH", "财神送来 ¥1,200", playerId, 1_200));
  } else if (god?.id === "poor-god") {
    const loss = Math.min(cash, 1_200);
    cash -= loss;
    events.push(makeEvent(state, "GOD_CASH", `穷神带走 ¥${loss.toLocaleString("zh-CN")}`, playerId, -loss));
  } else if (god?.id === "death-god") {
    const loss = Math.round(cash * 0.08);
    cash -= loss;
    events.push(makeEvent(state, "GOD_CASH", `死神带走 ¥${loss.toLocaleString("zh-CN")}`, playerId, -loss));
  }

  if (god) {
    god = god.remainingTurns <= 1 ? null : { ...god, remainingTurns: god.remainingTurns - 1 };
    if (!god) events.push(makeEvent(state, "GOD_LEFT", "附身神仙离开了", playerId));
  }
  const usedOnAction = new Set(["reversed", "remote-die", "motorbike", "car", "immunity", "revenge", "bomb"]);
  const statuses = player.statuses
    .map((status) => usedOnAction.has(status.id) ? status : { ...status, remainingTurns: status.remainingTurns - 1 })
    .filter((status) => status.remainingTurns > 0);

  return finish(state, events, {
    players: { ...state.players, [playerId]: { ...player, cash, god, statuses } },
  });
}

export function resolveSpecialSpace(state: GameState, playerId: PlayerId): CommandResult {
  const player = state.players[playerId];
  const node = state.map.nodes.find((entry) => entry.id === player.position);
  if (!node) return { state, events: [], error: { code: "INVALID_POSITION", message: "角色所在位置无效" } };
  const rng = createRng(state.rngState);
  let cash = player.cash;
  let cards = player.cards;
  let tools = player.tools;
  let statuses = player.statuses;
  let god = player.god;
  let message = `${player.name}来到${node.name}`;
  let amount = 0;

  if (node.type === "chance" || node.type === "news") {
    const outcomes = [-2_500, -1_000, 1_500, 3_000];
    amount = outcomes[rng.integer(0, outcomes.length - 1)];
    cash = Math.max(0, cash + amount);
    message = amount >= 0 ? `好运降临，获得 ¥${amount.toLocaleString("zh-CN")}` : `突发支出 ¥${Math.abs(amount).toLocaleString("zh-CN")}`;
  } else if (node.type === "bank") {
    amount = 300;
    cash += amount;
    message = "银行结算利息 ¥300";
  } else if (node.type === "shop") {
    const inventory = node.id === "shop-3" ? TOOL_DEFINITIONS : node.id === "shop-2" ? CARD_DEFINITIONS : [...CARD_DEFINITIONS, ...TOOL_DEFINITIONS];
    const item = inventory[rng.integer(0, inventory.length - 1)];
    if (toolIds.has(item.id)) tools = [...tools, item.id];
    else cards = [...cards, item.id];
    message = `获得${toolIds.has(item.id) ? "道具" : "卡片"}·${item.name}`;
  } else if (node.type === "hospital" || node.type === "jail") {
    const id = node.type === "hospital" ? "hospitalized" : "jailed";
    const immune = statuses.find((status) => status.id === "immunity");
    if (immune) {
      statuses = statuses.filter((status) => status !== immune);
      message = `免罪效果抵消了${node.type === "hospital" ? "住院" : "坐牢"}`;
    } else {
      statuses = [...statuses, { id, name: node.type === "hospital" ? "住院" : "坐牢", remainingTurns: 2, tone: "negative" }];
      message = node.type === "hospital" ? "需要住院两回合" : "需要停留两回合";
    }
  } else if (node.type === "lottery") {
    amount = 800;
    cash += amount;
    message = "乐透中心发放幸运奖 ¥800";
  } else if (node.type === "magic") {
    const roll = rng.integer(0, 99);
    if (roll < 35) {
      const item = CARD_DEFINITIONS[rng.integer(0, CARD_DEFINITIONS.length - 1)];
      cards = [...cards, item.id];
      message = `魔法变出一张卡片·${item.name}`;
    } else if (roll < 55) {
      const item = TOOL_DEFINITIONS[rng.integer(0, TOOL_DEFINITIONS.length - 1)];
      tools = [...tools, item.id];
      message = `魔法变出一件道具·${item.name}`;
    } else if (roll < 75) {
      amount = rng.integer(1, 3) * 1_000;
      cash += amount;
      message = `魔法点石成金，获得 ¥${amount.toLocaleString("zh-CN")}`;
    } else if (roll < 90) {
      amount = -rng.integer(1, 2) * 500;
      cash = Math.max(0, cash + amount);
      message = `魔法失灵，损失 ¥${Math.abs(amount).toLocaleString("zh-CN")}`;
    } else {
      const def = GOD_DEFINITIONS[rng.integer(0, GOD_DEFINITIONS.length - 1)];
      const replaced = god ? `，替换了${god.name}` : "";
      god = { id: def.id, name: def.name, remainingTurns: 4, tone: def.id === "poor-god" || def.id === "unlucky-god" || def.id === "death-god" ? "negative" : "positive" };
      message = `魔法召唤出${def.name}，附身四回合${replaced}`;
    }
  }

  const resolved = makeEvent(state, "SPECIAL_SPACE_RESOLVED", message, playerId, amount || undefined);
  return finish(state, [resolved], {
    rngState: rng.state,
    players: { ...state.players, [playerId]: { ...player, cash, cards, tools, statuses, god } },
    phase: "turn-end",
  });
}
