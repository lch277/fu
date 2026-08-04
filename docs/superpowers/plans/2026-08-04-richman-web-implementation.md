# 网页版大富翁实施计划

> **供智能执行者使用：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，逐项执行本计划。所有步骤使用复选框跟踪。

**目标：** 构建一款可以完整开局、游玩、保存、恢复和结算的《大富翁4》风格本地多人网页游戏。

**架构：** React 负责菜单与 HUD，PixiJS 负责 45° 棋盘表现，纯 TypeScript 规则引擎通过“指令 → 事件 → 新状态”推进对局。规则引擎不依赖 DOM，所有随机结果由可序列化种子产生，以便自动模拟与稳定复现。

**技术栈：** TypeScript、React、Vite/vinext、PixiJS、Zustand、Vitest、Playwright、CSS。

## 全局约束

- 全部界面文本、代码注释和项目文档使用中文。
- 首版支持 2–4 名本地玩家，可混合真人与 AI。
- 首发只有一张中国大陆风格地图，采用 45° 高清手办融合风。
- 电脑 16:9 宽屏优先，同时适配平板与手机横屏。
- 首版无账号、服务器、联网对战、付费与广告。
- 不复制原版安装包的图片、音乐、视频和程序资源。
- 动画速度不能影响规则结果；减少动态效果模式必须可用。
- 所有对局随机结果必须可通过种子和指令序列复现。

---

## 文件结构

```text
app/
  layout.tsx                 页面元数据与全局结构
  page.tsx                   游戏入口与场景切换
  globals.css                色彩、排版、响应式与动效
components/
  StartScreen.tsx            模式与席位设置
  GameScreen.tsx             棋盘、HUD 与面板编排
  BoardCanvas.tsx            PixiJS 舞台生命周期
  PlayerRail.tsx             玩家排行与状态
  ActionDock.tsx             当前回合动作栏
  EventFeed.tsx              事件记录
  ModalLayer.tsx             买地、升级、事件与结算弹窗
  InventoryDrawer.tsx        卡片和道具
  StockDrawer.tsx            股票交易
  ResultScreen.tsx           胜负与资产结算
game/
  types.ts                   状态、指令、事件和内容类型
  rng.ts                     可复现随机数
  content.ts                 角色、地块、卡片、道具、神仙与股票数据
  map.ts                     中国大陆地图节点与路径
  selectors.ts               合法动作与 UI 查询
  reducer.ts                 指令校验和状态更新入口
  turn.ts                    回合状态机与移动
  economy.ts                 地产、建设、收费与破产
  effects.ts                 卡片、道具、神仙与新闻
  stocks.ts                  股票与公司规则
  ai.ts                      AI 决策
  save.ts                    存档、校验与迁移
  simulate.ts                无界面对局模拟
store/
  gameStore.ts               React 与规则引擎桥接
render/
  createBoard.ts             PixiJS 地图、角色与建筑图层
  animateEvents.ts           事件动画队列
  assets.ts                  程序化纹理与资源清单
tests/
  rng.test.ts
  reducer.test.ts
  economy.test.ts
  effects.test.ts
  stocks.test.ts
  ai.test.ts
  save.test.ts
  simulation.test.ts
e2e/
  game.spec.ts               浏览器关键路径
  responsive.spec.ts         电脑与横屏布局
```

---

### 任务 1：初始化站点与测试基线

**文件：**
- 创建：站点初始化器生成的项目文件
- 修改：`package.json`
- 创建：`vitest.config.ts`
- 创建：`playwright.config.ts`
- 创建：`tests/setup.ts`

**接口：**
- 产出：`npm run test`、`npm run test:run`、`npm run test:e2e` 和 `npm run build`。

- [ ] **步骤 1：初始化站点并启动开发服务**

运行 Sites 初始化器一次，保留生成的 Vite/vinext 结构与锁文件，然后启动 `npm run dev`。

- [ ] **步骤 2：安装运行与测试依赖**

运行：

```powershell
npm install pixi.js zustand
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @playwright/test
```

- [ ] **步骤 3：增加测试脚本**

`package.json` 增加：

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **步骤 4：建立空测试并验证测试链路**

`tests/setup.ts`：

```ts
import "@testing-library/jest-dom/vitest";
```

运行 `npm run test:run`，预期测试进程正常退出；运行 `npm run build`，预期生产构建通过。

- [ ] **步骤 5：提交**

```powershell
git add package.json package-lock.json vitest.config.ts playwright.config.ts tests/setup.ts
git commit -m "chore: 初始化游戏站点与测试环境"
```

