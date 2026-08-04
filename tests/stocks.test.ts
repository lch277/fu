import { describe, expect, it } from "vitest";
import { createInitialState } from "@/game/reducer";
import { advanceMarket, getChairperson, tradeStock } from "@/game/stocks";
import type { GameConfig, GameState } from "@/game/types";

const config: GameConfig = {
  mode: "quick",
  seed: 808,
  maxRounds: 50,
  targetNetWorth: 100_000,
  players: [
    { id: "p1", name: "孙小美", character: "sun-xiaomei", kind: "human", color: "#f05278" },
    { id: "p2", name: "阿土伯", character: "a-tubo", kind: "ai", difficulty: "standard", color: "#f3b83f" },
  ],
};

describe("股票交易", () => {
  it("买入股票会扣除现金并增加持仓", () => {
    const state = createInitialState(config);
    const result = tradeStock(state, { playerId: "p1", stockId: "mall", quantity: 100, side: "buy" });

    expect(result.state.players.p1.cash).toBe(28_000 - 2_500);
    expect(result.state.players.p1.stocks.mall).toBe(100);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "STOCK_BOUGHT", amount: 2_500 }));
  });

  it("拒绝超出现金或持仓的订单", () => {
    const state = createInitialState(config);
    expect(tradeStock(state, { playerId: "p1", stockId: "tech", quantity: 10_000, side: "buy" }).error?.code).toBe("INSUFFICIENT_CASH");
    expect(tradeStock(state, { playerId: "p1", stockId: "tech", quantity: 1, side: "sell" }).error?.code).toBe("INSUFFICIENT_SHARES");
  });

  it("卖出股票会增加现金并减少持仓", () => {
    const state = createInitialState(config);
    const holding: GameState = {
      ...state,
      players: { ...state.players, p1: { ...state.players.p1, stocks: { mall: 80 } } },
    };
    const result = tradeStock(holding, { playerId: "p1", stockId: "mall", quantity: 30, side: "sell" });

    expect(result.state.players.p1.cash).toBe(28_750);
    expect(result.state.players.p1.stocks.mall).toBe(50);
  });
});

describe("股票市场", () => {
  it("市场更新可复现且价格不突破涨跌停", () => {
    const state = createInitialState(config);
    const a = advanceMarket(state);
    const b = advanceMarket(state);

    expect(a.state.stocks).toEqual(b.state.stocks);
    for (const stock of Object.values(a.state.stocks)) {
      expect(stock.price).toBeGreaterThanOrEqual(stock.limitDown);
      expect(stock.price).toBeLessThanOrEqual(stock.limitUp);
    }
  });

  it("持股最多且不并列的玩家成为董事长", () => {
    const state = createInitialState(config);
    const holding: GameState = {
      ...state,
      players: {
        ...state.players,
        p1: { ...state.players.p1, stocks: { mall: 300 } },
        p2: { ...state.players.p2, stocks: { mall: 500 } },
      },
    };

    expect(getChairperson(holding, "mall")).toBe("p2");
    const tied = {
      ...holding,
      players: { ...holding.players, p1: { ...holding.players.p1, stocks: { mall: 500 } } },
    };
    expect(getChairperson(tied, "mall")).toBeNull();
  });
});
