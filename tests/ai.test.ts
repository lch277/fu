import { describe, expect, it } from "vitest";
import { chooseAiCommand } from "@/game/ai";
import { resolveLanding } from "@/game/economy";
import { createInitialState } from "@/game/reducer";
import { getLegalActions } from "@/game/selectors";
import type { GameConfig, GameState } from "@/game/types";

const config: GameConfig = {
  mode: "quick",
  seed: 66,
  maxRounds: 20,
  targetNetWorth: 80_000,
  players: [
    { id: "p1", name: "孙小美", character: "sun-xiaomei", kind: "ai", difficulty: "standard", color: "#f05278" },
    { id: "p2", name: "钱夫人", character: "qian-furen", kind: "ai", difficulty: "smart", color: "#8f6bd8" },
  ],
};

describe("AI 决策", () => {
  it("始终返回当前合法指令", () => {
    const state = createInitialState(config);
    const command = chooseAiCommand(state, "p1", "standard");
    const legal = getLegalActions(state, "p1");

    expect(legal.some((action) => action.type === command.type && action.enabled)).toBe(true);
  });

  it("现金充足时会购买价格合理的地产", () => {
    const state = createInitialState(config);
    const positioned: GameState = {
      ...state,
      phase: "resolving",
      players: { ...state.players, p1: { ...state.players.p1, position: "beijing-1" } },
    };
    const offered = resolveLanding(positioned, "p1").state;
    const command = chooseAiCommand(offered, "p1", "standard");

    expect(command).toEqual({ type: "BUY_PROPERTY", playerId: "p1", propertyId: "beijing-1" });
  });

  it("现金安全线不足时放弃购买", () => {
    const state = createInitialState(config);
    const positioned: GameState = {
      ...state,
      phase: "resolving",
      players: { ...state.players, p1: { ...state.players.p1, position: "beijing-1", cash: 3_100 } },
    };
    const offered = resolveLanding(positioned, "p1").state;

    expect(chooseAiCommand(offered, "p1", "standard").type).toBe("SKIP_PURCHASE");
  });
});
