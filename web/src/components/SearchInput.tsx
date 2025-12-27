import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchHistory, useDebouncedSearch, useSearchSuggestions } from '../hooks/use-search';
import { SearchSuggestions } from './SearchSuggestions';
import { useClickAway } from '@uidotdev/usehooks';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * 增强版搜索输入框
 * 集成搜索历史、实时建议和防抖搜索
 */
export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = '搜索音乐/歌手/专辑',
  className = '',
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

  // 防抖搜索
  const debouncedQuery = useDebouncedSearch(value, 300);

  // 搜索建议
  const suggestions = useSearchSuggestions(debouncedQuery, history);

  // 点击外部关闭建议框
  const containerRef = useClickAway<HTMLDivElement>(() => {
    setIsFocused(false);
  });

  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    addToHistory(trimmed);
    onSearch(trimmed);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(value);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    handleSearch(suggestion);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-20 bg-muted text-foreground rounded-full border border-transparent focus:border-primary focus:outline-none transition-all duration-200"
        />

        {/* 清除按钮 */}
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-muted-foreground/10 rounded-full transition-colors"
            aria-label="清除"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* 搜索按钮 */}
        <button
          onClick={() => handleSearch(value)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary-hover transition-colors"
          aria-label="搜索"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* 搜索建议 */}
      <SearchSuggestions
        query={value}
        history={history}
        suggestions={suggestions}
        isVisible={isFocused}
        onSelectSuggestion={handleSelectSuggestion}
        onRemoveHistory={removeFromHistory}
        onClearHistory={clearHistory}
      />
    </div>
  );
}