### 任务 2：建立可复现规则核心

**文件：**
- 创建：`game/types.ts`
- 创建：`game/rng.ts`
- 创建：`game/content.ts`
- 创建：`game/map.ts`
- 创建：`game/reducer.ts`
- 创建：`tests/rng.test.ts`
- 创建：`tests/reducer.test.ts`

**接口：**
- 产出：`createInitialState(config: GameConfig): GameState`
- 产出：`dispatchCommand(state: GameState, command: GameCommand): CommandResult`
- 产出：`createRng(seed: number): SeededRng`

- [ ] **步骤 1：先写随机数与开局失败测试**

```ts
it("相同种子产生相同骰子序列", () => {
  const a = createRng(20260804);
  const b = createRng(20260804);
  expect([a.die(), a.die(), a.die()]).toEqual([b.die(), b.die(), b.die()]);
});

it("只允许二到四名玩家开局", () => {
  expect(() => createInitialState(makeConfig(1))).toThrow("玩家数量必须为 2–4");
});
```

- [ ] **步骤 2：运行并确认失败**

运行：`npm run test:run -- tests/rng.test.ts tests/reducer.test.ts`

预期：因模块尚未创建而失败。

- [ ] **步骤 3：实现类型、随机服务与初始状态**

核心签名：

```ts
export type TurnPhase = "turn-start" | "action" | "moving" | "resolving" | "turn-end" | "game-over";

export interface CommandResult {
  state: GameState;
  events: GameEvent[];
  error?: { code: string; message: string };
}

export function dispatchCommand(state: GameState, command: GameCommand): CommandResult;
```

地图以稳定节点 ID、相邻节点 ID 和屏幕坐标描述；内容数据使用只读对象，规则代码不硬编码显示文案。

- [ ] **步骤 4：运行核心测试**

运行：`npm run test:run -- tests/rng.test.ts tests/reducer.test.ts`

预期：全部通过。

- [ ] **步骤 5：提交**

```powershell
git add game tests/rng.test.ts tests/reducer.test.ts
git commit -m "feat: 建立可复现规则核心"
```

### 任务 3：实现回合移动与地产经济

**文件：**
- 创建：`game/turn.ts`
- 创建：`game/economy.ts`
- 创建：`game/selectors.ts`
- 创建：`tests/economy.test.ts`
- 修改：`game/reducer.ts`

**接口：**
- 消费：`GameState`、`GameCommand`、`SeededRng`
- 产出：`getLegalActions(state, playerId): LegalAction[]`
- 产出：`calculateToll(state, propertyId): number`
- 产出：`resolveBankruptcy(state, playerId): GameEvent[]`

- [ ] **步骤 1：写移动、购地、升级、收费和破产失败测试**

```ts
it("掷骰后逐格移动并进入落点结算", () => {
  const result = dispatchCommand(actionState, { type: "ROLL_DICE", playerId: "p1" });
  expect(result.events.some((event) => event.type === "DICE_ROLLED")).toBe(true);
  expect(result.events.filter((event) => event.type === "PLAYER_STEPPED")).toHaveLength(result.state.lastRoll!);
  expect(result.state.phase).toBe("resolving");
});

it("落在对手地产会支付正确通行费", () => {
  const result = resolveLanding(opponentPropertyState, "p1");
  expect(netCashChange(result.events, "p1")).toBe(-1200);
  expect(netCashChange(result.events, "p2")).toBe(1200);
});
```

- [ ] **步骤 2：运行并确认失败**

运行：`npm run test:run -- tests/economy.test.ts`

- [ ] **步骤 3：实现回合状态机与经济规则**

所有金额变动生成 `CASH_CHANGED` 事件；所有地产变动生成 `PROPERTY_CHANGED` 事件。资金不足时依次出售股票、抵押地产，再进入破产清算，不允许出现负数建筑等级。

- [ ] **步骤 4：运行经济与回归测试**

运行：`npm run test:run -- tests/economy.test.ts tests/reducer.test.ts`

- [ ] **步骤 5：提交**

```powershell
git add game/turn.ts game/economy.ts game/selectors.ts game/reducer.ts tests/economy.test.ts
git commit -m "feat: 实现回合移动与地产经济"
```

### 任务 4：实现卡片、道具、神仙与特殊设施

**文件：**
- 创建：`game/effects.ts`
- 创建：`tests/effects.test.ts`
- 修改：`game/content.ts`
- 修改：`game/reducer.ts`

