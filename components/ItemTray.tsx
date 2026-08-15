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

interface ItemTrayProps {
  state: GameState;
  disabled?: boolean;
  onUse(request: EffectRequest): void;
}

// 道具卡横排条:当前玩家的卡片与道具直接展示,放不下横向滚动;点击即用,多目标时弹出选择层
export function ItemTray({ state, disabled = false, onUse }: ItemTrayProps) {
  const player = state.players[state.currentPlayerId];
  const [selection, setSelection] = useState<{ effectId: string; name: string; targets: TargetRef[] } | null>(null);
  const [dieSelection, setDieSelection] = useState(false);
  const definitions = [...CARD_DEFINITIONS, ...TOOL_DEFINITIONS];
  const items = [...player.cards, ...player.tools].map((id) => definitions.find((item) => item.id === id)).filter(Boolean);

  function chooseEffect(effectId: string, name: string) {
    if (effectId === "remote-die") {
      setSelection(null);
      setDieSelection(true);
      return;
    }
    const targets = getEffectTargets(state, effectId, player.id);
    if (targets.length === 1) {
      setSelection(null);
      onUse({ playerId: player.id, effectId, target: targets[0] });
    } else if (targets.length > 1) {
      setSelection({ effectId, name, targets });
    }
  }

  if (!items.length) {
    return <div className="item-tray-empty">暂无道具</div>;
  }

  return (
    <div className="item-tray" role="group" aria-label="道具卡">
      {dieSelection && (
        <div className="item-target-pop" role="dialog" aria-label="选择遥控骰子点数">
          <div className="item-target-head"><b>遥控骰子：选择点数</b><button aria-label="取消选择点数" onClick={() => setDieSelection(false)}>×</button></div>
          <div className="die-pick-list">
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <button key={value} aria-label={`${value} 点`} onClick={() => {
                setDieSelection(false);
                onUse({ playerId: player.id, effectId: "remote-die", target: { type: "player", id: player.id }, value });
              }}>{value}</button>
            ))}
          </div>
        </div>
      )}
      {selection && (
        <div className="item-target-pop" role="dialog" aria-label={`为${selection.name}选择目标`}>
          <div className="item-target-head"><b>为{selection.name}选择目标</b><button aria-label="取消选择目标" onClick={() => setSelection(null)}>×</button></div>
          <div className="item-target-list">
            {selection.targets.map((target) => (
              <button key={`${target.type}-${target.id}`} aria-label={targetLabel(state, target)} onClick={() => {
                const effectId = selection.effectId;
                setSelection(null);
                onUse({ playerId: player.id, effectId, target });
              }}>
                {target.type === "player" ? "👤" : target.type === "stock" ? "📈" : target.type === "road" ? "📍" : "🏠"} {targetLabel(state, target)}
              </button>
            ))}
          </div>
        </div>
      )}
      {items.map((item, index) => {
        const usable = !disabled && getEffectTargets(state, item!.id, player.id).length > 0;
        return (
          <button key={`${item!.id}-${index}`} className="item-chip" disabled={!usable} title={item!.description} onClick={() => chooseEffect(item!.id, item!.name)}>
            {item!.name}
          </button>
        );
      })}
    </div>
  );
}
