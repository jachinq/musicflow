// components/Playlist.tsx
import { AudioLines, Trash } from "lucide-react";
import { Music } from "../lib/defined";
import { formatTime } from "../lib/utils";
import { usePlaylist } from "../store/playlist";
import { getCoverSmallUrl } from "../lib/api";
import { useCurrentPlay } from "../store/current-play";
import { useClickAway } from "@uidotdev/usehooks";
import { useDevice } from "../hooks/use-device";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { useRef } from "react";
import LoadingIndicator from "./LoadingIndicator";

interface Props {
  clearPlaylist: () => void;
}
const Playlist = ({ clearPlaylist }: Props) => {
  const {
    showPlaylist,
    openPlaylist, // 外部控制是否要打开播放列表
    displaySongs,
    currentSong,
    getTotal,
    setCurrentSong,
    togglePlaylist,
    isLoadMore,
    loadMore,
    loadedCount,
  } = usePlaylist();

  const { isPlaying } = useCurrentPlay();

  // 独立的 ref：用于无限滚动
  const containerRef = useRef<HTMLDivElement>(null);

  // 用于点击外部关闭
  const clickAwayRef = useClickAway(() => {
    return togglePlaylist(false);
  });

  const { isSmallDevice, isMediumDevice, isLargeDevice } = useDevice();

  // 无限滚动
  useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: loadedCount < getTotal(),
    isLoading: isLoadMore,
    threshold: 300,
    containerRef,
  });

  const playSong = (song: Music) => {
    setCurrentSong(song);
  };

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

  return <>
    <div
      className="mask"
      style={{ opacity: 0 }}
    // style={{ opacity: showPlaylist ? 0.5 : 0 }}
    ></div>
    <div className="fixed inset-0 top-[68px] z-50 flex">
      <div className="flex-1"></div>

      <div
        ref={clickAwayRef as any}
        className={`min-w-[320px] h-[calc(100vh-180px)] bg-secondary overflow-hidden text-secondary-foreground rounded-md transform transition-transform duration-300 ease-in-out ${adaptiveClass()}`}
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="p-4 flex justify-between items-center sticky top-0 bg-secondary z-10">
          <div className="flex items-center">
            <span className="font-bold">播放列表</span>
            {getTotal() > 0 && (
              <div className="px-4 text-xs text-muted-foreground">
                已加载 {loadedCount}/{getTotal()} 首歌曲
              </div>
            )}
          </div>
          <Trash
            size={18}
            className="text-muted-foreground hover:text-destructive cursor-pointer"
            onClick={clearPlaylist}
          />
        </div>
        <div ref={containerRef}
          onScroll={(e) => { e.stopPropagation() }}
          className="flex flex-col gap-2 overflow-y-scroll h-[calc(100vh-280px)]"
          style={{ overscrollBehavior: "contain" }} >
          {displaySongs.map((song) => (
            <div
              key={song.id}
              onClick={() => playSong(song)}
              className="flex items-center justify-center cursor-pointer hover:bg-muted gap-2 px-4 py-2"
            >
              <div className="rounded-lg overflow-hidden relative">
                <img
                  src={getCoverSmallUrl(song.cover_art)}
                  alt=""
                  width={40}
                />
                {currentSong?.id === song.id && isPlaying && (
                  <AudioLines size={22} 
                    className="absolute animate-pulse text-sidebar-ring z-50"
                    style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                  />
                )}
              </div>
              <div
                className={`flex justify-between items-center w-full ${currentSong?.id === song.id ? "text-sidebar-ring" : ""
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
          {loadedCount < getTotal() && (
            <div className="flex justify-center items-center h-16">
              <button
                className="bg-secondary text-secondary-foreground font-bold rounded-md px-4 py-2"
                onClick={loadMore}
              >
                {isLoadMore ? "正在加载..." : "加载更多"}
              </button>
            </div>
          )}
          <LoadingIndicator loading={isLoadMore} hasMore={loadedCount < getTotal()} />
        </div>
      </div>
    </div>
  </>
};

export default Playlist;
