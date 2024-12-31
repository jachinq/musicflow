import { useEffect, useState } from "react";
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
  Star,
  Volume1Icon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { Music } from "../lib/defined";
import { useKeyPress } from "../hooks/use-keypress";
import { toast } from "sonner";

export const AudioPlayer = () => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const [progressIntevalId, setProgressIntevalId] = useState<number | null>(
    null
  );
  const navigate = useNavigate();
  const location = useLocation();
  const [loadStatus, setLoadStatus] = useState<string>("");

  const isDetailPage = location.pathname.startsWith("/detail");

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
  } = useCurrentPlay();
  const [gainNode, setGainNode] = useState<GainNode | null>(null);

  const {
    showPlaylist,
    allSongs,
    currentSong,
    setCurrentSong,
    setShowPlaylist,
    setAllSongs,
  } = usePlaylist();

  // 空格键控制播放暂停
  useKeyPress(" ", () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio(currentTime >= duration ? 0 : currentTime);
    }
  });

  // p 显示/隐藏播放列表
  useKeyPress("p", () => {
    setShowPlaylist(!showPlaylist);
  });

  // j 跳到上一首歌曲
  useKeyPress("j", () => {
    nextSong(-1);
  });

  // k 跳到下一首歌曲
  useKeyPress("k", () => {
    nextSong(1);
  });

  // b 静音/取消静音
  useKeyPress("b", () => {
    let isMuted = volume > 0;
    if (isMuted) {
      setMutedVolume(volume);
      toast.success("开启静音");
    } else {
      setMutedVolume(0);
      toast.success("取消静音");
    }
    changeVolume(isMuted? 0 : mutedVolume || 0.5);
  });

  // v 显示/隐藏音量
  useKeyPress("v", () => {
    setShowVolume(!showVolume);
  });

  // 音量键调节音量 / 切歌
  useKeyPress("ArrowUp", () => {
    if (showVolume && volume < 1) changeVolume(Math.min(volume + 0.005, 1));
    if (showPlaylist) nextSong(-1);
  });
  useKeyPress("ArrowDown", () => {
    if (showVolume && volume > 0) changeVolume(Math.max(volume - 0.005, 0));
    if (showPlaylist) nextSong(1);
  });

  useEffect(() => {
    if (isDetailPage && audioContext == null) {
      return;
    }
    initStatus();
    loadAudioFile();
    // 等待 10 秒后开始预加载下一首歌曲
    setTimeout(() => {
      preDecodeAudioBuffer();
    }, 10 * 1000);
  }, [currentSong]);

  useEffect(() => {
    if (audioBuffer) {
      if (gainNode === null && audioContext) {
        initGainNode(audioContext);
      }
      pauseAudio();
      playAudio(0);
    }
  }, [audioBuffer, gainNode]);

  useEffect(() => {
    if (currentTime >= duration && isPlaying) {
      console.log("end of song");
      nextSong(1);
    }
  }, [currentTime]);

  const initStatus = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioBuffer(null);
    setCurrentLyric(null);
    progressIntevalId && clearInterval(progressIntevalId);
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
    if (audioBuffer) return audioBuffer;
    if (song.decodedAudioBuffer) {
      setAudioBuffer(song.decodedAudioBuffer);
      return song.decodedAudioBuffer;
    }
    await decodeAudioBuffer(song, true);
    return song.decodedAudioBuffer;
  };

  const playAudio = async (startTime: number = 0) => {
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
    }
    if (audioContext.state === "running") {
      audioContext.suspend();
    }
    if (source) {
      source.stop();
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
      let audioContextTmp = audioContext;
      if (!audioContextTmp) {
        setLoadStatus("设置音频上下文...");
        audioContextTmp = new AudioContext();
        setAudioContext(audioContextTmp);
        setLoadStatus("创建音量节点...");
        const gainNodeTmp = audioContextTmp.createGain();
        gainNodeTmp.connect(audioContextTmp.destination);
        gainNodeTmp.gain.value = volume;
        setGainNode(gainNodeTmp);
      }
      audioContextTmp.suspend(); // 先暂停，等点击播放按钮后再恢复

      decodeAudioBuffer(currentSong, true);
    } catch (error) {
      console.log("load audio file error", error);
      setLoadStatus("加载失败...");
    }
  };

  const decodeAudioBuffer = async (song: Music, actuallyDecode: boolean) => {
    await loadFileArrayBuffer(song);
    let fileArrayBuffer = song.fileArrayBuffer;
    if (!fileArrayBuffer) return;

    if (song.decodedAudioBuffer) {
      actuallyDecode && setLoadStatus("解码音频数据...");
      actuallyDecode && setAudioBuffer(song.decodedAudioBuffer);
      actuallyDecode && setDuration(song.decodedAudioBuffer.duration);
      actuallyDecode && setLoadStatus("");
    } else {
      // 克隆一个新的ArrayBuffer，避免影响到原数组
      let copyBuffer = fileArrayBuffer.slice(0);
      // console.log("start decode audio data", song.name);
      actuallyDecode && setLoadStatus("解码音频数据...");
      new AudioContext()
        .decodeAudioData(copyBuffer)
        .then((audioBuffer) => {
          actuallyDecode && setAudioBuffer(audioBuffer);
          actuallyDecode && setDuration(audioBuffer.duration);
          song.decodedAudioBuffer = audioBuffer;
          actuallyDecode && setLoadStatus("");
        })
        .catch((_error) => {
          setLoadStatus("解码音频数据失败...");
        });
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
    const nextSong = allSongs[nextIndex];
    if (nextSong.id === currentSong.id) {
      return;
    }
    decodeAudioBuffer(nextSong, false);
  };

  const loadFileArrayBuffer = async (song: Music) => {
    if (song.fileArrayBuffer) {
      return;
    }
    song.file_url = getMusicUrl(song);
    const response = await fetch(song.file_url);
    const arrayBuffer = await response.arrayBuffer();
    song.fileArrayBuffer = arrayBuffer;
  };

  const coverClick = () => {
    if (!currentSong) {
      return;
    }
    if (isDetailPage) {
      navigate(-1);
      return;
    }
    navigate("/detail/" + currentSong.id);
  };

  const clearPlaylist = () => {
    setAllSongs([]);
    setShowPlaylist(false);
    pauseAudio();
  };

  const groupSong = () => {
    if (!currentSong) {
      return;
    }
    // TODO: open group modal
  };

  const [showVolume, setShowVolume] = useState<boolean>(false);
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
                src={getCoverSmallUrl(currentSong.id)}
                alt=""
                width={42}
                className={isPlaying ? "album-spin" : ""}
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
                <div
                  className="hover:text-primary-hover cursor-pointer"
                  onClick={groupSong}
                >
                  <Star />
                </div>
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
                onClick={() => setShowPlaylist(!showPlaylist)}
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
