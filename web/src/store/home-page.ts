// pages/HomePage.tsx
import { create } from "zustand";

interface ContextProps {
  initialized: boolean;
  setInitialized: (initialized: boolean) => void;
  error: string | null;
  loading: boolean;
  isLoadingMore: boolean;
  setIsLoadingMore: (isLoadingMore: boolean) => void;
  hasMore: boolean;
  setHasMore: (hasMore: boolean) => void;
  pageSize: number;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}
export const useHomePageStore = create<ContextProps>((set) => ({
  initialized: false,
  setInitialized: (initialized: boolean) =>
    set((state) => ({ ...state, initialized })),
  error: null,
  loading: false,
  isLoadingMore: false,
  setIsLoadingMore: (isLoadingMore: boolean) =>
    set((state) => ({ ...state, isLoadingMore })),
  hasMore: true,
  setHasMore: (hasMore: boolean) => set((state) => ({ ...state, hasMore })),
  pageSize: 30,
  setError: (error: string | null) => set((state) => ({ ...state, error })),
  setLoading: (loading: boolean) => set((state) => ({ ...state, loading })),
}));