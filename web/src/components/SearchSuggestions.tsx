import { Clock, Search, X, TrendingUp } from 'lucide-react';
import { SearchHistoryItem } from '../hooks/use-search';

interface SearchSuggestionsProps {
  query: string;
  history: SearchHistoryItem[];
  suggestions: string[];
  isVisible: boolean;
  onSelectSuggestion: (suggestion: string) => void;
  onRemoveHistory: (query: string) => void;
  onClearHistory: () => void;
}

/**
 * 搜索建议下拉框组件
 * 显示搜索历史和实时建议
 */
export function SearchSuggestions({
  query,
  history,
  suggestions,
  isVisible,
  onSelectSuggestion,
  onRemoveHistory,
  onClearHistory,
}: SearchSuggestionsProps) {
  if (!isVisible) {
    return null;
  }

  const hasHistory = history.length > 0;
  const hasSuggestions = suggestions.length > 0;

  // 如果没有输入且没有历史记录,不显示
  if (!query && !hasHistory) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {/* 搜索历史 */}
      {!query && hasHistory && (
        <div className="p-2">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>搜索历史</span>
            </div>
            <button
              onClick={onClearHistory}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>

          <div className="space-y-1">
            {history.map((item) => (
              <div
                key={item.query + item.timestamp}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md cursor-pointer group"
                onClick={() => onSelectSuggestion(item.query)}
              >
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 text-sm truncate">{item.query}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveHistory(item.query);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted-foreground/10 rounded"
                  aria-label="删除历史记录"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 搜索建议 */}
      {query && hasSuggestions && (
        <div className="p-2">
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>搜索建议</span>
          </div>

          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion + index}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md cursor-pointer"
                onClick={() => onSelectSuggestion(suggestion)}
              >
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 text-sm truncate">
                  {/* 高亮匹配部分 */}
                  <HighlightMatch text={suggestion} query={query} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 无结果提示 */}
      {query && !hasSuggestions && (
        <div className="p-8 text-center text-muted-foreground text-sm">
          没有找到相关建议
        </div>
      )}
    </div>
  );
}

/**
 * 高亮匹配文本
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-primary/20 text-foreground font-medium">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}
