import { getLegalActions } from "@/game/selectors";
import type { GameCommand, GameState } from "@/game/types";

interface ActionDockProps {
  state: GameState;
  interactionLocked?: boolean;
  onCommand(command: GameCommand): void;
  onOpenInventory(): void;
  onOpenStocks(): void;
}

export function ActionDock({ state, interactionLocked = false, onCommand, onOpenInventory, onOpenStocks }: ActionDockProps) {
  const playerId = state.currentPlayerId;
  const toolsEnabled = state.players[playerId].kind === "human" && state.phase === "action";
  // 掷骰按钮已移至棋盘中心的 3D 骰子,操作栏只保留其余动作
  const actions = getLegalActions(state, playerId).filter((action) => action.type !== "ROLL_DICE");

  function commandFor(type: GameCommand["type"]): GameCommand {
    if (type === "BUY_PROPERTY") return { type, playerId, propertyId: state.pending!.propertyId };
    if (type === "UPGRADE_PROPERTY") return { type, playerId, propertyId: state.pending!.propertyId };
    if (type === "SKIP_PURCHASE") return { type, playerId };
    if (type === "RESOLVE_LANDING") return { type, playerId };
    return { type: "ROLL_DICE", playerId };
  }

  return (
    <footer className="action-dock">
      <div className="dock-tools">
        <button disabled={!toolsEnabled} onClick={onOpenInventory}><span>卡</span>卡片与道具</button>
        <button disabled={!toolsEnabled} onClick={onOpenStocks}><span>股</span>股票市场</button>
      </div>
      <div className="phase-caption"><small>当前阶段</small><b>{state.phase === "action" ? "行动准备" : state.phase === "resolving" ? "落点结算" : state.phase === "turn-end" ? "回合完成" : "游戏结算"}</b></div>
      <div className="primary-actions">
        {actions.map((action) => (
          <button key={action.type} aria-label={action.label} className={`${action.type === "BUY_PROPERTY" || action.type === "UPGRADE_PROPERTY" ? "dice-button" : "secondary-action"}${action.enabled === false && action.reason ? " action-denied" : ""}`} disabled={interactionLocked || (action.enabled === false && !action.reason) || state.players[playerId].kind !== "human"} title={interactionLocked ? "棋子移动动画进行中" : state.players[playerId].kind !== "human" ? "AI 正在思考" : !action.enabled ? action.reason : undefined} onClick={() => onCommand(commandFor(action.type))}>
            {action.label}
          </button>
        ))}
      </div>
    </footer>
  );
}
