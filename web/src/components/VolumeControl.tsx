import React, { useState, useRef, useEffect } from "react";
import { Volume2Icon, Volume1Icon, VolumeXIcon } from "lucide-react";
import { useKeyboardShortcut } from "../hooks/use-global-keyboard-shortcuts";
import { toast } from "sonner";

interface VolumeControlProps {
  volume: number; // 0-1 的音量值
  setVolume: (volume: number) => void;
  showVolume: boolean;
  setShowVolume: (show: boolean) => void;
  className?: string;
}

const VolumeControlComponent: React.FC<VolumeControlProps> = ({
  volume,
  setVolume,
  showVolume,
  setShowVolume,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [mutedVolume, setMutedVolume] = useState(0); // 静音前的音量值

  // b 静音/取消静音
  useKeyboardShortcut(
    "b",
    () => {
      let isMuted = volume > 0;
      if (isMuted) {
        setMutedVolume(volume);
        toast.success("已静音");
      } else {
        setMutedVolume(0);
        toast.success("取消静音");
      }
      changeVolume(isMuted ? 0 : mutedVolume || 0.5);
    },
    "global",
    10,
    "静音/取消静音"
  );

  // v 显示/隐藏音量
  useKeyboardShortcut(
    "v",
    () => {
      setShowVolume(!showVolume);
    },
    "global",
    10,
    "显示/隐藏音量控制"
  );

  // ArrowUp: 音量控制优先（优先级 20），播放列表其次（优先级 10）
  useKeyboardShortcut(
    "ArrowUp",
    () => {
      if (volume < 1) changeVolume(Math.min(volume + 0.005, 1));
    },
    "volume",
    20,
    "增加音量"
  );


  // ArrowDown: 音量控制优先（优先级 20），播放列表其次（优先级 10）
  useKeyboardShortcut(
    "ArrowDown",
    () => {
      if (volume > 0) changeVolume(Math.max(volume - 0.005, 0));
    },
    "volume",
    20,
    "减少音量"
  );

  // 切换音量面板显示/隐藏
  const toggleVolumePanel = () => {
    setShowVolume(!showVolume);
  };

  // 改变音量并同步到 audio 元素
  const changeVolume = (value: number) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    setVolume(clampedValue);
  };

  // 处理滑块拖拽
  const handleSliderChange = (clientY: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = 1 - (clientY - rect.top) / rect.height;
    const clampedPercentage = Math.max(0, Math.min(1, percentage));
    changeVolume(clampedPercentage);
  };

  // 鼠标/触摸事件处理
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    handleSliderChange(e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleSliderChange(e.touches[0].clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleSliderChange(e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        handleSliderChange(e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  // 音量图标选择逻辑
  const VolumeIcon = () => {
    if (volume <= 0) return <VolumeXIcon className="w-5 h-5" />;
    if (volume <= 0.5) return <Volume1Icon className="w-5 h-5" />;
    return <Volume2Icon className="w-5 h-5" />;
  };

  // 计算渐变色（从蓝色到紫色）
  const getVolumeGradient = () => {
    // const percentage = volume * 100;
    // 蓝色: hsl(217, 28%, 68%) -> 紫色: hsl(260, 60%, 65%)
    const hue = 217 + (260 - 217) * volume;
    const saturation = 28 + (60 - 28) * volume;
    const lightness = 68 - 3 * volume;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* 音量图标按钮 */}
      <button onClick={toggleVolumePanel}
        className="group relative flex items-center justify-center w-10 h-10 rounded-full
                   transition-all duration-300 ease-out hover:text-primary-hover
                   hover:scale-110 active:scale-95 z-[1] focus:outline-none"
        // style={{
        //   color: showVolume
        //     ? "var(--primary-hover)"
        //     : "var(--playstatus-foreground)",
        //   background: showVolume
        //     ? "var(--primary)"
        //     : "transparent",
        // }}
        aria-label={showVolume ? "隐藏音量控制" : "显示音量控制"}
      >
        <VolumeIcon />

        {/* 悬停光晕效果 */}
        {/* <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100
                     transition-opacity duration-300"
          style={{ background: "var(--primary)" }} /> */}
      </button>


      {/* 音量面板 */}
      <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[1]
                   transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]
                   ${showVolume ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 scale-95 pointer-events-none"}`}
        style={{ transitionProperty: "opacity, transform" }}
      >
        {/* 玻璃态容器 */}
        <div className="relative w-12 h-40 rounded-2xl overflow-hidden 
                     shadow-2xl flex flex-col items-center justify-center p-3"
          style={{
            background: "linear-gradient(135deg, var(--muted), var(--card))",
            borderColor: "var(--primary)",
            boxShadow: `0 8px 32px var(--primary),
              0 1px 0 var(--primary-foreground) inset,
              0 -1px 0 hsla(0, 0%, 0% / 0.05) inset` }}>
          {/* 音量百分比显示 */}
          <div className="absolute top-2 text-xs font-semibold tracking-wider mb-1"
            style={{
              color: "var(--playstatus-foreground)",
              fontVariantNumeric: "tabular-nums",
            }}>
            {Math.round(volume * 100)}
            <span className="text-[10px] opacity-60">%</span>
          </div>

          {/* 滑块轨道容器 */}
          <div ref={sliderRef} className="relative w-full flex-1 cursor-pointer rounded-full overflow-hidden mt-4 py-2"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
              background: "var(--muted)",
            }}
          >
            {/* 渐变音量条 */}
            <div className="absolute bottom-0 left-0 right-0 transition-all duration-100 ease-out"
              style={{
                height: `${volume * 100}%`,
                background: `linear-gradient(to top, ${getVolumeGradient()}, var(--primary-hover))`,
                boxShadow: `0 0 20px ${getVolumeGradient()}40, 0 -2px 10px ${getVolumeGradient()}60 inset`
              }} >
              {/* 顶部发光圆点 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                           w-full h-2 rounded-full transition-all duration-200"
                style={{
                  background: getVolumeGradient(),
                  boxShadow: `0 0 12px ${getVolumeGradient()},
                    0 0 4px white inset`,
                  transform: isDragging ? "translate(-50%, -50%) scale(1.3)"
                    : "translate(-50%, -50%) scale(1)"
                }}
              />
            </div>

            {/* 刻度线（可选装饰） */}
            {[0.25, 0.5, 0.75].map((mark) => (
              <div key={mark}
                className="absolute left-0 right-0 h-[1px] opacity-20"
                style={{ bottom: `${mark * 100}%`, background: "var(--playstatus-foreground)" }}
              />
            ))}
          </div>

          {/* 底部装饰性边框光晕 */}
          {/* <div className="absolute bottom-0 left-0 right-0 h-[1px] opacity-60"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--primary), transparent)",
            }}
          /> */}
        </div>

        {/* 三角形指示箭头 */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-[1px]
                     w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px]
                     border-l-transparent border-r-transparent"
          style={{
            borderTopColor: "var(--card)",
            filter: "drop-shadow(0 2px 4px hsla(0, 0%, 0% / 0.1))",
          }}
        />
      </div>

      {/* 遮罩层 */}
      <div className={`fixed inset-0 transition-opacity duration-250 backdrop-blur-[2px]
                   ${showVolume
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
        }`}
        style={{
          background: "hsla(0, 0%, 0% / 0.2)",
          // backdropFilter: "blur(2px)",
        }}
        onClick={() => setShowVolume(false)}
        aria-hidden="true"
      />
    </div >
  );
};

// 使用 React.memo 避免因父组件频繁更新（如播放时每秒多次的 currentTime 更新）而重渲染
// 这样可以防止点击事件在重渲染时丢失
export const VolumeControl = React.memo(VolumeControlComponent);
