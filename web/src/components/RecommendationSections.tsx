import React, { useCallback } from 'react';
import { Album } from '../lib/defined';
import { AlbumCard } from './AlbumCard';
import { useState, useEffect } from 'react';
import { AlbumCardSkeleton } from './Skeleton';
import { Clock, TrendingUp, Sparkles, Play, RotateCcw, ChevronRight } from 'lucide-react';
import { getAlbumList, getRandomSongs } from '../lib/api';
import { useHomePageStore } from '../store/home-page';
import { usePlaylist } from '../store/playlist';
import { toast } from 'sonner';
import { MusicCard } from './MusicCard';
import { useNavigate } from 'react-router-dom';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

function SectionHeader({ icon, title, subtitle, actionButton }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
}

/**
 * 最近播放组件
 * 显示用户最近播放的专辑
 */
export function RecentlyAlbums() {
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentlyPlayed = async () => {
      setIsLoading(true);
      try {
        getAlbumList(
          1,
          8,
          "",
          "recent",
          (response) => {
            if (response.success && response.data.list) {
              setRecentAlbums(response.data.list);
            }
            setIsLoading(false);
          },
          (error) => {
            console.error('获取最近播放专辑失败:', error);
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error('获取最近播放专辑失败:', error);
        setIsLoading(false);
      }
    };

    fetchRecentlyPlayed();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SectionHeader
          icon={<Clock className="w-5 h-5 text-primary" />}
          title="最近播放"
          subtitle="继续聆听您喜欢的音乐"
        />
        <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
          {Array.from({ length: 8 }).map((_, i) => (
            <AlbumCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (recentAlbums.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Clock className="w-5 h-5 text-primary" />}
        title="最近播放"
        subtitle="继续聆听您喜欢的音乐"
        actionButton={
          <button
            onClick={() => navigate('/recommendations/albums/recent')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <span>查看更多</span>
            <ChevronRight size={16} />
          </button>
        }
      />
      <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
        {recentAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
}

/**
 * 热门推荐组件
 * 显示播放次数最多的专辑
 */
export function TopAlbums() {
  const [topAlbums, setTopAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopPlayed = async () => {
      setIsLoading(true);
      try {
        getAlbumList(
          1,
          8,
          "",
          "frequent",
          (response) => {
            if (response.success && response.data.list) {
              setTopAlbums(response.data.list);
            }
            setIsLoading(false);
          },
          (error) => {
            console.error('获取热门专辑失败:', error);
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error('获取热门专辑失败:', error);
        setIsLoading(false);
      }
    };

    fetchTopPlayed();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SectionHeader
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          title="热门推荐"
          subtitle="发现最受欢迎的音乐"
        />
        <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
          {Array.from({ length: 8 }).map((_, i) => (
            <AlbumCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (topAlbums.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<TrendingUp className="w-5 h-5 text-primary" />}
        title="热门推荐"
        subtitle="发现最受欢迎的音乐"
        actionButton={
          <button
            onClick={() => navigate('/recommendations/albums/frequent')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <span>查看更多</span>
            <ChevronRight size={16} />
          </button>
        }
      />
      <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
        {topAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
}

/**
 * 最新专辑组件
 * 显示最新添加的专辑
 */
export function NewestAlbums() {
  const [newestAlbums, setNewestAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNewestAlbums = async () => {
      setIsLoading(true);
      try {
        getAlbumList(
          1,
          8,
          "",
          "newest",
          (response) => {
            if (response.success && response.data.list) {
              setNewestAlbums(response.data.list);
            }
            setIsLoading(false);
          },
          (error) => {
            console.error('获取最新专辑失败:', error);
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error('获取最新专辑失败:', error);
        setIsLoading(false);
      }
    };

    fetchNewestAlbums();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SectionHeader
          icon={<Sparkles className="w-5 h-5 text-primary" />}
          title="最新专辑"
          subtitle="发现刚刚添加的音乐"
        />
        <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
          {Array.from({ length: 8 }).map((_, i) => (
            <AlbumCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (newestAlbums.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Sparkles className="w-5 h-5 text-primary" />}
        title="最新专辑"
        subtitle="发现刚刚添加的音乐"
        actionButton={
          <button
            onClick={() => navigate('/recommendations/albums/newest')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <span>查看更多</span>
            <ChevronRight size={16} />
          </button>
        }
      />
      <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
        {newestAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
}

/**
 * 随机推荐歌曲组件
 * 显示随机推荐的歌曲
 */
export function RandomSongs() {
  const {
    randomSongs,
    setRandomSongs,
    randomSongsLoading,
    setRandomSongsLoading,
  } = useHomePageStore();

  const { playSingleSong, setAllSongs, setCurrentSong } = usePlaylist();
  const navigate = useNavigate();

  // 加载随机歌曲
  const loadRandomSongs = useCallback(() => {
    setRandomSongsLoading(true);
    getRandomSongs(
      8, // 获取50首随机歌曲
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/recommendations/random')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <span>查看更多</span>
            <ChevronRight size={16} />
          </button>
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

      {/* <LoadingIndicator loading={randomSongsLoading} hasMore={false} /> */}

    </div>
  );
}