**接口：**
- 产出：`getEffectTargets(state, effectId, playerId): TargetRef[]`
- 产出：`applyEffect(state, request): CommandResult`
- 产出：`tickStatuses(state, playerId): CommandResult`

- [ ] **步骤 1：写合法目标、持续状态和互斥效果失败测试**

```ts
it("购地卡只能选择当前无主地产", () => {
  expect(getEffectTargets(state, "purchase-card", "p1")).toEqual([{ type: "property", id: "beijing-1" }]);
});

it("送神卡移除附身并记录事件", () => {
  const result = applyEffect(blessedState, { playerId: "p1", effectId: "send-god", targetId: "p1" });
  expect(result.state.players.p1.god).toBeNull();
  expect(result.events).toContainEqual(expect.objectContaining({ type: "GOD_LEFT" }));
});
```

- [ ] **步骤 2：运行并确认失败**

运行：`npm run test:run -- tests/effects.test.ts`

- [ ] **步骤 3：实现首发卡片、道具、六类神仙和设施事件**

每种效果使用声明式定义：

```ts
interface EffectDefinition {
  id: string;
  target: "self" | "player" | "property" | "road" | "stock";
  canUse(ctx: EffectContext): boolean;
  apply(ctx: EffectContext, target: TargetRef): GameEvent[];
}
```

地图危险物必须记录创建者、节点、类型与剩余状态；机器娃娃只清除前方可清除障碍。

- [ ] **步骤 4：运行效果与经济回归测试**

运行：`npm run test:run -- tests/effects.test.ts tests/economy.test.ts`

- [ ] **步骤 5：提交**

```powershell
git add game/effects.ts game/content.ts game/reducer.ts tests/effects.test.ts
git commit -m "feat: 加入卡片道具与神仙系统"
```

### 任务 5：实现股票、公司与新闻

**文件：**
- 创建：`game/stocks.ts`
- 创建：`tests/stocks.test.ts`
- 修改：`game/content.ts`
- 修改：`game/reducer.ts`

**接口：**
- 产出：`tradeStock(state, order: StockOrder): CommandResult`
- 产出：`advanceMarket(state): CommandResult`
- 产出：`getChairperson(state, companyId): PlayerId | null`

- [ ] **步骤 1：写交易、涨跌停、董事长和新闻失败测试**

```ts
it("股票价格不能突破当日涨停", () => {
  const result = advanceMarket(stockAtLimitState);
  expect(result.state.stocks.mall.price).toBeLessThanOrEqual(stockAtLimitState.stocks.mall.limitUp);
});

it("持股最多且不并列的玩家成为董事长", () => {
  expect(getChairperson(companyState, "mall")).toBe("p2");
});
```

- [ ] **步骤 2：运行并确认失败**

运行：`npm run test:run -- tests/stocks.test.ts`

- [ ] **步骤 3：实现股票与公司规则**

交易必须检查现金、持仓、交易数量和涨跌停状态；市场更新使用种子随机服务，并为价格变化生成可展示原因。

- [ ] **步骤 4：运行股票与规则回归测试**

运行：`npm run test:run -- tests/stocks.test.ts tests/reducer.test.ts`

- [ ] **步骤 5：提交**

```powershell
git add game/stocks.ts game/content.ts game/reducer.ts tests/stocks.test.ts
git commit -m "feat: 实现股票公司与新闻系统"
```

### 任务 6：实现 AI 与无界面对局模拟

**文件：**
- 创建：`game/ai.ts`
- 创建：`game/simulate.ts`
- 创建：`tests/ai.test.ts`
- 创建：`tests/simulation.test.ts`

**接口：**
- 产出：`chooseAiCommand(state, playerId, difficulty): GameCommand`
- 产出：`simulateGame(config, options): SimulationResult`

- [ ] **步骤 1：写合法动作与终局失败测试**

```ts
it("AI 永远返回当前合法指令", () => {
  const command = chooseAiCommand(state, "p2", "standard");
  expect(getLegalActions(state, "p2").some((action) => action.type === command.type)).toBe(true);
});

it("固定种子的自动对局可重复并在回合限制内结束", () => {
  const a = simulateGame(configWithSeed(77), { maxTurns: 500 });
  const b = simulateGame(configWithSeed(77), { maxTurns: 500 });
  expect(a.summary).toEqual(b.summary);
  expect(a.finished).toBe(true);
});
```

- [ ] **步骤 2：运行并确认失败**

运行：`npm run test:run -- tests/ai.test.ts tests/simulation.test.ts`

