import { useEffect, useMemo, useState } from "react";
import { useCurrentPlay } from "../store/current-play";
import { getCoverSmallUrl, getMusicUrl } from "../lib/api";
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
import { checkRoute, Music, MyRoutes } from "../lib/defined";
import { toast } from "sonner";
import { audioBufferCache } from "../lib/audio-cache";
import { StreamingAudioLoader } from "../lib/streaming-loader";
import {
  useGlobalKeyboardShortcuts,
  useKeyboardShortcut,
  useKeyboardScope,
} from "../hooks/use-global-keyboard-shortcuts";

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
    hasUserInteracted,
    setVolume,
    setMutedVolume,
    setAudioContext,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setCurrentLyric,
    setHasUserInteracted,
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
        toast.success("开启静音");
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
    if (isDetailPage && audioContext == null) {
      return;
    }
    // 注释掉这个检查，允许在播放过程中切歌
    // if (currentTime > 0) {
    //   return;
    // }
    // console.log("audio buffer or gain node changed");
    console.log("切换歌曲:", currentSong?.title);
    initStatus();
    loadAudioFile();
    // 等待 10 秒后开始预加载下一首歌曲
    setTimeout(() => {
      preDecodeAudioBuffer();
    }, 10 * 1000);
  }, [currentSong]);

  useEffect(() => {
    if (audioBuffer && hasUserInteracted) {
      // 如果用户已经交互过,自动播放新加载的歌曲
      if (gainNode === null && audioContext) {
        initGainNode(audioContext);
      }
      pauseAudio();
      playAudio(0);
    }
  }, [audioBuffer]);

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
    if (currentSong) {
      const index = allSongs.findIndex((music) => music.id === currentSong.id);
      const nextIndex = (index + next + allSongs.length) % allSongs.length;
      const nextSong = allSongs[nextIndex];
      setCurrentSong(nextSong);
      console.log("next song", nextSong.title || "unknown");
      if (currentSong.id === nextSong.id) {
        initStatus();
        loadAudioFile(); // 重新加载当前歌曲
      }
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
    // 标记用户已经交互过
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }

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
    if (!gainNode) {
      return;
    }
    gainNode.gain.value = value;
    setVolume(value);
    setGainNode(gainNode);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-playstatus text-playstatus-foreground min-h-[88px] max-h-[88px] flex justify-center items-center">
      <div className="grid grid-cols-[64px,1fr] gap-4 w-full h-full relative px-4 py-2">
        {currentSong && (
          <input
            className="play-progress w-full absolute top-[-6px] left-0"
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeekChange}
          />
        )}
        {currentSong && (
          <div className="flex gap-4 justify-center items-center min-w-[64px]">
            <div
              className="cursor-pointer album-spin-wrapper border-[10px] "
              onClick={coverClick}
            >
              <img
                src={getCoverSmallUrl(currentSong.cover_art)}
                alt=""
                // width={42}
                className={isPlaying ? "album-spin" : ""}
                style={{width: 42, height: 42}}
              />
            </div>
          </div>
        )}
        {currentSong && (
          <div className="gap-2 w-full grid grid-rows-2">
            <div
              className={`song-title flex flex-row gap-1 justify-center items-center overflow-hidden`}
            >
              <ShowLoader loadStatus={loadStatus} />
              <ShowTitle currentSong={currentSong} loadStatus={loadStatus} />
            </div>

            <div
              className={`play-controls flex gap-2 flex-row justify-center items-center`}
            >
              {isDetailPage && (
                // <div
                //   className="hover:text-primary-hover cursor-pointer"
                //   onClick={groupSong}
                // >
                //   <Star />
                // </div>
                <></>
              )}

              <div
                className="prevsong hover:text-primary-hover cursor-pointer"
                onClick={() => nextSong(-1)}
              >
                <ChevronFirst />
              </div>

              <div
                className="play-pause hover:text-primary-hover cursor-pointer "
                onClick={() => {
                  isPlaying
                    ? pauseAudio()
                    : playAudio(currentTime >= duration ? 0 : currentTime);
                }}
              >
                {isPlaying ? (
                  <PauseCircle size={32} />
                ) : (
                  <PlayCircle size={32} />
                )}
              </div>

              <div
                className="nextsong hover:text-primary-hover cursor-pointer"
                onClick={() => nextSong(1)}
              >
                <ChevronLast />
              </div>

              <span className="text-sm text-muted-foreground">
                {formatTime(currentTime)}/{formatTime(duration)}
              </span>

              <div
                className="cursor-pointer hover:text-primary-hover"
                onClick={()=>togglePlaylist(true)}
              >
                <ListMusic />
              </div>

              <div className="volume-control relative">
                <div className="flex justify-center items-center gap-2">
                  <div
                    className="hover:text-primary-hover volume-icon"
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
            </div>
          </div>
        )}
      </div>

      <Playlist clearPlaylist={clearPlaylist} />
    </div>
  );
};

const ShowLoader = ({ loadStatus }: { loadStatus: string }) => {
  if (loadStatus.length === 0) {
    return null;
  }
  return (
    <div className="flex gap-2 justify-center items-center w-full h-full">
      <Loader2 className="animate-spin" />
      <span className="text-sm text-muted-foreground">{loadStatus}</span>
    </div>
  );
};

const ShowTitle = ({
  currentSong,
  loadStatus,
}: {
  currentSong: Music;
  loadStatus: string;
}) => {
  if (loadStatus.length > 0) return null;
  return (
    <span className=" whitespace-nowrap overflow-hidden text-ellipsis ">
      <span className=" whitespace-nowrap overflow-hidden text-ellipsis ">
        {currentSong.title || "未知标题"}
      </span>
      <span className="ml-2 text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ">
        {currentSong.artist}
      </span>
    </span>
  );
};
