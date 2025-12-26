/**
 * 性能监控面板
 * 按 Shift + ? 显示/隐藏
 */

import { useEffect, useState } from "react";
import { X, Activity, Database, HardDrive, Cpu } from "lucide-react";
import { audioBufferCache } from "../lib/audio-cache";

interface PerformanceStats {
  memoryUsage?: number; // MB
  cacheStats: {
    size: number;
    maxSize: number;
    keys: string[];
  };
  renderCount: number;
  fps: number;
}

export const PerformanceMonitor = () => {
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState<PerformanceStats>({
    cacheStats: { size: 0, maxSize: 3, keys: [] },
    renderCount: 0,
    fps: 60,
  });

  // 监听 Shift + ? 快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // 定期更新性能统计
  useEffect(() => {
    if (!visible) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const updateStats = () => {
      frameCount++;
      const currentTime = performance.now();

      // 每秒更新一次统计
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        setStats({
          memoryUsage: getMemoryUsage(),
          cacheStats: audioBufferCache.getStats(),
          renderCount: frameCount,
          fps,
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(updateStats);
    };

    animationFrameId = requestAnimationFrame(updateStats);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [visible]);

  const getMemoryUsage = (): number | undefined => {
    // @ts-ignore - performance.memory 是 Chrome 特有的 API
    if (performance.memory) {
      // @ts-ignore
      return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    return undefined;
  };

  if (!visible) return null;

  const cacheHitRate =
    stats.cacheStats.size > 0
      ? Math.round((stats.cacheStats.size / stats.cacheStats.maxSize) * 100)
      : 0;

  return (
    <div className="fixed top-4 right-4 z-50 bg-background text-foreground rounded-lg shadow-lg border border-border w-96">
      <div className="bg-background border-b border-border px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-primary" />
          <h2 className="text-lg font-bold">性能监控</h2>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="hover:bg-primary-hover p-1 rounded-md transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* FPS */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium">FPS</span>
          </div>
          <span className={`font-mono text-lg font-bold ${stats.fps >= 50 ? "text-green-500" : "text-yellow-500"}`}>
            {stats.fps}
          </span>
        </div>

        {/* 内存占用 */}
        {stats.memoryUsage !== undefined && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">内存占用</span>
            </div>
            <span className="font-mono text-lg font-bold text-primary">
              {stats.memoryUsage} MB
            </span>
          </div>
        )}

        {/* AudioBuffer 缓存 */}
        <div className="p-3 bg-muted rounded-md space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">AudioBuffer 缓存</span>
            </div>
            <span className="font-mono text-sm">
              {stats.cacheStats.size}/{stats.cacheStats.maxSize}
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${cacheHitRate}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            {stats.cacheStats.keys.length > 0 ? (
              stats.cacheStats.keys.map((key, index) => (
                <div key={index} className="truncate">
                  • {key}
                </div>
              ))
            ) : (
              <div>无缓存</div>
            )}
          </div>
        </div>

        {/* 提示信息 */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          实时更新 · 按 <kbd className="px-1 py-0.5 bg-background border border-border rounded font-mono">Shift + ?</kbd> 关闭
        </div>
      </div>
    </div>
  );
};
