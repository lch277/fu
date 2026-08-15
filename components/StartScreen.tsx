"use client";

import { useState } from "react";
import type { CharacterId, GameConfig, PlayerKind, PlayerSetup } from "@/game/types";

const characters: Array<{ id: CharacterId; name: string; mark: string; color: string; caption: string }> = [
  { id: "sun-xiaomei", name: "孙小美", mark: "美", color: "#f05278", caption: "好运常伴" },
  { id: "a-tubo", name: "阿土伯", mark: "土", color: "#f3b83f", caption: "稳中求胜" },
  { id: "qian-furen", name: "钱夫人", mark: "钱", color: "#8f6bd8", caption: "投资高手" },
  { id: "jin-beibei", name: "金贝贝", mark: "贝", color: "#35b9b0", caption: "福气满满" },
];

interface StartScreenProps {
  onStart(config: GameConfig): void;
  canContinue: boolean;
  onContinue(): void;
}

export function StartScreen({ onStart, canContinue, onContinue }: StartScreenProps) {
  const [mode, setMode] = useState<"quick" | "standard">("quick");
  const [count, setCount] = useState(2);
  const [seatKinds, setSeatKinds] = useState<PlayerKind[]>(["human", "ai", "ai", "ai"]);

  function toggleSeat(index: number) {
    setSeatKinds((current) => current.map((kind, seat) => seat === index ? (kind === "human" ? "ai" : "human") : kind));
  }

  function start() {
    const players: PlayerSetup[] = characters.slice(0, count).map((character, index) => ({
      id: `p${index + 1}`,
      name: character.name,
      character: character.id,
      color: character.color,
      kind: seatKinds[index],
      difficulty: seatKinds[index] === "human" ? undefined : index === count - 1 && count > 2 ? "smart" : "standard",
    }));
    onStart({
      mode,
      seed: Date.now() >>> 0,
      players,
      maxRounds: mode === "quick" ? 60 : 120,
      targetNetWorth: mode === "quick" ? 100_000 : 180_000,
    });
  }

  return (
    <main className="start-screen">
      <section className="start-copy">
        <div className="setup-card" aria-label="新游戏设置">
          <div className="setup-row">
            <span className="setup-label">对局节奏</span>
            <div className="segmented">
              <button className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>快速局 <small>20–30 分钟</small></button>
              <button className={mode === "standard" ? "active" : ""} onClick={() => setMode("standard")}>标准局 <small>45–60 分钟</small></button>
            </div>
          </div>
          <div className="setup-row">
            <span className="setup-label">玩家席位</span>
            <div className="segmented player-count">
              {[2, 3, 4].map((value) => (
                <button key={value} className={count === value ? "active" : ""} onClick={() => setCount(value)} aria-label={`${value === 2 ? "二" : value === 3 ? "三" : "四"}人局`}>
                  {value} 人
                </button>
              ))}
            </div>
          </div>
          <div className="roster-preview">
            {characters.slice(0, count).map((character, index) => (
              <button type="button" className="roster-chip" key={character.id} style={{ "--player-color": character.color } as React.CSSProperties} onClick={() => toggleSeat(index)} aria-label={`将${character.name}切换为${seatKinds[index] === "human" ? "AI" : "真人"}`}>
                <span className="mini-avatar">{character.mark}</span>
                <span><b>{character.name}</b><small>{seatKinds[index] === "human" ? "真人 · 本地操作" : "AI · " + character.caption}</small></span>
              </button>
            ))}
          </div>
          <div className="start-actions">
            <button className="primary-button" aria-label="开始掷骰" onClick={start}>开始掷骰 <span aria-hidden="true">➜</span></button>
            {canContinue && <button className="ghost-button" onClick={onContinue}>继续上次对局</button>}
          </div>
        </div>
      </section>
    </main>
  );
}
