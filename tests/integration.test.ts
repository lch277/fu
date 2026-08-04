import { describe, expect, it } from "vitest";
import { createInitialState, dispatchCommand } from "@/game/reducer";
import type { GameConfig, GameState } from "@/game/types";

const config: GameConfig = {
  mode: "quick",
  seed: 2468,
  maxRounds: 60,
  targetNetWorth: 100_000,
  players: [
    { id: "p1", name: "孙小美", character: "sun-xiaomei", kind: "human", color: "#f05278" },
    { id: "p2", name: "阿土伯", character: "a-tubo", kind: "ai", difficulty: "standard", color: "#f3b83f" },
  ],
};

describe("完整回合联动", () => {
  it("通过标准落点指令触发机会格效果", () => {
    const base = createInitialState(config);
    const state: GameState = {
      ...base,
      phase: "resolving",
      players: { ...base.players, p1: { ...base.players.p1, position: "chance-1" } },
    };

    const result = dispatchCommand(state, { type: "RESOLVE_LANDING", playerId: "p1" });

    expect(result.events).toContainEqual(expect.objectContaining({ type: "SPECIAL_SPACE_RESOLVED" }));
    expect(result.state.players.p1.cash).not.toBe(28_000);
    expect(result.state.phase).toBe("turn-end");
  });

  it("新一轮开始时刷新股市并结算下一位玩家的神仙状态", () => {
    const base = createInitialState(config);
    const state: GameState = {
      ...base,
      currentPlayerId: "p2",
      turn: 2,
      phase: "turn-end",
      players: {
        ...base.players,
        p1: { ...base.players.p1, god: { id: "wealth-god", name: "财神", remainingTurns: 2, tone: "positive" } },
      },
    };

    const result = dispatchCommand(state, { type: "END_TURN", playerId: "p2" });

    expect(result.state.round).toBe(2);
    expect(result.state.players.p1.cash).toBe(29_200);
    expect(result.state.players.p1.god?.remainingTurns).toBe(1);
    expect(Object.values(result.state.stocks).some((stock) => stock.price !== stock.previousPrice)).toBe(true);
    expect(result.events.some((event) => event.type === "GOD_CASH")).toBe(true);
    expect(result.events.some((event) => event.type === "STOCK_CHANGED")).toBe(true);
  });
});
