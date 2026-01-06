// pages/FavoritesPage.tsx
import { useEffect, useState } from 'react';
import { Heart, Loader, Sparkles } from 'lucide-react';
import { MusicCard } from '../components/MusicCard';
import { getStarredList } from '../lib/api';
import { usePlaylist } from '../store/playlist';
import { useFavoriteStore } from '../store/favorite';
import { toast } from 'sonner';

export const FavoritesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playSingleSong } = usePlaylist();
  const { starredSongs, setStarredSongs } = useFavoriteStore();

  // 统计信息
  const totalSongs = starredSongs.length;

  useEffect(() => {
    fetchStarredSongs();
  }, []);

  const fetchStarredSongs = () => {
    setLoading(true);
    setError(null);

    getStarredList(
      (result) => {
        setLoading(false);
        if (result && result.success) {
          // 只取 songs 数组（暂时不处理专辑和艺术家）
          const songs = result.data.songs || [];
          setStarredSongs(songs);
        } else {
          setError(result.message);
          toast.error('获取收藏列表失败', {
            description: result.message,
          });
        }
      },
      (err) => {
        setLoading(false);
        setError(err.message);
        toast.error('获取收藏列表失败', {
          description: err.message,
        });
      }
    );
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-68px)]">
        <Loader className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col gap-2 justify-center items-center p-4 h-[calc(100vh-68px)]">
        <Heart className="text-destructive" size={64} />
        <div className="text-lg font-semibold">加载失败</div>
        <div className="text-sm text-muted-foreground">{error}</div>
        <button
          onClick={fetchStarredSongs}
          className="button mt-4"
        >
          重新加载
        </button>
      </div>
    );
  }

  // 空状态
  if (totalSongs === 0) {
    return (
      <div className="relative min-h-[calc(100vh-68px)] flex items-center justify-center p-4 overflow-hidden">
        {/* 背景装饰 - 柔和的渐变球 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-hover/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '6s', animationDelay: '2s' }} />

        {/* 空状态卡片 */}
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-md text-center">
          {/* 心形图标带脉冲动画 */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"
              style={{ animationDuration: '2s' }} />
            <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <Heart
                className="w-12 h-12 text-primary animate-pulse"
                style={{ animationDuration: '2s' }}
              />
            </div>
          </div>

          {/* 文字内容 */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">还没有收藏</h2>
            <p className="text-muted-foreground">
              点击歌曲卡片上的心形按钮，收藏您喜欢的音乐
            </p>
          </div>

          {/* 提示卡片 */}
          <div className="flex flex-col gap-3 w-full mt-4">
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border/50 hover:border-primary/50 transition-colors duration-300">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <div className="font-medium mb-1">发现喜欢的音乐</div>
                <div className="text-muted-foreground">浏览首页推荐，找到您喜欢的歌曲</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border/50 hover:border-primary/50 transition-colors duration-300">
              <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <div className="font-medium mb-1">收藏您的最爱</div>
                <div className="text-muted-foreground">点击心形按钮，将歌曲添加到收藏夹</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 有收藏内容的状态
  return (
    <div className="p-4 space-y-4 page-transition">
      {/* 标题区域 */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary-hover/20 flex items-center justify-center">
          <Heart className="w-6 h-6 text-primary" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-xl font-bold">我的收藏</h1>
          <p className="text-sm text-muted-foreground mt-1">收藏您最喜欢的音乐</p>
        </div>
      </div>


      {/* 歌曲网格 - 使用 MusicCard 组件 */}
      <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
        {starredSongs.map((music, index) => (
          <div
            key={music.id}
            className="animate-fadeInUp"
            style={{
              animationDelay: `${Math.min(index * 0.05, 0.8)}s`,
              animationFillMode: 'backwards'
            }}
          >
            <MusicCard music={music} onPlay={playSingleSong} size='small'/>
          </div>
        ))}
      </div>
    </div>
  );
};
