import { useEffect, useRef, useState } from 'react';
import { IMeta, readMeta } from '../lib/readmeta';

const audioFile = 'http://172.17.33.158:9090/music/1.mp3';


function AudioPlayer() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progressIntevalId, setProgressIntevalId] = useState<number | null>(null);
  const [metadata, setMetadata] = useState<IMeta | null>(null);

  const inputRef = useRef(null);

  const loadAudioFile = async () => {
    const audioContext = new AudioContext();
    audioContext.suspend(); // 先暂停，等点击播放按钮后再恢复
    setAudioContext(audioContext);
    const response = await fetch(audioFile);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    setAudioBuffer(audioBuffer);
    setDuration(audioBuffer.duration);
    const metadata = await readMeta(audioFile);
    setMetadata(metadata);
  };

  const playAudio = (startTime: number = 0) => {
    if (!audioContext) {
      return;
    }
    console.log("play", audioContext.state, startTime);
    if (!audioBuffer) {
      console.log("audio buffer is null");
      return
    };
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
    console.log('ccc', currentTime, audioContext.currentTime, sourceStartTime, startOffset);
    // 更新当前播放时间
    const interval = setInterval(() => {
      setCurrentTime(audioContext.currentTime - sourceStartTime + startOffset);
    }, 100);
    setProgressIntevalId(interval);
  };

  useEffect(() => {
    if (currentTime >= duration && progressIntevalId) {
      setIsPlaying(false);
      clearInterval(progressIntevalId);
      setCurrentTime(duration);
    }
  }, [currentTime])

  const pauseAudio = () => {
    if (!audioContext) {
      return;
    }
    console.log("pause", audioContext.state);
    if (progressIntevalId) {
      clearInterval(progressIntevalId);
    }
    if (audioContext.state === 'running') {
      audioContext.suspend();
    }
    if (source) {
      source.stop();
      setIsPlaying(false);
    }
  };

  const handleSeekChange = (event: { target: { value: string; }; }) => {
    const seekTime = parseFloat(event.target.value);
    setCurrentTime(seekTime);
    isPlaying && pauseAudio();
    playAudio(seekTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };



  return (
    <div className='flex flex-col gap-4'>
      {
        metadata && (
          <div className='grid grid-cols-2 gap-4 p-4'>
            <div className=' rounded-md overflow-hidden'>
              <img src={metadata.cover} alt="" width={320} />
            </div>
            <div className="flex flex-col gap-2 justify-center items-center">
              <h2>{metadata.title || '未知标题'}</h2>
              <p>artist: {metadata.artist}</p>
              <p>album: {metadata.album}</p>
              <p>year: {metadata.year}</p>
              <p>bitrate: {metadata.bitrate}</p>
            </div>
          </div>
        )
      }

      <button onClick={loadAudioFile} disabled={audioBuffer !== null}>加载音频</button>
      <button onClick={() => {
        const end = currentTime >= duration;
        isPlaying ? pauseAudio() : playAudio(end ? 0 : currentTime);
      }}>{isPlaying ? '暂停' : '播放'}</button>
      <input
        ref={inputRef}
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={handleSeekChange}
      />
      <span>当前时间: {formatTime(currentTime)} / {formatTime(duration)}</span>
    </div>
  );
}

export default AudioPlayer;
