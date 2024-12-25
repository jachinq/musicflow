// components/Lyrics.tsx
import { useEffect, useRef } from "react";
import { useCurrentPlay } from "../store/current-play";

interface LyricsProps {
  lyrics: { time: number; text: string }[];
}

function Lyrics({ lyrics }: LyricsProps) {
  const { currentLyric } = useCurrentPlay();
  const lyricsRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (!lyricsRef.current) return;
    const currentLyricIndex = lyrics.findIndex(line => line.time === currentLyric?.time);
    if (currentLyricIndex !== -1) {
      const currentLyricElement = lyricsRef.current.children[currentLyricIndex] as HTMLElement;
      if (currentLyricElement) {
        currentLyricElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    if (currentLyric === null) {
      lyricsRef.current.scrollTo(0, 0);
    }
  }, [currentLyric]);

  return (
    <div ref={lyricsRef} className="text-center max-h-[calc(100vh-220px)] overflow-scroll" style={{overscrollBehavior: "contain"}}>
      {lyrics &&
        lyrics.map((line, index) => (
          <div
            key={index}
            className={`min-h-10 flex items-center transition-all duration-300 justify-center ${currentLyric?.time === line.time ? "text-[28px] font-bold text-blue-500 dark:text-blue-400" : ""}`}
          >
            <span>{line.text}</span>
          </div>
        ))}
    </div>
  );
}

export default Lyrics;
