import { useEffect, useRef } from "react";
import { Music } from "../lib/defined";
import { scrobble } from "../lib/api";

/**
 * Scrobble Hook - 自动记录播放历史
 *
 * 规则：
 * 1. 播放 10 秒后记录"正在播放"（submission=false）
 * 2. 播放到倒数 10 秒时记录"已播放"（submission=true）
 * 3. 歌曲时长 < 20 秒：不记录
 */
export const useScrobble = (
  currentSong: Music | null,
  currentTime: number,
  duration: number,
  isPlaying: boolean
) => {
  // 状态管理（使用 Ref 避免重渲染）
  const hasScrobbledNowPlayingRef = useRef(false);
  const hasScrobbledPlayedRef = useRef(false);
  const scrobbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSongIdRef = useRef<string | null>(null);

  // 重置 scrobble 状态
  const resetScrobbleState = () => {
    hasScrobbledNowPlayingRef.current = false;
    hasScrobbledPlayedRef.current = false;

    // 清理定时器
    if (scrobbleTimerRef.current) {
      clearTimeout(scrobbleTimerRef.current);
      scrobbleTimerRef.current = null;
    }
  };

  // 记录"正在播放"
  const handleScrobbleNowPlaying = () => {
    if (!currentSong || hasScrobbledNowPlayingRef.current) return;

    scrobble(
      currentSong.id,
      false, // submission=false 表示正在播放
      undefined,
      (data) => {
        if (data.success) {
          hasScrobbledNowPlayingRef.current = true;
          console.log("[Scrobble] 记录正在播放:", currentSong.title);
        }
      },
      (error) => {
        console.error("[Scrobble] 记录失败:", error);
      }
    );
  };

  // 记录"已播放"
  const handleScrobblePlayed = () => {
    if (!currentSong || hasScrobbledPlayedRef.current) return;

    scrobble(
      currentSong.id,
      true, // submission=true 表示已播放
      undefined,
      (data) => {
        if (data.success) {
          hasScrobbledPlayedRef.current = true;
          console.log("[Scrobble] 记录已播放:", currentSong.title);
        }
      },
      (error) => {
        console.error("[Scrobble] 记录失败:", error);
      }
    );
  };

  // 监听歌曲切换
  useEffect(() => {
    if (!currentSong) return;

    // 检测歌曲是否切换
    if (lastSongIdRef.current !== currentSong.id) {
      console.log("[Scrobble] 歌曲切换，重置状态");
      resetScrobbleState();
      lastSongIdRef.current = currentSong.id;
    }
  }, [currentSong]);

  // 监听播放状态 - 启动/清理定时器
  useEffect(() => {
    if (!currentSong || duration <= 20) {
      // 歌曲时长 <= 20 秒，不记录
      return;
    }

    if (isPlaying) {
      // 开始播放：10 秒后记录"正在播放"
      if (!hasScrobbledNowPlayingRef.current && !scrobbleTimerRef.current) {
        scrobbleTimerRef.current = setTimeout(() => {
          handleScrobbleNowPlaying();
        }, 10000); // 10 秒
      }
    } else {
      // 暂停播放：清理定时器
      if (scrobbleTimerRef.current) {
        clearTimeout(scrobbleTimerRef.current);
        scrobbleTimerRef.current = null;
      }
    }

    return () => {
      // 清理定时器
      if (scrobbleTimerRef.current) {
        clearTimeout(scrobbleTimerRef.current);
        scrobbleTimerRef.current = null;
      }
    };
  }, [isPlaying, currentSong, duration]);

  // 监听播放进度 - 检测倒数 10 秒
  useEffect(() => {
    if (!currentSong || duration <= 20) return;
    if (hasScrobbledPlayedRef.current) return;

    const remainingTime = duration - currentTime;

    // 播放到倒数 10 秒时，记录"已播放"
    if (remainingTime <= 10 && remainingTime > 0) {
      handleScrobblePlayed();
    }
  }, [currentTime, currentSong, duration]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      resetScrobbleState();
    };
  }, []);
};