- [ ] **步骤 3：实现分层评分 AI 与模拟器**

AI 评分由现金安全线、地产回报、同色组价值、攻击收益、股票风险和随机失误组成。单次决策不超过 450 毫秒；模拟器检测连续无进展回合并返回诊断结果。

- [ ] **步骤 4：运行 100 局固定种子模拟**

运行：`npm run test:run -- tests/ai.test.ts tests/simulation.test.ts`

预期：100 个种子全部结束，无非法状态或死循环。

- [ ] **步骤 5：提交**

```powershell
git add game/ai.ts game/simulate.ts tests/ai.test.ts tests/simulation.test.ts
git commit -m "feat: 实现游戏 AI 与自动对局模拟"
```

### 任务 7：实现版本化本地存档

**文件：**
- 创建：`game/save.ts`
- 创建：`tests/save.test.ts`

**接口：**
- 产出：`serializeSave(state): string`
- 产出：`parseSave(raw): SaveParseResult`
- 产出：`saveGame(slot, state): void`
- 产出：`loadGame(slot): SaveParseResult`

- [ ] **步骤 1：写往返、损坏与旧版本失败测试**

```ts
it("存档往返保持规则状态与随机种子", () => {
  const loaded = parseSave(serializeSave(state));
  expect(loaded.ok && loaded.state).toEqual(state);
});

it("损坏存档返回中文错误且不抛出未捕获异常", () => {
  expect(parseSave("{broken")).toEqual({ ok: false, message: "存档内容已损坏" });
});
```

- [ ] **步骤 2：运行并确认失败**

运行：`npm run test:run -- tests/save.test.ts`

- [ ] **步骤 3：实现校验、版本号、自动存档与三个手动槽位**

存档键使用 `richman-web:v1:<slot>`；自动存档在每个完整指令后触发，禁止保存临时动画状态。

- [ ] **步骤 4：运行存档回归测试**

运行：`npm run test:run -- tests/save.test.ts tests/simulation.test.ts`

- [ ] **步骤 5：提交**

```powershell
git add game/save.ts tests/save.test.ts
git commit -m "feat: 加入版本化本地存档"
```

### 任务 8：搭建 React 游戏界面

**文件：**
- 修改：`app/page.tsx`
- 修改：`app/layout.tsx`
- 修改：`app/globals.css`
- 创建：`components/StartScreen.tsx`
- 创建：`components/GameScreen.tsx`
- 创建：`components/PlayerRail.tsx`
- 创建：`components/ActionDock.tsx`
- 创建：`components/EventFeed.tsx`
- 创建：`components/ModalLayer.tsx`
- 创建：`components/InventoryDrawer.tsx`
- 创建：`components/StockDrawer.tsx`
- 创建：`components/ResultScreen.tsx`
- 创建：`store/gameStore.ts`
- 创建：`tests/components.test.tsx`

**接口：**
- 消费：`dispatchCommand`、`getLegalActions`、`saveGame`
- 产出：`useGameStore()` 与可访问的中文界面。

- [ ] **步骤 1：写开始对局与 HUD 渲染组件测试**

使用 Testing Library 验证：选择四个席位后“开始对局”按钮可用；当前玩家、现金、总资产、卡片、股票与掷骰按钮按状态出现。

- [ ] **步骤 2：运行并确认失败**

运行：`npm run test:run -- tests/components.test.tsx`

- [ ] **步骤 3：实现开始页、游戏壳层、动作栏与抽屉**

所有按钮使用动作文本和 `aria-label`；不使用通用“提交”。当前阶段不可用的动作隐藏或禁用，并显示中文原因。

- [ ] **步骤 4：实现响应式宽屏布局**

桌面使用“棋盘 + 右侧玩家栏 + 底部动作栏”；宽度小于 900px 的横屏设备把玩家栏折叠为顶部头像条，抽屉覆盖右侧 42% 屏幕。

- [ ] **步骤 5：运行组件测试与构建**

运行：`npm run test:run -- tests/components.test.tsx`，然后运行 `npm run build`。

- [ ] **步骤 6：提交**

```powershell
git add app components store tests/components.test.tsx
git commit -m "feat: 搭建宽屏游戏界面"
```

### 任务 9：实现 PixiJS 45° 棋盘与动画队列

**文件：**
- 创建：`components/BoardCanvas.tsx`
- 创建：`render/createBoard.ts`
- 创建：`render/animateEvents.ts`
- 创建：`render/assets.ts`
- 修改：`components/GameScreen.tsx`
- 创建：`tests/board.test.tsx`

