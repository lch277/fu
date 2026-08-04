import { createRng } from "./rng";
import type { CommandResult, GameEvent, GameState, PlayerId, StockOrder } from "./types";

function event(state: GameState, type: string, message: string, playerId: PlayerId, amount?: number): GameEvent {
  return { id: `${state.turn}-${type}-${state.eventLog.length}`, type, message, playerId, amount };
}

export function tradeStock(state: GameState, order: StockOrder): CommandResult {
  const player = state.players[order.playerId];
  const stock = state.stocks[order.stockId];
  if (!player || !stock || !Number.isInteger(order.quantity) || order.quantity <= 0) {
    return { state, events: [], error: { code: "INVALID_ORDER", message: "股票订单无效" } };
  }

  const total = Math.round(stock.price * order.quantity * 100) / 100;
  const holding = player.stocks[stock.id] ?? 0;
  if (order.side === "buy" && player.cash < total) {
    return { state, events: [], error: { code: "INSUFFICIENT_CASH", message: "现金不足，无法买入" } };
  }
  if (order.side === "sell" && holding < order.quantity) {
    return { state, events: [], error: { code: "INSUFFICIENT_SHARES", message: "持股不足，无法卖出" } };
  }

  const nextHolding = order.side === "buy" ? holding + order.quantity : holding - order.quantity;
  const nextStocks = { ...player.stocks, [stock.id]: nextHolding };
  if (nextHolding === 0) delete nextStocks[stock.id];
  const nextCash = order.side === "buy" ? player.cash - total : player.cash + total;
  const changed = event(
    state,
    order.side === "buy" ? "STOCK_BOUGHT" : "STOCK_SOLD",
    `${player.name}${order.side === "buy" ? "买入" : "卖出"}${stock.name} ${order.quantity} 股`,
    player.id,
    total,
  );
  return {
    state: {
      ...state,
      players: { ...state.players, [player.id]: { ...player, cash: nextCash, stocks: nextStocks } },
      eventLog: [...state.eventLog, changed],
    },
    events: [changed],
  };
}

export function advanceMarket(state: GameState): CommandResult {
  const rng = createRng(state.rngState);
  const events: GameEvent[] = [];
  const stocks = Object.fromEntries(
    Object.entries(state.stocks).map(([id, stock], index) => {
      const percent = (rng.nextFloat() - 0.46) * 0.14;
      const raw = Math.round(stock.price * (1 + percent) * 100) / 100;
      const price = Math.min(stock.limitUp, Math.max(stock.limitDown, raw));
      if (price !== stock.price) {
        events.push({
          id: `${state.turn}-STOCK_CHANGED-${index}`,
          type: "STOCK_CHANGED",
          message: `${stock.name}${price > stock.price ? "上涨" : "下跌"}至 ¥${price.toFixed(2)}`,
          amount: Math.round((price - stock.price) * 100) / 100,
          data: { stockId: id, price },
        });
      }
      return [id, { ...stock, previousPrice: stock.price, price }];
    }),
  );
  return {
    state: { ...state, rngState: rng.state, stocks, eventLog: [...state.eventLog, ...events] },
    events,
  };
}

export function getChairperson(state: GameState, stockId: string): PlayerId | null {
  const ranked = state.turnOrder
    .filter((id) => state.players[id].active)
    .map((id) => ({ id, shares: state.players[id].stocks[stockId] ?? 0 }))
    .sort((a, b) => b.shares - a.shares);
  if (!ranked.length || ranked[0].shares <= 0 || ranked[0].shares === ranked[1]?.shares) return null;
  return ranked[0].id;
}
