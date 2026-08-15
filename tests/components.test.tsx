import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StartScreen } from "@/components/StartScreen";
import { EventFeed } from "@/components/EventFeed";
import { GameScreen, POPUP_EVENT_TYPES } from "@/components/GameScreen";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { InventoryDrawer } from "@/components/InventoryDrawer";
import { createInitialState } from "@/game/reducer";
import type { GameConfig } from "@/game/types";

describe("开始界面", () => {
  it("可以选择四人快速局并开始游戏", () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} canContinue={false} onContinue={() => undefined} />);

    expect(screen.getByRole("button", { name: "四人局" })).toBeInTheDocument();
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
    // 掷骰按钮已移入棋盘中心的 3D 骰子,底部操作栏不再出现
    const dice = screen.getByRole("button", { name: "掷骰" });
    expect(dice.classList.contains("center-dice")).toBe(true);
    expect(screen.queryAllByRole("button", { name: "掷骰" })).toHaveLength(1);
    fireEvent.click(dice);
    expect(onCommand).toHaveBeenCalledWith({ type: "ROLL_DICE", playerId: "p1" });
  });

  it("中心骰子:已掷出时标记点数,新回合回到待掷状态", () => {
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
    const rolled = { ...createInitialState(config), lastRoll: 5 };
    const { rerender } = render(
      <GameScreen state={rolled} events={[]} onCommand={() => undefined} onOpenInventory={() => undefined} onOpenStocks={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: "掷骰" })).toHaveAttribute("data-rolled", "true");

    const fresh = createInitialState(config);
    rerender(
      <GameScreen state={fresh} events={[]} onCommand={() => undefined} onOpenInventory={() => undefined} onOpenStocks={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: "掷骰" })).toHaveAttribute("data-rolled", "false");
  });

  it("中心骰子:结算阶段与 AI 回合均不可掷骰", () => {
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
    const resolving = { ...createInitialState(config), phase: "resolving" as const };
    const { rerender } = render(
      <GameScreen state={resolving} events={[]} interactionLocked onCommand={() => undefined} onOpenInventory={() => undefined} onOpenStocks={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: "掷骰" })).toBeDisabled();

    const aiTurn = { ...createInitialState(config), currentPlayerId: "p2" as const };
    rerender(
      <GameScreen state={aiTurn} events={[]} onCommand={() => undefined} onOpenInventory={() => undefined} onOpenStocks={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: "掷骰" })).toBeDisabled();
  });

  it("可以切换两倍动画速度", () => {
    const onChange = vi.fn();
    render(<SettingsDrawer open settings={{ sound: true, speed: 1 }} onChange={onChange} onClose={() => undefined} onExit={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "2 倍速" }));
    expect(onChange).toHaveBeenCalledWith({ sound: true, speed: 2 });
  });

  it("棋子动画期间锁定落点结算按钮", () => {
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
    const state = { ...createInitialState(config), phase: "resolving" as const };
    render(<GameScreen state={state} events={[]} interactionLocked onCommand={() => undefined} onOpenInventory={() => undefined} onOpenStocks={() => undefined} />);

    expect(screen.getByRole("button", { name: "结算落点" })).toBeDisabled();
  });

  it("三人局使用卡片时可以选择指定对手", () => {
    const config: GameConfig = {
      mode: "quick",
      seed: 88,
      maxRounds: 60,
      targetNetWorth: 100_000,
      players: [
        { id: "p1", name: "孙小美", character: "sun-xiaomei", kind: "human", color: "#f05278" },
        { id: "p2", name: "阿土伯", character: "a-tubo", kind: "ai", color: "#f3b83f" },
        { id: "p3", name: "钱夫人", character: "qian-furen", kind: "ai", color: "#8f6bd8" },
      ],
    };
    const base = createInitialState(config);
    const state = { ...base, players: { ...base.players, p1: { ...base.players.p1, cards: ["stop-card"] } } };
    const onUse = vi.fn();
    render(<InventoryDrawer open state={state} onClose={() => undefined} onUse={onUse} />);

    fireEvent.click(screen.getByRole("button", { name: /停留卡/ }));
    fireEvent.click(screen.getByRole("button", { name: "钱夫人" }));
    expect(onUse).toHaveBeenCalledWith({ playerId: "p1", effectId: "stop-card", target: { type: "player", id: "p3" } });
  });

  it("顶部玩家卡:真人/AI 标识位于头像下方,名字与金额同行", () => {
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

    const cards = document.querySelectorAll(".player-card");
    expect(cards).toHaveLength(2);
    const [human, ai] = [...cards];
    expect(human.querySelector(".player-kind")!.textContent).toBe("真人");
    expect(ai.querySelector(".player-kind")!.textContent).toBe("AI");
    expect(human.querySelector(".player-avatar")).not.toBeNull();
    // 名字不再带“真人玩家”小字行,金额单独成行
    expect(human.querySelector(".player-summary")!.textContent).toBe("孙小美");
    expect(human.querySelector(".player-money strong")!.textContent).toContain("¥28,000");
  });
});

