// 随机推荐音乐组件
import { useCallback, useEffect } from "react";
import { MusicCard } from "../components/MusicCard";
import { getRandomSongs } from "../lib/api";
import { Play, Sparkles, RotateCcw } from "lucide-react";
import { usePlaylist } from "../store/playlist";
import { toast } from "sonner";
import LoadingIndicator from "../components/LoadingIndicator";
import { useHomePageStore } from "../store/home-page";

const RandomSongs = () => {
  const {
    randomSongs,
    setRandomSongs,
    randomSongsLoading,
    setRandomSongsLoading,
  } = useHomePageStore();
  
  const { playSingleSong, setAllSongs, setCurrentSong } = usePlaylist();

  // 加载随机歌曲
  const loadRandomSongs = useCallback(() => {
    setRandomSongsLoading(true);
    getRandomSongs(
      50, // 获取50首随机歌曲
      undefined,
      undefined,
      undefined,
      (result) => {
        setRandomSongsLoading(false);
        if (!result || !result.success) {
          toast.error("获取随机推荐失败");
          return;
        }
        setRandomSongs(result.data.list);
      },
      (error) => {
        setRandomSongsLoading(false);
        console.error("获取随机推荐失败", error);
        toast.error("获取随机推荐失败");
      }
    );
  }, [setRandomSongs, setRandomSongsLoading]);

  const playRandomSong = () => {
    if (randomSongs.length === 0) {
      return;
    }
    setAllSongs(randomSongs);
    setCurrentSong(randomSongs[0]);
  };

  // 组件首次挂载时,如果没有歌曲才加载
  useEffect(() => {
    if (randomSongs.length === 0) {
      loadRandomSongs();
    }
  }, []);

  // 如果没有歌曲或被关闭,不显示
  if (randomSongs.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary" size={20} />
          <h2 className="text-2xl font-semibold">随机推荐</h2>
          <div
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-primary-hover px-2 py-1 rounded-md bg-primary text-primary-foreground transition-all duration-300 max-h-10"
            onClick={playRandomSong}
          >
            <Play size={16} />
            <span className="break-keep">播放全部</span>
          </div>
        </div>
        <button
          onClick={loadRandomSongs}
          disabled={randomSongsLoading}
          className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          title="换一批"
        >
          <div className="flex items-center gap-2">
            {randomSongsLoading ? "加载中..." : "换一批"}
            <RotateCcw size={16} />
          </div>
        </button>

      </div>

      <div className="relative overflow-hidden">
        <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
          {randomSongs.map((music: any) => (
            <div key={music.id} className="flex-shrink-0 w-[140px]">
              <MusicCard music={music} onPlay={playSingleSong} />
            </div>
          ))}
        </div>
      </div>

      <LoadingIndicator loading={randomSongsLoading} hasMore={false} />

    </div>
  );
};
export default RandomSongs;
