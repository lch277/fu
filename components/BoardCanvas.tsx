"use client";

import { useEffect, useRef } from "react";
import { buildAnimationPlan, createBoardGeometry } from "@/render/boardGeometry";
import type { GameEvent, GameState } from "@/game/types";

interface BoardCanvasProps {
  state: GameState;
  events: GameEvent[];
}

const colors = [0x73d5dc, 0x8bd38d, 0xffc95b, 0xf16482, 0x7868c9];

export function BoardCanvas({ state, events }: BoardCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const eventsRef = useRef(events);
  const seenEventRef = useRef<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || navigator.userAgent.includes("jsdom")) return;
    let disposed = false;
    let observer: ResizeObserver | null = null;
    let cancelPulse: (() => void) | null = null;

    void import("pixi.js").then(async ({ Application, Container, Graphics }) => {
      if (disposed) return;
      const app = new Application();
      await app.init({ resizeTo: host, antialias: true, backgroundAlpha: 0, resolution: Math.min(window.devicePixelRatio, 2) });
      if (disposed) {
        app.destroy(true);
        return;
      }
      app.canvas.setAttribute("aria-hidden", "true");
      host.appendChild(app.canvas);

      const redraw = () => {
        const width = app.renderer.width / app.renderer.resolution;
        const height = app.renderer.height / app.renderer.resolution;
        if (!width || !height) return;
        app.stage.removeChildren().forEach((child) => child.destroy({ children: true }));
        const layer = new Container();
        app.stage.addChild(layer);
        const geometry = createBoardGeometry(stateRef.current.map);

        const island = new Graphics()
          .roundRect(width * 0.19, height * 0.17, width * 0.62, height * 0.59, Math.min(width, height) * 0.08)
          .fill({ color: 0xbce5ad, alpha: 0.42 })
          .stroke({ color: 0xffffff, alpha: 0.38, width: 2 });
        island.rotation = -0.035;
        layer.addChild(island);

        const routeShadow = new Graphics();
        const route = new Graphics();
        geometry.segments.forEach((segment, index) => {
          const x1 = segment.from.x * width;
          const y1 = segment.from.y * height;
          const x2 = segment.to.x * width;
          const y2 = segment.to.y * height;
          if (index === 0) {
            routeShadow.moveTo(x1, y1);
            route.moveTo(x1, y1);
          }
          routeShadow.lineTo(x2, y2);
          route.lineTo(x2, y2);
        });
        routeShadow.stroke({ color: 0x24445d, alpha: 0.16, width: Math.max(12, width * 0.014) });
        route.stroke({ color: 0xfff2cf, alpha: 0.78, width: Math.max(7, width * 0.009) });
        layer.addChild(routeShadow, route);

        for (let index = 0; index < 24; index += 1) {
          const seed = (index * 47) % 97;
          const puff = new Graphics().circle(0, 0, 2.5 + (index % 4)).fill({ color: colors[index % colors.length], alpha: 0.18 });
          puff.x = width * (0.18 + ((seed * 13) % 67) / 100);
          puff.y = height * (0.19 + ((seed * 29) % 58) / 100);
          layer.addChild(puff);
        }
      };

      const pulse = (eventBatch: GameEvent[]) => {
        cancelPulse?.();
        const plan = buildAnimationPlan(eventBatch);
        const timers: number[] = [];
        const geometry = createBoardGeometry(stateRef.current.map);
        plan.forEach((item, index) => {
          const timer = window.setTimeout(() => {
            if (disposed) return;
            const target = item.nodeId ? geometry.nodes.find((node) => node.id === item.nodeId) : geometry.nodes[(index * 7) % geometry.nodes.length];
            if (!target) return;
            const burst = new Graphics();
            const color = item.kind === "cash" ? 0xffc24b : item.kind === "celebrate" ? 0xf05278 : 0xffffff;
            burst.circle(0, 0, item.kind === "dice" ? 20 : 12).fill({ color, alpha: 0.65 });
            burst.x = target.x * (app.renderer.width / app.renderer.resolution);
            burst.y = target.y * (app.renderer.height / app.renderer.resolution);
            app.stage.addChild(burst);
            let frame = 0;
            const tick = () => {
              frame += 1;
              burst.scale.set(1 + frame / 18);
              burst.alpha = Math.max(0, 0.65 - frame / 34);
              if (frame > 22) {
                app.ticker.remove(tick);
                burst.destroy();
              }
            };
            app.ticker.add(tick);
          }, item.delay);
          timers.push(timer);
        });
        cancelPulse = () => timers.forEach(window.clearTimeout);
      };

      redraw();
      observer = new ResizeObserver(redraw);
      observer.observe(host);
      (host as HTMLDivElement & { replay?: (items: GameEvent[]) => void }).replay = pulse;
      const latest = eventsRef.current.at(-1);
      if (latest) pulse(eventsRef.current.slice(-8));
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      cancelPulse?.();
      host.replaceChildren();
    };
  }, []);

  useEffect(() => {
    eventsRef.current = events;
    const latest = events.at(-1);
    if (!latest || latest.id === seenEventRef.current) return;
    seenEventRef.current = latest.id;
    const host = hostRef.current as (HTMLDivElement & { replay?: (items: GameEvent[]) => void }) | null;
    host?.replay?.(events.slice(-8));
  }, [events]);

  return <div className="board-canvas" ref={hostRef} />;
}
