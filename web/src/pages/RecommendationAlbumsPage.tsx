import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Album, GetAlbumList, JsonResult } from "../lib/defined";
import { getAlbumList } from "../lib/api";
import { AlbumCard } from "../components/AlbumCard";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { Clock, TrendingUp, Sparkles, Loader, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

type AlbumType = "recent" | "frequent" | "newest";

interface TypeConfig {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const typeConfigMap: Record<AlbumType, TypeConfig> = {
  recent: {
    title: "最近播放",
    subtitle: "继续聆听您喜欢的音乐",
    icon: Clock,
  },
  frequent: {
    title: "热门推荐",
    subtitle: "发现最受欢迎的音乐",
    icon: TrendingUp,
  },
  newest: {
    title: "最新专辑",
    subtitle: "发现刚刚添加的音乐",
    icon: Sparkles,
  },
};

export function RecommendationAlbumsPage() {
  const { type } = useParams<{ type: AlbumType }>();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const currentPageRef = useRef(1);
  const pageSize = 30;

  // 获取类型配置
  const config = type ? typeConfigMap[type] : typeConfigMap.newest;
  const Icon = config.icon;

  const fetchAlbums = useCallback(
    (page: number, append: boolean = false) => {
      if (!type) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      getAlbumList(
        page,
        pageSize,
        "",
        type,
        (result: JsonResult<GetAlbumList>) => {
          if (result && result.success) {
            const newData = result.data.list || [];

            if (append) {
              setAlbums((prevAlbums) => {
                // 根据 id 去重
                const newList = newData.filter(
                  (item: Album) =>
                    !prevAlbums.some((oldItem) => oldItem.id === item.id)
                );
                return [...prevAlbums, ...newList];
              });
            } else {
              setAlbums(newData);
            }

            // 如果返回的数据少于请求的页大小，说明没有更多数据了
            setHasMore(newData.length === pageSize);
            currentPageRef.current = page;
          } else {
            toast.error("获取专辑列表失败", {
              description: result.message,
            });
            setHasMore(false);
          }
          setLoading(false);
          setIsLoadingMore(false);
        },
        (error) => {
          console.error("获取专辑列表失败:", error);
          toast.error("获取专辑列表失败");
          setLoading(false);
          setIsLoadingMore(false);
          setHasMore(false);
        }
      );
    },
    [type, pageSize]
  );

  const loadMore = useCallback(() => {
    const nextPage = currentPageRef.current + 1;
    fetchAlbums(nextPage, true);
  }, [fetchAlbums]);

  useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: hasMore,
    isLoading: isLoadingMore,
    threshold: 200,
  });

  useEffect(() => {
    // 重置并重新加载
    setAlbums([]);
    currentPageRef.current = 1;
    setHasMore(true);
    fetchAlbums(1, false);
  }, [type, fetchAlbums]);

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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>
      </div>

      {/* 专辑网格 */}
      <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>

      {/* 加载更多指示器 */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader className="animate-spin" size={32} />
        </div>
      )}

      {/* 已加载全部提示 */}
      {!hasMore && albums.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">
          已加载全部 {albums.length} 张专辑
        </div>
      )}

      {/* 空状态 */}
      {albums.length === 0 && !loading && (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <div className="text-center text-muted-foreground">
            <Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无数据</p>
          </div>
        </div>
      )}
    </div>
  );
}
