import { ActionDock } from "./ActionDock";
import { BoardCanvas } from "./BoardCanvas";
import { EventFeed } from "./EventFeed";
import { ModalLayer } from "./ModalLayer";
import { PlayerRail } from "./PlayerRail";
import type { GameCommand, GameEvent, GameState } from "@/game/types";

interface GameScreenProps {
  state: GameState;
  events: GameEvent[];
  onCommand(command: GameCommand): void;
  onOpenInventory(): void;
  onOpenStocks(): void;
}

export function GameScreen({ state, events, onCommand, onOpenInventory, onOpenStocks }: GameScreenProps) {
  const current = state.players[state.currentPlayerId];
  return (
    <main className="game-screen">
      <header className="game-topbar">
        <div className="compact-logo"><span>神州</span><b>大富翁</b></div>
        <div className="turn-ticket"><small>当前行动</small><b>{current.name}</b><span style={{ background: current.color }} /></div>
        <div className="round-info"><span>第 {state.round} 轮</span><small>目标 ¥{state.config.targetNetWorth.toLocaleString("zh-CN")}</small></div>
        <button className="settings-button" aria-label="游戏设置">⚙</button>
      </header>
      <section className="game-layout">
        <div className="board-shell">
          <div className="board-glow" />
          <div className="board-stage" aria-label="神州环游棋盘">
            <div className="map-water" />
            <BoardCanvas state={state} events={events} />
            {state.map.nodes.map((node, index) => {
              const property = node.propertyId ? state.properties[node.propertyId] : null;
              return <div key={node.id} className={`map-node node-${node.type}`} style={{ left: `${node.x / 10}%`, top: `${node.y / 7}%`, "--node-index": index } as React.CSSProperties} title={node.name}>
                <span>{node.name.slice(0, 2)}</span>{property?.ownerId && <i style={{ background: state.players[property.ownerId].color }} />}{property && property.level > 0 && <b>{"楼".repeat(Math.min(3, property.level))}</b>}
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
            <div className="map-center-die"><span>{state.lastRoll ?? "?"}</span></div>
          </div>
          <EventFeed events={events} />
        </div>
        <PlayerRail state={state} />
      </section>
      <ActionDock state={state} onCommand={onCommand} onOpenInventory={onOpenInventory} onOpenStocks={onOpenStocks} />
      <ModalLayer state={state} onCommand={onCommand} />
    </main>
  );
}
