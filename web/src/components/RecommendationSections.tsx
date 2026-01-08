import React, { useCallback, useMemo } from 'react';
import { Album } from '../lib/defined';
import { AlbumCard } from './AlbumCard';
import { useState, useEffect } from 'react';
import { AlbumCardSkeleton } from './Skeleton';
import { Clock, TrendingUp, Sparkles, Play, ChevronRight, MicVocal } from 'lucide-react';
import { getAlbumList, getRandomSongs } from '../lib/api';
import { useHomePageStore } from '../store/home-page';
import { usePlaylist } from '../store/playlist';
import { toast } from 'sonner';
import { MusicCard } from './MusicCard';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '../hooks/use-device';

/**
 * 根据设备尺寸返回推荐内容的数量
 * - 小屏设备 (≤768px): 4 条
 * - 中屏设备 (768-1024px): 8 条
 * - 大屏设备 (1024-1560px): 12 条
 * - 超大屏设备 (≥1560px): 16 条
 */
function useRecommendationCount() {
  const { isSmallDevice, isMediumDevice, isLargeDevice } = useDevice();

  if (isSmallDevice) return 20;
  if (isMediumDevice) return 10;
  if (isLargeDevice) return 14;
  return 18; // isHugeDevice
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

function SectionHeader({ icon, title, subtitle, actionButton }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex flex-col sm:gap-2 gap-1">
        <div className='flex items-center gap-1'>
          <div className="rounded-lg bg-primary/10 flex items-center justify-start">
            {icon}
          </div>
          <h2 className="sm:text-xl text-sm font-bold text-foreground">{title}</h2>
        </div>
        {subtitle && <p className="sm:text-sm text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
}


interface AlbumsListProps {
  type: 'top' | 'recent' | 'newest';
}

/**
 * 最近播放组件
 * 显示用户最近播放的专辑
 */
export function AlbumsList({ type }: AlbumsListProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const count = useRecommendationCount();

  const { isSmallDevice } = useDevice();
  const cardSize = useMemo(() => (isSmallDevice ? 120 : 140), [isSmallDevice]);

  useEffect(() => {
    const fetchAlbums = async () => {
      setIsLoading(true);
      try {
        getAlbumList(
          1,
          count,
          "",
          type,
          (response) => {
            if (response.success && response.data.list) {
              setAlbums(response.data.list);
            }
            setIsLoading(false);
          },
          (error) => {
            console.error('获取专辑失败:', error);
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error('获取专辑失败:', error);
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, [count]);

  const typeInfo = useMemo(() => {
    switch (type) {
      case 'top':
        return {
          icon: <TrendingUp className="w-5 h-5 text-primary" />,
          title: '热门推荐',
          subtitle: '发现最受欢迎的音乐',
          route: '/recommendations/albums/frequent',
        }
      case 'recent':
        return {
          icon: <Clock className="w-5 h-5 text-primary" />,
          title: '最近播放',
          subtitle: '继续聆听您喜欢的音乐',
          route: '/recommendations/albums/recent',
        }
      case 'newest':
        return {
          icon: <MicVocal className="w-5 h-5 text-primary" />,
          title: '最新专辑',
          subtitle: '发现最新的音乐',
          route: '/recommendations/albums/newest',
        }
    }
    return {}
  }, [type])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SectionHeader
          icon={typeInfo.icon}
          title={typeInfo.title || ''}
          subtitle={typeInfo.subtitle}
        />
        <div className={`card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(${cardSize}px,1fr))]`}>
          {Array.from({ length: count }).map((_, i) => (
            <AlbumCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (albums.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={typeInfo.icon}
        title={typeInfo.title || ''}
        subtitle={typeInfo.subtitle}
        actionButton={
          <button
            onClick={() => navigate(typeInfo.route || '/')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <span>查看更多</span>
            <ChevronRight size={16} />
          </button>
        }
      />
      <div className="relative sm:overflow-hidden overflow-x-scroll scrollbar-hide">
        <div className={`card-container sm:grid flex gap-4 w-full sm:justify-center grid-cols-[repeat(auto-fill,minmax(${cardSize}px,1fr))]`}>
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} size={cardSize} />
          ))}
        </div>
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
    setRandomSongsLoading,
  } = useHomePageStore();

  const { playSingleSong, setAllSongs, setCurrentSong } = usePlaylist();
  const navigate = useNavigate();
  const count = useRecommendationCount();

  const { isSmallDevice } = useDevice();
  const cardSize = useMemo(() => (isSmallDevice ? 'small' : 'medium'), [isSmallDevice]);

  // 加载随机歌曲
  const loadRandomSongs = useCallback(() => {
    setRandomSongsLoading(true);
    getRandomSongs(
      count,
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
  }, [count, setRandomSongs, setRandomSongsLoading]);

  const playRandomSong = () => {
    setRandomSongsLoading(true);
    getRandomSongs(
      200, // 播放全部 200 首推荐歌曲
      undefined,
      undefined,
      undefined,
      (result) => {
        setRandomSongsLoading(false);
        if (!result || !result.success) {
          toast.error("获取随机推荐失败");
          return;
        }
        setAllSongs(result.data.list);
        if (result.data.list.length > 0) {
          setCurrentSong(result.data.list[0]);
        }
      },
      (error) => {
        setRandomSongsLoading(false);
        console.error("获取随机推荐失败", error);
        toast.error("获取随机推荐失败");
      }
    );
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
          <Sparkles className="w-5 h-5 text-primary"/>
          <h2 className="sm:text-xl text-sm font-semibold">今日推荐</h2>
          <div className="button button-small group flex items-center gap-2 hover:scale-105"
            onClick={playRandomSong}
          >
            <Play size={16} className='group-hover:animate-pulse' />
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
        </div>

      </div>

      <div className="relative sm:overflow-hidden overflow-x-scroll scrollbar-hide">
        <div className={`card-container sm:grid flex gap-4 w-full sm:justify-center grid-cols-[repeat(auto-fill,minmax(${cardSize === 'small' ? '120px' : '140px'},1fr))]`}>
          {randomSongs.map((music: any) => (
            <MusicCard key={music.id} music={music} onPlay={playSingleSong} size={cardSize} />
          ))}
        </div>
      </div>

      {/* <LoadingIndicator loading={randomSongsLoading} hasMore={false} /> */}

    </div>
  );
}