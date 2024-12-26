import { useEffect, useRef, useState } from "react";
import { useCurrentPlay } from "../store/current-play";
import { getMusicUrl } from "../lib/api";
import { readMeta } from "../lib/readmeta";
import { usePlaylist } from "../store/playlist";
import { useLocation, useNavigate } from "react-router-dom";
import { formatTime } from "../lib/utils";
import Playlist from "./Playlist";
import useScreenStatus from "../hooks/use-screen-status";
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

function AudioPlayer() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const [progressIntevalId, setProgressIntevalId] = useState<number | null>(
    null
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { isScreenHidden, setIsScreenHidden } = useScreenStatus();

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
    setMusic,
    setMetadata,
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

  const [internalIsPageVisible, setInternalIsPageVisible] = useState<number[]>(
    []
  );
  useEffect(() => {
    console.log("isScreenHidden", isScreenHidden);
    if (isScreenHidden) {
      if (!document.hidden) {
        setIsScreenHidden(false);
        return;
      }
      // const intervalId = setInterval(() => {
      //   console.log("internal isScreenHidden", isScreenHidden);
      // }, 1000);
      // setInternalIsPageVisible([intervalId, ...internalIsPageVisible]);
    } else {
      internalIsPageVisible.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      setInternalIsPageVisible([]);
    }
  }, [isScreenHidden]);

  useEffect(() => {
    loadAudioFile();
  }, [currentSong]);
  useEffect(() => {
    if (audioBuffer && audioContext) {
      pauseAudio();
      playAudio(0);
    }
  }, [audioBuffer]);

  useEffect(() => {
    if (currentTime >= duration && progressIntevalId) {
      console.log("end of song");
      setIsPlaying(false);
      clearInterval(progressIntevalId);
      setCurrentTime(duration);
      nextSong();
    }
  }, [currentTime]);

  const nextSong = () => {
    setCurrentTime(0);
    // console.log("current song", currentSong);
    if (currentSong) {
      const index = allSongs.findIndex((music) => music.id === currentSong.id);
      const nextIndex = (index + 1) % allSongs.length;
      const nextSong = allSongs[nextIndex];
      setCurrentSong(nextSong);
      console.log("next song", nextSong.metadata?.title || nextSong.name);
      if (currentSong.id === nextSong.id) {
        loadAudioFile(); // 重新加载当前歌曲
      }
    }
  };
  const prevSong = () => {
    setCurrentTime(0);
    if (currentSong) {
      const index = allSongs.findIndex((music) => music.id === currentSong.id);
      const prevIndex = (index - 1 + allSongs.length) % allSongs.length;
      const prevSong = allSongs[prevIndex];
      setCurrentSong(prevSong);
    }
  };

  const loadAudioFile = async () => {
    if (!currentSong) {
      return;
    }
    console.log("start load audio file", currentSong.name);
    setCurrentLyric(null);
    let audioContextTmp = audioContext;
    if (!audioContextTmp) {
      audioContextTmp = new AudioContext();
      setAudioContext(audioContextTmp);
      const gainNodeTmp = audioContextTmp.createGain();
      gainNodeTmp.connect(audioContextTmp.destination);
      gainNodeTmp.gain.value = volume;
      setGainNode(gainNodeTmp);
    }
    audioContextTmp.suspend(); // 先暂停，等点击播放按钮后再恢复
    let fileArrayBuffer = null;
    if (currentSong.fileArrayBuffer) {
      fileArrayBuffer = currentSong.fileArrayBuffer;
    } else {
      console.log("start read meta data", currentSong.url);
      currentSong.url = getMusicUrl(currentSong);
      currentSong.metadata = await readMeta(currentSong.url);
      setMetadata(currentSong.metadata);
      console.log("meta data end");

      console.log("start fetch file", currentSong.url);
      const response = await fetch(currentSong.url);
      const arrayBuffer = await response.arrayBuffer();
      fileArrayBuffer = arrayBuffer;
      currentSong.fileArrayBuffer = fileArrayBuffer;
      setMusic(currentSong);
      console.log("fetch file end");
    }
    // 克隆一个新的ArrayBuffer，避免影响到原数组
    console.log("start clone array buffer", currentSong.name);
    let copyBuffer = fileArrayBuffer.slice(0);
    console.log("start decode audio data", currentSong.name);
    const audioBuffer = await audioContextTmp.decodeAudioData(copyBuffer);
    setAudioBuffer(audioBuffer);
    setDuration(audioBuffer.duration);
    console.log("decode audio data end", currentSong.name);
  };

  const playAudio = (startTime: number = 0) => {
    if (!audioContext) {
      return;
    }
    console.log("play", audioContext.state, startTime);
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
    console.log("pause", audioContext.state);
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


  return (<div className="fixed bottom-0 left-0 w-full bg-playstatus text-playstatus-foreground min-h-[88px] max-h-[88px]">
    <div className="flex gap-4 justify-between items-center w-full relative px-4 py-2">
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
        <div className="flex flex-col gap-2 justify-center items-center flex-1">
          <input className="play-progress w-full absolute top-[-6px] left-0"
            type="range" min="0" max={duration} value={currentTime}
            onChange={handleSeekChange}
          />

          <div className="song-title flex flex-row gap-1 justify-start items-center">
            <span>{currentSong?.metadata.title || "未知标题"}</span>
            <span className="text-sm text-muted-foreground">{currentSong?.metadata.artist}</span>
          </div>

          <div className="play-controls flex gap-2 flex-row justify-center items-center">
            {isDetailPage && (<div className="hover:text-primary-hover cursor-pointer" onClick={groupSong}><Star /></div>)}

            <div className="prevsong hover:text-primary-hover cursor-pointer" onClick={prevSong}
            >
              <ChevronFirst />
            </div>

            <div className="play-pause hover:text-primary-hover cursor-pointer "
              onClick={() => {
                const end = currentTime >= duration;
                isPlaying ? pauseAudio() : playAudio(end ? 0 : currentTime);
              }}>
              {isPlaying ? (<PauseCircle size={32} />) : (<PlayCircle size={32} />)}
            </div>

            <div className="nextsong hover:text-primary-hover cursor-pointer" onClick={nextSong}>
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
          <Loader2 className="animate-spin" size={48}/>
          <span className="text-sm text-muted-foreground">加载中...</span>
        </div>
      )}
    </div>

    <Playlist clearPlaylist={clearPlaylist} />
  </div>
  );

}

export default AudioPlayer;
