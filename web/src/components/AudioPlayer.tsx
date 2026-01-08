import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentPlay } from "../store/current-play";
import { getCoverSmallUrl, getMusicUrl, getLyrics } from "../lib/api";
import { usePlaylist } from "../store/playlist";
import { useLocation, useNavigate } from "react-router-dom";
import { formatTime } from "../lib/utils";
import Playlist from "./Playlist";
import { VolumeControl } from "./VolumeControl";
import {
  ChevronFirst,
  ChevronLast,
  ListMusic,
  Loader2,
  Monitor,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { checkRoute, Music, MyRoutes, lyric } from "../lib/defined";
import {
  useGlobalKeyboardShortcuts,
  useKeyboardShortcut,
  useKeyboardScope,
} from "../hooks/use-global-keyboard-shortcuts";
import { useSettingStore } from "../store/setting";
import { mediaSessionManager } from "../lib/media-session";
import { useScrobble } from "../hooks/use-scrobble";
import { useDesktopLyrics } from "../hooks/use-desktop-lyrics";
import "../styles/AudioPlayer.css";

export const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const isDraggingRef = useRef(false);
  const nextSongRef = useRef<((next: number) => void) | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [loadStatus, setLoadStatus] = useState<string>("");


  const {
    currentTime,
    duration,
    isPlaying,
    volume,
    setVolume,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setCurrentLyric,
    setLyrics,
  } = useCurrentPlay();

  const {
    openPlaylist,
    allSongs,
    currentSong,
    setCurrentSong,
    togglePlaylist,
    setAllSongs,
    setShowPlaylist,
    isDetailPage,
    setIsDetailPage,
  } = usePlaylist();

  // 获取协议，判断为安全环境
  const safe_protocol = window.location.protocol === "https:" || window.location.host.startsWith("localhost");

  // const {audioRef} = useBlobAudio(currentSong);
  const { play_mode } = useSettingStore();

  // 桌面歌词功能
  const { isPipOpen, openPipLyrics, closePipLyrics } = useDesktopLyrics();

  const pendingTimeRef = useRef(0) // 记录用户拖动进度条时，播放器暂停时的 currentTime

  // 集成播放历史记录（自动记录）
  useScrobble(currentSong, currentTime, duration, isPlaying);

  // 初始化全局键盘监听
  useGlobalKeyboardShortcuts();

  // 激活播放器作用域
  useKeyboardScope("player");

  // 初始化 Audio 实例
  useEffect(() => {
    const audio = audioRef.current;
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    // 绑定事件监听器
    const handleLoadedMetadata = () => {
      // console.log("歌曲元数据加载完成:", audio.src);
      const duration = audio.duration;
      // 只有当 duration 是有效数字时才设置
      if (isFinite(duration) && duration > 0) {
        setDuration(duration);
      } else {
        setDuration(0);
      }
      setLoadStatus("");
    };

    const handleTimeUpdate = () => {
      if (isDraggingRef.current) return
      setCurrentTime(audio.currentTime)
    };

    const handleEnded = () => {
      console.log("歌曲播放结束", audio.src);
      setIsPlaying(false);
      // 使用 ref 调用最新的 nextSong 函数，避免闭包陷阱
      if (nextSongRef.current) {
        nextSongRef.current(1);
      }
    };

    // const handleError = (e: ErrorEvent) => {
    //   console.error("音频加载错误:", e, audio.src);
    //   setLoadStatus("加载失败");
    //   setIsPlaying(false);
    // };

    const handleCanPlay = () => {
      setLoadStatus("");
    };

    const handleLoadStart = () => {
      setLoadStatus("加载中...");
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    // audio.addEventListener('error', handleError as any);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);


    // 注册 Media Session 事件处理器
    mediaSessionManager.setActionHandlers({
      onPlay: () => {
        playAudio();
      },
      onPause: () => {
        pauseAudio();
      },
      onPrevious: () => {
        if (nextSongRef.current) {
          nextSongRef.current(-1);
        }
      },
      onNext: () => {
        if (nextSongRef.current) {
          nextSongRef.current(1);
        }
      },
      onSeek: (time: number) => {
        // setCurrentTime(time);
        audioRef.current.currentTime = time;
        isPlaying ? pauseAudio() : playAudio();
      },
    });

    return () => {

      // 组件卸载时清理
      mediaSessionManager.clear();

      // 处理 audio 管理
      audio.pause();
      let src = audio.src;
      if (src) { // 释放资源
        URL.revokeObjectURL(src);
      }
      audio.src = '';
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      // audio.removeEventListener('error', handleError as any);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);

    };
  }, []);

  // 同步音量到 audio 元素
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 检查是否为详情播放页
  useEffect(()=> {
    setIsDetailPage(checkRoute(location, MyRoutes.Player));
    
  }, [location])

  // 空格键控制播放暂停
  useKeyboardShortcut(
    "Space",
    () => {
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
    },
    "global",
    10,
    "播放/暂停"
  );

  // p 显示/隐藏播放列表
  useKeyboardShortcut(
    "p",
    () => {
      togglePlaylist();
    },
    "global",
    10,
    "显示/隐藏播放列表"
  );

  // j 跳到上一首歌曲
  useKeyboardShortcut(
    "j",
    () => {
      nextSong(-1);
    },
    "global",
    10,
    "上一首"
  );

  // k 跳到下一首歌曲
  useKeyboardShortcut(
    "k",
    () => {
      nextSong(1);
    },
    "global",
    10,
    "下一首"
  );

  // l 键：开启/关闭桌面歌词
  useKeyboardShortcut(
    "l",
    () => {
      if (isPipOpen) {
        closePipLyrics();
      } else {
        openPipLyrics();
      }
    },
    "global",
    10,
    "开启/关闭桌面歌词"
  );

  useKeyboardShortcut(
    "ArrowUp",
    () => {
      nextSong(-1);
    },
    "playlist",
    10,
    "播放列表：上一首"
  );

  useKeyboardShortcut(
    "ArrowDown",
    () => {
      nextSong(1);
    },
    "playlist",
    10,
    "播放列表：下一首"
  );

  // 切换歌曲时加载新歌曲
  useEffect(() => {
    if (!currentSong || !audioRef.current) {
      console.log("current song or audio element is null", currentSong, audioRef.current);
      return
    };

    console.log("切换歌曲:", currentSong?.title);

    // 更新 Media Session 元数据
    mediaSessionManager.updateMetadata({
      title: currentSong.title || '未知标题',
      artist: currentSong.artist || '未知艺术家',
      album: currentSong.album || '',
      artwork: getCoverSmallUrl(currentSong.cover_art),
    });

    const audio = audioRef.current;

    // 释放旧的 Blob URL
    const oldSrc = audio.src;
    if (oldSrc && oldSrc.startsWith('blob:')) {
      URL.revokeObjectURL(oldSrc);
      // console.log("已释放旧的 Blob URL:", oldSrc);
    }

    // 停止当前播放
    audio.pause();
    audio.src = '';  // 清空 src，确保不引用旧 Blob
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentLyric(null);

    // 创建可取消的 AbortController
    const abortController = new AbortController();

    // 设置新歌曲 URL // 加载到本地，避免进度条 seek 问题
    const load = async () => {
      try {
        const res = await fetch(getMusicUrl(currentSong), {
          signal: abortController.signal
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const blob = await res.blob();

        // 检查是否已取消
        if (abortController.signal.aborted) {
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        audioRef.current.src = objectUrl;
        audioRef.current.load();

        // 加载歌词
        loadLyrics();

        // 检查是否已有用户交互
        const userInteract = localStorage.getItem("userInteract");
        const hasUserInteracted = userInteract === "true";

        if (hasUserInteracted) {
          // 自动播放新歌曲
          playAudio();
        }
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setLoadStatus("加载失败");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoadStatus("");
        }
      }
    };

    load();

    // cleanup 函数：取消未完成的请求
    return () => {
      abortController.abort();
    };
  }, [currentSong]);

  const nextSong = (next: number) => {
    // console.log("current song", currentSong?.title || "unknown");
    if (!currentSong || allSongs.length === 0) {
      console.log("current song or all songs is null");
      return;
    }

    const index = allSongs.findIndex((music) => music.id === currentSong.id);
    let nextIndex: number;
    let nextSongItem: Music;

    // 根据播放模式决定下一首歌曲
    if (play_mode === 2) {
      // 单曲循环模式
      nextIndex = index;
      nextSongItem = currentSong;
    } else if (play_mode === 3) {
      // 随机播放模式
      if (allSongs.length === 1) {
        nextIndex = 0;
      } else {
        // 生成一个不等于当前索引的随机索引
        do {
          nextIndex = Math.floor(Math.random() * allSongs.length);
        } while (nextIndex === index);
      }
      nextSongItem = allSongs[nextIndex];
    } else {
      // 顺序播放模式 (play_mode === 1)
      nextIndex = (index + next + allSongs.length) % allSongs.length;
      nextSongItem = allSongs[nextIndex];
    }

    // console.log(`播放模式: ${play_mode === 1 ? '顺序播放' : play_mode === 2 ? '单曲循环' : '随机播放'}, next song:`, nextSongItem.title);

    if (currentSong.id === nextSongItem.id) {
      // 单曲循环：重置播放位置并重新播放
      console.log("单曲循环：重新播放");
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        playAudio();
      }
    } else {
      // 切换到不同的歌曲
      setCurrentSong(nextSongItem);
      // console.log("next song", nextSongItem.title || "unknown");
      playAudio();
    }
  };

  // 同步 nextSong 函数到 ref，确保事件监听器能访问最新状态
  useEffect(() => {
    nextSongRef.current = nextSong;
  }, [nextSong]);


  const playAudio = async () => {
    localStorage.setItem("userInteract", "true");

    if (!audioRef.current) {
      console.log("audio element is null");
      return;
    }

    const audio = audioRef.current;

    try {
      // audio.currentTime = startTime;
      await audio.play();
      setIsPlaying(true);

      // 更新 Media Session 播放状态
      mediaSessionManager.setPlaybackState('playing');
    } catch (error) {
      console.error("播放失败:", error);
      setIsPlaying(false);
    }
  };

  const pauseAudio = () => {
    if (!audioRef.current) {
      console.log("audio element is null");
      return;
    }

    audioRef.current.pause();
    setIsPlaying(false);

    // 更新 Media Session 播放状态
    mediaSessionManager.setPlaybackState('paused');
  };

  const handleSeekChange = (event: { target: { value: string } }) => {
    const t = Number(event.target.value)
    pendingTimeRef.current = t;
    setCurrentTime(t);
  };

  const loadLyrics = async () => {
    if (!currentSong) {
      return;
    }
    getLyrics(
      currentSong.id,
      (lyrics: lyric[]) => {
        if (!lyrics || lyrics.length === 0) {
          setLyrics([]);
          return;
        }
        setLyrics(lyrics);
      },
      (error) => {
        console.error("加载歌词失败:", error);
        setLyrics([]);
      }
    );
  };

  const coverClick = () => {
    if (!currentSong) {
      return;
    }
    if (isDetailPage) {
      navigate(-1);
      return;
    }
    navigate(MyRoutes.Player.replace(":id", currentSong.id));
  };

  const clearPlaylist = () => {
    setAllSongs([]);
    togglePlaylist(false);
    pauseAudio();
  };

  const [showVolume, setShowVolume] = useState<boolean>(false);

  // 根据 showVolume 动态激活/停用音量作用域
  useEffect(() => {
    const { globalKeyboardManager } = require("../hooks/use-global-keyboard-shortcuts");
    if (showVolume) {
      globalKeyboardManager.activateScope("volume");
      setShowPlaylist(false);
    } else {
      globalKeyboardManager.deactivateScope("volume");
    }
  }, [showVolume]);

  // 根据 openPlaylist 动态激活/停用播放列表作用域
  useEffect(() => {
    const { globalKeyboardManager } = require("../hooks/use-global-keyboard-shortcuts");
    if (openPlaylist) {
      globalKeyboardManager.activateScope("playlist");
    } else {
      globalKeyboardManager.deactivateScope("playlist");
    }
  }, [openPlaylist]);

  return (
    <>
      <div className="audio-player-container">
        {/* 进度条 */}
        {currentSong && (
          <div className="progress-wrapper">
            <input
              className="play-progress w-full absolute top-[-6px] left-0"
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={currentTime}
              onPointerDown={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                }
                isDraggingRef.current = true
              }}
              onPointerUp={() => {
                isDraggingRef.current = false
                if (audioRef.current) {
                  audioRef.current.currentTime = pendingTimeRef.current
                  audioRef.current.play();
                }
              }}
              onChange={handleSeekChange}
              aria-label="播放进度"
            />
          </div>
        )}

        {currentSong && (
          <div className="player-content">
            {/* 左侧：封面 + 歌曲信息 */}
            <div className="player-left">
              <div
                className="album-cover-wrapper cursor-pointer album-spin-wrapper border-[10px]"
                onClick={coverClick}
                role="button"
                tabIndex={0}
                aria-label={isDetailPage ? "返回上一页" : "查看歌曲详情"}
              >
                <img
                  src={getCoverSmallUrl(currentSong.cover_art)}
                  alt={`${currentSong.title} 封面`}
                  className={`album-cover-image ${isPlaying ? "album-cover-spinning" : ""}`}
                />
              </div>

              <div className="song-info">
                {loadStatus ? (
                  <div className="loading-indicator">
                    <Loader2 className="loading-spinner" size={16} />
                    <span>{loadStatus}</span>
                  </div>
                ) : isDetailPage ? (
                  <>
                    <div className="song-title">{currentSong.title || "未知标题"}</div>
                    <div className="song-artist">{currentSong.artist || "未知艺术家"}</div>
                  </>
                ) : (
                  <ShowCurrentLyric currentSong={currentSong} loadStatus={loadStatus} />
                )}
              </div>
            </div>

            {/* 中间：播放控制 */}
            <div className="player-center">
              <div className="controls-group">
                <button
                  className="control-button"
                  onClick={() => nextSong(-1)}
                  aria-label="上一首"
                >
                  <ChevronFirst size={24} />
                </button>

                <button
                  className={`play-button control-button ${isPlaying ? "playing" : ""}`}
                  onClick={() => (isPlaying ? pauseAudio() : playAudio())}
                  aria-label={isPlaying ? "暂停" : "播放"}
                >
                  {(isPlaying ? <PauseCircle size={28} /> : <PlayCircle size={28} />)}
                </button>

                <button
                  className="control-button"
                  onClick={() => nextSong(1)}
                  aria-label="下一首"
                >
                  <ChevronLast size={24} />
                </button>
              </div>

              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* 右侧：音量 + 桌面歌词 + 播放列表 */}
            <div className="player-right">
              <VolumeControl
                volume={volume}
                setVolume={setVolume}
                showVolume={showVolume}
                setShowVolume={setShowVolume}
              />

              {safe_protocol && // 仅在 https 协议下显示桌面歌词按钮
                <button
                  className={`control-button ${isPipOpen ? "active" : ""}`}
                  onClick={() => isPipOpen ? closePipLyrics() : openPipLyrics()}
                  aria-label={isPipOpen ? "关闭桌面歌词" : "开启桌面歌词"}
                  title={isPipOpen ? "关闭桌面歌词" : "开启桌面歌词"}
                >
                  <Monitor size={20} />
                </button>
              }

              <button
                className="control-button"
                onClick={() => togglePlaylist(true)}
                aria-label="播放列表"
              >
                <ListMusic size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Playlist clearPlaylist={clearPlaylist} />
    </>
  );
};

const ShowCurrentLyric = ({
  currentSong,
  loadStatus,
}: {
  currentSong: Music;
  loadStatus: string;
}) => {
  const { currentLyric } = useCurrentPlay();

  if (loadStatus.length > 0) return null;

  return (
    <>
      {currentLyric && currentLyric.text ? (
        <div className="song-lyric">{currentLyric.text}</div>
      ) : (
        <>
          <div className="song-title">{currentSong.title || "未知标题"}</div>
          <div className="song-artist">{currentSong.artist || "未知艺术家"}</div>
        </>
      )}
    </>
  );
};