import { createRng } from "./rng";
import { tickStatuses } from "./effects";
import { advanceMarket } from "./stocks";
import { getNetWorth } from "./selectors";
import type { CommandResult, GameEvent, GameState, PlayerId } from "./types";

function event(state: GameState, type: string, message: string, index: number, amount?: number): GameEvent {
  return { id: `${state.turn}-${type}-${index}`, type, message, playerId: state.currentPlayerId, amount };
}

function finishTargetVictory(state: GameState): CommandResult | null {
  const activeOrder = state.turnOrder.filter((id) => state.players[id].active);
  const reached = activeOrder.filter((id) => getNetWorth(state, id) >= state.config.targetNetWorth);
  if (!reached.length) return null;
  const best = Math.max(...reached.map((id) => getNetWorth(state, id)));
  const winnerIds = reached.filter((id) => getNetWorth(state, id) === best);
  const finished = event(state, "TARGET_REACHED", `${state.players[winnerIds[0]].name}达到目标资产`, 0);
  return { state: { ...state, phase: "game-over", winnerIds, eventLog: [...state.eventLog, finished] }, events: [finished] };
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
  const player = state.players[playerId];
  const hasStatus = (id: string) => player.statuses.some((status) => status.id === id);
  const diceCount = hasStatus("car") ? 3 : hasStatus("motorbike") ? 2 : 1;
  const remoteDie = player.statuses.find((status) => status.id === "remote-die");
  const rolls = Array.from({ length: diceCount }, (_, index) => remoteDie && index === 0 ? (remoteDie.value ?? 6) : rng.die());
  const roll = rolls.reduce((sum, value) => sum + value, 0);
  const nodeById = new Map(state.map.nodes.map((node) => [node.id, node]));
  let position = player.position;
  let cash = player.cash;
  let hazards = state.hazards;
  let statuses = player.statuses.filter((status) => !["car", "motorbike", "remote-die", "reversed"].includes(status.id));
  let bomb = statuses.find((status) => status.id === "bomb");
  let hazardTriggered = false;
  let hazardType: "roadblock" | "mine" | "bomb" | null = null;
  const reversed = hasStatus("reversed");
  const events: GameEvent[] = [event(state, "DICE_ROLLED", diceCount > 1 ? `${diceCount} 颗骰子共 ${roll} 点` : `掷出了 ${roll} 点`, 0, roll)];

  for (let step = 0; step < roll; step += 1) {
    const currentIndex = state.map.nodes.findIndex((node) => node.id === position);
    const nextIndex = (currentIndex + (reversed ? -1 : 1) + state.map.nodes.length) % state.map.nodes.length;
    position = state.map.nodes[nextIndex]?.id ?? state.map.nodes[0].id;
    if (position === state.map.nodes[0].id) {
      cash += 2_000;
      events.push(event(state, "START_BONUS", "经过出发站，获得 ¥2,000", events.length, 2_000));
    }
    events.push({
      ...event(state, "PLAYER_STEPPED", `${reversed ? "后退" : "前进"}到${nodeById.get(position)?.name ?? "下一站"}`, events.length),
      data: { nodeId: position, step: step + 1 },
    });
    if (bomb) {
      bomb = { ...bomb, remainingTurns: bomb.remainingTurns - 1 };
      statuses = statuses.map((status) => status.id === "bomb" ? bomb! : status);
      if (bomb.remainingTurns <= 0) {
        statuses = [
          ...statuses.filter((status) => status.id !== "bomb" && status.id !== "hospitalized"),
          { id: "hospitalized", name: "住院", remainingTurns: 3, tone: "negative" },
        ];
        events.push(event(state, "BOMB_EXPLODED", `${player.name}携带的定时炸弹爆炸，需要住院三回合`, events.length));
        hazardTriggered = true;
        break;
      }
    }
    const hazard = hazards.find((item) => item.nodeId === position && item.ownerId !== playerId);
    if (hazard) {
      hazards = hazards.filter((item) => item.id !== hazard.id);
      hazardType = hazard.type;
      if (hazard.type === "mine" || hazard.type === "bomb") {
        const turns = hazard.type === "bomb" ? 3 : 2;
        statuses = [...statuses.filter((status) => status.id !== "hospitalized"), { id: "hospitalized", name: "住院", remainingTurns: turns, tone: "negative" }];
      }
      events.push(event(state, "HAZARD_TRIGGERED", `${player.name}触发${hazard.type === "roadblock" ? "路障" : hazard.type === "mine" ? "地雷" : "定时炸弹"}并停止移动`, events.length));
      hazardTriggered = true;
      break;
    }
  }

  return {
    state: {
      ...state,
      rngState: rng.state,
      lastRoll: roll,
      // 路障只是停止移动,仍需正常结算落点(过路费/购买/事件);地雷与炸弹住院则直接结束回合
      phase: hazardTriggered && hazardType !== "roadblock" ? "turn-end" : "resolving",
      hazards,
      players: {
        ...state.players,
        [playerId]: { ...player, position, cash, statuses },
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
  const targetVictory = finishTargetVictory(state);
  if (targetVictory) return targetVictory;
  if (activeOrder.length <= 1) {
    const winnerIds = activeOrder;
    const finished = event(state, "GAME_OVER", winnerIds.length ? `${state.players[winnerIds[0]].name}获得胜利` : "本局结束", 0);
    return {
      state: { ...state, phase: "game-over", winnerIds, eventLog: [...state.eventLog, finished] },
      events: [finished],
    };
  }

  const currentIndex = state.turnOrder.indexOf(state.currentPlayerId);
  let nextIndex = currentIndex;
  for (let offset = 1; offset <= state.turnOrder.length; offset += 1) {
    const candidate = (currentIndex + offset) % state.turnOrder.length;
    if (state.players[state.turnOrder[candidate]].active) {
      nextIndex = candidate;
      break;
    }
  }
  const nextId = state.turnOrder[nextIndex];
  const wrapped = nextIndex <= currentIndex;
  const nextRound = state.round + (wrapped ? 1 : 0);

  if (nextRound > state.config.maxRounds) {
    const ranked = activeOrder
      .map((id) => ({ id, worth: getNetWorth(state, id) }))
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
    round: nextRound,
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
  const marketResult = wrapped ? advanceMarket(statusResult.state) : { state: statusResult.state, events: [] };
  const nextTargetVictory = finishTargetVictory(marketResult.state);
  if (nextTargetVictory) {
    return {
      state: nextTargetVictory.state,
      events: [started, ...statusResult.events, ...marketResult.events, ...nextTargetVictory.events],
    };
  }
  const blocker = nextState.players[nextId].statuses.find((status) => ["stopped", "jailed", "hospitalized"].includes(status.id));
  const events = [started, ...statusResult.events, ...marketResult.events];
  if (!blocker) return { state: marketResult.state, events };

  const skipped: GameEvent = { id: `${state.turn + 1}-TURN_SKIPPED-0`, type: "TURN_SKIPPED", message: `${state.players[nextId].name}因${blocker.name}跳过行动`, playerId: nextId };
  const skippedState: GameState = { ...marketResult.state, phase: "turn-end", eventLog: [...marketResult.state.eventLog, skipped] };
  const following = endTurn(skippedState);
  return { state: following.state, events: [...events, skipped, ...following.events] };
}
