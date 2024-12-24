// components/MusicPlayer.tsx
import React, { useRef, useState, useEffect } from "react";
import { API_URL } from "../lib/api";
import { Music } from "../def/CommDef";

interface MusicPlayerProps {
  music: Music;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
}

function MusicPlayer({ music, currentTime, onTimeUpdate }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  function togglePlay() {
    setIsPlaying(!isPlaying);
  }

  function handleVolumeChange(event: React.ChangeEvent<HTMLInputElement>) {
    setVolume(Number(event.target.value));
  }

  function handleTimeUpdate() {
    if (audioRef.current) {
      onTimeUpdate(audioRef.current.currentTime);
    }
  }

  function getUrl() {
    return `${API_URL}/music/${music.path}`;
  }

  function formatTime(time: number) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
     .toString()
     .padStart(2, "0")}`;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{music.name}</h2>
        <p className="text-gray-500">{music.artist}</p>
      </div>
      <div className="flex items-center justify-between">
      <button onClick={togglePlay}>{isPlaying ? "暂停" : "播放"}</button>
        <audio ref={audioRef} src={getUrl()} onTimeUpdate={handleTimeUpdate} />
        <span>{formatTime(currentTime)}</span>
        <input
        type="range"
        min="0"
        max={audioRef.current?.duration ?? 0}
        value={audioRef.current?.currentTime ?? 0}
        onChange={(event) => {
          if (audioRef.current) {
            audioRef.current.currentTime = Number(event.target.value);
          }
        }}
      />
      </div>
      <div>
        <span>音量</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
      />
      </div>
      
    </div>
  );
}

export default MusicPlayer;
