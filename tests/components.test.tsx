import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StartScreen } from "@/components/StartScreen";
import { GameScreen } from "@/components/GameScreen";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { createInitialState } from "@/game/reducer";
import type { GameConfig } from "@/game/types";

describe("开始界面", () => {
  it("可以选择四人快速局并开始游戏", () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} canContinue={false} onContinue={() => undefined} />);

    expect(screen.getByRole("heading", { name: "神州大富翁" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "四人局" }));
    fireEvent.click(screen.getByRole("button", { name: "开始掷骰" }));

    expect(onStart).toHaveBeenCalledOnce();
    expect(onStart.mock.calls[0][0].players).toHaveLength(4);
    expect(onStart.mock.calls[0][0].mode).toBe("quick");
  });

  it("可以把任一席位在真人与 AI 之间切换", () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} canContinue={false} onContinue={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "将阿土伯切换为真人" }));
    fireEvent.click(screen.getByRole("button", { name: "开始掷骰" }));

    expect(onStart.mock.calls[0][0].players[1].kind).toBe("human");
  });
});

describe("游戏界面", () => {
  it("显示当前玩家、现金、轮次与可用动作", () => {
    const config: GameConfig = {
      mode: "quick",
      seed: 88,
      maxRounds: 60,
      targetNetWorth: 100_000,
      players: [
        { id: "p1", name: "孙小美", character: "sun-xiaomei", kind: "human", color: "#f05278" },
        { id: "p2", name: "阿土伯", character: "a-tubo", kind: "ai", difficulty: "standard", color: "#f3b83f" },
      ],
    };
    const onCommand = vi.fn();
    render(
      <GameScreen
        state={createInitialState(config)}
        events={[]}
        onCommand={onCommand}
        onOpenInventory={() => undefined}
        onOpenStocks={() => undefined}
      />,
    );

    expect(screen.getAllByText("孙小美").length).toBeGreaterThan(0);
    expect(screen.getByText("第 1 轮")).toBeInTheDocument();
    expect(screen.getAllByText("¥28,000").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "掷骰" }));
    expect(onCommand).toHaveBeenCalledWith({ type: "ROLL_DICE", playerId: "p1" });
  });

  it("可以切换两倍动画速度", () => {
    const onChange = vi.fn();
    render(<SettingsDrawer open settings={{ sound: true, speed: 1 }} onChange={onChange} onClose={() => undefined} onExit={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "2 倍速" }));
    expect(onChange).toHaveBeenCalledWith({ sound: true, speed: 2 });
  });
});
