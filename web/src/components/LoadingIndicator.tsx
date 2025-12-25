interface LoadingProps {
  loading: boolean;
  hasMore?: boolean;
}
// 加载指示器组件
const LoadingIndicator = ({ loading, hasMore = false }: LoadingProps) => {
  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">加载中...</div>
    );
  }

  if (!hasMore) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        到底啦~
      </div>
    );
  }

  return null;
};

export default LoadingIndicator;