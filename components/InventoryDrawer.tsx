import { CARD_DEFINITIONS, TOOL_DEFINITIONS } from "@/game/content";
import { getEffectTargets } from "@/game/effects";
import type { EffectRequest, GameState } from "@/game/types";

export function InventoryDrawer({ open, state, onClose, onUse }: { open: boolean; state: GameState; onClose(): void; onUse(request: EffectRequest): void }) {
  if (!open) return null;
  const player = state.players[state.currentPlayerId];
  const definitions = [...CARD_DEFINITIONS, ...TOOL_DEFINITIONS];
  const items = [...player.cards, ...player.tools].map((id) => definitions.find((item) => item.id === id)).filter(Boolean);
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="game-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label="卡片与道具">
        <div className="drawer-heading"><div><small>当前背包</small><h2>卡片与道具</h2></div><button onClick={onClose} aria-label="关闭卡片与道具">×</button></div>
        <div className="inventory-grid">
          {items.map((item, index) => {
            const target = getEffectTargets(state, item!.id, player.id)[0];
            return <button key={`${item!.id}-${index}`} disabled={!target} onClick={() => target && onUse({ playerId: player.id, effectId: item!.id, target })}>
              <span>{item!.icon}</span><b>{item!.name}</b><small>{item!.description}</small>
            </button>;
          })}
        </div>
        {!items.length && <p className="empty-drawer">经过商店或使用卡片点，就能补充道具。</p>}
      </aside>
    </div>
  );
}
