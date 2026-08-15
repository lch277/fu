import type { GameEvent, GameState } from "@/game/types";

/** 弹窗已展示的询问事件,不进快讯 */
const QUESTION_TYPES = new Set(["PROPERTY_OFFERED", "UPGRADE_OFFERED"]);
/** 无玩家归属的公共事件,独立成段 */
const PUBLIC_TYPES = new Set(["STOCK_CHANGED", "GAME_OVER"]);

interface FeedPart {
  step: boolean;
  text: string;
}

interface FeedSegment {
  key: string;
  playerId?: string;
  playerName?: string;
  color?: string;
  round?: number;
  parts: FeedPart[];
}

function stripPlayer(msg: string, name: string): string {
  return msg.startsWith(name) ? msg.slice(name.length) : msg;
}

function buildSegments(
  events: GameEvent[],
  players: GameState["players"],
  turnOrder: string[],
): FeedSegment[] {
  const segments: FeedSegment[] = [];
  // 旧事件没有 round 字段:用 id 里的全局回合号近似重建轮次(每轮约等于玩家人数个回合)
  let currentRound = 1;
  for (const event of events) {
    if (event.type === "TURN_STARTED") {
      const player = event.playerId ? players[event.playerId] : undefined;
      if (event.round != null) {
        currentRound = event.round;
      } else if (turnOrder.length > 0) {
        const turnId = Number.parseInt(event.id.split("-")[0], 10);
        if (Number.isFinite(turnId)) {
          const approx = Math.ceil(turnId / turnOrder.length);
          if (approx > currentRound) currentRound = approx;
        }
      }
      segments.push({
        key: event.id,
        playerId: event.playerId ?? "",
        playerName: player?.name ?? "未知玩家",
        color: player?.color ?? "#64748b",
        round: currentRound,
        parts: [],
      });
      continue;
    }
    if (QUESTION_TYPES.has(event.type)) continue;
    if (PUBLIC_TYPES.has(event.type)) {
      // 同轮市场更新(多条股票)合并成一条公共消息
      const last = segments[segments.length - 1];
      if (last && !last.playerId) {
        last.parts.push({ step: false, text: event.message });
      } else {
        segments.push({
          key: event.id,
          playerName: "股票",
          color: "#b0831f",
          round: currentRound,
          parts: [{ step: false, text: event.message }],
        });
      }
      continue;
    }
    const current = [...segments].reverse().find((segment) => segment.playerId);
    if (!current) continue;
    const text = stripPlayer(event.message, current.playerName ?? "");
    if (event.type === "PLAYER_STEPPED") {
      // 一轮只走一次:多条“前进到”只保留最终落点
      const idx = current.parts.findIndex((part) => part.step);
      const part = { step: true, text };
      if (idx >= 0) current.parts[idx] = part;
      else current.parts.push(part);
    } else {
      current.parts.push({ step: false, text });
    }
  }
  return segments;
}

export function EventFeed({
  events,
  players,
  turnOrder,
}: {
  events: GameEvent[];
  players: GameState["players"];
  turnOrder: string[];
}) {
  const segments = buildSegments(events, players, turnOrder).map((segment) => {
    // 回合刚开始、还没动作的玩家(通常是等待真人掷骰)也要显示
    if (segment.parts.length === 0 && segment.playerName) {
      return { ...segment, parts: [{ step: false, text: "轮到行动" }] };
    }
    return segment;
  });
  return (
    <section className="event-feed" aria-label="事件记录">
      <div className="feed-heading"><b>城中快讯</b><span>LIVE</span></div>
      <div className="feed-list">
        {segments.length === 0 ? (
          <p className="empty-feed">第一颗骰子正等着你。</p>
        ) : (
          segments.slice().reverse().map((segment) => (
            <p key={segment.key}>
              {segment.playerName && (
                <b className="feed-who" style={{ color: segment.color }}>
                  {segment.round != null ? `第${segment.round}轮-${segment.playerName}` : segment.playerName}：
                </b>
              )}
              {segment.parts.map((part) => part.text).join("，")}。
            </p>
          ))
        )}
      </div>
    </section>
  );
}
