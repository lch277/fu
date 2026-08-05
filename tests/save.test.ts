import { beforeEach, describe, expect, it } from "vitest";
import { createInitialState } from "@/game/reducer";
import { loadGame, parseSave, saveGame, serializeSave } from "@/game/save";
import type { GameConfig } from "@/game/types";

const config: GameConfig = {
  mode: "standard",
  seed: 9_901,
  maxRounds: 120,
  targetNetWorth: 180_000,
  players: [
    { id: "p1", name: "孙小美", character: "sun-xiaomei", kind: "human", color: "#f05278" },
    { id: "p2", name: "金贝贝", character: "jin-beibei", kind: "ai", difficulty: "casual", color: "#4bb9b2" },
  ],
};

describe("本地存档", () => {
  beforeEach(() => localStorage.clear());

  it("序列化往返保持完整规则状态与随机种子", () => {
    const state = createInitialState(config);
    const parsed = parseSave(serializeSave(state));

    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.state).toEqual(state);
  });

  it("损坏存档返回中文错误且不抛出异常", () => {
    expect(parseSave("{broken")).toEqual({ ok: false, message: "存档内容已损坏" });
  });

  it("拒绝缺少关键字段的伪造存档", () => {
    expect(parseSave(JSON.stringify({ schemaVersion: 1, state: { version: 1 } }))).toEqual({
      ok: false,
      message: "存档结构不完整",
    });
  });

  it("拒绝当前玩家不存在或地图节点损坏的深层伪造存档", () => {
    const state = createInitialState(config);
    const currentMissing = { ...state, players: { p2: state.players.p2 } };
    const brokenMap = { ...state, map: { ...state.map, nodes: [{ id: "start" }] } };

    expect(parseSave(JSON.stringify({ schemaVersion: 1, savedAt: new Date().toISOString(), state: currentMissing })).ok).toBe(false);
    expect(parseSave(JSON.stringify({ schemaVersion: 1, savedAt: new Date().toISOString(), state: brokenMap })).ok).toBe(false);
  });

  it("拒绝缺少事件、障碍、待处理状态或非法阶段的存档", () => {
    const state = createInitialState(config);
    const variants = [
      { ...state, eventLog: undefined },
      { ...state, hazards: undefined },
      { ...state, pending: undefined },
      { ...state, phase: "teleporting" },
      { ...state, round: 0 },
      { ...state, turn: Number.NaN },
    ];

    for (const invalid of variants) {
      expect(parseSave(JSON.stringify({ schemaVersion: 1, savedAt: new Date().toISOString(), state: invalid })).ok).toBe(false);
    }
  });

  it("自动槽和手动槽可以分别保存并读取", () => {
    const state = createInitialState(config);
    saveGame("auto", state);
    saveGame("slot-1", { ...state, round: 8 });

    expect(loadGame("auto")).toEqual({ ok: true, state });
    expect(loadGame("slot-1")).toEqual({ ok: true, state: { ...state, round: 8 } });
    expect(loadGame("slot-2")).toEqual({ ok: false, message: "这个存档槽为空" });
  });
});
