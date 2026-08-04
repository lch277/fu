import { getLegalActions } from "@/game/selectors";
import type { GameCommand, GameState } from "@/game/types";

interface ActionDockProps {
  state: GameState;
  onCommand(command: GameCommand): void;
  onOpenInventory(): void;
  onOpenStocks(): void;
}

export function ActionDock({ state, onCommand, onOpenInventory, onOpenStocks }: ActionDockProps) {
  const playerId = state.currentPlayerId;
  const actions = getLegalActions(state, playerId);

  function commandFor(type: GameCommand["type"]): GameCommand {
    if (type === "BUY_PROPERTY") return { type, playerId, propertyId: state.pending!.propertyId };
    if (type === "UPGRADE_PROPERTY") return { type, playerId, propertyId: state.pending!.propertyId };
    if (type === "SKIP_PURCHASE") return { type, playerId };
    if (type === "RESOLVE_LANDING") return { type, playerId };
    if (type === "END_TURN") return { type, playerId };
    return { type: "ROLL_DICE", playerId };
  }

  return (
    <footer className="action-dock">
      <div className="dock-tools">
        <button onClick={onOpenInventory}><span>卡</span>卡片与道具</button>
        <button onClick={onOpenStocks}><span>股</span>股票市场</button>
      </div>
      <div className="phase-caption"><small>当前阶段</small><b>{state.phase === "action" ? "行动准备" : state.phase === "resolving" ? "落点结算" : state.phase === "turn-end" ? "回合完成" : "游戏结算"}</b></div>
      <div className="primary-actions">
        {actions.map((action) => (
          <button key={action.type} aria-label={action.label} className={action.type === "ROLL_DICE" || action.type === "BUY_PROPERTY" || action.type === "UPGRADE_PROPERTY" ? "dice-button" : "secondary-action"} disabled={!action.enabled} title={!action.enabled ? action.reason : undefined} onClick={() => onCommand(commandFor(action.type))}>
            {action.type === "ROLL_DICE" && <span aria-hidden="true" className="dice-face">⚄</span>}{action.label}
          </button>
        ))}
      </div>
    </footer>
  );
}
