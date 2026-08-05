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
  const finite = (entry: unknown): entry is number => typeof entry === "number" && Number.isFinite(entry);
  const nonNegativeInteger = (entry: unknown): entry is number => Number.isInteger(entry) && (entry as number) >= 0;
  const phases = new Set(["turn-start", "action", "moving", "resolving", "turn-end", "game-over"]);
  const nodeTypes = new Set(["start", "property", "company", "bank", "shop", "chance", "news", "hospital", "jail", "magic", "lottery"]);
  if (!(
    state.version === 1 &&
    typeof state.currentPlayerId === "string" &&
    typeof state.phase === "string" && phases.has(state.phase) &&
    typeof state.players === "object" &&
    state.players !== null &&
    Array.isArray(state.turnOrder) &&
    Array.isArray(state.map?.nodes) &&
    typeof state.properties === "object" &&
    typeof state.stocks === "object" &&
    finite(state.seed) && finite(state.rngState) &&
    Number.isInteger(state.round) && state.round! >= 1 &&
    Number.isInteger(state.turn) && state.turn! >= 1 &&
    (state.lastRoll === null || (Number.isInteger(state.lastRoll) && state.lastRoll! >= 1 && state.lastRoll! <= 18)) &&
    Array.isArray(state.eventLog) && Array.isArray(state.hazards) && Array.isArray(state.winnerIds) &&
    Object.prototype.hasOwnProperty.call(state, "pending")
  )) return false;

  if (!record(state.players) || !record(state.properties) || !record(state.stocks) || !state.turnOrder?.length) return false;
  if (!state.turnOrder.includes(state.currentPlayerId) || !state.turnOrder.every((id) => record(state.players![id]))) return false;
  if (!state.config || !Array.isArray(state.config.players) || state.config.players.length !== state.turnOrder.length || !["quick", "standard"].includes(state.config.mode) || !finite(state.config.seed) || !Number.isInteger(state.config.maxRounds) || state.config.maxRounds < 1 || !finite(state.config.targetNetWorth) || state.config.targetNetWorth <= 0) return false;
  if (!state.map || typeof state.map.id !== "string" || typeof state.map.name !== "string" || !Array.isArray(state.map.nodes) || state.map.nodes.length < 2) return false;

  const nodeIds = new Set<string>();
  for (const node of state.map.nodes) {
    if (!node || typeof node.id !== "string" || typeof node.name !== "string" || typeof node.type !== "string" || !nodeTypes.has(node.type) || !finite(node.x) || !finite(node.y) || !Array.isArray(node.next)) return false;
    nodeIds.add(node.id);
  }
  if (!state.map.nodes.every((node) => node.next.length > 0 && node.next.every((id) => nodeIds.has(id)))) return false;

  for (const id of state.turnOrder) {
    const player = state.players[id] as GameState["players"][string];
    if (player.id !== id || typeof player.name !== "string" || typeof player.cash !== "number" || !Number.isFinite(player.cash) || typeof player.active !== "boolean" || !nodeIds.has(player.position)) return false;
    if (!Array.isArray(player.propertyIds) || !Array.isArray(player.cards) || !Array.isArray(player.tools) || !Array.isArray(player.statuses) || !record(player.stocks)) return false;
    if (!player.propertyIds.every((propertyId) => typeof propertyId === "string" && state.properties![propertyId]?.ownerId === id) || !player.cards.every((card) => typeof card === "string") || !player.tools.every((tool) => typeof tool === "string")) return false;
    if (!Object.values(player.stocks).every((quantity) => nonNegativeInteger(quantity))) return false;
    if (!player.statuses.every((status) => status && typeof status.id === "string" && typeof status.name === "string" && nonNegativeInteger(status.remainingTurns) && ["positive", "negative", "neutral"].includes(status.tone))) return false;
    if (player.god !== null && (!record(player.god) || typeof player.god.id !== "string" || typeof player.god.name !== "string" || !nonNegativeInteger(player.god.remainingTurns) || !["positive", "negative"].includes(player.god.tone))) return false;
  }

  for (const [id, property] of Object.entries(state.properties)) {
    if (!record(property) || property.id !== id || typeof property.name !== "string" || typeof property.group !== "string" || !finite(property.price) || !finite(property.baseToll) || !nonNegativeInteger(property.level) || !nonNegativeInteger(property.maxLevel) || property.level > property.maxLevel) return false;
    if (property.ownerId !== null && (typeof property.ownerId !== "string" || !state.players[property.ownerId])) return false;
  }
  for (const [id, stock] of Object.entries(state.stocks)) {
    if (!record(stock) || stock.id !== id || typeof stock.name !== "string" || !finite(stock.price) || !finite(stock.previousPrice) || !finite(stock.limitUp) || !finite(stock.limitDown) || stock.companyPropertyId !== null && typeof stock.companyPropertyId !== "string") return false;
  }

  for (const propertyId of Object.keys(state.properties)) {
    const ownerId = state.properties[propertyId].ownerId;
    if (ownerId && !state.players[ownerId].propertyIds.includes(propertyId)) return false;
  }
  if (!state.hazards.every((hazard) => hazard && typeof hazard.id === "string" && nodeIds.has(hazard.nodeId) && Boolean(state.players[hazard.ownerId]) && ["roadblock", "mine", "bomb"].includes(hazard.type))) return false;
  if (!state.eventLog.every((entry) => record(entry) && typeof entry.id === "string" && typeof entry.type === "string" && typeof entry.message === "string")) return false;
  if (!state.winnerIds.every((id) => typeof id === "string" && Boolean(state.players[id]))) return false;
  if (state.pending !== null) {
    if (!record(state.pending) || !["purchase", "upgrade"].includes(String(state.pending.type)) || typeof state.pending.propertyId !== "string" || !state.properties[state.pending.propertyId]) return false;
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
