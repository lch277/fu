import type { GameCommand, GameState } from "@/game/types";

export function ModalLayer({ state, onCommand }: { state: GameState; onCommand(command: GameCommand): void }) {
  if (!state.pending) return null;
  const property = state.properties[state.pending.propertyId];
  const playerId = state.currentPlayerId;
  const buying = state.pending.type === "purchase";
  const cost = buying ? property.price : Math.round(property.price * 0.5);
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="property-modal" role="dialog" aria-modal="true" aria-label={buying ? "购买地产" : "升级地产"}>
        <span className="property-ribbon" style={{ background: property.group.includes("红") ? "#f05278" : "#35b9b0" }}>{property.group}</span>
        <p className="modal-kicker">{buying ? "发现无主地产" : "建设机会"}</p>
        <h2>{property.name}</h2>
        <div className="property-illustration"><span>楼</span><i /><i /><i /></div>
        <div className="property-stats"><span><small>{buying ? "购买价格" : "升级费用"}</small><b>¥{cost.toLocaleString("zh-CN")}</b></span><span><small>当前通行费</small><b>¥{property.baseToll.toLocaleString("zh-CN")}</b></span></div>
        <div className="modal-actions">
          <button className="primary-button" onClick={() => onCommand(buying ? { type: "BUY_PROPERTY", playerId, propertyId: property.id } : { type: "UPGRADE_PROPERTY", playerId, propertyId: property.id })}>{buying ? "买下地产" : "立即升级"}</button>
          <button className="ghost-button" onClick={() => onCommand({ type: "SKIP_PURCHASE", playerId })}>暂时放弃</button>
        </div>
      </section>
    </div>
  );
}
