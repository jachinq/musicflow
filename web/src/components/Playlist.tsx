// components/Playlist.tsx
import { AudioLines, Trash } from "lucide-react";
import { Music } from "../lib/defined";
import { formatTime } from "../lib/utils";
import { usePlaylist } from "../store/playlist";
import { Pagination } from "./Pagination";
import { getCoverSmallUrl } from "../lib/api";
import { useKeyPress } from "../hooks/use-keypress";
import { useCurrentPlay } from "../store/current-play";
import { useClickAway } from "@uidotdev/usehooks";
import { useDevice } from "../hooks/use-device";

interface Props {
  clearPlaylist: () => void;
}
const Playlist = ({ clearPlaylist }: Props) => {
  const {
    showPlaylist,
    openPlaylist, // 外部控制是否要打开播放列表
    pageSongs,
    currentSong,
    currentPage,
    setCurrentPage,
    getTotal,
    setCurrentSong,
    togglePlaylist,
  } = usePlaylist();
  const { isPlaying } = useCurrentPlay();
  // 使用 useClickAway 控制点击播放列表外面关闭播放列表
  const playlistRef = useClickAway(() => {
    console.log("toggle playlist 1111", showPlaylist);
    return togglePlaylist(false)
  });
  const { isSmallDevice, isMediumDevice, isLargeDevice } = useDevice();

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

  const adaptiveClass = () => {
    let className = "w-[calc(100vw/3)] ";
    if (isSmallDevice) className = "w-full ";
    if (isMediumDevice) className = "w-[calc(100vw/2)] ";
    if (isLargeDevice) className = "w-[calc(100vw/2.5)] ";
    let translate = showPlaylist ? "translate-x-0" : "translate-x-full";
    if (isSmallDevice)
      translate = showPlaylist ? "translate-y-0" : "translate-y-full";
    return `${className} ${translate}`;
  };

  if (!openPlaylist) {
    return null;
  }

  return (
    <>
      <div
        className="mask"
        style={{ opacity: 0 }}
        // style={{ opacity: showPlaylist ? 0.5 : 0 }}
      ></div>
      <div className="fixed inset-0 top-[68px] z-50 flex overflow-y-scroll overflow-x-hidden">
        <div className="flex-1"></div>

        <div
          ref={playlistRef as any}
          className={`min-w-[320px] h-[calc(100vh-180px)] bg-secondary text-secondary-foreground rounded-md overflow-y-scroll overflow-x-hidden transform transition-transform duration-300 ease-in-out ${adaptiveClass()}`}
          style={{ overscrollBehavior: "contain" }}
        >
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
                className="flex items-center justify-center cursor-pointer hover:bg-muted gap-2 px-4 py-2"
              >
                <div className="rounded-lg overflow-hidden relative">
                  <img
                    src={getCoverSmallUrl(song.album_id)}
                    alt=""
                    width={40}
                  />
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
      </div>
    </>
  );
};

export default Playlist;
