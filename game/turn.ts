import { createRng } from "./rng";
import { tickStatuses } from "./effects";
import { advanceMarket } from "./stocks";
import type { CommandResult, GameEvent, GameState, PlayerId } from "./types";

function event(state: GameState, type: string, message: string, index: number, amount?: number): GameEvent {
  return { id: `${state.turn}-${type}-${index}`, type, message, playerId: state.currentPlayerId, amount };
}

export function rollAndMove(state: GameState, playerId: PlayerId): CommandResult {
  if (state.phase !== "action") {
    return {
      state,
      events: [],
      error: { code: "INVALID_PHASE", message: "当前阶段不能掷骰" },
    };
  }

  const rng = createRng(state.rngState);
  const roll = rng.die();
  const nodeById = new Map(state.map.nodes.map((node) => [node.id, node]));
  let position = state.players[playerId].position;
  const events: GameEvent[] = [event(state, "DICE_ROLLED", `掷出了 ${roll} 点`, 0, roll)];

  for (let step = 0; step < roll; step += 1) {
    const node = nodeById.get(position);
    position = node?.next[0] ?? state.map.nodes[0].id;
    events.push({
      ...event(state, "PLAYER_STEPPED", `前进到${nodeById.get(position)?.name ?? "下一站"}`, step + 1),
      data: { nodeId: position, step: step + 1 },
    });
  }

  return {
    state: {
      ...state,
      rngState: rng.state,
      lastRoll: roll,
      phase: "resolving",
      players: {
        ...state.players,
        [playerId]: { ...state.players[playerId], position },
      },
      eventLog: [...state.eventLog, ...events],
    },
    events,
  };
}

export function endTurn(state: GameState): CommandResult {
  if (state.phase !== "turn-end") {
    return { state, events: [], error: { code: "INVALID_PHASE", message: "当前回合还没有结算完成" } };
  }

  const activeOrder = state.turnOrder.filter((id) => state.players[id].active);
  if (activeOrder.length <= 1) {
    const winnerIds = activeOrder;
    const finished = event(state, "GAME_OVER", winnerIds.length ? `${state.players[winnerIds[0]].name}获得胜利` : "本局结束", 0);
    return {
      state: { ...state, phase: "game-over", winnerIds, eventLog: [...state.eventLog, finished] },
      events: [finished],
    };
  }

  const currentIndex = activeOrder.indexOf(state.currentPlayerId);
  const nextIndex = (currentIndex + 1) % activeOrder.length;
  const nextId = activeOrder[nextIndex];
  const wrapped = nextIndex === 0;
  const nextRound = state.round + (wrapped ? 1 : 0);

  if (nextRound > state.config.maxRounds) {
    const ranked = activeOrder
      .map((id) => ({ id, worth: state.players[id].cash + state.players[id].propertyIds.reduce((sum, propertyId) => sum + state.properties[propertyId].price, 0) }))
      .sort((a, b) => b.worth - a.worth);
    const winners = ranked.filter((entry) => entry.worth === ranked[0].worth).map((entry) => entry.id);
    const finished = event(state, "GAME_OVER", "达到回合上限，按净资产结算", 0);
    return {
      state: { ...state, phase: "game-over", winnerIds: winners, eventLog: [...state.eventLog, finished] },
      events: [finished],
    };
  }

  const started: GameEvent = {
    id: `${state.turn + 1}-TURN_STARTED-0`,
    type: "TURN_STARTED",
    message: `轮到${state.players[nextId].name}行动`,
    playerId: nextId,
  };

  const nextState: GameState = {
      ...state,
      round: nextRound,
      turn: state.turn + 1,
      currentPlayerId: nextId,
      phase: "action",
      lastRoll: null,
      pending: null,
      eventLog: [...state.eventLog, started],
  };
  const statusResult = tickStatuses(nextState, nextId);
  if (!wrapped) return { state: statusResult.state, events: [started, ...statusResult.events] };

  const marketResult = advanceMarket(statusResult.state);
  return { state: marketResult.state, events: [started, ...statusResult.events, ...marketResult.events] };
}
