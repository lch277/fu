import type { GameState } from "./types";

export type SaveSlot = "auto" | "slot-1" | "slot-2" | "slot-3";
export type SaveParseResult =
  | { ok: true; state: GameState }
  | { ok: false; message: string };

const schemaVersion = 1;
const keyPrefix = "richman-web:v1:";

interface SaveEnvelope {
  schemaVersion: number;
  savedAt: string;
  state: GameState;
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<GameState>;
  return (
    state.version === 1 &&
    typeof state.currentPlayerId === "string" &&
    typeof state.phase === "string" &&
    typeof state.players === "object" &&
    state.players !== null &&
    Array.isArray(state.turnOrder) &&
    Array.isArray(state.map?.nodes) &&
    typeof state.properties === "object" &&
    typeof state.stocks === "object" &&
    typeof state.rngState === "number"
  );
}

export function serializeSave(state: GameState): string {
  const envelope: SaveEnvelope = {
    schemaVersion,
    savedAt: new Date().toISOString(),
    state,
  };
  return JSON.stringify(envelope);
}

export function parseSave(raw: string): SaveParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "存档内容已损坏" };
  }

  if (!parsed || typeof parsed !== "object") return { ok: false, message: "存档结构不完整" };
  const envelope = parsed as Partial<SaveEnvelope>;
  if (envelope.schemaVersion !== schemaVersion) {
    return { ok: false, message: "存档版本不受支持" };
  }
  if (!isGameState(envelope.state)) return { ok: false, message: "存档结构不完整" };
  return { ok: true, state: envelope.state };
}

export function saveGame(slot: SaveSlot, state: GameState): void {
  localStorage.setItem(`${keyPrefix}${slot}`, serializeSave(state));
}

export function loadGame(slot: SaveSlot): SaveParseResult {
  const raw = localStorage.getItem(`${keyPrefix}${slot}`);
  return raw ? parseSave(raw) : { ok: false, message: "这个存档槽为空" };
}

export function deleteSave(slot: SaveSlot): void {
  localStorage.removeItem(`${keyPrefix}${slot}`);
}
