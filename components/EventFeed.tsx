import type { GameEvent } from "@/game/types";

export function EventFeed({ events }: { events: GameEvent[] }) {
  return (
    <section className="event-feed" aria-label="事件记录">
      <div className="feed-heading"><b>城中快讯</b><span>LIVE</span></div>
      <div className="feed-list">
        {events.length === 0 ? <p className="empty-feed">第一颗骰子正等着你。</p> : events.slice(-5).reverse().map((event) => (
          <p key={event.id}><span className={`event-dot event-${event.type.toLowerCase()}`} />{event.message}</p>
        ))}
      </div>
    </section>
  );
}
