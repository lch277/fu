import { useEffect, useRef, useState } from "react";
import { ActionDock } from "./ActionDock";
import { BoardCanvas } from "./BoardCanvas";
import { CenterDice } from "./CenterDice";
import { EventFeed } from "./EventFeed";
import { ModalLayer } from "./ModalLayer";
import { PlayerRail } from "./PlayerRail";
import { calculateToll } from "@/game/economy";
import type { EffectRequest, GameCommand, GameEvent, GameState } from "@/game/types";

interface GameScreenProps {
  state: GameState;
  events: GameEvent[];
  onCommand(command: GameCommand): void;
  onOpenInventory?(): void;
  onOpenStocks(): void;
  onOpenSettings?(): void;
  onUse?(request: EffectRequest): void;
  animationSpeed?: 1 | 2 | 4;
  interactionLocked?: boolean;
}

interface NodePopup {
  id: string;
  text: string;
}

// 浮动消息只展示有实际反馈的事件,过滤纯流程提示(轮到谁、走到哪、掷骰、报价弹窗重复)
export const POPUP_EVENT_TYPES = new Set([
  "TOLL_PAID",
  "PROPERTY_BOUGHT",
  "PROPERTY_UPGRADED",
  "ASSETS_LIQUIDATED",
  "PLAYER_BANKRUPT",
  "REVENGE_TRIGGERED",
  "TURN_SKIPPED",
  "BOMB_EXPLODED",
  "HAZARD_TRIGGERED",
  "START_BONUS",
  "SPECIAL_SPACE_RESOLVED",
  "STOCK_CHANGED",
  "TARGET_REACHED",
  "GAME_OVER",
]);

export function GameScreen({ state, events, onCommand, onOpenStocks, onOpenSettings, onUse, animationSpeed = 1, interactionLocked = false }: GameScreenProps) {
  const [popups, setPopups] = useState<Record<string, NodePopup[]>>({});
  const handledEventIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fresh = events.filter((event) => !handledEventIds.current.has(event.id) && POPUP_EVENT_TYPES.has(event.type));
    if (!fresh.length) return;
    const matched = fresh
      .map((event) => {
        const actorId =
          event.playerId ??
          Object.values(state.players).find((player) => event.message.includes(player.name))?.id;
        if (!actorId) return null;
        const player = state.players[actorId];
        const node = player ? state.map.nodes.find((entry) => entry.id === player.position) : null;
        return node ? { nodeId: node.id, id: event.id, text: event.message } : null;
      })
      .filter((item): item is { nodeId: string; id: string; text: string } => item !== null);
    matched.forEach((item) => handledEventIds.current.add(item.id));
    if (!matched.length) return;
    setPopups((prev) => {
      const next = { ...prev };
      for (const item of matched) next[item.nodeId] = [...(next[item.nodeId] ?? []), item];
      return next;
    });
    for (const item of matched) {
      window.setTimeout(() => {
        setPopups((prev) => {
          const next = { ...prev };
          next[item.nodeId] = (next[item.nodeId] ?? []).filter((popup) => popup.id !== item.id);
          if (!next[item.nodeId].length) delete next[item.nodeId];
          return next;
        });
      }, 3500);
    }
  }, [events, state.map.nodes]);

  return (
    <main className="game-screen">
      <header className="game-topbar">
        <div className="compact-logo"><span>神州</span><b>大富翁</b></div>
        <PlayerRail state={state} />
        <div className="round-info"><span>第 {state.round} 轮</span><small>目标 ¥{state.config.targetNetWorth.toLocaleString("zh-CN")}</small></div>
        <button className="settings-button" aria-label="游戏设置" onClick={onOpenSettings}>⚙</button>
      </header>
      <section className="game-layout">
        <div className="board-shell">
          <div className="sky" aria-hidden="true">
            <span className="sky-cloud sky-cloud-1" />
            <span className="sky-cloud sky-cloud-2" />
            <span className="sky-mountain sky-mountain-1" />
            <span className="sky-mountain sky-mountain-2" />
          </div>
          <div className="board-glow" />
          <div className="board-stage" aria-label="神州环游棋盘" aria-busy={interactionLocked}>
            <BoardCanvas state={state} events={events} animationSpeed={animationSpeed} />
            {state.map.nodes.map((node, index) => {
              const property = node.propertyId ? state.properties[node.propertyId] : null;
              return <div key={node.id} className={`map-node node-${node.type}`} style={{ left: `${node.x / 10}%`, top: `${node.y / 7}%`, "--node-index": index } as React.CSSProperties} title={node.name}>
                <span>{node.name}</span>{property?.ownerId && <i style={{ background: state.players[property.ownerId].color }} />}{property && property.level > 0 && <b>{"楼".repeat(Math.min(3, property.level))}</b>}
                {property && !property.ownerId && <small className="node-fee price">¥{property.price.toLocaleString("zh-CN")}</small>}
                {property?.ownerId && <small className="node-fee toll">过路 ¥{calculateToll(state, property.id).toLocaleString("zh-CN")}</small>}
                {popups[node.id]?.map((popup, popupIndex) => (
                  <em key={popup.id} className="node-pop" style={{ bottom: `calc(118% + ${popupIndex * 46}px)` }}>{popup.text}</em>
                ))}
              </div>;
            })}
            {state.turnOrder.map((id, index) => {
              const player = state.players[id];
              const node = state.map.nodes.find((item) => item.id === player.position)!;
              return <div className={`board-pawn pawn-index-${index} ${id === state.currentPlayerId ? "active" : ""}`} key={id} style={{ left: `${node.x / 10 + index * 0.7}%`, top: `${node.y / 7 - 5}%`, background: player.color } as React.CSSProperties}><span>{player.name.slice(-1)}</span></div>;
            })}
            <div className="map-landmark landmark-north">北京<br /><b>城楼</b></div>
            <div className="map-landmark landmark-east">上海<br /><b>明珠塔</b></div>
            <div className="map-landmark landmark-south">广州<br /><b>骑楼</b></div>
            <CenterDice state={state} interactionLocked={interactionLocked} onCommand={onCommand} />
          </div>
        </div>
        <EventFeed events={events} players={state.players} turnOrder={state.turnOrder} />
      </section>
      <ActionDock state={state} interactionLocked={interactionLocked} onCommand={onCommand} onOpenStocks={onOpenStocks} onUse={onUse ?? (() => undefined)} />
      <ModalLayer state={state} onCommand={onCommand} />
    </main>
  );
}
