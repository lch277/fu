import { describe, expect, it } from "vitest";
import { createRng } from "@/game/rng";

describe("可复现随机数", () => {
  it("相同种子产生相同骰子序列", () => {
    const a = createRng(20260804);
    const b = createRng(20260804);

    expect([a.die(), a.die(), a.die(), a.die()]).toEqual([
      b.die(),
      b.die(),
      b.die(),
      b.die(),
    ]);
  });

  it("骰子结果始终位于一到六", () => {
    const rng = createRng(77);
    const rolls = Array.from({ length: 100 }, () => rng.die());

    expect(Math.min(...rolls)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...rolls)).toBeLessThanOrEqual(6);
  });

  it("可从当前内部状态继续同一随机序列", () => {
    const source = createRng(991);
    source.die();
    source.die();
    const resumed = createRng(source.state);

    expect(resumed.die()).toBe(source.die());
    expect(resumed.die()).toBe(source.die());
  });
});
