// components/Lyrics.tsx
import { useEffect, useRef } from "react";
import { useCurrentPlay } from "../store/current-play";
import { usePlaylist } from "../store/playlist";

interface LyricsProps {
  lyrics: { time: number; text: string }[];
}

function Lyrics({ lyrics }: LyricsProps) {
  const { currentLyric } = useCurrentPlay();
  const { currentSong } = usePlaylist();
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

  const getContainerHeight = () => {
    let height = "max-h-[calc(100vh-60px)]"
    if (currentSong) {
      height = "max-h-[calc(100vh-220px)]";
    }
    return `${height} text-center overflow-scroll my-4`;
  }

  const lyricNameFocus = () => (" text-[28px] font-bold text-blue-500 dark:text-blue-400");
  const lyricNameFocusHover = () => {
    // console.log("hover", lyricNameFocus().split(" ").join(" hover:"))
    return lyricNameFocus().split(" ").join(" hover:")
  };
  const lyricName = (line: {time: number, text: string}) => {
    const focus = currentLyric?.time === line.time ? lyricNameFocus() : "";
    return `${focus} min-h-10 flex items-center transition-all duration-300 justify-center`
  }

  return (
    <div ref={lyricsRef} className={getContainerHeight()} style={{overscrollBehavior: "contain"}}>
      {lyrics &&
        lyrics.map((line, index) => (
          <div
            key={index}
            className={`${lyricName(line)} ${lyricNameFocusHover()}`}
          >
            <span>{line.text}</span>
          </div>
        ))}
    </div>
  );
}

export default Lyrics;
