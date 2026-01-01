/**
 * 快捷键查看器组件
 * 按 ? 键显示/隐藏
 */

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { globalKeyboardManager, KeyboardScope } from "../hooks/use-global-keyboard-shortcuts";

interface ShortcutInfo {
  key: string;
  scope: KeyboardScope;
  priority: number;
  description?: string;
}

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const KeyboardShortcutViewer = ({ visible, setVisible }: Props) => {
  const [shortcuts, setShortcuts] = useState<ShortcutInfo[]>([]);

  useEffect(() => {
    // 获取最新的快捷键列表
    const allShortcuts = globalKeyboardManager.getRegisteredShortcuts();
    setShortcuts(allShortcuts);

  }, [visible]);

  if (!visible) return null;

  // 按作用域分组
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.scope]) {
      acc[shortcut.scope] = [];
    }
    acc[shortcut.scope].push(shortcut);
    return acc;
  }, {} as Record<KeyboardScope, ShortcutInfo[]>);

  const scopeNames: Record<KeyboardScope, string> = {
    global: "全局快捷键",
    player: "播放器",
    playlist: "播放列表",
    volume: "音量控制",
    musicList: "音乐列表",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background text-foreground rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">快捷键列表</h2>
          <button
            onClick={() => setVisible(false)}
            className="hover:bg-primary-hover p-2 rounded-md transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {Object.entries(groupedShortcuts).map(([scope, scopeShortcuts]) => (
            <div key={scope} className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">
                {scopeNames[scope as KeyboardScope]}
              </h3>
              <div className="space-y-2">
                {scopeShortcuts.map((shortcut, index) => (
                  <div
                    key={`${shortcut.key}-${index}`}
                    className="flex justify-between items-center py-2 px-4 bg-muted rounded-md hover:bg-primary-hover transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <kbd className="px-3 py-1 bg-background border border-border rounded-md font-mono text-sm min-w-[60px] text-center">
                        {shortcut.key}
                      </kbd>
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description || "未命名快捷键"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      优先级: {shortcut.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
          {/* 按 <kbd className="px-2 py-1 bg-muted border border-border rounded-md font-mono">?</kbd>{" "}
          关闭此窗口 ·  */}
          按 <kbd className="px-2 py-1 bg-muted border border-border rounded-md font-mono">Shift + ?</kbd>{" "}
          打开性能监控
        </div>
      </div>
    </div>
  );
};
