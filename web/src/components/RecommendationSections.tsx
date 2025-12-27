import React from 'react';
import { Music } from '../lib/defined';
import { MusicCard } from './MusicCard';
import { usePlaylist } from '../store/playlist';
import { useState, useEffect } from 'react';
import { MusicCardSkeleton } from './Skeleton';
import { Clock, TrendingUp } from 'lucide-react';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

/**
 * 最近播放组件
 * 显示用户最近播放的歌曲
 */
export function RecentlyPlayed() {
  const { playSingleSong } = usePlaylist();
  const [recentSongs, setRecentSongs] = useState<Music[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: 从 localStorage 或 API 获取最近播放记录
    const fetchRecentlyPlayed = async () => {
      setIsLoading(true);
      try {
        // 模拟获取数据
        await new Promise(resolve => setTimeout(resolve, 600));

        // 从 localStorage 获取播放历史
        const historyStr = localStorage.getItem('musicflow_play_history');
        if (historyStr) {
          const history = JSON.parse(historyStr);
          setRecentSongs(history.slice(0, 6)); // 只显示最近 6 首
        }
      } catch (error) {
        console.error('获取最近播放失败:', error);
      } finally {
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MusicCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (recentSongs.length === 0) {
    return null; // 如果没有最近播放,不显示此部分
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Clock className="w-5 h-5 text-primary" />}
        title="最近播放"
        subtitle="继续聆听您喜欢的音乐"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {recentSongs.map((song) => (
          <MusicCard
            key={song.id}
            music={song}
            onPlay={playSingleSong}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 热门推荐组件
 * 显示播放次数最多的歌曲
 */
export function TopPlayed() {
  const { playSingleSong } = usePlaylist();
  const [topSongs, setTopSongs] = useState<Music[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: 从 API 获取热门歌曲
    const fetchTopPlayed = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 600));

        // 模拟数据 - 实际应该从 API 获取
        setTopSongs([]);
      } catch (error) {
        console.error('获取热门歌曲失败:', error);
      } finally {
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MusicCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (topSongs.length === 0) {
    return null; // 如果没有数据,不显示此部分
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<TrendingUp className="w-5 h-5 text-primary" />}
        title="热门推荐"
        subtitle="发现最受欢迎的音乐"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {topSongs.map((song) => (
          <MusicCard
            key={song.id}
            music={song}
            onPlay={playSingleSong}
          />
        ))}
      </div>
    </div>
  );
}
