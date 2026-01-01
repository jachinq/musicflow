import _React, { useEffect, useMemo, useState } from "react";
import { useCurrentPlay } from "../store/current-play";
import { getCoverSmallUrl, getMusicUrl, getLyrics } from "../lib/api";
import { usePlaylist } from "../store/playlist";
import { useLocation, useNavigate } from "react-router-dom";
import { formatTime } from "../lib/utils";
import Playlist from "./Playlist";
import {
  ChevronFirst,
  ChevronLast,
  ListMusic,
  Loader2,
  PauseCircle,
  PlayCircle,
  // Star,
  Volume1Icon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { checkRoute, Music, MyRoutes, lyric } from "../lib/defined";
import { toast } from "sonner";
import { audioBufferCache } from "../lib/audio-cache";
import { StreamingAudioLoader } from "../lib/streaming-loader";
import {
  useGlobalKeyboardShortcuts,
  useKeyboardShortcut,
  useKeyboardScope,
} from "../hooks/use-global-keyboard-shortcuts";
import { useSettingStore } from "../store/setting";
import "../styles/AudioPlayer.css";

export const AudioPlayer = () => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const [progressIntevalId, setProgressIntevalId] = useState<NodeJS.Timeout | null>(
    null
  );
  const navigate = useNavigate();
  const location = useLocation();
  const [loadStatus, setLoadStatus] = useState<string>("");

  const isDetailPage = useMemo(() => (checkRoute(location, MyRoutes.Player)), [location]);

  const {
    audioContext,
    currentTime,
    duration,
    isPlaying,
    volume,
    mutedVolume,
    setVolume,
    setMutedVolume,
    setAudioContext,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setCurrentLyric,
    setLyrics,
  } = useCurrentPlay();
  const [gainNode, setGainNode] = useState<GainNode | null>(null);

  const {
    openPlaylist,
    allSongs,
    currentSong,
    setCurrentSong,
    togglePlaylist,
    setAllSongs,
  } = usePlaylist();

  const { play_mode } = useSettingStore();

  // 初始化全局键盘监听
  useGlobalKeyboardShortcuts();

  // 激活播放器作用域
  useKeyboardScope("player");

  // 空格键控制播放暂停
  useKeyboardShortcut(
    "Space",
    () => {
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio(currentTime >= duration ? 0 : currentTime);
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

  useKeyboardShortcut(
    "ArrowUp",
    () => {
      nextSong(-1);
    },
    "playlist",
    10,
    "播放列表：上一首"
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

  useKeyboardShortcut(
    "ArrowDown",
    () => {
      nextSong(1);
    },
    "playlist",
    10,
    "播放列表：下一首"
  );


  useEffect(() => {
    console.log("AudioPlayer mounted", currentSong);
    if (isDetailPage && audioContext == null) {
      return;
    }
    // console.log("audio buffer or gain node changed");
    console.log("切换歌曲:", currentSong?.title);
    initStatus();
    loadAudioFile();
    loadLyrics();
    // 等待 10 秒后开始预加载下一首歌曲
    setTimeout(() => {
      preDecodeAudioBuffer();
    }, 10 * 1000);
  }, [currentSong]);

  useEffect(() => {
    const userInteract = localStorage.getItem("userInteract");
    // From True/False to Boolean
    const hasUserInteracted = userInteract === "true";

    if (audioBuffer && hasUserInteracted) {
      // 如果用户已经交互过,自动播放新加载的歌曲
      if (gainNode === null && audioContext) {
        initGainNode(audioContext);
      }
      pauseAudio();
      playAudio(0);
    }
  }, [audioBuffer, audioContext]);

  useEffect(() => {
    // 检查歌曲是否播放结束（加 0.5 秒容差，且只在接近结尾时触发一次）
    if (currentTime >= duration - 0.5 && duration > 0 && isPlaying && currentTime < duration + 1) {
      console.log("end of song", currentTime, duration);
      // 立即停止播放，避免多次触发
      pauseAudio();
      nextSong(1);
    }
  }, [currentTime, duration, isPlaying]);

  const initStatus = () => {
    // 停止播放并清理所有状态
    if (source) {
      try {
        source.stop();
      } catch (e) {
        console.log("source already stopped in initStatus");
      }
      setSource(null);
    }

    if (progressIntevalId) {
      clearInterval(progressIntevalId);
      setProgressIntevalId(null);
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0); // 重置 duration，避免误判歌曲结束
    setAudioBuffer(null);
    setCurrentLyric(null);
  };

  const nextSong = (next: number) => {
    console.log("current song", currentSong?.title || "unknown");
    if (!currentSong || allSongs.length === 0) {
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

    console.log(`播放模式: ${play_mode === 1 ? '顺序播放' : play_mode === 2 ? '单曲循环' : '随机播放'}, next song:`, nextSongItem.title);

    if (currentSong.id === nextSongItem.id) {
      // 单曲循环：重置播放位置并重新播放
      console.log("单曲循环：重新播放");

      // 停止当前播放
      if (source) {
        try {
          source.stop();
        } catch (e) {
          console.log("source already stopped in nextSong");
        }
        setSource(null);
      }
      if (progressIntevalId) {
        clearInterval(progressIntevalId);
        setProgressIntevalId(null);
      }

      // 立即重置时间，避免触发结束检测
      setCurrentTime(0);
      setIsPlaying(false);

      // 延迟一下再播放，确保状态已更新
      setTimeout(() => {
        playAudio(0);
      }, 50);
    } else {
      // 切换到不同的歌曲
      setCurrentSong(nextSongItem);
      console.log("next song", nextSongItem.title || "unknown");
    }
  };
  const initAudioContext = () => {
    if (audioContext) return audioContext;
    let audioContextTmp = new AudioContext();
    setAudioContext(audioContextTmp);
    return audioContextTmp;
  };
  const initGainNode = (audioContext: AudioContext) => {
    if (gainNode) return gainNode;
    let gainNodeTmp = audioContext.createGain();
    gainNodeTmp.connect(audioContext.destination);
    gainNodeTmp.gain.value = volume;
    setGainNode(gainNodeTmp);
    return gainNodeTmp;
  };
  const initAudioBuffer = async (song: Music | null) => {
    if (!song) return null;

    // 优先从缓存中获取
    const cachedBuffer = audioBufferCache.get(song.id);
    if (cachedBuffer) {
      console.log(`[AudioPlayer] 从缓存加载: ${song.title}`);
      setAudioBuffer(cachedBuffer);
      setDuration(cachedBuffer.duration);
      return cachedBuffer;
    }

    // 缓存未命中，开始解码
    await decodeAudioBuffer(song, true);
    return audioBufferCache.get(song.id);
  };

  const playAudio = async (startTime: number = 0) => {
    localStorage.setItem("userInteract", "true"); // 用户交互过，记录状态

    initGainNode(initAudioContext());
    const audioBuffer = await initAudioBuffer(currentSong);
    // console.log("play", audioContext.state, startTime);
    if (!audioContext) {
      console.log("audio context is null");
      return;
    }
    if (!audioBuffer) {
      console.log("audio buffer is null");
      return;
    }
    if (!gainNode) {
      console.log("gain node is null");
      return;
    }
    const sourceStartTime = audioContext.currentTime;
    const startOffset = startTime;

    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(gainNode);
    // sourceNode.connect(audioContext.destination);
    sourceNode.start(0, startTime);
    setSource(sourceNode);

    setIsPlaying(true);
    audioContext.resume();

    if (progressIntevalId) {
      clearInterval(progressIntevalId);
    }
    // 更新当前播放时间
    const interval = setInterval(() => {
      setCurrentTime(audioContext.currentTime - sourceStartTime + startOffset);
    }, 100);
    setProgressIntevalId(interval);
  };

  const pauseAudio = () => {
    if (!audioContext) {
      console.log("audio context is null");
      return;
    }
    // console.log("pause", audioContext.state);
    if (progressIntevalId) {
      clearInterval(progressIntevalId);
      setProgressIntevalId(null);
    }
    if (audioContext.state === "running") {
      audioContext.suspend();
    }
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // source 可能已经停止，忽略错误
        console.log("source already stopped");
      }
      setSource(null);
      setIsPlaying(false);
    }
  };

  const handleSeekChange = (event: { target: { value: string } }) => {
    const seekTime = parseFloat(event.target.value);
    setCurrentTime(seekTime);
    isPlaying && pauseAudio();
    playAudio(seekTime);
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

  const loadAudioFile = async () => {
    if (!currentSong) {
      return;
    }
    try {
      setLoadStatus("加载中...");
      // 不在这里创建 AudioContext,等待用户点击播放按钮时再创建
      // 只预加载音频数据
      decodeAudioBuffer(currentSong, true);
    } catch (error) {
      console.log("load audio file error", error);
      setLoadStatus("加载失败...");
    }
  };

  const decodeAudioBuffer = async (song: Music, actuallyDecode: boolean) => {
    // 检查缓存
    const cachedBuffer = audioBufferCache.get(song.id);
    if (cachedBuffer) {
      if (actuallyDecode) {
        setLoadStatus("从缓存加载...");
        setAudioBuffer(cachedBuffer);
        setDuration(cachedBuffer.duration);
        setLoadStatus("");
      }
      song.samplerate = cachedBuffer.sampleRate;
      return;
    }

    // 缓存未命中，加载并解码音频文件
    let fileArrayBuffer = await loadFileArrayBuffer(song);
    if (!fileArrayBuffer) return;

    actuallyDecode && setLoadStatus("解码音频数据...");

    try {
      // 复用现有的 audioContext 或创建一个临时的用于解码
      // 注意:这里创建的 AudioContext 仅用于解码,不会自动播放
      const decodeContext = audioContext || new AudioContext();
      const audioBuffer = await decodeContext.decodeAudioData(fileArrayBuffer);

      // 存入缓存
      audioBufferCache.set(song.id, audioBuffer);
      console.log(`[AudioPlayer] 缓存音频: ${song.title}`, audioBufferCache.getStats());

      if (actuallyDecode) {
        setAudioBuffer(audioBuffer);
        setDuration(audioBuffer.duration);
        setLoadStatus("");
      }

      song.samplerate = audioBuffer.sampleRate;
    } catch (error) {
      console.log("decode audio data error", error);
      setLoadStatus("解码音频数据失败...");
    }
  };

  const preDecodeAudioBuffer = () => {
    if (!currentSong) {
      return;
    }
    console.log("pre decode next song");
    const currentIndex = allSongs.findIndex(
      (music) => music.id === currentSong.id
    );
    const nextIndex = (currentIndex + 1) % allSongs.length;
    if (currentIndex === nextIndex) return;
    const nextSong = allSongs[nextIndex];
    if (nextSong.id === currentSong.id) {
      return;
    }
    decodeAudioBuffer(nextSong, false);
  };

  const loadFileArrayBuffer = async (song: Music) => {
    song.file_url = getMusicUrl(song);

    // 使用流式加载器,带进度显示
    const loader = new StreamingAudioLoader();

    try {
      return await loader.loadFull({
        url: song.file_url,
        onProgress: (progress) => {
          setLoadStatus(`加载中... ${Math.floor(progress)}%`);
          if (progress >= 100) {
            setLoadStatus("");
          }
        },
      });
    } catch (error) {
      console.error("Streaming load failed, fallback to normal fetch", error);
      // 如果流式加载失败,降级到传统方式
      const fallbackResponse = await fetch(song.file_url);
      return await fallbackResponse.arrayBuffer();
    }
  };

  const coverClick = () => {
    if (!currentSong) {
      return;
    }
    // console.log(isDetailPage, MyRoutes.Player.replace(":id", currentSong.id))
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

  const changeVolume = (value: number) => {
    setVolume(value);
    if (!gainNode) {
      return;
    }
    gainNode.gain.value = value;
    // setGainNode(gainNode);
  };

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
              value={currentTime}
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
                  onClick={() => {
                    isPlaying
                      ? pauseAudio()
                      : playAudio(currentTime >= duration ? 0 : currentTime);
                  }}
                  aria-label={isPlaying ? "暂停" : "播放"}
                >
                  {isPlaying ? (
                    <PauseCircle size={28} />
                  ) : (
                    <PlayCircle size={28} />
                  )}
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

            {/* 右侧：音量 + 播放列表 */}
            <div className="player-right">
              <div className="volume-control relative">
                <div className="flex justify-center items-center gap-2">
                  <div
                    className="control-button volume-icon"
                    onClick={() => setShowVolume(!showVolume)}
                  >
                    {volume > 0.5 && <Volume2Icon />}
                    {volume <= 0.5 && volume > 0 && <Volume1Icon />}
                    {volume <= 0 && <VolumeXIcon />}
                  </div>
                </div>
                {showVolume && (
                  <>
                    <div title={volume.toFixed(2)}>
                      <div className="volume-slider z-10">
                        <input
                          className="w-[128px]"
                          type="range"
                          dir="btt"
                          min="0"
                          max="1"
                          step="0.001"
                          value={volume}
                          onChange={(e) =>
                            changeVolume(parseFloat(e.target.value))
                          }
                        />
                      </div>
                    </div>
                    <div
                      className="volume-slider-mask fixed top-0 left-0 w-full h-full bg-black-translucent"
                      onClick={() => setShowVolume(false)}
                    ></div>
                  </>
                )}
              </div>

              <button
                className={`control-button ${openPlaylist ? "active" : ""}`}
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
