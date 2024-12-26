import { useEffect, useState } from "react";
import { useCurrentPlay } from "../store/current-play";
import {
  ChevronFirst,
  ChevronLast,
  List,
  PauseCircle,
  PlayCircle,
  Star,
} from "lucide-react";
import { getMusicUrl } from "../lib/api";
import { readMeta } from "../lib/readmeta";
import { usePlaylist } from "../store/playlist";
import { useLocation, useNavigate } from "react-router-dom";
import { formatTime } from "../lib/utils";
import Playlist from "./Playlist";
import useScreenStatus from "../hooks/use-screen-status";
// import useClickOutside from "../hooks/use-click-outside";

function AudioPlayer({ fiexd = true }: { fiexd?: boolean }) {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const [progressIntevalId, setProgressIntevalId] = useState<number | null>(
    null
  );
  const navigate = useNavigate();
  const location = useLocation();
  // const clickOutsideRef = useClickOutside(()=>{
  //   setShowPlaylist(false);
  // })
  const { isScreenHidden, setIsScreenHidden } = useScreenStatus();

  const isDetailPage = location.pathname.startsWith("/music");

  const {
    audioContext,
    currentTime,
    duration,
    isPlaying,
    metadata,
    setAudioContext,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setMusic,
    setMetadata,
    setCurrentLyric,
  } = useCurrentPlay();

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
    if (fiexd && audioBuffer && audioContext) {
      pauseAudio();
      playAudio(0);
    }
  }, [fiexd, audioBuffer]);

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
      console.log("next song", nextSong);
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
    setCurrentLyric(null);
    let audioContextTmp = audioContext;
    if (!audioContextTmp) {
      audioContextTmp = new AudioContext();
      setAudioContext(audioContextTmp);
    }
    audioContextTmp.suspend(); // 先暂停，等点击播放按钮后再恢复
    let fileArrayBuffer = null;
    if (currentSong.fileArrayBuffer) {
      fileArrayBuffer = currentSong.fileArrayBuffer;
    } else {
      if (fiexd) {
        currentSong.url = getMusicUrl(currentSong);
        currentSong.metadata = await readMeta(currentSong.url);
        setMetadata(currentSong.metadata);
      }
      const response = await fetch(currentSong.url);
      const arrayBuffer = await response.arrayBuffer();
      fileArrayBuffer = arrayBuffer;
      currentSong.fileArrayBuffer = fileArrayBuffer;
      setMusic(currentSong);
    }
    // 克隆一个新的ArrayBuffer，避免影响到原数组
    let copyBuffer = fileArrayBuffer.slice(0);
    const audioBuffer = await audioContextTmp.decodeAudioData(copyBuffer);
    setAudioBuffer(audioBuffer);
    setDuration(audioBuffer.duration);
  };

  const playAudio = (startTime: number = 0) => {
    if (!audioContext) {
      return;
    }
    console.log("play", audioContext.state, startTime);
    if (!audioBuffer) {
      console.log("audio buffer is null");
      return;
    }
    const sourceStartTime = audioContext.currentTime;
    const startOffset = startTime;

    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(audioContext.destination);
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

  return (
    <>
      <div className="flex flex-row gap-4 justify-between items-center w-full">
        {metadata && (
          <div className="flex gap-4 justify-center items-center">
            <div
              className="cursor-pointer rounded-full overflow-hidden border-[10px] box-border border-gray-950"
              onClick={coverClick}
            >
              <img
                src={metadata.cover}
                alt=""
                width={42}
                className={isPlaying ? "album-spin" : ""}
              />
            </div>
            <div className="flex">
              <div className="flex flex-col gap-1 justify-center items-start">
                <span>{metadata.title || "未知标题"}</span>
                <span className="text-sm text-gray-400">{metadata.artist}</span>
              </div>
            </div>
          </div>
        )}
        {audioBuffer && (
          <div className="flex flex-row gap-2 justify-center items-center flex-1">
            <div className="flex justify-center items-center rounded-full">
              {isDetailPage && (
                <div
                  className="hover:text-primary-hover cursor-pointer"
                  onClick={groupSong}
                >
                  <Star />
                </div>
              )}
              <div
                className="hover:text-primary-hover cursor-pointer"
                onClick={prevSong}
              >
                <ChevronFirst />
              </div>
              <div
                className="hover:text-primary-hover cursor-pointer "
                onClick={() => {
                  const end = currentTime >= duration;
                  isPlaying ? pauseAudio() : playAudio(end ? 0 : currentTime);
                }}
              >
                {isPlaying ? (
                  <PauseCircle size={32} />
                ) : (
                  <PlayCircle size={32} />
                )}
              </div>
              <div
                className="hover:text-primary-hover cursor-pointer"
                onClick={nextSong}
              >
                <ChevronLast />
              </div>
            </div>
            <input
              width={"80%"}
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeekChange}
            />
            <span className="text-sm text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div onClick={() => setShowPlaylist(!showPlaylist)}>
              <List />
            </div>
          </div>
        )}
      </div>
      <Playlist
        // ref={clickOutsideRef}
        clearPlaylist={clearPlaylist}
      />
    </>
  );
}

export default AudioPlayer;
