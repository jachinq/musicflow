// 随机推荐音乐组件
import { useCallback, useEffect, useState } from "react";
import { MusicCard } from "../components/MusicCard";
import { getRandomSongs } from "../lib/api";
import { Play, Sparkles, RotateCcw } from "lucide-react";
import { usePlaylist } from "../store/playlist";
import { toast } from "sonner";
import LoadingIndicator from "../components/LoadingIndicator";

const RandomSongs = () => {
  const [randomSongs, setRandomSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { playSingleSong, setAllSongs, setCurrentSong } = usePlaylist();

  // 加载随机歌曲
  const loadRandomSongs = useCallback(() => {
    setLoading(true);
    getRandomSongs(
      50, // 获取10首随机歌曲
      undefined,
      undefined,
      undefined,
      (result) => {
        setLoading(false);
        if (!result || !result.success) {
          toast.error("获取随机推荐失败");
          return;
        }
        setRandomSongs(result.data.list);
      },
      (error) => {
        setLoading(false);
        console.error("获取随机推荐失败", error);
        toast.error("获取随机推荐失败");
      }
    );
  }, []);

  const playRandomSong = () => {
    if (randomSongs.length === 0) {
      return;
    }
    setAllSongs(randomSongs);
    setCurrentSong(randomSongs[0]);
  };

  // 组件挂载时加载
  useEffect(() => {
    loadRandomSongs();
  }, [loadRandomSongs]);

  // 如果没有歌曲或被关闭，不显示
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
          disabled={loading}
          className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          title="换一批"
        >
          <div className="flex items-center gap-2">
            {loading ? "加载中..." : "换一批"}
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

      <LoadingIndicator loading={loading} hasMore={false} />

    </div>
  );
};
export default RandomSongs;
