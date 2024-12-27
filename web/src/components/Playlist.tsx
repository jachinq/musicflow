// components/Playlist.tsx
import { AudioLines, Trash } from "lucide-react";
import { Music } from "../def/CommDef";
import { formatTime } from "../lib/utils";
import { usePlaylist } from "../store/playlist";
import { Pagination } from "./Pagination";
import { forwardRef, useRef } from "react";

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

  const playSong = (song: Music) => {
    setCurrentSong(song);
  };

  if (!showPlaylist) {
    return null;
  }

  return (
    <>
      <div
        ref={setRef}
        className="fixed top-[72px] right-2 w-[calc(100vw/3)] min-w-[320px] h-[calc(100vh-180px)] bg-background text-foreground rounded-md overflow-y-scroll overflow-x-hidden z-10"
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
                <img src={song.metadata?.cover} alt="" width={40} />
                {currentSong?.id === song.id && (
                  <>
                    <div className="mask w-[40px] h-[40px] absolute top-0 left-0 bg-black opacity-70"></div>
                    <AudioLines
                      size={22}
                      className="absolute animate-pulse text-sidebar-ring"
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
                  <span>{song.metadata?.title || song.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {song.metadata?.artist || song.artist}
                  </span>
                </div>
                {song.metadata?.duration && (
                  <div className="text-xs text-muted-foreground">
                    {formatTime(song.metadata?.duration)}
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
