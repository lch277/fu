import { describe, expect, it } from "vitest";
import { simulateGame } from "@/game/simulate";
import type { GameConfig } from "@/game/types";

function config(seed: number): GameConfig {
  return {
    mode: "quick",
    seed,
    maxRounds: 12,
    targetNetWorth: 65_000,
    players: [
      { id: "p1", name: "孙小美", character: "sun-xiaomei", kind: "ai", difficulty: "standard", color: "#f05278" },
      { id: "p2", name: "阿土伯", character: "a-tubo", kind: "ai", difficulty: "standard", color: "#f3b83f" },
      { id: "p3", name: "钱夫人", character: "qian-furen", kind: "ai", difficulty: "smart", color: "#8f6bd8" },
    ],
  };
}

describe("无界面对局模拟", () => {
  it("固定种子得到相同结果并在限制内结束", () => {
    const a = simulateGame(config(77), { maxCommands: 1_000 });
    const b = simulateGame(config(77), { maxCommands: 1_000 });

    expect(a.finished).toBe(true);
    expect(a.summary).toEqual(b.summary);
    expect(a.commandCount).toBeLessThan(1_000);
  });

  it("一百个固定种子都不会进入非法状态或死循环", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const result = simulateGame(config(seed), { maxCommands: 1_000 });
      expect(result.finished, `种子 ${seed} 未结束：${result.error ?? "无错误信息"}`).toBe(true);
      expect(result.error).toBeUndefined();
      expect(Object.values(result.state.players).every((player) => player.cash >= 0)).toBe(true);
      expect(Object.values(result.state.properties).every((property) => property.level >= 0 && property.level <= property.maxLevel)).toBe(true);
    }
  });
});
