import { mainlandMap } from "./map";
import type { ContentDefinition, PropertyState, StockState } from "./types";

export const CARD_DEFINITIONS: ContentDefinition[] = [
  { id: "purchase-card", name: "购地卡", description: "直接购买脚下的无主地产", icon: "契" },
  { id: "swap-card", name: "换地卡", description: "交换两块地产的所有权", icon: "换" },
  { id: "remodel-card", name: "改建卡", description: "改变大型地产的用途", icon: "改" },
  { id: "tax-card", name: "查税卡", description: "向指定玩家征收部分现金", icon: "税" },
  { id: "equal-rich-card", name: "均富卡", description: "重新平均所有玩家的现金", icon: "均" },
  { id: "equal-poor-card", name: "均贫卡", description: "重新平均指定两人的现金", icon: "衡" },
  { id: "angel-card", name: "天使卡", description: "己方全部地产升一级", icon: "升" },
  { id: "devil-card", name: "恶魔卡", description: "对手全部地产降一级", icon: "降" },
  { id: "red-card", name: "红卡", description: "指定股票连续上涨", icon: "涨" },
  { id: "black-card", name: "黑卡", description: "指定股票连续下跌", icon: "跌" },
  { id: "stop-card", name: "停留卡", description: "指定玩家停留一回合", icon: "停" },
  { id: "turn-card", name: "转向卡", description: "改变指定玩家的前进方向", icon: "转" },
  { id: "invite-god-card", name: "请神卡", description: "请来附近的神仙", icon: "请" },
  { id: "send-god-card", name: "送神卡", description: "送走附身的神仙", icon: "送" },
  { id: "immunity-card", name: "免罪卡", description: "免除一次监狱或伤害效果", icon: "免" },
  { id: "revenge-card", name: "复仇卡", description: "把下一次损失返还给来源玩家", icon: "返" },
];

export const TOOL_DEFINITIONS: ContentDefinition[] = [
  { id: "roadblock", name: "路障", description: "让到达此处的角色停止", icon: "障" },
  { id: "mine", name: "地雷", description: "使踩中的角色住院", icon: "雷" },
  { id: "bomb", name: "定时炸弹", description: "随角色移动并在倒计时后爆炸", icon: "弹" },
  { id: "machine-doll", name: "机器娃娃", description: "清除前方六格道路障碍", icon: "机" },
  { id: "motorbike", name: "机车", description: "接下来可以使用两颗骰子", icon: "骑" },
  { id: "car", name: "汽车", description: "接下来可以使用三颗骰子", icon: "车" },
  { id: "remote-die", name: "遥控骰子", description: "选择下一次骰子的点数", icon: "控" },
];

export const GOD_DEFINITIONS: ContentDefinition[] = [
  { id: "wealth-god", name: "财神", description: "每回合获得现金", icon: "财" },
  { id: "poor-god", name: "穷神", description: "每回合损失现金", icon: "穷" },
  { id: "lucky-god", name: "福神", description: "增强正面随机事件", icon: "福" },
  { id: "unlucky-god", name: "衰神", description: "削弱购地和升级能力", icon: "衰" },
  { id: "land-god", name: "土地公", description: "经过时有机会取得地产", icon: "地" },
  { id: "death-god", name: "死神", description: "每回合损失部分现金", icon: "死" },
];

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
