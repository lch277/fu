import { describe, expect, it } from "vitest";
import { createInitialState, dispatchCommand } from "@/game/reducer";
import type { GameConfig, PlayerSetup } from "@/game/types";

const players: PlayerSetup[] = [
  { id: "p1", name: "玩家一", character: "sun-xiaomei", kind: "human", color: "#f05278" },
  { id: "p2", name: "阿土伯", character: "a-tubo", kind: "ai", difficulty: "standard", color: "#f3b83f" },
];

function config(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    mode: "quick",
    seed: 20260804,
    players,
    maxRounds: 80,
    targetNetWorth: 120_000,
    ...overrides,
  };
}

describe("对局初始状态", () => {
  it("只允许二到四名玩家开局", () => {
    expect(() => createInitialState(config({ players: players.slice(0, 1) }))).toThrow(
      "玩家数量必须为 2–4",
    );

    const five = [...players, ...players, players[0]].map((player, index) => ({
      ...player,
      id: `p${index + 1}`,
    }));
    expect(() => createInitialState(config({ players: five }))).toThrow("玩家数量必须为 2–4");
  });

  it("快速局以第一个玩家和二万八现金开始", () => {
    const state = createInitialState(config());

    expect(state.currentPlayerId).toBe("p1");
    expect(state.phase).toBe("action");
    expect(state.players.p1.cash).toBe(28_000);
    expect(state.players.p2.cash).toBe(28_000);
    expect(state.map.nodes.length).toBeGreaterThanOrEqual(24);
    expect(state.version).toBe(1);
  });

  it("相同配置生成完全相同的规则状态", () => {
    expect(createInitialState(config())).toEqual(createInitialState(config()));
  });
});

describe("指令校验", () => {
  it("拒绝非当前玩家发出的指令且不修改状态", () => {
    const state = createInitialState(config());
    const result = dispatchCommand(state, { type: "ROLL_DICE", playerId: "p2" });

    expect(result.error).toEqual({
      code: "NOT_CURRENT_PLAYER",
      message: "现在轮到玩家一行动",
    });
    expect(result.state).toBe(state);
    expect(result.events).toEqual([]);
  });
});
