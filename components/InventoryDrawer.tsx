"use client";

import { useState } from "react";
import { CARD_DEFINITIONS, TOOL_DEFINITIONS } from "@/game/content";
import { getEffectTargets } from "@/game/effects";
import type { EffectRequest, GameState, TargetRef } from "@/game/types";

function targetLabel(state: GameState, target: TargetRef): string {
  if (target.type === "player") return state.players[target.id]?.name ?? target.id;
  if (target.type === "property") return state.properties[target.id]?.name ?? target.id;
  if (target.type === "stock") return state.stocks[target.id]?.name ?? target.id;
  return state.map.nodes.find((node) => node.id === target.id)?.name ?? target.id;
}

export function InventoryDrawer({ open, state, onClose, onUse }: { open: boolean; state: GameState; onClose(): void; onUse(request: EffectRequest): void }) {
  const player = state.players[state.currentPlayerId];
  const [selection, setSelection] = useState<{ effectId: string; name: string; targets: TargetRef[] } | null>(null);
  if (!open) return null;
  const definitions = [...CARD_DEFINITIONS, ...TOOL_DEFINITIONS];
  const items = [...player.cards, ...player.tools].map((id) => definitions.find((item) => item.id === id)).filter(Boolean);

  function chooseEffect(effectId: string, name: string) {
    const targets = getEffectTargets(state, effectId, player.id);
    if (targets.length === 1) {
      setSelection(null);
      onUse({ playerId: player.id, effectId, target: targets[0] });
    }
    else if (targets.length > 1) setSelection({ effectId, name, targets });
  }

  function closeDrawer() {
    setSelection(null);
    onClose();
  }

  return (
    <div className="drawer-backdrop" onMouseDown={closeDrawer}>
      <aside className="game-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label="卡片与道具">
        <div className="drawer-heading"><div><small>当前背包</small><h2>卡片与道具</h2></div><button onClick={closeDrawer} aria-label="关闭卡片与道具">×</button></div>
        {selection ? <section className="target-picker" aria-label="选择使用目标">
          <div className="target-picker-heading"><button onClick={() => setSelection(null)}>← 返回</button><div><small>为{selection.name}</small><b>选择目标</b></div></div>
          <div className="target-grid">
            {selection.targets.map((target) => <button key={`${target.type}-${target.id}`} aria-label={targetLabel(state, target)} onClick={() => { setSelection(null); onUse({ playerId: player.id, effectId: selection.effectId, target }); }}>
              <span aria-hidden="true">{target.type === "player" ? "人" : target.type === "stock" ? "股" : target.type === "road" ? "路" : "地"}</span>{targetLabel(state, target)}
            </button>)}
          </div>
        </section> : <div className="inventory-grid">
          {items.map((item, index) => {
            const targets = getEffectTargets(state, item!.id, player.id);
            return <button key={`${item!.id}-${index}`} disabled={!targets.length} onClick={() => chooseEffect(item!.id, item!.name)}>
              <span>{item!.icon}</span><b>{item!.name}</b><small>{item!.description}</small>
            </button>;
          })}
        </div>}
        {!selection && !items.length && <p className="empty-drawer">经过商店或使用卡片点，就能补充道具。</p>}
      </aside>
    </div>
  );
}
