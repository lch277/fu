import { describe, expect, it } from "vitest";
import { mainlandMap } from "@/game/map";
import { buildAnimationPlan, createBoardGeometry } from "@/render/boardGeometry";
import { collectUnplayedEvents, createInitialPlayedEventIds } from "@/components/BoardCanvas";

describe("棋盘渲染几何", () => {
  it("将 32 个站点归一化并闭合为环线", () => {
    const geometry = createBoardGeometry(mainlandMap);

    expect(geometry.nodes).toHaveLength(32);
    expect(geometry.segments).toHaveLength(32);
    expect(geometry.nodes.every((node) => node.x >= 0 && node.x <= 1 && node.y >= 0 && node.y <= 1)).toBe(true);
    expect(geometry.segments.at(-1)?.to).toEqual(geometry.nodes[0]);
  });

  it("把骰子、移动和购买事件转换成有序动效", () => {
    const plan = buildAnimationPlan([
      { id: "1", type: "DICE_ROLLED", message: "掷出 5 点", amount: 5 },
      { id: "2", type: "PLAYER_STEPPED", message: "前进", data: { nodeId: "beijing-1", step: 1 } },
      { id: "3", type: "PROPERTY_BOUGHT", message: "买下地产", playerId: "p1", amount: 1200 },
    ]);

    expect(plan.map((item) => item.kind)).toEqual(["dice", "step", "celebrate"]);
    expect(plan[1]).toMatchObject({ nodeId: "beijing-1", delay: 140 });
  });
});

describe("动画事件队列", () => {
  it("只消费尚未播放的新事件", () => {
    const played = new Set(["e1"]);
    const events = [
      { id: "e1", type: "DICE_ROLLED", message: "旧骰子" },
      { id: "e2", type: "PLAYER_STEPPED", message: "新移动" },
    ];

    expect(collectUnplayedEvents(events, played).map((event) => event.id)).toEqual(["e2"]);
    expect(collectUnplayedEvents(events, played)).toEqual([]);
  });

  it("棋盘挂载时把恢复的历史事件标记为已播放", () => {
    const history = [{ id: "saved-1", type: "PLAYER_STEPPED", message: "历史移动" }];
    const played = createInitialPlayedEventIds(history);

    expect(collectUnplayedEvents(history, played)).toEqual([]);
  });
});