**接口：**
- 消费：地图内容、`GameState` 和 `GameEvent[]`
- 产出：`createBoard(app, content): BoardController`
- 产出：`playEventQueue(controller, events, speed): Promise<void>`

- [ ] **步骤 1：写棋盘控制器生命周期测试**

验证挂载时只创建一个 Pixi 应用，卸载时销毁纹理与监听器；动画完成后才从队列移除事件。

- [ ] **步骤 2：运行并确认失败**

运行：`npm run test:run -- tests/board.test.tsx`

- [ ] **步骤 3：实现地图图层**

按背景、道路、地产、建筑、障碍、角色、特效、交互高亮顺序创建图层。首版使用程序化圆角纹理、CSS 色板和原创角色头像资源，避免依赖官方素材。

- [ ] **步骤 4：实现重点动画**

实现骰子滚动、角色逐格弹跳、买地旗帜、房屋升级、神仙光效和破产退场；1×、2×、4× 只改变时长，不改变事件顺序。

- [ ] **步骤 5：运行测试与构建**

运行：`npm run test:run -- tests/board.test.tsx`，然后运行 `npm run build`。

- [ ] **步骤 6：提交**

```powershell
git add components/BoardCanvas.tsx components/GameScreen.tsx render tests/board.test.tsx
git commit -m "feat: 绘制高清斜视棋盘与事件动画"
```

### 任务 10：完成对局集成、音效与可用性

**文件：**
- 修改：`app/globals.css`
- 修改：`store/gameStore.ts`
- 修改：`components/ModalLayer.tsx`
- 修改：`components/ActionDock.tsx`
- 创建：`game/audio.ts`
- 创建：`tests/integration.test.ts`

**接口：**
- 产出：从开局到结算的完整用户路径。

- [ ] **步骤 1：写跨模块集成失败测试**

测试真人回合、AI 接管、买地弹窗、动画完成、自动存档与下一回合按固定顺序执行。

- [ ] **步骤 2：运行并确认失败**

运行：`npm run test:run -- tests/integration.test.ts`

- [ ] **步骤 3：接通规则、动画、AI 和存档**

Store 只在动画队列空闲时接受下一个自动指令；页面隐藏时暂停动画并保留规则状态；恢复页面后从当前事件继续。

- [ ] **步骤 4：加入原创合成音效与设置**

使用 Web Audio 生成骰子、金币、升级和提示音，默认音量 35%；首次用户操作前不创建音频上下文。设置包含音乐、音效、动画速度和减少动态效果。

- [ ] **步骤 5：运行集成测试与构建**

运行：`npm run test:run -- tests/integration.test.ts`，然后运行 `npm run build`。

- [ ] **步骤 6：提交**

```powershell
git add app/globals.css store components game/audio.ts tests/integration.test.ts
git commit -m "feat: 完成对局集成与游戏反馈"
```

### 任务 11：浏览器回归、性能与发布

**文件：**
- 创建：`e2e/game.spec.ts`
- 创建：`e2e/responsive.spec.ts`
- 修改：`playwright.config.ts`
- 修改：`app/layout.tsx`
- 创建：`public/og.png`

**接口：**
- 产出：通过自动回归的生产构建与部署地址。

- [ ] **步骤 1：写浏览器失败测试**

`e2e/game.spec.ts` 覆盖：创建两人局、掷骰、购买地产、完成 AI 回合、刷新恢复、打开股票、结束快速局。

`e2e/responsive.spec.ts` 覆盖：1440×900 下棋盘和右侧栏同时可见；844×390 下顶部玩家条和底部动作栏可操作；页面无水平溢出。

- [ ] **步骤 2：运行并确认失败**

运行：`npm run test:e2e`

- [ ] **步骤 3：修复真实回归问题并生成社交预览图**

只修复测试揭示的功能、响应式和可访问性问题。社交预览图使用实际品牌色、中文标题和棋盘视觉，不使用启动器占位图。

- [ ] **步骤 4：运行最终验证**

依次运行：

```powershell
npm run test:run
npm run test:e2e
npm run build
```

预期：规则、模拟、组件与浏览器测试全部通过，构建成功。

- [ ] **步骤 5：部署并检查线上入口**

使用 Sites 发布，确认公开地址可载入开始页并能创建本地对局。

- [ ] **步骤 6：提交**

```powershell
git add e2e playwright.config.ts app/layout.tsx public/og.png
git commit -m "test: 完成浏览器回归与发布准备"
```
