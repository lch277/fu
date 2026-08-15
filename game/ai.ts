import { getLegalActions, getNetWorth } from "./selectors";
import type { AiDifficulty, GameCommand, GameState, PlayerId } from "./types";

const cashReserve: Record<AiDifficulty, number> = {
  casual: 8_000,
  standard: 5_000,
  smart: 3_500,
};

/** AI 只读取与真人相同的公开状态，并从当前合法动作中选择。 */
export function chooseAiCommand(
  state: GameState,
  playerId: PlayerId,
  difficulty: AiDifficulty = "standard",
): GameCommand {
  if (state.phase === "turn-end") return { type: "END_TURN", playerId };
  const actions = getLegalActions(state, playerId);
  const enabled = actions.filter((action) => action.enabled);
  if (!enabled.length) {
    throw new Error(`玩家 ${playerId} 当前没有合法动作`);
  }

  const player = state.players[playerId];
  if (state.pending?.type === "purchase") {
    const property = state.properties[state.pending.propertyId];
    const groupOwned = player.propertyIds.filter((id) => state.properties[id].group === property.group).length;
    const strategicDiscount = groupOwned > 0 ? property.price * 0.25 : 0;
    const shouldBuy = player.cash - property.price >= cashReserve[difficulty] - strategicDiscount;
    if (shouldBuy && enabled.some((action) => action.type === "BUY_PROPERTY")) {
      return { type: "BUY_PROPERTY", playerId, propertyId: property.id };
    }
    return { type: "SKIP_PURCHASE", playerId };
  }

  if (state.pending?.type === "upgrade") {
    const property = state.properties[state.pending.propertyId];
    const cost = Math.round(property.price * 0.5);
    const shouldUpgrade = player.cash - cost >= cashReserve[difficulty] && getNetWorth(state, playerId) < state.config.targetNetWorth * 1.8;
    if (shouldUpgrade && enabled.some((action) => action.type === "UPGRADE_PROPERTY")) {
      return { type: "UPGRADE_PROPERTY", playerId, propertyId: property.id };
    }
    return { type: "SKIP_PURCHASE", playerId };
  }

  const preferred = ["RESOLVE_LANDING", "ROLL_DICE"] as const;
  const selected = preferred.find((type) => enabled.some((action) => action.type === type));
  if (selected === "RESOLVE_LANDING") return { type: selected, playerId };
  return { type: "ROLL_DICE", playerId };
}
