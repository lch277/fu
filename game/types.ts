export type PlayerId = string;
export type PlayerKind = "human" | "ai";
export type AiDifficulty = "casual" | "standard" | "smart";
export type GameMode = "quick" | "standard";
export type TurnPhase =
  | "turn-start"
  | "action"
  | "moving"
  | "resolving"
  | "turn-end"
  | "game-over";

export type CharacterId = "sun-xiaomei" | "a-tubo" | "qian-furen" | "jin-beibei";

export interface PlayerSetup {
  id: PlayerId;
  name: string;
  character: CharacterId;
  kind: PlayerKind;
  difficulty?: AiDifficulty;
  color: string;
}

export interface GameConfig {
  mode: GameMode;
  seed: number;
  players: PlayerSetup[];
  maxRounds: number;
  targetNetWorth: number;
}

export type MapNodeType =
  | "start"
  | "property"
  | "company"
  | "bank"
  | "shop"
  | "chance"
  | "news"
  | "hospital"
  | "jail"
  | "magic"
  | "lottery";

export interface MapNode {
  id: string;
  name: string;
  type: MapNodeType;
  x: number;
  y: number;
  next: string[];
  propertyId?: string;
}

export interface GameMap {
  id: string;
  name: string;
  nodes: MapNode[];
}

export interface StatusEffect {
  id: string;
  name: string;
  remainingTurns: number;
  tone: "positive" | "negative" | "neutral";
  /** 遥控骰子等需要携带数值的状态 */
  value?: number;
}

export interface GodState {
  id: string;
  name: string;
  remainingTurns: number;
  tone: "positive" | "negative";
}

export interface PlayerState extends PlayerSetup {
  cash: number;
  position: string;
  active: boolean;
  propertyIds: string[];
  cards: string[];
  tools: string[];
  stocks: Record<string, number>;
  statuses: StatusEffect[];
  god: GodState | null;
}

export interface PropertyState {
  id: string;
  name: string;
  group: string;
  price: number;
  baseToll: number;
  ownerId: PlayerId | null;
  level: number;
  maxLevel: number;
}

export interface StockState {
  id: string;
  name: string;
  price: number;
  previousPrice: number;
  limitUp: number;
  limitDown: number;
  companyPropertyId: string | null;
}

export interface StockOrder {
  playerId: PlayerId;
  stockId: string;
  quantity: number;
  side: "buy" | "sell";
}

export interface RoadHazard {
  id: string;
  nodeId: string;
  ownerId: PlayerId;
  type: "roadblock" | "mine" | "bomb";
}

export type PendingDecision =
  | { type: "purchase"; propertyId: string }
  | { type: "upgrade"; propertyId: string }
  | null;

export interface GameState {
  version: 1;
  config: GameConfig;
  seed: number;
  rngState: number;
  round: number;
  turn: number;
  currentPlayerId: PlayerId;
  turnOrder: PlayerId[];
  phase: TurnPhase;
  players: Record<PlayerId, PlayerState>;
  map: GameMap;
  properties: Record<string, PropertyState>;
  stocks: Record<string, StockState>;
  hazards: RoadHazard[];
  lastRoll: number | null;
  pending: PendingDecision;
  eventLog: GameEvent[];
  winnerIds: PlayerId[];
}

export type GameCommand =
  | { type: "ROLL_DICE"; playerId: PlayerId }
  | { type: "RESOLVE_LANDING"; playerId: PlayerId }
  | { type: "BUY_PROPERTY"; playerId: PlayerId; propertyId: string }
  | { type: "SKIP_PURCHASE"; playerId: PlayerId }
  | { type: "UPGRADE_PROPERTY"; playerId: PlayerId; propertyId: string }
  | { type: "END_TURN"; playerId: PlayerId }
  | { type: "USE_EFFECT"; playerId: PlayerId; effectId: string; targetId: string }
  | { type: "BUY_STOCK"; playerId: PlayerId; stockId: string; quantity: number }
  | { type: "SELL_STOCK"; playerId: PlayerId; stockId: string; quantity: number };

export interface GameEvent {
  id: string;
  type: string;
  message: string;
  playerId?: PlayerId;
  amount?: number;
  round?: number;
  data?: Record<string, string | number | boolean | null>;
}

export interface CommandError {
  code: string;
  message: string;
}

export interface CommandResult {
  state: GameState;
  events: GameEvent[];
  error?: CommandError;
}

export interface LegalAction {
  type: GameCommand["type"];
  label: string;
  enabled: boolean;
  reason?: string;
}

export type TargetRef =
  | { type: "player"; id: PlayerId }
  | { type: "property"; id: string }
  | { type: "road"; id: string }
  | { type: "stock"; id: string };

export interface EffectRequest {
  playerId: PlayerId;
  effectId: string;
  target: TargetRef;
  /** 遥控骰子等需要携带数值的效果 */
  value?: number;
}

export interface ContentDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface SeededRng {
  readonly state: number;
  nextFloat(): number;
  integer(min: number, max: number): number;
  die(): number;
}
