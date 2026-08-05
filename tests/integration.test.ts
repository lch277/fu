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

  it("达到目标资产后在结束回合时立即结算胜利", () => {
    const base = createInitialState(config);
    const state: GameState = {
      ...base,
      phase: "turn-end",
      players: { ...base.players, p1: { ...base.players.p1, cash: config.targetNetWorth + 1 } },
    };

    const result = dispatchCommand(state, { type: "END_TURN", playerId: "p1" });

    expect(result.state.phase).toBe("game-over");
    expect(result.state.winnerIds).toEqual(["p1"]);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "TARGET_REACHED" }));
  });

  it("回合开始效果使净资产越过目标时会在行动前结算", () => {
    const base = createInitialState(config);
    const state: GameState = {
      ...base,
      currentPlayerId: "p2",
      turn: 2,
      phase: "turn-end",
      players: {
        ...base.players,
        p1: {
          ...base.players.p1,
          cash: config.targetNetWorth - 1_000,
          god: { id: "wealth-god", name: "财神", remainingTurns: 2, tone: "positive" },
        },
      },
    };

    const result = dispatchCommand(state, { type: "END_TURN", playerId: "p2" });

    expect(result.state.players.p1.cash).toBe(config.targetNetWorth + 200);
    expect(result.state.phase).toBe("game-over");
    expect(result.state.winnerIds).toEqual(["p1"]);
  });

  it("停留状态会跳过目标玩家的行动并消耗一回合", () => {
    const base = createInitialState(config);
    const state: GameState = {
      ...base,
      phase: "turn-end",
      players: {
        ...base.players,
        p2: { ...base.players.p2, statuses: [{ id: "stopped", name: "原地停留", remainingTurns: 1, tone: "negative" }] },
      },
    };

    const result = dispatchCommand(state, { type: "END_TURN", playerId: "p1" });

    expect(result.state.currentPlayerId).toBe("p1");
    expect(result.state.round).toBe(2);
    expect(result.state.players.p2.statuses).toEqual([]);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "TURN_SKIPPED", playerId: "p2" }));
  });

  it("踩中路障后立刻停止并移除障碍", () => {
    const base = createInitialState({ ...config, seed: 1 });
    const state: GameState = {
      ...base,
      hazards: [{ id: "h1", nodeId: "beijing-1", ownerId: "p2", type: "roadblock" }],
    };

    const result = dispatchCommand(state, { type: "ROLL_DICE", playerId: "p1" });

    expect(result.state.players.p1.position).toBe("beijing-1");
    expect(result.state.hazards).toEqual([]);
    expect(result.state.phase).toBe("turn-end");
    expect(result.events).toContainEqual(expect.objectContaining({ type: "HAZARD_TRIGGERED" }));
  });

  it("经过出发站会获得通行奖金", () => {
    const base = createInitialState({ ...config, seed: 1 });
    const state: GameState = { ...base, players: { ...base.players, p1: { ...base.players.p1, position: "shop-3" } } };
    const result = dispatchCommand(state, { type: "ROLL_DICE", playerId: "p1" });

    expect(result.state.players.p1.cash).toBe(30_000);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "START_BONUS", amount: 2_000 }));
  });

  it("中间席位破产后会推进到原顺序中的下一位", () => {
    const threePlayerConfig: GameConfig = {
      ...config,
      players: [...config.players, { id: "p3", name: "钱夫人", character: "qian-furen", kind: "human", color: "#8f6bd8" }],
    };
    const base = createInitialState(threePlayerConfig);
    const state: GameState = {
      ...base,
      currentPlayerId: "p2",
      phase: "turn-end",
      players: { ...base.players, p2: { ...base.players.p2, active: false, cash: 0 } },
    };
    const result = dispatchCommand(state, { type: "END_TURN", playerId: "p2" });

    expect(result.state.currentPlayerId).toBe("p3");
    expect(result.state.round).toBe(1);
  });
});
