import { useEffect, useRef, useState } from "react";
import { useCurrentPlay } from "../store/current-play";
import { getMusicUrl } from "../lib/api";
import { readMetaByBuffer } from "../lib/readmeta";
import { usePlaylist } from "../store/playlist";
import { useLocation, useNavigate } from "react-router-dom";
import { formatTime } from "../lib/utils";
import Playlist from "./Playlist";
import {
  ChevronFirst,
  ChevronLast,
  List,
  Loader2,
  PauseCircle,
  PlayCircle,
  Star,
  Volume1Icon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { Music } from "../def/CommDef";

function AudioPlayer() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const [progressIntevalId, setProgressIntevalId] = useState<number | null>(
    null
  );
  const navigate = useNavigate();
  const location = useLocation();
  const [loadStatus, setLoadStatus] = useState<string>("加载中...");

  const isDetailPage = location.pathname.startsWith("/music");

  const {
    audioContext,
    currentTime,
    duration,
    isPlaying,
    volume,
    setVolume,
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
    pageSongs,
    setCurrentSong,
    setShowPlaylist,
    setAllSongs,
  } = usePlaylist();

  const handleKeyDown = (event: KeyboardEvent) => {
    console.log("keydown", event.code, isPlaying);
    if (event.code === "Space") {
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
    }
    // if (event.code === "ArrowRight") {
    //   nextSong();
    // }
    // if (event.code === "ArrowLeft") {
    //   prevSong();
    // }
    // if (event.code === "KeyP") {
    //   if (showPlaylist) {
    //     setShowPlaylist(false);
    //   } else {
    //     setShowPlaylist(true);
    //   }
    // }
    // if (event.code === "KeyC") {
    //   clearPlaylist();
    // }
    // if (event.code === "KeyG") {
    //   groupSong();
    // }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    initStatus();
    loadAudioFile();

    preDecodeAudioBuffer();
  }, [currentSong]);
  useEffect(() => {
    if (audioBuffer && audioContext) {
      pauseAudio();
      playAudio(0);
    }
  }, [audioBuffer]);

  useEffect(() => {
    if (currentTime >= duration) {
      console.log("end of song");
      nextSong(1);
    }
  }, [currentTime]);

  // 处理播放列表的meta数据
  useEffect(()=> {
    if (!pageSongs || pageSongs.length === 0) return;

    pageSongs.forEach((song) => {
      if (song.metadata && song.fileArrayBuffer) return;
      getMetatData(song);
    });
  }, [pageSongs]);

  const initStatus = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioBuffer(null);
    setCurrentLyric(null);
    progressIntevalId && clearInterval(progressIntevalId);
  }

  const nextSong = (next: number) => {
    console.log("current song", currentSong?.name);
    if (currentSong) {
      const index = allSongs.findIndex((music) => music.id === currentSong.id);
      const nextIndex = (index + next + allSongs.length) % allSongs.length;
      const nextSong = allSongs[nextIndex];
      setCurrentSong(nextSong);
      console.log("next song", nextSong.metadata?.title || nextSong.name);
      if (currentSong.id === nextSong.id) {
        loadAudioFile(); // 重新加载当前歌曲
      }
    }
  };
  const playAudio = (startTime: number = 0) => {
    if (!audioContext) {
      return;
    }
    // console.log("play", audioContext.state, startTime);
    if (!audioBuffer || !gainNode) {
      console.log("audio buffer is null");
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
  };

  const decodeAudioBuffer = async (song: Music, actuallyDecode: boolean) => {
    await getMetatData(song);
    let fileArrayBuffer = song.fileArrayBuffer;
    if (!fileArrayBuffer) return;

    if (song.decodedAudioBuffer) {
      actuallyDecode && setLoadStatus("解码音频数据...");
      actuallyDecode && setAudioBuffer(song.decodedAudioBuffer);
      actuallyDecode && setDuration(song.decodedAudioBuffer.duration);
    } else {
      // 克隆一个新的ArrayBuffer，避免影响到原数组
      let copyBuffer = fileArrayBuffer.slice(0);
      // console.log("start decode audio data", song.name);
      actuallyDecode && setLoadStatus("解码音频数据...");
      new AudioContext().decodeAudioData(copyBuffer).then((audioBuffer) => {
        actuallyDecode && setAudioBuffer(audioBuffer);
        actuallyDecode && setDuration(audioBuffer.duration);
        song.decodedAudioBuffer = audioBuffer;
        // const currentIndex = allSongs.findIndex((music) => music.id === song.id);
        // allSongs[currentIndex] = song;
        // setAllSongs([...allSongs]);
        // console.log("decode audio data end", song.name);
      }).catch((error) => {
        console.log("decode audio data error", error);
      });
      console.log("audio buffer", audioBuffer?.length);
    }
  }

  const preDecodeAudioBuffer = () => {
    if (!currentSong) {
      return;
    }
    console.log("pre decode next song");
    const currentIndex = allSongs.findIndex((music) => music.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % allSongs.length;
    const nextSong = allSongs[nextIndex];
    if (nextSong.id === currentSong.id) {
      return;
    }
    decodeAudioBuffer(nextSong, false);
  }

  const getMetatData = async (song: Music) => {
    if (song.metadata && song.fileArrayBuffer) {
      return;
    }
    song.url = getMusicUrl(song);
    const response = await fetch(song.url);
    const arrayBuffer = await response.arrayBuffer();
    let copyBuffer = arrayBuffer.slice(0);
    song.fileArrayBuffer = arrayBuffer;
    song.metadata = await readMetaByBuffer(copyBuffer);
  }

  const coverClick = () => {
    if (!currentSong) {
      return;
    }
    console.log(location.pathname);
    if (isDetailPage) {
      navigate(-1);
      return;
    }
    navigate("/music/" + currentSong.id);
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
  }


  const [showVolume, setShowVolume] = useState<{
    show: boolean;
    x: number;
    y: number;
  }>({
    show: false,
    x: 0,
    y: 0,
  });
  const volumeSliderRef = useRef<HTMLDivElement | null>(null);
  const changeVolume = (event: { target: { value: string } }) => {
    if (!gainNode) {
      return;
    }
    const volume = parseFloat(event.target.value);
    gainNode.gain.value = volume;
    setVolume(volume);
    setGainNode(gainNode);
  };
  const showVolumeBox = (event: any) => {
    setShowVolume({
      show: !showVolume.show,
      x: event.clientX,
      y: event.clientY,
    });
  };
  useEffect(() => {
    if (showVolume.show) {

    }
  }, [showVolume]);


  return (<div className="fixed bottom-0 left-0 w-full bg-playstatus text-playstatus-foreground min-h-[88px] max-h-[88px] flex justify-center items-center">
    <div className="flex gap-4 justify-between items-center w-full h-full relative px-4 py-2">
      {currentSong?.metadata && (
        <div className="flex gap-4 justify-center items-center">
          <div className="cursor-pointer rounded-full overflow-hidden border-[10px] box-border border-gray-950"
            onClick={coverClick}
          >
            <img
              src={currentSong?.metadata.cover}
              alt=""
              width={42}
              className={isPlaying ? "album-spin" : ""}
            />
          </div>
        </div>
      )}
      {audioBuffer && currentSong?.metadata && (
        <div className="flex flex-col gap-2 justify-center items-center flex-1 w-full">
          <input className="play-progress w-full absolute top-[-6px] left-0"
            type="range" min="0" max={duration} value={currentTime}
            onChange={handleSeekChange}
          />

          <div className="song-title flex flex-row gap-1 justify-center items-center w-full">
            <span className=" whitespace-nowrap overflow-hidden text-ellipsis ">
              <span>{currentSong?.metadata.title || "未知标题"}</span>
              <span className="ml-2 text-sm text-muted-foreground">{currentSong?.metadata.artist}</span>
            </span>
          </div>

          <div className="play-controls flex gap-2 flex-row justify-center items-center">
            {isDetailPage && (<div className="hover:text-primary-hover cursor-pointer" onClick={groupSong}><Star /></div>)}

            <div className="prevsong hover:text-primary-hover cursor-pointer" onClick={() => nextSong(-1)}>
              <ChevronFirst />
            </div>

            <div className="play-pause hover:text-primary-hover cursor-pointer "
              onClick={() => {
                const end = currentTime >= duration;
                isPlaying ? pauseAudio() : playAudio(end ? 0 : currentTime);
              }}>
              {isPlaying ? (<PauseCircle size={32} />) : (<PlayCircle size={32} />)}
            </div>

            <div className="nextsong hover:text-primary-hover cursor-pointer" onClick={() => nextSong(1)}>
              <ChevronLast />
            </div>

            <span className="text-sm text-muted-foreground">
              {formatTime(currentTime)}/{formatTime(duration)}
            </span>

            <div className="cursor-pointer hover:text-primary-hover" onClick={() => setShowPlaylist(!showPlaylist)}>
              <List />
            </div>

            <div className="volume-control relative">
              <div className="flex justify-center items-center gap-2">
                <div className="hover:text-primary-hover volume-icon z-10" onClick={(e) => showVolumeBox(e)}>
                  {volume > 0.5 && <Volume2Icon />}
                  {volume <= 0.5 && volume > 0 && <Volume1Icon />}
                  {volume <= 0 && <VolumeXIcon />}
                </div>
              </div>
              {
                showVolume.show && (
                  <>
                    <div ref={volumeSliderRef}>
                      <div className="volume-slider z-10">
                        <input type="range" dir="btt" min="0" max="1" step="0.001" value={volume} onChange={changeVolume} />
                        {/* {showVolume.show && (<span className="volume-value">{gainNode?.gain.value.toFixed(2)}</span>)} */}
                      </div>
                    </div>
                    <div className="volume-slider-mask fixed top-0 left-0 w-full h-full bg-black-translucent" onClick={() => setShowVolume({ ...showVolume, show: false })}></div>
                  </>
                )
              }
            </div>

          </div>
        </div>
      )}
      {(!currentSong || !currentSong.metadata || !audioBuffer) && (
        <div className="flex gap-2 justify-center items-center w-full h-full">
          <Loader2 className="animate-spin" size={48} />
          <span className="text-sm text-muted-foreground">{loadStatus}</span>
        </div>
      )}
    </div>

    <Playlist clearPlaylist={clearPlaylist} />
  </div>
  );

}

export default AudioPlayer;
