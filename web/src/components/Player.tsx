import { useEffect, useRef, useState } from "react";
import { useCurrentPlay } from "../store/current-play";
import { PauseCircle, PlayCircle } from "lucide-react";
import { Music } from "../def/CommDef";
import { getMusicUrl } from "../lib/api";
import { readMeta } from "../lib/readmeta";

function AudioPlayer({ music, fiexd = false, onPlayEnd }:
  {
    music: Music,
    fiexd?: boolean,
    onPlayEnd?: () => void,
  }) {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const [progressIntevalId, setProgressIntevalId] = useState<number | null>(
    null
  );

  const {
    audioContext,
    setAudioContext,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    metadata,
    setMusic,
    setMetadata,
  } = useCurrentPlay();

  const inputRef = useRef(null);

  useEffect(() => {
    loadAudioFile();
  }, []);
  useEffect(() => {
    if (fiexd && audioBuffer && audioContext) {
      pauseAudio();
      playAudio(0);
    }
  }, [fiexd, audioBuffer]);

  useEffect(() => {
    if (currentTime >= duration && progressIntevalId) {
      setIsPlaying(false);
      clearInterval(progressIntevalId);
      setCurrentTime(duration);
      onPlayEnd && onPlayEnd();
    }
  }, [currentTime]);

  const loadAudioFile = async () => {
    let audioContextTmp = audioContext;
    if (!audioContextTmp) {
      audioContextTmp = new AudioContext();
      setAudioContext(audioContextTmp);
    }
    audioContextTmp.suspend(); // 先暂停，等点击播放按钮后再恢复
    let response = null;
    if (music.fileResponse) {
      response = music.fileResponse;
    } else {
      if (fiexd) {
        music.url = getMusicUrl(music);
        music.metadata = await readMeta(music.url);
        setMetadata(music.metadata);
      }
      response = await fetch(music.url);
      music.fileResponse = response;
      // console.log(music);
      setMusic(music);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContextTmp.decodeAudioData(arrayBuffer);
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
    console.log(
      "ccc",
      currentTime,
      audioContext.currentTime,
      sourceStartTime,
      startOffset
    );
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };


  if (fiexd) {
    return (
      <div className="flex flex-row gap-4 justify-center items-center">
        {metadata && (
          <div className="flex">
            <div className="flex flex-col gap-2 justify-center items-center">
              <span>{metadata.title || "未知标题"}</span>
              <span className="text-sm text-gray-400">{metadata.artist}</span>
            </div>
          </div>
        )}
        {audioBuffer && (
          <div className="flex flex-row gap-2 justify-center items-center">
            <div className="flex justify-center items-center rounded-full"
            >
              <div className="hover:text-blue-200 cursor-pointer "
                onClick={() => {
                  const end = currentTime >= duration;
                  isPlaying ? pauseAudio() : playAudio(end ? 0 : currentTime);
                }}>
                {isPlaying ? <PauseCircle size={32} /> : <PlayCircle size={32} />}
              </div>
            </div>
            <input
              ref={inputRef}
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeekChange}
            />
            <span>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {metadata && (
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className=" rounded-md overflow-hidden">
            <img src={metadata.cover} alt="" width={320} />
          </div>
          <div className="flex flex-col gap-2 justify-center items-center">
            <h2>{metadata.title || "未知标题"}</h2>
            <p>artist: {metadata.artist}</p>
            <p>album: {metadata.album}</p>
            <p>year: {metadata.year}</p>
            <p>bitrate: {metadata.bitrate}</p>
          </div>
        </div>
      )}
      {!metadata && <p>loading...</p>}

      {/* <button onClick={loadAudioFile} disabled={audioBuffer !== null}>
        加载音频
      </button> */}

      {audioBuffer && (
        <>
          <div className="flex justify-center items-center rounded-full"
          >
            <div className="hover:text-blue-500 cursor-pointer "
              onClick={() => {
                const end = currentTime >= duration;
                isPlaying ? pauseAudio() : playAudio(end ? 0 : currentTime);
              }}>
              {isPlaying ? <PauseCircle size={32} /> : <PlayCircle size={32} />}
            </div>
          </div>
          <input
            ref={inputRef}
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeekChange}
          />
          <span>
            当前时间: {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </>
      )}
    </div>
  );
}

export default AudioPlayer;