describe("浮动消息过滤", () => {
  it("只保留有实际反馈的事件类型", () => {
    // 流程性噪音应被过滤
    expect(POPUP_EVENT_TYPES.has("TURN_STARTED")).toBe(false);
    expect(POPUP_EVENT_TYPES.has("PLAYER_STEPPED")).toBe(false);
    expect(POPUP_EVENT_TYPES.has("DICE_ROLLED")).toBe(false);
    // 弹窗已覆盖的报价事件不必重复浮动
    expect(POPUP_EVENT_TYPES.has("PROPERTY_OFFERED")).toBe(false);
    expect(POPUP_EVENT_TYPES.has("UPGRADE_OFFERED")).toBe(false);
    // 有实际反馈的事件应保留
    expect(POPUP_EVENT_TYPES.has("TOLL_PAID")).toBe(true);
    expect(POPUP_EVENT_TYPES.has("PROPERTY_BOUGHT")).toBe(true);
    expect(POPUP_EVENT_TYPES.has("PROPERTY_UPGRADED")).toBe(true);
    expect(POPUP_EVENT_TYPES.has("ASSETS_LIQUIDATED")).toBe(true);
    expect(POPUP_EVENT_TYPES.has("PLAYER_BANKRUPT")).toBe(true);
    expect(POPUP_EVENT_TYPES.has("REVENGE_TRIGGERED")).toBe(true);
    expect(POPUP_EVENT_TYPES.has("TURN_SKIPPED")).toBe(true);
    expect(POPUP_EVENT_TYPES.has("BOMB_EXPLODED")).toBe(true);
    expect(POPUP_EVENT_TYPES.has("HAZARD_TRIGGERED")).toBe(true);
    expect(POPUP_EVENT_TYPES.has("START_BONUS")).toBe(true);
    expect(POPUP_EVENT_TYPES.has("STOCK_CHANGED")).toBe(true);
  });
});

describe("事件快讯", () => {
  it("按轮次分组:轮次-玩家名 + 动作拼接,去重去问句", () => {
    const players = {
      p1: { name: "孙小美", color: "#f05278" },
      p2: { name: "阿土伯", color: "#f3b83f" },
    } as Record<string, { name: string; color: string }>;
    const events = [
      // 旧格式事件(无 round 字段):回合号 28/29,按玩家人数(3)近似重建轮次 ≈ 第 10 轮
      { id: "28-TURN_STARTED-0", type: "TURN_STARTED", message: "轮到孙小美行动", playerId: "p1" },
      { id: "28-DICE_ROLLED-1", type: "DICE_ROLLED", message: "掷出了 2 点" },
      { id: "28-PLAYER_STEPPED-2", type: "PLAYER_STEPPED", message: "前进到监狱" },
      { id: "28-PLAYER_STEPPED-3", type: "PLAYER_STEPPED", message: "前进到西安城墙" },
      { id: "28-PROPERTY_OFFERED-4", type: "PROPERTY_OFFERED", message: "是否以 ¥5,400 购买西安城墙？", playerId: "p1" },
      { id: "28-PROPERTY_BOUGHT-5", type: "PROPERTY_BOUGHT", message: "孙小美花 ¥5,400 买下西安城墙", playerId: "p1" },
      { id: "28-STOCK_CHANGED-6", type: "STOCK_CHANGED", message: "友谊商场上涨至 ¥26.78" },
      { id: "28-STOCK_CHANGED-7", type: "STOCK_CHANGED", message: "东方科技上涨至 ¥43.25" },
      // 股票段(无玩家)之后,真人玩家的动作事件仍必须归入她自己的回合段
      { id: "28-DICE_ROLLED-8", type: "DICE_ROLLED", message: "掷出了 4 点" },
      { id: "28-TOLL_PAID-9", type: "TOLL_PAID", message: "孙小美向阿土伯支付 ¥972", playerId: "p1" },
      // 回合刚开始还没掷骰的空回合:显示“轮到行动”而不是消失
      { id: "29-TURN_STARTED-0", type: "TURN_STARTED", message: "轮到钱夫人行动", playerId: "p3" },
      // 新格式事件(带 round 字段),精确校准
      { id: "30-TURN_STARTED-0", type: "TURN_STARTED", message: "轮到阿土伯行动", playerId: "p2", round: 11 },
      { id: "30-DICE_ROLLED-1", type: "DICE_ROLLED", message: "掷出了 5 点" },
    ] as any[];
    const turnOrder = ["p1", "p2", "p3"];
    const players2 = { ...players, p3: { name: "钱夫人", color: "#8f6bd8" } } as any;
    render(<EventFeed events={events} players={players2} turnOrder={turnOrder} />);

    const lines = document.querySelectorAll(".feed-list p");
    // 倒序:阿土伯、钱夫人(空回合显示“轮到行动”)、股票(合并)、孙小美
    expect(lines).toHaveLength(4);
    expect(lines[0].textContent).toContain("第11轮-阿土伯");
    expect(lines[0].textContent).toContain("掷出了 5 点");
    expect(lines[1].textContent).toBe("第10轮-钱夫人：轮到行动。");
    // 同轮多条股票合并成一条,带“第X轮-股票”标题
    expect(lines[2].textContent).toBe("第10轮-股票：友谊商场上涨至 ¥26.78，东方科技上涨至 ¥43.25。");
    expect(lines[2].querySelector(".feed-who")!.textContent).toBe("第10轮-股票：");

    const first = lines[3].textContent!;
    // 旧事件(无 round)按回合回绕重建出轮次
    expect(first).toContain("第10轮-孙小美");
    // 股票段(无玩家)之后的消息仍归入孙小美段,且不再显示“轮到行动”
    expect(first).toContain("掷出了 4 点");
    expect(first).toContain("向阿土伯支付 ¥972");
    expect(first).not.toContain("轮到行动");
    // 问句被过滤,不出现“是否”
    expect(first).not.toContain("是否");
    // 两次前进只保留最终落点
    expect(first).not.toContain("监狱");
    expect(first).toContain("前进到西安城墙");
    // 买下带价格,且玩家名只出现一次(标题 + 无前缀正文)
    expect(first).toContain("花 ¥5,400 买下西安城墙");
    expect(first.match(/孙小美/g)).toHaveLength(1);
    expect(lines[3].querySelector(".feed-who")!.textContent).toBe("第10轮-孙小美：");
  });
});
