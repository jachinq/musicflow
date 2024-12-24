// components/Lyrics.tsx
import React, { useState, useEffect } from "react";
import { useCurrentPlay } from "../store/current-play";

interface LyricsProps {
  lyrics: { time: number; text: string }[];
}

function Lyrics({ lyrics }: LyricsProps) {
  const { currentLyric } = useCurrentPlay();

  return (
    <div className="text-center p-4">
      {lyrics &&
        lyrics.map((line, index) => (
          <p
            key={index}
            className={
              currentLyric?.time === line.time ? "text-blue-500 dark:text-blue-400" : ""
            }
          >
            {line.text}
          </p>
        ))}
    </div>
  );
}

export default Lyrics;
