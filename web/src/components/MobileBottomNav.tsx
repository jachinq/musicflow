import { Home, TagIcon, Settings, Music2Icon, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MyRoutes } from '../lib/defined';
import { useDevice } from '../hooks/use-device';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: Home, label: '首页', path: MyRoutes.Home },
  { icon: Heart, label: '收藏', path: MyRoutes.Favorites },
  { icon: Music2Icon, label: '歌单', path: MyRoutes.Playlist },
  { icon: TagIcon, label: '曲库', path: MyRoutes.Albums },
  { icon: Settings, label: '设置', path: MyRoutes.Settings },
];

/**
 * 移动端底部导航栏
 * 仅在小屏幕设备上显示
 */
export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSmallDevice } = useDevice();

  // 只在移动端显示
  if (!isSmallDevice) {
    return null;
  }

  // 如果在播放器页面,不显示底部导航
  if (location.pathname === MyRoutes.Player) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === MyRoutes.Home) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors duration-200 ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-xs mt-1 transition-all duration-200 ${
                  active ? 'font-medium' : 'font-normal'
                }`}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
