// components/Lyrics.tsx
import { useEffect, useRef } from "react";
import { useCurrentPlay } from "../store/current-play";
import { usePlaylist } from "../store/playlist";
import { getLyrics } from "../lib/api";
import { lyric } from "../lib/defined";

function Lyrics({song_id, filterEmpty}: {song_id?: string, filterEmpty?: boolean}) {
  const { currentLyric, lyrics, setLyrics } = useCurrentPlay();
  const { currentSong } = usePlaylist();
  const lyricsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = song_id;
    if (!id) return;
    getLyrics(
      id,
      (lyrics: lyric[]) => {
        if (!lyrics || lyrics.length === 0) {
          setLyrics([]);
          return
        };
        const limit = 6; // 前后各显示n行空白
        const empty: lyric = { time: 0, text: "", id: 0, song_id: "" };
        let firstList = [];
        for (let i = 0; i < limit; i++) {
          firstList.push(empty);
        }
        const emptyLast: lyric = { time: 9999999999, text: "", id: 0, song_id: "" };
        let lastList = [];
        for (let i = 0; i < limit; i++) {
          lastList.push(emptyLast);
        }
        if (filterEmpty) {
          lyrics = lyrics.filter((line) => line.text !== "");
          setLyrics([...lyrics]);
        } else {
          setLyrics([...firstList, ...lyrics, ...lastList]);
        }
      },
      (error) => {
        console.error(error);
      }
    );
  }, [song_id]);

  useEffect(() => {
    if (currentSong?.id !== song_id) return;
    if (!lyricsRef.current) return;
    const currentLyricIndex = lyrics.findIndex(
      (line) => line.time === currentLyric?.time
    );
    if (currentLyricIndex !== -1) {
      const currentLyricElement = lyricsRef.current.children[
        currentLyricIndex
      ] as HTMLElement;
      if (currentLyricElement) {
        currentLyricElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
    if (currentLyric === null && lyricsRef.current) {
      lyricsRef.current.scrollTo(0, 0);
    }
  }, [currentLyric]);

  const getContainerHeight = () => {
    let height = "max-h-[calc(100vh-60px)]";
    if (currentSong) {
      height = "max-h-[calc(100vh-220px)]";
    }
    return `${height} text-center overflow-y-scroll overflw-x-hidden my-4 px-8 w-full hide-scrollbar`;
  };

  const lyricNameFocus = () =>
    " text-[24px] font-bold text-blue-500 dark:text-blue-400";
  const lyricNameFocusHover = () => {
    // console.log("hover", lyricNameFocus().split(" ").join(" hover:"))
    return lyricNameFocus().split(" ").join(" hover:");
  };
  const lyricName = (line: { time: number; text: string }) => {
    let focus = currentLyric?.time === line.time ? lyricNameFocus() : "";
    if (currentSong?.id !== song_id) focus = "";
    return `${focus} min-h-10 flex items-center transition-all duration-300 justify-center`;
  };

  return (
    <div
      ref={lyricsRef}
      className={`${getContainerHeight()}`}
      // style={{ overscrollBehavior: "contain" }}
    >
      {lyrics &&
        lyrics.map((line, index) => (
          <div
            key={index}
            className={`${lyricName(line)} ${lyricNameFocusHover()}`}
          >
            <span>{line.text}</span>
          </div>
        ))}
        {lyrics.length === 0 && (
          <div>暂无歌词</div>
        )}
    </div>
  );
}

export default Lyrics;
