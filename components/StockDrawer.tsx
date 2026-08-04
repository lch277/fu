import { getChairperson } from "@/game/stocks";
import type { GameState, StockOrder } from "@/game/types";

export function StockDrawer({ open, state, onClose, onTrade }: { open: boolean; state: GameState; onClose(): void; onTrade(order: StockOrder): void }) {
  if (!open) return null;
  const player = state.players[state.currentPlayerId];
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="game-drawer stock-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label="股票市场">
        <div className="drawer-heading"><div><small>即时交易</small><h2>神州股市</h2></div><button onClick={onClose} aria-label="关闭股票市场">×</button></div>
        <p className="stock-cash">可用现金 <b>¥{player.cash.toLocaleString("zh-CN")}</b></p>
        <div className="stock-list">
          {Object.values(state.stocks).map((stock) => {
            const change = stock.price - stock.previousPrice;
            const chairperson = getChairperson(state, stock.id);
            return <article key={stock.id}>
              <div className="stock-name"><b>{stock.name}</b><small>{chairperson ? `董事长：${state.players[chairperson].name}` : "暂无董事长"}</small></div>
              <div className={`stock-price ${change >= 0 ? "up" : "down"}`}><b>¥{stock.price.toFixed(2)}</b><small>{change >= 0 ? "+" : ""}{change.toFixed(2)}</small></div>
              <div className="stock-holding"><small>持仓</small><b>{player.stocks[stock.id] ?? 0} 股</b></div>
              <div className="stock-actions"><button onClick={() => onTrade({ playerId: player.id, stockId: stock.id, quantity: 50, side: "buy" })}>买 50</button><button onClick={() => onTrade({ playerId: player.id, stockId: stock.id, quantity: 50, side: "sell" })}>卖 50</button></div>
            </article>;
          })}
        </div>
      </aside>
    </div>
  );
}
