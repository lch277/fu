import { describe, expect, it } from "vitest";
import { calculateToll, resolveLanding } from "@/game/economy";
import { createInitialState, dispatchCommand } from "@/game/reducer";
import type { GameConfig, GameState } from "@/game/types";

const config: GameConfig = {
  mode: "quick",
  seed: 17,
  maxRounds: 80,
  targetNetWorth: 120_000,
  players: [
    { id: "p1", name: "孙小美", character: "sun-xiaomei", kind: "human", color: "#f05278" },
    { id: "p2", name: "阿土伯", character: "a-tubo", kind: "ai", difficulty: "standard", color: "#f3b83f" },
  ],
};

function stateAt(propertyId: string): GameState {
  const state = createInitialState(config);
  return {
    ...state,
    players: {
      ...state.players,
      p1: { ...state.players.p1, position: propertyId },
    },
  };
}

describe("回合移动", () => {
  it("掷骰后逐格移动并进入落点结算", () => {
    const state = createInitialState(config);
    const result = dispatchCommand(state, { type: "ROLL_DICE", playerId: "p1" });
    const roll = result.events.find((event) => event.type === "DICE_ROLLED")?.amount;

    expect(roll).toBeGreaterThanOrEqual(1);
    expect(roll).toBeLessThanOrEqual(6);
    expect(result.events.filter((event) => event.type === "PLAYER_STEPPED")).toHaveLength(roll!);
    expect(result.state.phase).toBe("resolving");
    expect(result.state.players.p1.position).not.toBe("start");
  });

  it("完成回合后切换下一位玩家", () => {
    const state = { ...createInitialState(config), phase: "turn-end" as const };
    const result = dispatchCommand(state, { type: "END_TURN", playerId: "p1" });

    expect(result.state.currentPlayerId).toBe("p2");
    expect(result.state.phase).toBe("action");
    expect(result.events.at(-1)?.type).toBe("TURN_STARTED");
  });
});

