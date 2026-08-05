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
  const record = (entry: unknown): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry);
  if (!(
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
  )) return false;

  if (!record(state.players) || !record(state.properties) || !record(state.stocks) || !state.turnOrder?.length) return false;
  if (!state.turnOrder.includes(state.currentPlayerId) || !state.turnOrder.every((id) => record(state.players![id]))) return false;
  if (!state.config || !Array.isArray(state.config.players) || state.config.players.length !== state.turnOrder.length) return false;
  if (!state.map || !Array.isArray(state.map.nodes) || state.map.nodes.length < 2) return false;

  const nodeIds = new Set<string>();
  for (const node of state.map.nodes) {
    if (!node || typeof node.id !== "string" || typeof node.name !== "string" || typeof node.type !== "string" || typeof node.x !== "number" || typeof node.y !== "number" || !Array.isArray(node.next)) return false;
    nodeIds.add(node.id);
  }
  if (!state.map.nodes.every((node) => node.next.length > 0 && node.next.every((id) => nodeIds.has(id)))) return false;

  for (const id of state.turnOrder) {
    const player = state.players[id] as GameState["players"][string];
    if (player.id !== id || typeof player.name !== "string" || typeof player.cash !== "number" || !Number.isFinite(player.cash) || typeof player.active !== "boolean" || !nodeIds.has(player.position)) return false;
    if (!Array.isArray(player.propertyIds) || !Array.isArray(player.cards) || !Array.isArray(player.tools) || !Array.isArray(player.statuses) || !record(player.stocks)) return false;
  }

  for (const [id, property] of Object.entries(state.properties)) {
    if (!record(property) || property.id !== id || typeof property.price !== "number" || typeof property.level !== "number" || typeof property.maxLevel !== "number") return false;
    if (property.ownerId !== null && (typeof property.ownerId !== "string" || !state.players[property.ownerId])) return false;
  }
  for (const [id, stock] of Object.entries(state.stocks)) {
    if (!record(stock) || stock.id !== id || typeof stock.price !== "number" || typeof stock.previousPrice !== "number") return false;
  }
  return true;
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
