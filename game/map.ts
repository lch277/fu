import type { GameMap, MapNode, MapNodeType } from "./types";

const stops: Array<[string, string, MapNodeType]> = [
  ["start", "出发站", "start"],
  ["beijing-1", "北京东城", "property"],
  ["chance-1", "机会", "chance"],
  ["beijing-2", "北京西城", "property"],
  ["bank", "银行", "bank"],
  ["tianjin", "天津", "property"],
  ["shop-1", "百货商店", "shop"],
  ["jail", "监狱", "jail"],
  ["xian-1", "西安城墙", "property"],
  ["news-1", "新闻", "news"],
  ["xian-2", "西安钟楼", "property"],
  ["chengdu", "成都", "property"],
  ["lottery", "乐透中心", "lottery"],
  ["chongqing", "重庆", "property"],
  ["chance-2", "命运", "chance"],
  ["hospital", "医院", "hospital"],
  ["guangzhou-1", "广州越秀", "property"],
  ["company-mall", "友谊商场", "company"],
  ["guangzhou-2", "广州天河", "property"],
  ["shenzhen", "深圳", "property"],
  ["magic", "魔法屋", "magic"],
  ["xiamen", "厦门", "property"],
  ["shop-2", "卡片商店", "shop"],
  ["shanghai-1", "上海外滩", "property"],
  ["news-2", "新闻", "news"],
  ["shanghai-2", "上海浦东", "property"],
  ["hangzhou", "杭州", "property"],
  ["chance-3", "机会", "chance"],
  ["nanjing", "南京", "property"],
  ["company-tech", "东方科技", "company"],
  ["wuhan", "武汉", "property"],
  ["shop-3", "道具商店", "shop"],
];

function position(index: number) {
  if (index < 9) return { x: 150 + index * 86, y: 590 };
  if (index < 16) return { x: 838, y: 590 - (index - 8) * 64 };
  if (index < 25) return { x: 838 - (index - 16) * 86, y: 78 };
  return { x: 150, y: 78 + (index - 24) * 64 };
}

const nodes: MapNode[] = stops.map(([id, name, type], index) => ({
  id,
  name,
  type,
  ...position(index),
  next: [stops[(index + 1) % stops.length][0]],
  propertyId: type === "property" || type === "company" ? id : undefined,
}));

export const mainlandMap: GameMap = {
  id: "mainland-china",
  name: "神州环游",
  nodes,
};
