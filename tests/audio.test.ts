import { describe, expect, it } from "vitest";
import { getSoundCue } from "@/game/audio";

describe("音效提示", () => {
  it("为骰子、交易与胜利事件选择不同提示音", () => {
    expect(getSoundCue([{ id: "1", type: "DICE_ROLLED", message: "掷骰" }])).toBe("dice");
    expect(getSoundCue([{ id: "2", type: "PROPERTY_BOUGHT", message: "购地" }])).toBe("coin");
    expect(getSoundCue([{ id: "3", type: "GAME_OVER", message: "结束" }])).toBe("fanfare");
  });
});
