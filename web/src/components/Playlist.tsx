// components/Playlist.tsx
import { AudioLines, Trash } from "lucide-react";
import { Music } from "../lib/defined";
import { formatTime } from "../lib/utils";
import { usePlaylist } from "../store/playlist";
import { Pagination } from "./Pagination";
import { forwardRef, useRef } from "react";
import { getCoverSmallUrl } from "../lib/api";
import { useKeyPress } from "../hooks/use-keypress";
import { useCurrentPlay } from "../store/current-play";

interface Props {
  clearPlaylist: () => void;
}
const Playlist = forwardRef<HTMLDivElement, Props>(({ clearPlaylist }, ref) => {
  const internalRef = useRef<HTMLDivElement | null>(null);
  // 将外部 ref 和内部 ref 结合
  const setRef = (node: HTMLDivElement | null) => {
    internalRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
    // internalRef.current?.style["--playlist-width"] = node?.offsetWidth + "px";
  };

  const {
    showPlaylist,
    pageSongs,
    currentSong,
    currentPage,
    setCurrentPage,
    getTotal,
    setCurrentSong,
    setShowPlaylist,
  } = usePlaylist();
  const { isPlaying } = useCurrentPlay();

  const playSong = (song: Music) => {
    setCurrentSong(song);
  };

  // 左右箭头控制翻页
  useKeyPress("ArrowRight", () => {
    const totalPages = Math.ceil(getTotal() / 10);
    if (getTotal() > 0 && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  });
  useKeyPress("ArrowLeft", () => {
    if (getTotal() > 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  });

  if (!showPlaylist) {
    return null;
  }

  return (
    <>
      <div className="mask" onClick={() => setShowPlaylist(false)}></div>
      <div
        ref={setRef}
        className="fixed top-[72px] right-2 w-[calc(100vw/3)] min-w-[320px] h-[calc(100vh-180px)] bg-secondary text-secondary-foreground rounded-md overflow-y-scroll overflow-x-hidden z-10 animate-playlist-fadein"
        style={{ overscrollBehavior: "contain" }}
      >
        {" "}
        <div className="p-4 flex justify-between items-center">
          <span className="font-bold">播放列表</span>
          <Trash
            size={18}
            className="text-muted-foreground hover:text-destructive cursor-pointer"
            onClick={clearPlaylist}
          />
        </div>
        {getTotal() > 0 && (
          <div className="px-4">
            <Pagination
              showTotal={false}
              currentPage={currentPage}
              total={getTotal()}
              onPageChange={setCurrentPage}
              className="justify-start"
            />
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2">
          {pageSongs.map((song) => (
            <div
              key={song.id}
              onClick={() => playSong(song)}
              className="flex items-center justify-center cursor-pointer hover:bg-muted gap-2 p-2"
            >
              <div className="rounded-lg overflow-hidden relative">
                <img src={getCoverSmallUrl(song.id)} alt="" width={40} />
                {currentSong?.id === song.id && isPlaying && (
                  <>
                    <AudioLines
                      size={22}
                      className="absolute animate-pulse text-sidebar-ring z-50"
                      style={{
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </>
                )}
              </div>
              <div
                className={`flex justify-between items-center w-full ${
                  currentSong?.id === song.id ? "text-sidebar-ring" : ""
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span>{song.title || "unknown"}</span>
                  <span className="text-xs text-muted-foreground">
                    {song.artist || song.artist}
                  </span>
                </div>
                {song.duration && (
                  <div className="text-xs text-muted-foreground">
                    {formatTime(song.duration)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="fixed bottom-0 left-0 w-full h-full bg-slate-900 rounded-t-md flex justify-center items-center opacity-0"
        onClick={() => {
          setShowPlaylist(false);
        }}
      ></div>
    </>
  );
});

export default Playlist;
