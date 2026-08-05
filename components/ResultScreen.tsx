import { getNetWorth } from "@/game/selectors";
import type { GameState } from "@/game/types";

export function ResultScreen({ state, onRestart }: { state: GameState; onRestart(): void }) {
  const ranked = state.turnOrder.map((id) => state.players[id]).sort((a, b) => {
    const winnerOrder = Number(state.winnerIds.includes(b.id)) - Number(state.winnerIds.includes(a.id));
    return winnerOrder || getNetWorth(state, b.id) - getNetWorth(state, a.id);
  });
  const winnerNames = state.winnerIds.map((id) => state.players[id]?.name).filter(Boolean).join("、") || ranked[0].name;
  return <main className="result-screen"><section className="result-card"><p className="eyebrow">本局结算</p><h1>{winnerNames}成为大富翁！</h1><div className="podium">{ranked.map((player, index) => <article key={player.id} className={`place-${index + 1}`}><span>{index + 1}</span><b>{player.name}</b><strong>¥{getNetWorth(state, player.id).toLocaleString("zh-CN")}</strong></article>)}</div><button className="primary-button" onClick={onRestart}>再来一局</button></section></main>;
}
