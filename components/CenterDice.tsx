"use client";

import { useEffect, useRef } from "react";
import { getLegalActions } from "@/game/selectors";
import type { GameCommand, GameState } from "@/game/types";

/**
 * 六面在立方体上的方位（法向量朝外）:
 * 1=前(+Z) 2=右(+X) 3=后(-Z) 4=左(-X) 5=上(+Y) 6=下(-Y)，对面和为 7。
 * 要让某面最终朝向观众,容器需旋转的角度:
 *   1: 不动; 2: Y-90; 3: Y-180; 4: Y+90; 5: X-90; 6: X+90
 */
const FACE_ROTATION: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: 0, y: -180 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 90, y: 0 },
};

/** 3x3 点阵中每个点位的序号(0-8),与骰子各面点数的标准布局对应 */
const PIP_POSITIONS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const FACES = [1, 2, 3, 4, 5, 6];

interface CenterDiceProps {
  state: GameState;
  interactionLocked?: boolean;
  onCommand(command: GameCommand): void;
}

export function CenterDice({ state, interactionLocked = false, onCommand }: CenterDiceProps) {
  const playerId = state.currentPlayerId;
  const player = state.players[playerId];
  const cubeRef = useRef<HTMLSpanElement>(null);
  const cumulative = useRef({ x: 0, y: 0 });
  /** 正在播放的动画,新回合清空点数时取消它 */
  const activeAnimation = useRef<Animation | null>(null);
  /** 已处理过的点数:undefined 表示组件刚挂载(跳过初始重放) */
  const handledRoll = useRef<number | null | undefined>(undefined);

  const rollAction = getLegalActions(state, playerId).find((action) => action.type === "ROLL_DICE");
  const enabled = state.phase === "action" && player.kind === "human" && !interactionLocked;
  const rolled = state.lastRoll != null;
  const bigRoll = rolled && state.lastRoll! > 6;

  const setPose = (x: number, y: number) => {
    cumulative.current = { x, y };
    const cube = cubeRef.current;
    if (cube) cube.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
  };

  useEffect(() => {
    const roll = state.lastRoll;
    const cube = cubeRef.current;
    if (handledRoll.current === undefined) {
      // 首次挂载(含恢复存档):直接摆到正确姿态,不重放动画
      handledRoll.current = roll;
      if (roll != null && roll <= 6) {
        const base = FACE_ROTATION[roll];
        setPose(base.x, base.y);
      }
      return;
    }
    if (roll === handledRoll.current) return; // 同一次掷骰重复渲染
    handledRoll.current = roll;

    if (roll == null) {
      // 新回合:取消未播完的动画并回到待掷姿态
      activeAnimation.current?.cancel();
      activeAnimation.current = null;
      setPose(0, 0);
      return;
    }

    // 目标面:单骰 1-6 停在对应面;多骰道具总和 >6 时所有面显示总和数字,姿态随意
    const base = roll <= 6 ? FACE_ROTATION[roll] : { x: 0, y: 0 };
    const prev = cumulative.current;
    const turns = 2 + Math.floor(Math.random() * 2); // 2~3 圈
    const endY = base.y + prev.y + turns * 360;
    let endX = base.x;
    const diffX = base.x - prev.x;
    if (diffX > 180) endX -= 360;
    else if (diffX < -180) endX += 360;
    const end = { x: endX, y: endY };

    if (!cube) return;
    const reduceMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof cube.animate !== "function") {
      setPose(end.x, end.y);
      return;
    }

    // 中途乱滚一帧,做出真实翻滚感;结束时显式落到最终姿态,确保点数精确对上
    const tumble = {
      x: prev.x + (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360),
      y: prev.y + (Math.random() < 0.5 ? -1 : 1) * (540 + Math.random() * 540),
    };
    const animation = cube.animate(
      [
        { transform: `rotateX(${prev.x}deg) rotateY(${prev.y}deg)` },
        { transform: `rotateX(${tumble.x}deg) rotateY(${tumble.y}deg)`, offset: 0.62 },
        { transform: `rotateX(${end.x}deg) rotateY(${end.y}deg)` },
      ],
      { duration: 980, easing: "cubic-bezier(.25,.8,.3,1)" },
    );
    activeAnimation.current = animation;
    animation.onfinish = () => {
      activeAnimation.current = null;
      cumulative.current = end;
      cube.style.transform = `rotateX(${end.x}deg) rotateY(${end.y}deg)`;
    };
  }, [state.lastRoll]);

  const title = interactionLocked ? "棋子移动动画进行中" : player.kind !== "human" ? "AI 正在思考" : !rollAction?.enabled ? rollAction?.reason : "点击掷骰";

  return (
    <button
      type="button"
      className="center-dice"
      aria-label="掷骰"
      data-rolled={rolled ? "true" : "false"}
      disabled={!enabled}
      title={title}
      onClick={() => onCommand({ type: "ROLL_DICE", playerId })}
    >
      <span className="die-scene">
        <span className="die-tilt">
          <span className="die-cube" ref={cubeRef}>
          {FACES.map((face) => (
            <span key={face} className={`die-face die-face-${face}`}>
              {bigRoll ? (
                <span className="die-num">{state.lastRoll}</span>
              ) : (
                <span className="die-pips">
                  {Array.from({ length: 9 }, (_, index) => (
                    <i key={index} className={PIP_POSITIONS[face].includes(index) ? "on" : ""} />
                  ))}
                </span>
              )}
            </span>
          ))}
        </span>
        </span>
        <span className="die-shadow" aria-hidden="true" />
      </span>
      {enabled && !rolled && <span className="die-hint">点击掷骰</span>}
    </button>
  );
}
