import type { GameEvent } from "./types";

export type SoundCue = "dice" | "step" | "coin" | "alert" | "fanfare";

const cueByType: Record<string, SoundCue> = {
  DICE_ROLLED: "dice",
  PLAYER_STEPPED: "step",
  PROPERTY_BOUGHT: "coin",
  PROPERTY_UPGRADED: "coin",
  STOCK_BOUGHT: "coin",
  STOCK_SOLD: "coin",
  TOLL_PAID: "alert",
  PLAYER_BANKRUPT: "alert",
  GAME_OVER: "fanfare",
};

export function getSoundCue(events: GameEvent[]): SoundCue | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const cue = cueByType[events[index].type];
    if (cue) return cue;
  }
  return null;
}

let context: AudioContext | null = null;

export function playEventSound(events: GameEvent[], enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  const cue = getSoundCue(events);
  if (!cue) return;
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  context ??= new AudioContextClass();
  const now = context.currentTime;
  const patterns: Record<SoundCue, number[]> = {
    dice: [180, 245, 205],
    step: [330],
    coin: [520, 760],
    alert: [240, 180],
    fanfare: [392, 523, 659, 784],
  };
  patterns[cue].forEach((frequency, index) => {
    const oscillator = context!.createOscillator();
    const gain = context!.createGain();
    const start = now + index * 0.075;
    oscillator.type = cue === "alert" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(cue === "step" ? 0.035 : 0.07, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
    oscillator.connect(gain).connect(context!.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.12);
  });
}
