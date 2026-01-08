import { useEffect, useRef, useState } from "react";
import { useCurrentPlay } from "../store/current-play";
import { usePlaylist } from "../store/playlist";

export const useDesktopLyrics = () => {
  const [isPipOpen, setIsPipOpen] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);
  const { lyrics, currentLyric } = useCurrentPlay();
  const { currentSong } = usePlaylist();

  // 打开 PiP 窗口
  const openPipLyrics = async () => {
    if (!("documentPictureInPicture" in window)) {
      alert("您的浏览器不支持桌面歌词功能，请使用 Chrome 116+ 或 Edge 116+");
      return;
    }

    try {
      // @ts-ignore - Document Picture-in-Picture API
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 600,
        height: 200,
        disallowReturnToOpener: false,
      });

      pipWindowRef.current = pipWindow;
      setIsPipOpen(true);

      // 初始化 PiP 窗口内容
      initializePipWindow(pipWindow);

      // 监听窗口关闭事件
      pipWindow.addEventListener("pagehide", () => {
        pipWindowRef.current = null;
        setIsPipOpen(false);
      });
    } catch (error) {
      console.error("打开桌面歌词失败:", error);
    }
  };

  // 关闭 PiP 窗口
  const closePipLyrics = () => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
      setIsPipOpen(false);
    }
  };

  // 初始化 PiP 窗口内容
  const initializePipWindow = (pipWindow: Window) => {
    const doc = pipWindow.document;

    // 复制主窗口的样式表到 PiP 窗口
    const styleSheets = Array.from(document.styleSheets);
    styleSheets.forEach((styleSheet) => {
      try {
        const cssRules = Array.from(styleSheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
        const style = doc.createElement("style");
        style.textContent = cssRules;
        doc.head.appendChild(style);
      } catch (e) {
        // 跨域样式表会报错，忽略
        const link = doc.createElement("link");
        link.rel = "stylesheet";
        link.href = (styleSheet as CSSStyleSheet).href || "";
        if (link.href) {
          doc.head.appendChild(link);
        }
      }
    });

    // 设置 body 样式，防止出现白色背景
    doc.body.style.cssText = `
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: rgba(20, 20, 40, 0.95);
    `;

    // 创建基础 HTML 结构 - 毛玻璃效果
    doc.body.innerHTML = `
      <div id="pip-lyrics-container" style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: rgba(20, 20, 40, 0.75);
        backdrop-filter: blur(30px) saturate(180%);
        -webkit-backdrop-filter: blur(30px) saturate(180%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
        padding: 20px;
        box-sizing: border-box;
        overflow: hidden;
        border-radius: 0;
      ">

        <div id="current-lyric" style="
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          line-height: 1.4;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
          color: rgba(255, 255, 255, 0.95);
        ">
          等待播放...
        </div>
        <div id="next-lyric" style="
          font-size: 16px;
          opacity: 0.5;
          margin-top: 12px;
          text-align: center;
          transition: all 0.3s ease;
          font-weight: 400;
        ">
        </div>
      </div>
    `;
  };

  // 更新 PiP 窗口歌词内容
  useEffect(() => {
    if (!isPipOpen || !pipWindowRef.current) return;

    const doc = pipWindowRef.current.document;
    const currentLyricEl = doc.getElementById("current-lyric");
    const nextLyricEl = doc.getElementById("next-lyric");
    const songInfoEl = doc.getElementById("song-info");

    // 更新歌曲信息
    if (currentSong && songInfoEl) {
      // songInfoEl.textContent = `${currentSong.title} - ${currentSong.artist}`;
      songInfoEl.textContent = "";
    }

    // 更新当前歌词
    if (currentLyric && currentLyric.text) {
      if (currentLyricEl) {
        currentLyricEl.textContent = currentLyric.text;
      }

      // 显示下一句歌词
      const currentIndex = lyrics.findIndex((l) => l.time === currentLyric.time);
      if (currentIndex !== -1 && currentIndex + 1 < lyrics.length) {
        const nextLyric = lyrics[currentIndex + 1];
        if (nextLyricEl && nextLyric.text) {
          nextLyricEl.textContent = nextLyric.text;
        } else if (nextLyricEl) {
          nextLyricEl.textContent = "";
        }
      } else {
        if (nextLyricEl) {
          nextLyricEl.textContent = "";
        }
      }
    } else {
      if (currentLyricEl) {
        currentLyricEl.textContent = currentSong ? "暂无歌词" : "等待播放...";
      }
      if (nextLyricEl) {
        nextLyricEl.textContent = "";
      }
    }
  }, [isPipOpen, currentLyric, lyrics, currentSong]);

  return {
    isPipOpen,
    openPipLyrics,
    closePipLyrics,
  };
};
