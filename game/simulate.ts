import { chooseAiCommand } from "./ai";
import { createInitialState, dispatchCommand } from "./reducer";
import { getNetWorth } from "./selectors";
import type { GameConfig, GameState } from "./types";

export interface SimulationOptions {
  maxCommands: number;
}

export interface SimulationResult {
  finished: boolean;
  state: GameState;
  commandCount: number;
  error?: string;
  summary: {
    winnerIds: string[];
    round: number;
    turn: number;
    netWorth: Record<string, number>;
  };
}

function summarize(state: GameState) {
  return {
    winnerIds: state.winnerIds,
    round: state.round,
    turn: state.turn,
    netWorth: Object.fromEntries(state.turnOrder.map((id) => [id, getNetWorth(state, id)])),
  };
}

function validateState(state: GameState): string | undefined {
  for (const player of Object.values(state.players)) {
    if (!Number.isFinite(player.cash) || player.cash < 0) return `${player.id} 的现金无效`;
    if (!state.map.nodes.some((node) => node.id === player.position)) return `${player.id} 的位置无效`;
  }
  for (const property of Object.values(state.properties)) {
    if (property.level < 0 || property.level > property.maxLevel) return `${property.id} 的建筑等级无效`;
    if (property.ownerId && !state.players[property.ownerId]) return `${property.id} 的所有者无效`;
  }
  return undefined;
}

export function simulateGame(config: GameConfig, options: SimulationOptions): SimulationResult {
  let state = createInitialState(config);
  let commandCount = 0;

  while (state.phase !== "game-over" && commandCount < options.maxCommands) {
    const player = state.players[state.currentPlayerId];
    try {
      const command = chooseAiCommand(state, player.id, player.difficulty ?? "standard");
      const result = dispatchCommand(state, command);
      if (result.error) {
        return { finished: false, state, commandCount, error: `${result.error.code}: ${result.error.message}`, summary: summarize(state) };
      }
      state = result.state;
      commandCount += 1;
      const invalid = validateState(state);
      if (invalid) return { finished: false, state, commandCount, error: invalid, summary: summarize(state) };
    } catch (error) {
      return {
        finished: false,
        state,
        commandCount,
        error: error instanceof Error ? error.message : "AI 决策失败",
        summary: summarize(state),
      };
    }
  }

  return {
    finished: state.phase === "game-over",
    state,
    commandCount,
    error: state.phase === "game-over" ? undefined : `超过 ${options.maxCommands} 条指令仍未结束`,
    summary: summarize(state),
  };
}
