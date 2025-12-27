import { Music2, Album as AlbumIcon, User2, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton, StatCardSkeleton } from './Skeleton';

interface MusicStats {
  totalSongs: number;
  totalAlbums: number;
  totalArtists: number;
  totalDuration: number;
}

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  isLoading?: boolean;
}

function StatsCard({ icon, label, value, color = 'bg-primary/10', isLoading }: StatsCardProps) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

/**
 * 音乐库统计卡片组
 * 显示总歌曲数、专辑数、艺术家数和总时长
 */
export function MusicStatsCards() {
  const [stats, setStats] = useState<MusicStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: 从 API 获取真实统计数据
    // 这里使用模拟数据,实际应该调用后端 API
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // 模拟 API 调用延迟
        await new Promise(resolve => setTimeout(resolve, 800));

        // 模拟数据 - 实际应该从 API 获取
        setStats({
          totalSongs: 1234,
          totalAlbums: 89,
          totalArtists: 156,
          totalDuration: 345600, // 秒
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    return `${hours} 小时`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard
        icon={<Music2 className="w-6 h-6 text-primary" />}
        label="总歌曲数"
        value={stats?.totalSongs ?? 0}
        color="bg-primary/10"
        isLoading={isLoading}
      />
      <StatsCard
        icon={<AlbumIcon className="w-6 h-6 text-blue-500" />}
        label="专辑数量"
        value={stats?.totalAlbums ?? 0}
        color="bg-blue-500/10"
        isLoading={isLoading}
      />
      <StatsCard
        icon={<User2 className="w-6 h-6 text-green-500" />}
        label="艺术家数"
        value={stats?.totalArtists ?? 0}
        color="bg-green-500/10"
        isLoading={isLoading}
      />
      <StatsCard
        icon={<Clock className="w-6 h-6 text-orange-500" />}
        label="总时长"
        value={stats ? formatDuration(stats.totalDuration) : '-'}
        color="bg-orange-500/10"
        isLoading={isLoading}
      />
    </div>
  );
}
