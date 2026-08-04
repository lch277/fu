import { mainlandMap } from "./map";
import type { PropertyState, StockState } from "./types";

const groupById: Record<string, string> = {
  "beijing-1": "京华红",
  "beijing-2": "京华红",
  tianjin: "渤海蓝",
  "xian-1": "长安紫",
  "xian-2": "长安紫",
  chengdu: "巴蜀绿",
  chongqing: "巴蜀绿",
  "guangzhou-1": "岭南橙",
  "guangzhou-2": "岭南橙",
  shenzhen: "湾区金",
  xiamen: "海峡青",
  "shanghai-1": "沪上蓝",
  "shanghai-2": "沪上蓝",
  hangzhou: "江南粉",
  nanjing: "江南粉",
  wuhan: "江汉绿",
  "company-mall": "公司",
  "company-tech": "公司",
};

export function createProperties(): Record<string, PropertyState> {
  return Object.fromEntries(
    mainlandMap.nodes
      .filter((node) => node.propertyId)
      .map((node, index) => {
        const company = node.type === "company";
        const price = company ? 18_000 : 3_000 + (index % 6) * 800;
        return [
          node.propertyId!,
          {
            id: node.propertyId!,
            name: node.name,
            group: groupById[node.id] ?? "城市",
            price,
            baseToll: Math.round(price * (company ? 0.12 : 0.18)),
            ownerId: null,
            level: 0,
            maxLevel: company ? 1 : 5,
          },
        ];
      }),
  );
}

export function createStocks(): Record<string, StockState> {
  return {
    mall: {
      id: "mall",
      name: "友谊商场",
      price: 25,
      previousPrice: 25,
      limitUp: 27.5,
      limitDown: 22.5,
      companyPropertyId: "company-mall",
    },
    tech: {
      id: "tech",
      name: "东方科技",
      price: 42,
      previousPrice: 42,
      limitUp: 46.2,
      limitDown: 37.8,
      companyPropertyId: "company-tech",
    },
    travel: {
      id: "travel",
      name: "神州旅行",
      price: 18,
      previousPrice: 18,
      limitUp: 19.8,
      limitDown: 16.2,
      companyPropertyId: null,
    },
  };
}
