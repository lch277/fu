import { getLegalActions } from "@/game/selectors";
import type { EffectRequest, GameCommand, GameState } from "@/game/types";
import { ItemTray } from "./ItemTray";

interface ActionDockProps {
  state: GameState;
  interactionLocked?: boolean;
  onCommand(command: GameCommand): void;
  onOpenStocks(): void;
  onUse(request: EffectRequest): void;
}

export function ActionDock({ state, interactionLocked = false, onCommand, onOpenStocks, onUse }: ActionDockProps) {
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
        <button disabled={!toolsEnabled} onClick={onOpenStocks}><span>股</span>股票市场</button>
      </div>
      <ItemTray state={state} disabled={!toolsEnabled} onUse={onUse} />
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
