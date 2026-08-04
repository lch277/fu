"use client";

export interface UiSettings {
  sound: boolean;
  speed: 1 | 2 | 4;
}

export function SettingsDrawer({ open, settings, onChange, onClose, onExit }: { open: boolean; settings: UiSettings; onChange(settings: UiSettings): void; onClose(): void; onExit(): void }) {
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="game-drawer settings-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label="游戏设置">
        <div className="drawer-heading"><div><small>随时调整</small><h2>游戏设置</h2></div><button onClick={onClose} aria-label="关闭游戏设置">×</button></div>
        <section className="settings-section">
          <div><b>动画速度</b><small>加快 AI 行动与落点结算</small></div>
          <div className="settings-options">
            {([1, 2, 4] as const).map((speed) => <button key={speed} className={settings.speed === speed ? "active" : ""} aria-label={`${speed} 倍速`} onClick={() => onChange({ ...settings, speed })}>{speed}×</button>)}
          </div>
        </section>
        <section className="settings-section">
          <div><b>合成音效</b><small>骰子、金币与胜利均由浏览器即时合成</small></div>
          <button className={`sound-toggle ${settings.sound ? "active" : ""}`} aria-label={settings.sound ? "关闭音效" : "开启音效"} onClick={() => onChange({ ...settings, sound: !settings.sound })}>{settings.sound ? "已开启" : "已静音"}</button>
        </section>
        <p className="settings-note">进度会在每次操作后自动保存在此浏览器中。</p>
        <button className="exit-game-button" onClick={onExit}>保存并返回首页</button>
      </aside>
    </div>
  );
}
