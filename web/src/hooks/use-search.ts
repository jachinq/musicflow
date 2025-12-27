import { useState, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'musicflow_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  type?: 'music' | 'album' | 'artist';
}

/**
 * 搜索历史管理 Hook
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // 从 localStorage 加载历史记录
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  }, []);

  // 保存历史记录到 localStorage
  const saveHistory = (newHistory: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  };

  // 添加搜索记录
  const addToHistory = (query: string, type?: 'music' | 'album' | 'artist') => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      type,
    };

    // 移除重复项,保留最新的
    const filtered = history.filter((item) => item.query !== newItem.query);

    // 添加新项到开头,限制最大数量
    const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);

    saveHistory(newHistory);
  };

  // 删除单个历史记录
  const removeFromHistory = (query: string) => {
    const newHistory = history.filter((item) => item.query !== query);
    saveHistory(newHistory);
  };

  // 清空历史记录
  const clearHistory = () => {
    saveHistory([]);
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}

/**
 * 搜索建议 Hook
 * 基于历史记录和输入提供搜索建议
 */
export function useSearchSuggestions(
  query: string,
  history: SearchHistoryItem[],
  allItems: string[] = []
) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();

    // 从历史记录中筛选匹配项
    const historyMatches = history
      .filter((item) => item.query.toLowerCase().includes(lowerQuery))
      .map((item) => item.query);

    // 从所有项目中筛选匹配项 (可选)
    const itemMatches = allItems
      .filter((item) => item.toLowerCase().includes(lowerQuery))
      .slice(0, 5);

    // 合并并去重
    const combined = [...new Set([...historyMatches, ...itemMatches])];

    setSuggestions(combined.slice(0, 8));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]); // 只依赖 query,避免无限循环

  return suggestions;
}

/**
 * 防抖搜索 Hook
 */
export function useDebouncedSearch(value: string, delay: number = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
