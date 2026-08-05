import { describe, expect, it } from "vitest";
import { applyEffect, getEffectTargets, resolveSpecialSpace, tickStatuses } from "@/game/effects";
import { createInitialState, dispatchCommand } from "@/game/reducer";
import type { GameConfig, GameState } from "@/game/types";

const config: GameConfig = {
  mode: "quick",
  seed: 123,
  maxRounds: 60,
  targetNetWorth: 100_000,
  players: [
    { id: "p1", name: "孙小美", character: "sun-xiaomei", kind: "human", color: "#f05278" },
    { id: "p2", name: "钱夫人", character: "qian-furen", kind: "ai", difficulty: "smart", color: "#8f6bd8" },
  ],
};

function withPlayer(state: GameState, changes: Partial<GameState["players"][string]>): GameState {
  return {
    ...state,
    players: { ...state.players, p1: { ...state.players.p1, ...changes } },
  };
}

describe("卡片与道具", () => {
  it("购地卡只能选择玩家脚下的无主地产", () => {
    const state = withPlayer(createInitialState(config), {
      position: "beijing-1",
      cards: ["purchase-card"],
    });

    expect(getEffectTargets(state, "purchase-card", "p1")).toEqual([
      { type: "property", id: "beijing-1" },
    ]);
  });

  it("停留卡给对手增加一回合停留并消耗卡片", () => {
    const state = withPlayer(createInitialState(config), { cards: ["stop-card"] });
    const result = applyEffect(state, {
      playerId: "p1",
      effectId: "stop-card",
      target: { type: "player", id: "p2" },
    });

    expect(result.state.players.p2.statuses).toContainEqual({
      id: "stopped",
      name: "原地停留",
      remainingTurns: 1,
      tone: "negative",
    });
    expect(result.state.players.p1.cards).not.toContain("stop-card");
  });

  it("路障会放置在未占用道路节点", () => {
    const state = withPlayer(createInitialState(config), { tools: ["roadblock"] });
    const result = applyEffect(state, {
      playerId: "p1",
      effectId: "roadblock",
      target: { type: "road", id: "chance-1" },
    });

    expect(result.state.hazards).toContainEqual(
      expect.objectContaining({ nodeId: "chance-1", ownerId: "p1", type: "roadblock" }),
    );
    expect(result.state.players.p1.tools).not.toContain("roadblock");
  });

  it("送神卡移除附身状态", () => {
    const state = withPlayer(createInitialState(config), {
      cards: ["send-god-card"],
      god: { id: "poor-god", name: "穷神", remainingTurns: 4, tone: "negative" },
    });
    const result = applyEffect(state, {
      playerId: "p1",
      effectId: "send-god-card",
      target: { type: "player", id: "p1" },
    });

    expect(result.state.players.p1.god).toBeNull();
    expect(result.events).toContainEqual(expect.objectContaining({ type: "GOD_LEFT" }));
  });

  it("均贫卡会平均使用者与目标玩家的现金", () => {
    const base = createInitialState(config);
    const state: GameState = {
      ...base,
      players: {
        ...base.players,
        p1: { ...base.players.p1, cash: 40_000, cards: ["equal-poor-card"] },
        p2: { ...base.players.p2, cash: 10_000 },
      },
    };
    const result = applyEffect(state, { playerId: "p1", effectId: "equal-poor-card", target: { type: "player", id: "p2" } });

    expect(result.state.players.p1.cash).toBe(25_000);
    expect(result.state.players.p2.cash).toBe(25_000);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "CASH_EQUALIZED" }));
  });

  it("USE_EFFECT 指令会分派到统一效果系统", () => {
    const state = withPlayer(createInitialState(config), { cards: ["tax-card"] });
    const result = dispatchCommand(state, { type: "USE_EFFECT", playerId: "p1", effectId: "tax-card", targetId: "p2" });

    expect(result.state.players.p1.cards).not.toContain("tax-card");
    expect(result.events).toContainEqual(expect.objectContaining({ type: "TAX_COLLECTED" }));
  });

  it("转向卡让目标玩家下一次反向移动并随后消耗状态", () => {
    const base = withPlayer(createInitialState(config), { cards: ["turn-card"] });
    const applied = applyEffect(base, { playerId: "p1", effectId: "turn-card", target: { type: "player", id: "p2" } });
    const turnState: GameState = { ...applied.state, currentPlayerId: "p2", phase: "action" };
    const moved = dispatchCommand(turnState, { type: "ROLL_DICE", playerId: "p2" });
    const positionIndex = moved.state.map.nodes.findIndex((node) => node.id === moved.state.players.p2.position);

    expect(positionIndex).toBeGreaterThan(24);
    expect(moved.state.players.p2.statuses.some((status) => status.id === "reversed")).toBe(false);
  });

  it("汽车状态会一次掷三颗骰子并在移动后消耗", () => {
    const state = withPlayer(createInitialState(config), { tools: ["car"] });
    const applied = applyEffect(state, { playerId: "p1", effectId: "car", target: { type: "player", id: "p1" } });
    const moved = dispatchCommand(applied.state, { type: "ROLL_DICE", playerId: "p1" });
    const total = moved.events.find((event) => event.type === "DICE_ROLLED")?.amount ?? 0;

    expect(total).toBeGreaterThanOrEqual(3);
    expect(total).toBeLessThanOrEqual(18);
    expect(moved.state.players.p1.statuses.some((status) => status.id === "car")).toBe(false);
  });
});

describe("持续状态与特殊设施", () => {
  it("财神每回合送钱并减少剩余回合", () => {
    const state = withPlayer(createInitialState(config), {
      god: { id: "wealth-god", name: "财神", remainingTurns: 2, tone: "positive" },
    });
    const result = tickStatuses(state, "p1");

    expect(result.state.players.p1.cash).toBe(29_200);
    expect(result.state.players.p1.god?.remainingTurns).toBe(1);
  });

  it("相同种子的机会事件产生相同结果", () => {
    const state = withPlayer(createInitialState(config), { position: "chance-1" });
    const a = resolveSpecialSpace(state, "p1");
    const b = resolveSpecialSpace(state, "p1");

    expect(a.state.players.p1.cash).toBe(b.state.players.p1.cash);
    expect(a.events).toEqual(b.events);
    expect(a.state.rngState).toBe(b.state.rngState);
  });
});
