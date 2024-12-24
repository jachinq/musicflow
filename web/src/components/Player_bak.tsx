import { use, useEffect, useState } from 'react';
import './App.css';

const API_URL = 'http://172.17.33.158:9090/music/tmp/2.mp3';

const Player = () => {
  const [play, setPlay] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const intervalId = requestAnimationFrame(updateProgress);
    console.log('request animation frame', intervalId);
  }, []);

  // useEffect(() => {
  //   if (audioContext && source) {
  //     const analyserNode = audioContext.createAnalyser();
  //     analyserNode.connect(audioContext.destination);
  //     setAnalyser(analyserNode);
  //     const frequencyArray = new Uint8Array(analyserNode.frequencyBinCount);
  //     const dataArray = new Uint8Array(analyserNode.fftSize);
  //     const updateFrequencyData = () => {
  //       analyserNode.getByteFrequencyData(frequencyArray);
  //       analyserNode.getByteTimeDomainData(dataArray);
  //       setFrequencyData(frequencyArray);
  //     };
  //     source.addEventListener('ended', () => {
  //       setPlay(false);
  //       source.disconnect();
  //       analyserNode.disconnect();
  //     });
  //     source.connect(analyserNode);
  //     updateFrequencyData();
  //     const intervalId = setInterval(updateFrequencyData, 100);
  //     return () => clearInterval(intervalId);
  //   }
  // }, [audioContext, source]);

  useEffect(() => {
    const audidUrl = API_URL;
    if (audioContext) {
      fetch(audidUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          const sourceNode = audioContext.createBufferSource();
          sourceNode.buffer = audioBuffer;
          sourceNode.connect(audioContext.destination);
          setSource(sourceNode);
          setAudioContext(audioContext);
          sourceNode.start(0);
          setDuration(audioBuffer.duration);
          setCurrentTime(0);
          // setPlay(true);
          console.log('audio buffer loaded');
        });
    }
  }, [audioContext]);

  useEffect(() => {
    if (!audioContext) {
      setAudioContext(new AudioContext());
    }

    if (!audioContext) {
      return;
    }

    if (play) {
      audioContext.resume();
      console.log('resume');
    } else {
      audioContext.suspend();
      console.log('suspend');
    }
  }, [play]);

  const handlePlay = () => {
    setPlay(true);
  };

  const handlePause = () => {
    setPlay(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlay(false);
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioContext && source) {
      source.stop();
      source.disconnect();
      // create new source node with new time
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = source!.buffer;
      sourceNode.connect(audioContext.destination);
      setSource(sourceNode);
      sourceNode.start(0, time);
      setPlay(true);
    }
  };

  const updateProgress = () => {
    // console.log('update progress', play, audioContext);
    if (play && audioContext) {
      const currentTime = audioContext.currentTime;
      setCurrentTime(currentTime);
    }
  };

  return (
    <div>
      {
        play ? (
          <button onClick={handlePause}>Pause</button>
        ) : (
          <button onClick={handlePlay}>Play</button>
        )
      }

      <div>
        <input type="range" min="0" max={duration} value={currentTime} onChange={handleSeek} />
        <span>{currentTime.toFixed(2)}</span>

      </div>
    </div>
  );
};

export default Player;