describe("地产经济", () => {
  it("无主地产会提供购买并完成产权转移", () => {
    const offered = resolveLanding(stateAt("beijing-1"), "p1");
    expect(offered.state.pending).toEqual({ type: "purchase", propertyId: "beijing-1" });

    const price = offered.state.properties["beijing-1"].price;
    const bought = dispatchCommand(offered.state, {
      type: "BUY_PROPERTY",
      playerId: "p1",
      propertyId: "beijing-1",
    });

    expect(bought.state.properties["beijing-1"].ownerId).toBe("p1");
    expect(bought.state.players.p1.cash).toBe(28_000 - price);
    expect(bought.state.players.p1.propertyIds).toContain("beijing-1");
    expect(bought.state.phase).toBe("turn-end");
  });

  it("建筑等级提高通行费", () => {
    const state = stateAt("beijing-1");
    const levelZero = calculateToll(state, "beijing-1");
    const developed = {
      ...state,
      properties: {
        ...state.properties,
        "beijing-1": { ...state.properties["beijing-1"], level: 3 },
      },
    };

    expect(calculateToll(developed, "beijing-1")).toBeGreaterThan(levelZero);
  });

  it("落在对手地产会支付通行费", () => {
    const state = stateAt("beijing-1");
    const owned: GameState = {
      ...state,
      properties: {
        ...state.properties,
        "beijing-1": { ...state.properties["beijing-1"], ownerId: "p2", level: 2 },
      },
      players: {
        ...state.players,
        p2: { ...state.players.p2, propertyIds: ["beijing-1"] },
      },
    };
    const toll = calculateToll(owned, "beijing-1");
    const result = resolveLanding(owned, "p1");

    expect(result.state.players.p1.cash).toBe(28_000 - toll);
    expect(result.state.players.p2.cash).toBe(28_000 + toll);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "TOLL_PAID", amount: toll }));
  });

  it("复仇状态会把下一次通行费损失返还给来源玩家", () => {
    const state = stateAt("beijing-1");
    const owned: GameState = {
      ...state,
      properties: { ...state.properties, "beijing-1": { ...state.properties["beijing-1"], ownerId: "p2", level: 1 } },
      players: {
        ...state.players,
        p1: { ...state.players.p1, statuses: [{ id: "revenge", name: "复仇卡", remainingTurns: 1, tone: "positive" }] },
        p2: { ...state.players.p2, propertyIds: ["beijing-1"] },
      },
    };
    const result = resolveLanding(owned, "p1");

    expect(result.state.players.p1.cash).toBe(28_000);
    expect(result.state.players.p2.cash).toBe(28_000);
    expect(result.state.players.p1.statuses).toEqual([]);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "REVENGE_TRIGGERED" }));
  });

  it("现金不足支付通行费时安全破产", () => {
    const state = stateAt("beijing-1");
    const owned: GameState = {
      ...state,
      properties: {
        ...state.properties,
        "beijing-1": { ...state.properties["beijing-1"], ownerId: "p2", level: 5 },
      },
      players: {
        ...state.players,
        p1: { ...state.players.p1, cash: 100 },
        p2: { ...state.players.p2, propertyIds: ["beijing-1"] },
      },
    };
    const result = resolveLanding(owned, "p1");

    expect(result.state.players.p1.cash).toBe(0);
    expect(result.state.players.p1.active).toBe(false);
    expect(result.state.players.p2.cash).toBe(28_100);
    expect(result.events.some((event) => event.type === "PLAYER_BANKRUPT")).toBe(true);
  });

  it("现金不足但持有股票时会先变现再支付通行费", () => {
    const state = stateAt("beijing-1");
    const owned: GameState = {
      ...state,
      properties: { ...state.properties, "beijing-1": { ...state.properties["beijing-1"], ownerId: "p2", level: 1 } },
      players: {
        ...state.players,
        p1: { ...state.players.p1, cash: 100, stocks: { mall: 100 } },
        p2: { ...state.players.p2, propertyIds: ["beijing-1"] },
      },
    };
    const result = resolveLanding(owned, "p1");

    expect(result.state.players.p1.active).toBe(true);
    expect(result.state.players.p1.stocks).toEqual({});
    expect(result.events).toContainEqual(expect.objectContaining({ type: "ASSETS_LIQUIDATED" }));
    expect(result.events).not.toContainEqual(expect.objectContaining({ type: "PLAYER_BANKRUPT" }));
  });

  it("变现地产后会同步释放产权且不再形成幽灵收费", () => {
    const state = stateAt("beijing-1");
    const owned: GameState = {
      ...state,
      properties: {
        ...state.properties,
        "beijing-1": { ...state.properties["beijing-1"], ownerId: "p2", level: 4 },
        tianjin: { ...state.properties.tianjin, ownerId: "p1", level: 2 },
      },
      players: {
        ...state.players,
        p1: { ...state.players.p1, cash: 100, propertyIds: ["tianjin"] },
        p2: { ...state.players.p2, propertyIds: ["beijing-1"] },
      },
    };
    const result = resolveLanding(owned, "p1");

    expect(result.state.players.p1.propertyIds).not.toContain("tianjin");
    expect(result.state.properties.tianjin.ownerId).toBeNull();
    expect(result.state.properties.tianjin.level).toBe(0);
  });

  it("破产后自动推进并结算剩余玩家胜利", () => {
    const state = stateAt("beijing-1");
    const owned: GameState = {
      ...state,
      properties: { ...state.properties, "beijing-1": { ...state.properties["beijing-1"], ownerId: "p2", level: 5 } },
      players: {
        ...state.players,
        p1: { ...state.players.p1, cash: 100 },
        p2: { ...state.players.p2, propertyIds: ["beijing-1"] },
      },
    };
    const result = resolveLanding(owned, "p1");

    expect(result.state.phase).toBe("game-over");
    expect(result.state.winnerIds).toEqual(["p2"]);
  });
});
