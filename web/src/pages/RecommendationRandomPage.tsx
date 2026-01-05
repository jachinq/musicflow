import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GetList, JsonResult, Music } from "../lib/defined";
import { getRandomSongs } from "../lib/api";
import { MusicCard } from "../components/MusicCard";
import { Sparkles, Loader, ChevronLeft, Play } from "lucide-react";
import { toast } from "sonner";
import { usePlaylist } from "../store/playlist";

export function RecommendationRandomPage() {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const batchSize = 50; // 每次展示 50 首歌曲
  const maxSongs = 200; // 最多加载 200 首

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

    // 计算需要请求的总数量（累计）
    const requestSize = append ? songs.length + batchSize : batchSize;

    getRandomSongs(
      requestSize,
      undefined,
      undefined,
      undefined,
      (result: JsonResult<GetList>) => {
        if (result && result.success) {
          const allData = (result.data.list || []) as Music[];

          if (append) {
            // 客户端去重：跳过前 songs.length 首，取接下来的 batchSize 首
            const newData = allData.slice(songs.length, songs.length + batchSize);
            setSongs((prevSongs) => {
              const combined = [...prevSongs, ...newData];
              // 限制最大数量
              const result = combined.slice(0, maxSongs);

              // 检查是否达到最大数量或已无更多数据
              if (result.length >= maxSongs || allData.length < requestSize) {
                setHasMore(false);
              }

              return result;
            });
          } else {
            // 首次加载，取前 batchSize 首
            const initialData = allData.slice(0, batchSize);
            setSongs(initialData);

            // 检查是否还有更多数据
            if (allData.length < batchSize || initialData.length >= maxSongs) {
              setHasMore(false);
            }
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

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchRandomSongs(true);
    }
  };

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

      {/* 加载更多按钮 */}
      {hasMore && songs.length > 0 && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <>
                <Loader className="animate-spin" size={16} />
                <span>加载中...</span>
              </>
            ) : (
              <span>加载更多 (50 首)</span>
            )}
          </button>
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
