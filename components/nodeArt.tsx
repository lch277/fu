import type { MapNode } from "@/game/types";

// 每个格子按名字定制的整幅背景插画(山水小品),铺满卡片,名字标签叠加在顶部
const S = { viewBox: "0 0 120 80", preserveAspectRatio: "xMidYMid slice" } as const;

const ground = (fill: string) => <path d="M0 62 Q30 54 60 60 T120 56 V80 H0 Z" fill={fill} />;

const ART_BY_ID: Record<string, React.ReactElement> = {
  // 出发站:红色牌坊与号旗
  start: (
    <svg {...S}>
      <rect width="120" height="80" fill="#d6ecf6" />
      <circle cx="94" cy="18" r="9" fill="#ffd98a" />
      {ground("#9fd6a2")}
      <rect x="42" y="28" width="7" height="36" fill="#c0483f" />
      <rect x="71" y="28" width="7" height="36" fill="#c0483f" />
      <rect x="36" y="22" width="48" height="8" rx="2" fill="#b03a34" />
      <path d="M32 22 L60 10 L88 22 Z" fill="#e0b23f" />
      <rect x="59" y="2" width="2" height="9" fill="#8a5a3a" />
      <path d="M61 3 h13 l-4 3.5 4 3.5 h-13 z" fill="#e2543e" />
      <circle cx="49" cy="35" r="3" fill="#ff8f5e" />
      <circle cx="71" cy="35" r="3" fill="#ff8f5e" />
    </svg>
  ),
  // 北京东城:天安门城楼
  "beijing-1": (
    <svg {...S}>
      <rect width="120" height="80" fill="#dcecf7" />
      <circle cx="22" cy="18" r="8" fill="#ffd98a" />
      {ground("#a8d89c")}
      <rect x="30" y="42" width="60" height="22" fill="#c0483f" />
      <path d="M50 64 v-8 a10 8 0 0 1 20 0 v8 z" fill="#7a2e2a" />
      <rect x="44" y="28" width="32" height="16" fill="#b03a34" />
      <path d="M38 30 L60 16 L82 30 Z" fill="#e0b23f" />
      <rect x="52" y="31" width="4" height="9" fill="#f4d47c" />
      <rect x="64" y="31" width="4" height="9" fill="#f4d47c" />
    </svg>
  ),
  // 北京西城:北海白塔
  "beijing-2": (
    <svg {...S}>
      <rect width="120" height="80" fill="#e3f0f8" />
      <path d="M0 58 Q40 42 120 52 V80 H0 Z" fill="#9fd6a2" />
      <rect x="54" y="46" width="14" height="10" rx="2" fill="#e2dccb" />
      <path d="M61 16 C71 24 73 36 73 46 H49 C49 36 51 24 61 16 Z" fill="#f6f1e6" />
      <rect x="60" y="6" width="2" height="12" fill="#b9b2a2" />
      <circle cx="61" cy="6" r="2.4" fill="#e0b23f" />
      <circle cx="30" cy="56" r="5" fill="#6db072" />
      <circle cx="88" cy="54" r="6" fill="#6db072" />
    </svg>
  ),
  // 天津:天津之眼摩天轮
  tianjin: (
    <svg {...S}>
      <rect width="120" height="80" fill="#cfe7f4" />
      <circle cx="24" cy="16" r="7" fill="#ffd98a" />
      <circle cx="60" cy="32" r="21" fill="none" stroke="#d97b4c" strokeWidth="4" />
      <path d="M60 11 V53 M39 32 H81 M45 17 L75 47 M75 17 L45 47" stroke="#e19a6f" strokeWidth="2" />
      <circle cx="60" cy="32" r="4" fill="#e2543e" />
      <circle cx="60" cy="11" r="3" fill="#c0483f" />
      <circle cx="60" cy="53" r="3" fill="#c0483f" />
      <circle cx="39" cy="32" r="3" fill="#c0483f" />
      <circle cx="81" cy="32" r="3" fill="#c0483f" />
      <path d="M48 49 L38 62 M72 49 L82 62" stroke="#7a8ba0" strokeWidth="4" />
      <rect y="62" width="120" height="18" fill="#a9cfe8" />
      <path d="M14 70 h14 M46 74 h16 M84 68 h14" stroke="#d8ecf6" strokeWidth="2" />
    </svg>
  ),
  // 西安城墙:垛口城门
  "xian-1": (
    <svg {...S}>
      <rect width="120" height="80" fill="#f3e0bd" />
      <circle cx="96" cy="16" r="8" fill="#f2b45c" />
      <rect x="16" y="38" width="88" height="26" fill="#b6a08a" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={16 + i * 13} y="32" width="8" height="7" fill="#a58f77" />
      ))}
      <path d="M52 64 v-10 a8 7 0 0 1 16 0 v10 z" fill="#6b5847" />
      <circle cx="30" cy="46" r="3" fill="#e2543e" />
      <circle cx="90" cy="46" r="3" fill="#e2543e" />
      <rect y="64" width="120" height="16" fill="#cbb99c" />
    </svg>
  ),
  // 西安钟楼:绿瓦方楼挂金钟
  "xian-2": (
    <svg {...S}>
      <rect width="120" height="80" fill="#dceaf5" />
      <circle cx="20" cy="16" r="7" fill="#ffd98a" />
      {ground("#a8d89c")}
      <rect x="40" y="50" width="40" height="14" fill="#b7a998" />
      <rect x="48" y="36" width="24" height="16" fill="#c0483f" />
      <path d="M42 38 L60 26 L78 38 Z" fill="#3f8f74" />
      <path d="M47 26 L60 16 L73 26 Z" fill="#3f8f74" />
      <rect x="59.2" y="8" width="1.6" height="9" fill="#e0b23f" />
      <circle cx="60" cy="8" r="2" fill="#e0b23f" />
      <rect x="56" y="42" width="8" height="8" rx="1" fill="#f4d47c" />
    </svg>
  ),
  // 成都:竹林熊猫
  chengdu: (
    <svg {...S}>
      <rect width="120" height="80" fill="#e6f2e9" />
      <rect x="14" y="8" width="6" height="58" fill="#7fb069" />
      <rect x="100" y="4" width="6" height="62" fill="#7fb069" />
      <path d="M20 16 q10 -8 16 0 M20 30 q10 -8 16 0 M100 14 q-10 -8 -16 0" stroke="#5c9950" strokeWidth="3" fill="none" />
      {ground("#bfe0b2")}
      <circle cx="60" cy="42" r="17" fill="#f7f4ec" stroke="#d8d2c4" strokeWidth="1" />
      <circle cx="47" cy="28" r="5.5" fill="#3a3a3a" />
      <circle cx="73" cy="28" r="5.5" fill="#3a3a3a" />
      <ellipse cx="51" cy="40" rx="4.5" ry="6" transform="rotate(-18 51 40)" fill="#3a3a3a" />
      <ellipse cx="69" cy="40" rx="4.5" ry="6" transform="rotate(18 69 40)" fill="#3a3a3a" />
      <circle cx="51.5" cy="40" r="1.6" fill="#fff" />
      <circle cx="68.5" cy="40" r="1.6" fill="#fff" />
      <circle cx="60" cy="46" r="2" fill="#3a3a3a" />
      <path d="M56 50 q4 3 8 0" stroke="#3a3a3a" strokeWidth="2" fill="none" />
    </svg>
  ),
  // 重庆:山城吊脚楼与江水
  chongqing: (
    <svg {...S}>
      <rect width="120" height="80" fill="#e9d9c8" />
      <path d="M0 54 Q26 40 48 52 T96 48 T120 44 V80 H0 Z" fill="#97b98a" />
      <rect y="66" width="120" height="14" fill="#a9cfe8" />
      <rect x="46" y="46" width="28" height="20" fill="#b6554a" />
      <rect x="50" y="34" width="20" height="14" fill="#c0483f" />
      <path d="M44 36 L60 24 L76 36 Z" fill="#e0b23f" />
      <rect x="59" y="17" width="2" height="8" fill="#e0b23f" />
      <circle cx="54" cy="52" r="2" fill="#f4d47c" />
      <circle cx="66" cy="52" r="2" fill="#f4d47c" />
      <circle cx="58" cy="40" r="2" fill="#f4d47c" />
      <circle cx="62" cy="40" r="2" fill="#f4d47c" />
      <path d="M8 70 h30 M80 72 h32" stroke="#d8ecf6" strokeWidth="2" />
    </svg>
  ),
  // 广州越秀:五羊石像
  "guangzhou-1": (
    <svg {...S}>
      <rect width="120" height="80" fill="#e0f0e6" />
      <circle cx="96" cy="16" r="7" fill="#ffd98a" />
      {ground("#a8d89c")}
      <path d="M28 62 q8 -16 32 -16 t32 16 z" fill="#a89a85" />
      <ellipse cx="62" cy="46" rx="13" ry="8" fill="#e8e0cf" />
      <circle cx="49" cy="41" r="5" fill="#e8e0cf" />
      <path d="M47 37 q-7 -6 -2 -11 M51 37 q1 -8 7 -9" stroke="#cfc6b4" strokeWidth="2.4" fill="none" />
      <rect x="54" y="52" width="2.6" height="9" fill="#cfc6b4" />
      <rect x="66" y="52" width="2.6" height="9" fill="#cfc6b4" />
      <ellipse cx="78" cy="50" rx="8" ry="5" fill="#cfc6b4" />
      <circle cx="70" cy="47" r="3.4" fill="#cfc6b4" />
    </svg>
  ),
  // 广州天河:小蛮腰
  "guangzhou-2": (
    <svg {...S}>
      <rect width="120" height="80" fill="#cfe6f4" />
      <circle cx="22" cy="14" r="6" fill="#ffd98a" />
      {ground("#a8d89c")}
      <path d="M55 16 C62 32 58 46 52 62 M65 16 C58 32 62 46 68 62" stroke="#d98a9c" strokeWidth="3" fill="none" />
      <rect x="55" y="10" width="10" height="5" rx="2" fill="#d98a9c" />
      <circle cx="60" cy="35" r="4" fill="#e0b23f" />
      <rect x="59" y="2" width="2" height="8" fill="#d98a9c" />
      <rect x="46" y="62" width="28" height="4" fill="#8fa8b8" />
    </svg>
  ),
  // 深圳:摩天楼群
  shenzhen: (
    <svg {...S}>
      <rect width="120" height="80" fill="#d8ecf7" />
      <ellipse cx="26" cy="18" rx="10" ry="4" fill="#fff" opacity="0.8" />
      <ellipse cx="88" cy="12" rx="8" ry="3.4" fill="#fff" opacity="0.8" />
      {ground("#a8d89c")}
      <rect x="38" y="44" width="12" height="22" fill="#9cc3a8" />
      <rect x="72" y="36" width="12" height="30" fill="#a8cfd9" />
      <path d="M59 6 L64 14 L64 66 L56 66 L56 14 Z" fill="#7fb3d9" />
      <rect x="59.6" y="14" width="0.8" height="52" fill="#a9d3ea" />
    </svg>
  ),
  // 厦门:鼓浪屿与帆船
  xiamen: (
    <svg {...S}>
      <rect width="120" height="80" fill="#dff0f2" />
      <circle cx="20" cy="14" r="6" fill="#ffd98a" />
      <path d="M14 58 Q44 26 78 58 Z" fill="#8fc79b" />
      <path d="M44 40 L58 24 L70 40 Z" fill="#cbb99c" />
      <rect y="58" width="120" height="22" fill="#a9cfe8" />
      <rect x="78" y="48" width="12" height="10" fill="#f0e9db" />
      <path d="M76 48 L84 41 L92 48 Z" fill="#c0483f" />
      <path d="M22 68 q6 -7 12 0 M64 72 q6 -7 12 0" stroke="#d8ecf6" strokeWidth="2" fill="none" />
      <path d="M96 58 l0 -12 l10 4 z" fill="#fff" />
      <path d="M90 58 h20 l-4 4 h-12 z" fill="#c0483f" />
    </svg>
  ),
  // 上海外滩:万国建筑与钟楼
  "shanghai-1": (
    <svg {...S}>
      <rect width="120" height="80" fill="#e8ddc6" />
      <rect x="26" y="42" width="14" height="20" fill="#b09a7c" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={28 + (i % 3) * 4.4} y={46 + Math.floor(i / 3) * 7} width="2.6" height="4" fill="#f4d47c" />
      ))}
      <rect x="41" y="46" width="11" height="16" fill="#c0aa8c" />
      <rect x="54" y="18" width="13" height="44" fill="#b3a08a" />
      <path d="M52 18 L60.5 10 L69 18 Z" fill="#8e2f2c" />
      <circle cx="60.5" cy="24" r="4" fill="#fdf6e3" />
      <path d="M60.5 22 v2.6 l1.8 1" stroke="#5c5346" strokeWidth="1" fill="none" />
      <rect x="74" y="40" width="14" height="22" fill="#c0aa8c" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={76 + (i % 3) * 4.4} y={44 + Math.floor(i / 3) * 7} width="2.6" height="4" fill="#f4d47c" />
      ))}
      <rect x="88" y="46" width="10" height="16" fill="#b09a7c" />
      <rect y="62" width="120" height="18" fill="#a9cfe8" />
      <path d="M16 70 h18 M70 74 h22" stroke="#d8ecf6" strokeWidth="2" />
    </svg>
  ),
  // 上海浦东:东方明珠
  "shanghai-2": (
    <svg {...S}>
      <rect width="120" height="80" fill="#cfe7f4" />
      <circle cx="22" cy="14" r="6" fill="#ffd98a" />
      {ground("#a8d89c")}
      <path d="M50 64 L56 36 M70 64 L64 36 M60 64 V36" stroke="#c0483f" strokeWidth="3" />
      <circle cx="60" cy="36" r="9" fill="#d98a9c" />
      <circle cx="60" cy="20" r="5" fill="#d98a9c" />
      <rect x="59.3" y="6" width="1.4" height="9" fill="#c0483f" />
      <circle cx="60" cy="6" r="1.6" fill="#e0b23f" />
      <rect x="50" y="60" width="20" height="4" fill="#b3a08a" />
    </svg>
  ),
  // 杭州:西湖雷峰塔与三潭印月
  hangzhou: (
    <svg {...S}>
      <rect width="120" height="80" fill="#e6f1ea" />
      <circle cx="94" cy="14" r="6" fill="#ffd98a" />
      <path d="M0 48 Q30 40 60 46 T120 42 V56 H0 Z" fill="#b5d8a8" />
      <rect y="54" width="120" height="26" fill="#b5d8e8" />
      <rect x="34" y="34" width="14" height="14" fill="#8a7a68" />
      <path d="M30 36 L41 26 L52 36 Z" fill="#e0b23f" />
      <rect x="37" y="24" width="8" height="4" fill="#8a7a68" />
      <path d="M35 24 L41 18 L47 24 Z" fill="#e0b23f" />
      <rect x="40.2" y="13" width="1.6" height="6" fill="#e0b23f" />
      <rect x="34" y="48" width="14" height="6" fill="#b7a998" />
      <path d="M78 58 v-6 h6 v6 z M76 52 h10 l-5 -4 z" fill="#5b7a8c" />
      <path d="M92 60 v-5 h5 v5 z M90.5 55 h8 l-4 -3.4 z" fill="#5b7a8c" />
      <path d="M12 66 q10 -9 20 0" stroke="#e0d5c2" strokeWidth="3" fill="none" />
      <path d="M28 72 h14 M64 74 h16" stroke="#d8ecf6" strokeWidth="2" />
    </svg>
  ),
  // 南京:鸡鸣寺塔、城墙与玄武湖
  nanjing: (
    <svg {...S}>
      <rect width="120" height="80" fill="#e9eff5" />
      <circle cx="20" cy="14" r="6" fill="#ffd98a" />
      <rect y="58" width="120" height="22" fill="#b5d8e8" />
      <rect x="67" y="22" width="10" height="28" fill="#8a7a68" />
      <path d="M60 44 L72 37 L84 44 Z" fill="#4b6b5e" />
      <path d="M63 35 L72 29 L81 35 Z" fill="#4b6b5e" />
      <path d="M65 26 L72 20 L79 26 Z" fill="#4b6b5e" />
      <rect x="71.2" y="14" width="1.6" height="6" fill="#e0b23f" />
      <circle cx="72" cy="14" r="1.6" fill="#e0b23f" />
      <rect x="64" y="50" width="16" height="6" fill="#b7a998" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={12 + i * 11} y="50" width="7" height="6" fill="#b0a18c" />
      ))}
      <rect x="10" y="56" width="92" height="8" fill="#bfae97" />
      <path d="M32 58 q-4 -10 2 -18 M38 58 q0 -12 6 -16" stroke="#7fb069" strokeWidth="2" fill="none" />
      <path d="M14 70 h16 M46 74 h14 M88 70 h16" stroke="#d8ecf6" strokeWidth="2" />
    </svg>
  ),
  // 武汉:黄鹤楼
  wuhan: (
    <svg {...S}>
      <rect width="120" height="80" fill="#f0e4cf" />
      <circle cx="24" cy="14" r="6" fill="#f2b45c" />
      <path d="M100 16 q5 -5 9 0 q4 -5 9 0" stroke="#b8ab93" strokeWidth="1.6" fill="none" />
      {ground("#c9bfa6")}
      <rect x="32" y="58" width="56" height="5" fill="#b7a998" />
      <rect x="38" y="53" width="44" height="5" fill="#c3b5a0" />
      <rect x="46" y="38" width="28" height="15" fill="#c0483f" />
      <path d="M40 40 L60 26 L80 40 Z" fill="#3f8f74" />
      <rect x="52" y="28" width="16" height="10" fill="#b03a34" />
      <path d="M46 30 L60 20 L74 30 Z" fill="#3f8f74" />
      <rect x="59.2" y="13" width="1.6" height="8" fill="#e0b23f" />
      <circle cx="60" cy="13" r="1.8" fill="#e0b23f" />
      <rect x="53" y="44" width="4" height="7" fill="#f4d47c" />
      <rect x="63" y="44" width="4" height="7" fill="#f4d47c" />
    </svg>
  ),
  // 友谊商场:橱窗与提袋招牌
  "company-mall": (
    <svg {...S}>
      <rect width="120" height="80" fill="#dcecf7" />
      {ground("#a8d89c")}
      <rect x="28" y="34" width="64" height="28" fill="#f0e0c8" />
      <rect x="36" y="24" width="48" height="10" rx="2" fill="#e2543e" />
      <rect x="55" y="27" width="10" height="5" rx="1" fill="#fdf6e3" />
      <path d="M57.5 27 v-1.4 a2.5 2.2 0 0 1 5 0 V27" stroke="#fdf6e3" strokeWidth="1.4" fill="none" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={34 + i * 8.7} y="44" width="8.7" height="6" fill={i % 2 ? "#fdf6e3" : "#e2543e"} />
      ))}
      <rect x="36" y="56" width="8" height="6" fill="#b5d8e8" />
      <rect x="76" y="56" width="8" height="6" fill="#b5d8e8" />
      <rect x="52" y="54" width="16" height="8" fill="#8a7a68" />
    </svg>
  ),
  // 东方科技:原子轨道与芯片
  "company-tech": (
    <svg {...S}>
      <rect width="120" height="80" fill="#d8e8f0" />
      {ground("#a8d89c")}
      <ellipse cx="60" cy="36" rx="20" ry="8" fill="none" stroke="#e0b23f" strokeWidth="2.2" transform="rotate(-30 60 36)" />
      <ellipse cx="60" cy="36" rx="20" ry="8" fill="none" stroke="#e0b23f" strokeWidth="2.2" transform="rotate(30 60 36)" />
      <circle cx="60" cy="36" r="6" fill="#3f8f74" />
      <circle cx="42" cy="30" r="2.6" fill="#e2543e" />
      <circle cx="78" cy="42" r="2.6" fill="#e2543e" />
      <rect x="90" y="48" width="14" height="14" rx="2" fill="#3f8f74" />
      <rect x="94" y="52" width="6" height="6" fill="#6fb3a3" />
      <path d="M90 51 h-5 M90 58 h-5 M104 51 h5 M104 58 h5 M97 48 v-5 M97 62 v5" stroke="#3f8f74" strokeWidth="1.6" />
      <path d="M26 22 l1.4 3.6 3.6 1.4 -3.6 1.4 -1.4 3.6 -1.4 -3.6 -3.6 -1.4 3.6 -1.4 z" fill="#e0b23f" />
    </svg>
  ),
  // 银行:石柱立面与铜钱山花
  bank: (
    <svg {...S}>
      <rect width="120" height="80" fill="#e8eef0" />
      {ground("#b8c9b0")}
      <path d="M32 32 L60 16 L88 32 Z" fill="#b8a98e" />
      <circle cx="60" cy="24" r="6.5" fill="#e0b23f" />
      <rect x="58" y="22" width="4" height="4" fill="#fdf6e3" />
      <rect x="32" y="32" width="56" height="7" fill="#cbbfa6" />
      {Array.from({ length: 4 }, (_, i) => (
        <rect key={i} x={38 + i * 13.3} y="39" width="7" height="21" fill="#d8cbb2" />
      ))}
      <rect x="30" y="60" width="60" height="4" fill="#b8a98e" />
      <rect x="34" y="64" width="52" height="3" fill="#cbbfa6" />
    </svg>
  ),
  // 百货商店:红顶铺面与橱窗
  "shop-1": (
    <svg {...S}>
      <rect width="120" height="80" fill="#e4eef2" />
      {ground("#a8d89c")}
      <rect x="30" y="38" width="60" height="24" fill="#f0e0c8" />
      <path d="M26 38 L60 24 L94 38 Z" fill="#c0483f" />
      <rect x="38" y="44" width="18" height="8" fill="#b5d8e8" />
      <rect x="64" y="44" width="18" height="8" fill="#b5d8e8" />
      <circle cx="47" cy="48" r="2.4" fill="#e2543e" />
      <circle cx="73" cy="48" r="2.4" fill="#e0b23f" />
      <rect x="52" y="54" width="16" height="8" fill="#8a7a68" />
    </svg>
  ),
  // 卡片商店:卡牌扇面
  "shop-2": (
    <svg {...S}>
      <rect width="120" height="80" fill="#ece8f4" />
      {ground("#a8d89c")}
      <rect x="30" y="38" width="60" height="24" fill="#f0e9db" />
      <path d="M26 38 L60 24 L94 38 Z" fill="#8f6bd8" />
      <rect x="46" y="44" width="12" height="15" rx="2" fill="#e0b23f" transform="rotate(-14 52 51)" />
      <rect x="54" y="43" width="12" height="15" rx="2" fill="#fdf6e3" stroke="#d8cbb2" />
      <rect x="62" y="44" width="12" height="15" rx="2" fill="#e2543e" transform="rotate(14 68 51)" />
      <path d="M38 28 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 z" fill="#e0b23f" />
    </svg>
  ),
  // 道具商店:药水瓶与炸弹
  "shop-3": (
    <svg {...S}>
      <rect width="120" height="80" fill="#e2f0ea" />
      {ground("#a8d89c")}
      <rect x="30" y="38" width="60" height="24" fill="#f0e9db" />
      <path d="M26 38 L60 24 L94 38 Z" fill="#3f8f74" />
      <rect x="57" y="42" width="5" height="6" fill="#7fd0c0" />
      <path d="M54 48 h11 l4 12 h-19 z" fill="#7fd0c0" />
      <circle cx="58" cy="54" r="1.4" fill="#fff" />
      <circle cx="62" cy="57" r="1" fill="#fff" />
      <circle cx="72" cy="56" r="5" fill="#3a3a3a" />
      <path d="M72 51 q3 -4 6 -3" stroke="#8a5a3a" strokeWidth="1.4" fill="none" />
      <circle cx="78.5" cy="47.5" r="1.4" fill="#e0b23f" />
    </svg>
  ),
  // 监狱:铁窗与锁链
  jail: (
    <svg {...S}>
      <rect width="120" height="80" fill="#c3ccd3" />
      <circle cx="94" cy="16" r="7" fill="#e8e2d4" />
      <rect x="22" y="26" width="76" height="38" fill="#8d98a1" />
      <rect x="22" y="26" width="76" height="4" fill="#5c6771" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={30 + i * 11} y="26" width="3.5" height="38" fill="#5c6771" />
      ))}
      {ground("#9aa8ad")}
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={i} cx={34 + i * 13} cy="70" r="2.6" fill="none" stroke="#5c6771" strokeWidth="1.6" />
      ))}
    </svg>
  ),
  // 医院:红十字白楼
  hospital: (
    <svg {...S}>
      <rect width="120" height="80" fill="#e6f0f4" />
      {ground("#a8d89c")}
      <rect x="34" y="28" width="52" height="34" fill="#f7f4ec" />
      <path d="M30 28 L60 18 L90 28 Z" fill="#9cc3d4" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={40 + (i % 3) * 14} y={34 + Math.floor(i / 3) * 9} width="8" height="6" rx="1" fill="#b5d8e8" />
      ))}
      <rect x="53" y="52" width="14" height="10" fill="#8fb3c4" />
      <circle cx="60" cy="21" r="5" fill="#fff" stroke="#e2543e" strokeWidth="1.6" />
      <path d="M60 18.4 v5.2 M57.4 21 h5.2" stroke="#e2543e" strokeWidth="1.8" />
    </svg>
  ),
  // 机会/命运:锦囊
  "chance-1": (
    <svg {...S}>
      <rect width="120" height="80" fill="#f6e8d8" />
      {ground("#e8d5b8")}
      <path d="M60 26 C44 32 34 44 34 56 c0 11 10 18 26 18 s26 -7 26 -18 c0 -12 -10 -24 -26 -30" fill="#e8a13c" />
      <path d="M52 25 h16" stroke="#c9852d" strokeWidth="3" />
      <path d="M52 25 l-4 -8 M68 25 l4 -8" stroke="#c9852d" strokeWidth="2.4" />
      <path d="M28 18 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" fill="#e0b23f" />
      <circle cx="88" cy="16" r="2" fill="#e0b23f" />
    </svg>
  ),
  "chance-2": (
    <svg {...S}>
      <rect width="120" height="80" fill="#e8e2f2" />
      {ground("#d5cbe4")}
      <path d="M60 26 C44 32 34 44 34 56 c0 11 10 18 26 18 s26 -7 26 -18 c0 -12 -10 -24 -26 -30" fill="#8f6bd8" />
      <path d="M52 25 h16" stroke="#6e4bb5" strokeWidth="3" />
      <path d="M52 25 l-4 -8 M68 25 l4 -8" stroke="#6e4bb5" strokeWidth="2.4" />
      <path d="M28 18 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" fill="#e0b23f" />
      <circle cx="88" cy="16" r="2" fill="#e0b23f" />
    </svg>
  ),
  "chance-3": (
    <svg {...S}>
      <rect width="120" height="80" fill="#f6e8d8" />
      {ground("#e8d5b8")}
      <path d="M60 26 C44 32 34 44 34 56 c0 11 10 18 26 18 s26 -7 26 -18 c0 -12 -10 -24 -26 -30" fill="#e8a13c" />
      <path d="M52 25 h16" stroke="#c9852d" strokeWidth="3" />
      <path d="M52 25 l-4 -8 M68 25 l4 -8" stroke="#c9852d" strokeWidth="2.4" />
      <path d="M28 18 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" fill="#e0b23f" />
      <circle cx="88" cy="16" r="2" fill="#e0b23f" />
    </svg>
  ),
  // 新闻:号外与红印章
  "news-1": (
    <svg {...S}>
      <rect width="120" height="80" fill="#e8eef2" />
      {ground("#b8c9b0")}
      <g transform="rotate(-3 60 46)">
        <rect x="26" y="26" width="68" height="42" rx="2" fill="#fdf9ef" stroke="#d8d2c4" />
        <rect x="31" y="31" width="58" height="7" fill="#35507a" />
        <rect x="31" y="42" width="22" height="16" fill="#9db8c9" />
        <path d="M58 43 h26 M58 48 h26 M58 53 h18 M31 62 h53" stroke="#b9b2a2" strokeWidth="2.4" />
      </g>
      <rect x="82" y="52" width="10" height="10" rx="1" fill="#c0392b" opacity="0.85" transform="rotate(-8 87 57)" />
    </svg>
  ),
  "news-2": (
    <svg {...S}>
      <rect width="120" height="80" fill="#e8eef2" />
      {ground("#b8c9b0")}
      <g transform="rotate(-3 60 46)">
        <rect x="26" y="26" width="68" height="42" rx="2" fill="#fdf9ef" stroke="#d8d2c4" />
        <rect x="31" y="31" width="58" height="7" fill="#35507a" />
        <rect x="31" y="42" width="22" height="16" fill="#9db8c9" />
        <path d="M58 43 h26 M58 48 h26 M58 53 h18 M31 62 h53" stroke="#b9b2a2" strokeWidth="2.4" />
      </g>
      <rect x="82" y="52" width="10" height="10" rx="1" fill="#c0392b" opacity="0.85" transform="rotate(-8 87 57)" />
    </svg>
  ),
  // 乐透中心:红灯笼与彩票
  lottery: (
    <svg {...S}>
      <rect width="120" height="80" fill="#fdf1de" />
      {ground("#f0dcae")}
      <path d="M36 18 h14" stroke="#8a5a3a" strokeWidth="2" />
      <ellipse cx="43" cy="30" rx="10" ry="12" fill="#e2543e" />
      <path d="M40 18.5 v23 M43 18 v23 M46 18.5 v23" stroke="#c0392b" strokeWidth="1" />
      <path d="M43 42 v6" stroke="#e0b23f" strokeWidth="2" />
      <rect x="64" y="30" width="30" height="18" rx="3" fill="#fdf6e3" stroke="#e0b23f" strokeWidth="2" />
      <path d="M79 34 l2 4.6 4.6 2 -4.6 2 -2 4.6 -2 -4.6 -4.6 -2 4.6 -2 z" fill="#e0b23f" />
      <circle cx="60" cy="58" r="5" fill="#e0b23f" />
      <rect x="58.2" y="56.2" width="3.6" height="3.6" fill="#fdf6e3" />
    </svg>
  ),
  // 魔法屋:星月与法师塔
  magic: (
    <svg {...S}>
      <rect width="120" height="80" fill="#5e4b98" />
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={14 + i * 13.7} cy={12 + (i % 3) * 9} r="1.6" fill="#fff" opacity="0.9" />
      ))}
      <path d="M96 14 a8 8 0 1 0 6 12 a6.5 6.5 0 0 1 -6 -12 z" fill="#ffd98a" />
      <path d="M0 62 Q30 56 60 60 T120 56 V80 H0 Z" fill="#46577f" />
      <rect x="46" y="36" width="28" height="28" fill="#7a68b3" />
      <path d="M42 38 L60 14 L78 38 Z" fill="#4a3a80" />
      <circle cx="60" cy="48" r="4" fill="#ffd98a" />
      <path d="M55 64 v-6 a5 5 0 0 1 10 0 v6 z" fill="#3d2f6b" />
      <path d="M30 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#ffd98a" />
    </svg>
  ),
};

const GENERIC = (
  <svg {...S}>
    <rect width="120" height="80" fill="#dcecf7" />
    <circle cx="92" cy="16" r="7" fill="#ffd98a" />
    <path d="M0 56 Q30 42 64 54 T120 48 V80 H0 Z" fill="#9fd6a2" />
    <path d="M60 36 L74 56 H46 Z" fill="#7fb069" />
  </svg>
);

export function NodeArt({ node }: { node: MapNode }) {
  return ART_BY_ID[node.id] ?? GENERIC;
}
