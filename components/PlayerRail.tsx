import { getNetWorth } from "@/game/selectors";
import type { GameState } from "@/game/types";

const marks: Record<string, string> = { "sun-xiaomei": "美", "a-tubo": "土", "qian-furen": "钱", "jin-beibei": "贝" };

export function PlayerRail({ state }: { state: GameState }) {
  const ranked = state.turnOrder
    .map((id) => state.players[id])
    .sort((a, b) => getNetWorth(state, b.id) - getNetWorth(state, a.id));
  return (
    <aside className="player-rail" aria-label="玩家排行">
      <div className="rail-heading"><span>资产排行</span><small>第 {state.round} 轮排行</small></div>
      {ranked.map((player, index) => (
        <article className={`player-card ${player.id === state.currentPlayerId ? "current" : ""} ${!player.active ? "bankrupt" : ""}`} key={player.id} style={{ "--player-color": player.color } as React.CSSProperties}>
          <span className="rank-number">{index + 1}</span>
          <div className="player-id">
            <span className="player-avatar">{marks[player.character]}</span>
            <span className="player-kind">{player.kind === "human" ? "真人" : "AI"}</span>
          </div>
          <div className="player-summary"><b>{player.name}</b></div>
          <div className="player-money"><strong>¥{player.cash.toLocaleString("zh-CN")}</strong><small>总资产 ¥{getNetWorth(state, player.id).toLocaleString("zh-CN")}</small></div>
          {player.god && <span className={`god-badge ${player.god.tone}`}>{player.god.name} · {player.god.remainingTurns}</span>}
        </article>
      ))}
    </aside>
  );
}
