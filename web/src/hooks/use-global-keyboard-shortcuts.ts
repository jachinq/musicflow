/**
 * 全局快捷键管理系统
 * 统一管理所有快捷键，支持作用域（scope）和优先级
 */

import { useEffect, useRef } from "react";

export type KeyboardScope =
  | "global"           // 全局作用域，始终生效
  | "player"           // 播放器作用域
  | "playlist"         // 播放列表作用域
  | "volume"           // 音量控制作用域
  | "musicList";       // 音乐列表作用域

interface KeyHandler {
  key: string;
  scope: KeyboardScope;
  handler: (event: KeyboardEvent) => void;
  priority: number;  // 优先级，数字越大优先级越高
  description?: string;
}

class GlobalKeyboardManager {
  private handlers: Map<string, KeyHandler[]> = new Map();
  private activeScopes: Set<KeyboardScope> = new Set(["global"]);
  private isListening = false;

  constructor() {
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  /**
   * 注册快捷键处理器
   */
  register(
    key: string,
    scope: KeyboardScope,
    handler: (event: KeyboardEvent) => void,
    priority: number = 0,
    description?: string
  ) {
    const normalizedKey = this.normalizeKey(key);

    if (!this.handlers.has(normalizedKey)) {
      this.handlers.set(normalizedKey, []);
    }

    const handlers = this.handlers.get(normalizedKey)!;
    handlers.push({ key: normalizedKey, scope, handler, priority, description });

    // 按优先级排序（降序）
    handlers.sort((a, b) => b.priority - a.priority);

    console.log(`[Keyboard] 注册快捷键: ${key} (scope: ${scope}, priority: ${priority})`);
  }

  /**
   * 注销快捷键处理器
   */
  unregister(key: string, handler: (event: KeyboardEvent) => void) {
    const normalizedKey = this.normalizeKey(key);
    const handlers = this.handlers.get(normalizedKey);

    if (handlers) {
      const index = handlers.findIndex((h) => h.handler === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        console.log(`[Keyboard] 注销快捷键: ${key}`);
      }

      if (handlers.length === 0) {
        this.handlers.delete(normalizedKey);
      }
    }
  }

  /**
   * 激活作用域
   */
  activateScope(scope: KeyboardScope) {
    this.activeScopes.add(scope);
    console.log(`[Keyboard] 激活作用域: ${scope}`, Array.from(this.activeScopes));
  }

  /**
   * 停用作用域
   */
  deactivateScope(scope: KeyboardScope) {
    if (scope !== "global") {
      this.activeScopes.delete(scope);
      console.log(`[Keyboard] 停用作用域: ${scope}`, Array.from(this.activeScopes));
    }
  }

  /**
   * 处理按键事件
   */
  private handleKeyPress(event: KeyboardEvent) {
    // 忽略在输入框中的按键
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    const key = this.normalizeKey(event.key);
    const handlers = this.handlers.get(key);

    if (!handlers || handlers.length === 0) {
      return;
    }

    // 找到第一个匹配的活动作用域的处理器
    for (const handler of handlers) {
      if (this.activeScopes.has(handler.scope)) {
        event.preventDefault();
        handler.handler(event);
        console.log(`[Keyboard] 触发快捷键: ${key} (scope: ${handler.scope})`);
        break; // 只执行优先级最高的处理器
      }
    }
  }

  /**
   * 标准化按键名称
   */
  private normalizeKey(key: string): string {
    // 将空格键标准化为 "Space"
    if (key === " ") return "Space";
    return key;
  }

  /**
   * 开始监听键盘事件
   */
  startListening() {
    if (!this.isListening) {
      window.addEventListener("keydown", this.handleKeyPress);
      this.isListening = true;
      console.log("[Keyboard] 开始监听键盘事件");
    }
  }

  /**
   * 停止监听键盘事件
   */
  stopListening() {
    if (this.isListening) {
      window.removeEventListener("keydown", this.handleKeyPress);
      this.isListening = false;
      console.log("[Keyboard] 停止监听键盘事件");
    }
  }

  /**
   * 获取所有注册的快捷键（用于调试）
   */
  getRegisteredShortcuts() {
    const shortcuts: Array<{ key: string; scope: KeyboardScope; priority: number; description?: string }> = [];

    this.handlers.forEach((handlers, key) => {
      handlers.forEach((handler) => {
        shortcuts.push({
          key,
          scope: handler.scope,
          priority: handler.priority,
          description: handler.description,
        });
      });
    });

    return shortcuts.sort((a, b) => {
      if (a.key < b.key) return -1;
      if (a.key > b.key) return 1;
      return b.priority - a.priority;
    });
  }
}

// 全局单例
export const globalKeyboardManager = new GlobalKeyboardManager();

/**
 * 使用全局快捷键的 Hook
 */
export const useGlobalKeyboardShortcuts = () => {
  useEffect(() => {
    globalKeyboardManager.startListening();
    return () => {
      // 不在这里停止监听，因为这是全局管理器
    };
  }, []);
};

/**
 * 注册快捷键的 Hook
 * 使用 useRef 保持 handler 引用稳定，避免重复注册
 */
export const useKeyboardShortcut = (
  key: string,
  handler: (event: KeyboardEvent) => void,
  scope: KeyboardScope = "global",
  priority: number = 0,
  description?: string
) => {
  // 使用 ref 保持最新的 handler，避免闭包陷阱
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // 创建一个稳定的 wrapper 函数，调用最新的 handler
    const stableHandler = (event: KeyboardEvent) => {
      handlerRef.current(event);
    };

    globalKeyboardManager.register(key, scope, stableHandler, priority, description);

    return () => {
      globalKeyboardManager.unregister(key, stableHandler);
    };
  }, [key, scope, priority, description]); // handler 不在依赖项中，避免重复注册
};

/**
 * 管理作用域的 Hook
 */
export const useKeyboardScope = (scope: KeyboardScope) => {
  useEffect(() => {
    globalKeyboardManager.activateScope(scope);

    return () => {
      globalKeyboardManager.deactivateScope(scope);
    };
  }, [scope]);
};
