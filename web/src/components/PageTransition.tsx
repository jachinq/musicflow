import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * 页面切换动画包装器
 * 为路由切换添加淡入淡出效果
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 页面切换时滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div
      ref={nodeRef}
      className="page-transition"
      key={location.pathname}
    >
      {children}
    </div>
  );
}
