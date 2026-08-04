import type { GameEvent, GameMap } from "@/game/types";

export interface BoardPoint {
  id: string;
  x: number;
  y: number;
}

export interface BoardSegment {
  from: BoardPoint;
  to: BoardPoint;
}

export interface BoardAnimation {
  kind: "dice" | "step" | "celebrate" | "cash";
  delay: number;
  nodeId?: string;
  amount?: number;
}

export function createBoardGeometry(map: GameMap) {
  const nodes = map.nodes.map((node) => ({ id: node.id, x: node.x / 1000, y: node.y / 700 }));
  const segments = nodes.map((node, index) => ({ from: node, to: nodes[(index + 1) % nodes.length] }));
  return { nodes, segments };
}

export function buildAnimationPlan(events: GameEvent[]): BoardAnimation[] {
  let stepIndex = 0;
  return events.flatMap((event) => {
    if (event.type === "DICE_ROLLED") return [{ kind: "dice" as const, delay: 0, amount: event.amount }];
    if (event.type === "PLAYER_STEPPED") {
      stepIndex += 1;
      return [{ kind: "step" as const, delay: stepIndex * 140, nodeId: String(event.data?.nodeId ?? "") }];
    }
    if (event.type === "PROPERTY_BOUGHT" || event.type === "PROPERTY_UPGRADED") {
      return [{ kind: "celebrate" as const, delay: (stepIndex + 1) * 140, amount: event.amount }];
    }
    if (event.type === "TOLL_PAID" || event.type === "STOCK_CHANGED") {
      return [{ kind: "cash" as const, delay: (stepIndex + 1) * 140, amount: event.amount }];
    }
    return [];
  });
}
