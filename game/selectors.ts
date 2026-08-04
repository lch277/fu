import type { GameState, LegalAction, PlayerId } from "./types";

export function getNetWorth(state: GameState, playerId: PlayerId): number {
  const player = state.players[playerId];
  const properties = player.propertyIds.reduce((sum, id) => {
    const property = state.properties[id];
    return sum + property.price + Math.round(property.price * 0.5 * property.level);
  }, 0);
  const stocks = Object.entries(player.stocks).reduce(
    (sum, [id, quantity]) => sum + (state.stocks[id]?.price ?? 0) * quantity,
    0,
  );
  return Math.round(player.cash + properties + stocks);
}

export function getLegalActions(state: GameState, playerId: PlayerId): LegalAction[] {
  if (playerId !== state.currentPlayerId || !state.players[playerId]?.active) return [];
  if (state.phase === "action") return [{ type: "ROLL_DICE", label: "掷骰", enabled: true }];
  if (state.phase === "resolving" && state.pending?.type === "purchase") {
    const property = state.properties[state.pending.propertyId];
    return [
      { type: "BUY_PROPERTY", label: "买下地产", enabled: state.players[playerId].cash >= property.price, reason: "现金不足" },
      { type: "SKIP_PURCHASE", label: "放弃购买", enabled: true },
    ];
  }
  if (state.phase === "resolving" && state.pending?.type === "upgrade") {
    const property = state.properties[state.pending.propertyId];
    return [
      { type: "UPGRADE_PROPERTY", label: "升级地产", enabled: state.players[playerId].cash >= property.price * 0.5, reason: "现金不足" },
      { type: "SKIP_PURCHASE", label: "暂不升级", enabled: true },
    ];
  }
  if (state.phase === "resolving") return [{ type: "RESOLVE_LANDING", label: "结算落点", enabled: true }];
  if (state.phase === "turn-end") return [{ type: "END_TURN", label: "结束回合", enabled: true }];
  return [];
}
