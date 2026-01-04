import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GetList, JsonResult, Music } from "../lib/defined";
import { getRandomSongs } from "../lib/api";
import { MusicCard } from "../components/MusicCard";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { Sparkles, Loader, ChevronLeft, Play } from "lucide-react";
import { toast } from "sonner";
import { usePlaylist } from "../store/playlist";

export function RecommendationRandomPage() {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const batchSize = 30; // 每次加载 30 首歌曲
  const maxSongs = 200; // 最多加载 200 首，避免无限加载

  const { playSingleSong, setAllSongs, setCurrentSong } = usePlaylist();

  const fetchRandomSongs = useCallback((append: boolean = false) => {
    // 检查是否已达到最大数量
    if (append && songs.length >= maxSongs) {
      setHasMore(false);
      return;
    }

    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    getRandomSongs(
      batchSize,
      undefined,
      undefined,
      undefined,
      (result: JsonResult<GetList>) => {
        if (result && result.success) {
          const newData = (result.data.list || []) as Music[];

          if (append) {
            setSongs((prevSongs) => {
              const combined = [...prevSongs, ...newData];
              // 限制最大数量
              return combined.slice(0, maxSongs);
            });
          } else {
            setSongs(newData);
          }

          // 检查是否达到最大数量
          if (songs.length + newData.length >= maxSongs) {
            setHasMore(false);
          }
        } else {
          toast.error("获取随机歌曲失败", {
            description: result.message,
          });
          setHasMore(false);
        }
        setLoading(false);
        setIsLoadingMore(false);
      },
      (error) => {
        console.error("获取随机歌曲失败:", error);
        toast.error("获取随机歌曲失败");
        setLoading(false);
        setIsLoadingMore(false);
        setHasMore(false);
      }
    );
  }, [songs.length, batchSize, maxSongs]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchRandomSongs(true);
    }
  }, [fetchRandomSongs, isLoadingMore, hasMore]);

  useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: hasMore,
    isLoading: isLoadingMore,
    threshold: 200,
  });

  useEffect(() => {
    fetchRandomSongs(false);
  }, []);

  const playAllSongs = () => {
    if (songs.length === 0) return;
    setAllSongs(songs);
    setCurrentSong(songs[0]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-68px)]">
        <Loader className="animate-spin" size={36} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">随机推荐</h1>
            <p className="text-sm text-muted-foreground">探索更多精彩音乐</p>
          </div>
          {/* 播放全部按钮 */}
          {songs.length > 0 && (
            <button
              onClick={playAllSongs}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all duration-300"
            >
              <Play size={16} />
              <span>播放全部</span>
            </button>
          )}
        </div>
      </div>

      {/* 歌曲网格 */}
      <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
        {songs.map((music) => (
          <MusicCard key={music.id} music={music} onPlay={playSingleSong} />
        ))}
      </div>

      {/* 加载更多指示器 */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader className="animate-spin" size={32} />
        </div>
      )}

      {/* 已加载全部提示 */}
      {!hasMore && songs.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">
          已加载 {songs.length} 首歌曲
          {songs.length >= maxSongs && "（已达到最大数量）"}
        </div>
      )}

      {/* 空状态 */}
      {songs.length === 0 && !loading && (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <div className="text-center text-muted-foreground">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无数据</p>
          </div>
        </div>
      )}
    </div>
  );
}
