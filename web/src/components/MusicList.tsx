import { useCallback, useEffect, useRef } from "react";
import { MusicCard } from "../components/MusicCard";

import { getMusicList } from "../lib/api";
import { Play, Rabbit, X } from "lucide-react";
import { usePlaylist } from "../store/playlist";
import { useMusicList } from "../store/musicList";
import { useDevice } from "../hooks/use-device";
import { useKeyboardShortcut } from "../hooks/use-global-keyboard-shortcuts";
import { toast } from "sonner";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { useHomePageStore } from "../store/home-page";
import LoadingIndicator from "../components/LoadingIndicator";

const MusicList = () => {
  const { playSingleSong } = usePlaylist();
  const {
    initialized,
    setInitialized,
    setLoading,
    setError,
    pageSize,
    isLoadingMore,
    setIsLoadingMore,
    hasMore,
    setHasMore,
    loading,
  } = useHomePageStore();
  const currentPageRef = useRef(1);
  const {
    filter,
    needFilter,
    setNeedFilter,
    setTotalCount,
    musicList,
    fetchMusicList,
    lastFetchCount,
  } = useMusicList();

  // 加载更多的函数
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    const nextPage = currentPageRef.current + 1;
    console.log("loadMore 被调用，加载第", nextPage, "页");

    setIsLoadingMore(true);
    fetchMusicList(
      nextPage,
      pageSize,
      setTotalCount,
      (loading) => {
        if (!loading) {
          setIsLoadingMore(false);
        }
      },
      setError,
      true // append = true
    );
    currentPageRef.current = nextPage;
  }, [
    isLoadingMore,
    hasMore,
    pageSize,
    setIsLoadingMore,
    fetchMusicList,
    setTotalCount,
    setError,
    filter, // 添加 filter 依赖
  ]);

  // 使用无限滚动 hook
  useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isLoadingMore,
    threshold: 300,
  });

  // 检查是否还有更多数据
  useEffect(() => {
    // 通过上次获取的数据量判断：如果少于 pageSize，说明已经没有更多数据
    if (lastFetchCount === 0) {
      setHasMore(false);
    } else if (lastFetchCount > 0 && lastFetchCount < pageSize) {
      setHasMore(false);
    } else if (lastFetchCount === pageSize) {
      setHasMore(true);
    }
  }, [lastFetchCount, pageSize, setHasMore]);

  useEffect(() => {
    if (initialized) return;
    fetchMusicList(1, pageSize, setTotalCount, setLoading, setError); // 初始加载
    setInitialized(true);

    // // 获取播放列表
    // getPlayList(1, 0, (data) => {
    //   if (!data || !data.success) {
    //     console.error("获取播放列表失败", data);
    //     return;
    //   }
    //   setAllSongs(data.data.list, true);
    //   if (data.data.current_song) {
    //     setCurrentSong(data.data.current_song);
    //   }
    // },
    //   (error) => {
    //     console.error("获取播放列表失败", error);
    //     setError(error);
    //   }
    // );
  }, []);

  useEffect(() => {
    if (!needFilter) return;

    // 重置分页状态
    currentPageRef.current = 1;
    setHasMore(true);

    fetchMusicList(1, pageSize, setTotalCount, setLoading, setError); // 标签切换时重新获取音乐列表
    setNeedFilter(false);
  }, [needFilter, pageSize, fetchMusicList, setTotalCount, setLoading, setError, setNeedFilter, setHasMore]);

  return (
    <div className="p-4 grid gap-4">
      <Control />
      <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
        {musicList.map((music: any) => (
          <MusicCard key={music.id} music={music} onPlay={playSingleSong} />
        ))}
      </div>
      <LoadingIndicator loading={isLoadingMore} hasMore={hasMore} />
      <NotFound loading={loading} />
    </div>
  );
};

const Control = () => {
  const { filter, totalCount } = useMusicList();
  const { setAllSongs, setCurrentSong } = usePlaylist();
  const { setError } = useHomePageStore();
  const { isSmallDevice } = useDevice();
  const newLineTag =
    isSmallDevice && filter.genres
      ? filter.genres.length > 5
      : filter.genres && filter.genres.length > 10;

  const playAllSongs = () => {
    getMusicList(
      (result) => {
        if (!result || !result.success) {
          toast.error("获取音乐列表失败");
          return;
        }
        if (result.data.list.length === 0) {
          toast.error("没有找到相关歌曲");
          return;
        }
        // 随机播放全部歌曲
        const randomList = result.data.list.sort(() => 0.5 - Math.random());
        setAllSongs(randomList);
        setCurrentSong(randomList[0]);
      },
      (error) => {
        console.error("获取音乐列表失败", error);
        setError(error);
      },
      1,
      totalCount,
      filter
    );
  };

  // o键播放全部歌曲
  useKeyboardShortcut("o", playAllSongs, "musicList", 10, "播放全部歌曲");

  return (
    <div className="flex justify-center items-center gap-4 flex-col">
      <div className="control flex flex-row gap-4 justify-start items-center w-full select-none">
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-primary-hover p-2 rounded-md bg-primary text-primary-foreground transition-all duration-300 max-h-10"
          onClick={playAllSongs}
          title="随机播放全部歌曲"
        >
          <Play />
          <span className="break-keep">播放全部</span>
        </div>

        {!newLineTag && <SelectTag />}
      </div>
      {newLineTag && <SelectTag />}
    </div>
  );
};

const SelectTag = () => {
  const { filter, setFilter, setNeedFilter } = useMusicList();
  const removeSelectedTag = (tag: string) => {
    if (!filter.genres) {
      return;
    }
    filter.genres = filter.genres.filter((t) => t !== tag);
    setFilter({ ...filter });
    setNeedFilter(true);
  };
  return (
    <div>
      {filter.genres && filter.genres.length > 0 && (
        <div>
          <div className="flex flex-row gap-2 justify-center items-center w-full">
            {/* <div className="text-sm break-keep">标签</div> */}
            <div className="flex gap-2 flex-wrap">
              {filter.genres &&
                filter.genres.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 p-1 rounded-md bg-muted text-muted-foreground transition-all duration-300"
                  >
                    {tag}
                    <div
                      onClick={() => removeSelectedTag(tag)}
                      className="hover:text-primary-hover cursor-pointer"
                    >
                      <X />
                    </div>
                    {/* <span className="text-xs text-gray-500">({tag.count})</span> */}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface NotFoundProps {
  loading: boolean;
}
const NotFound = ({ loading }: NotFoundProps) => {
  const { musicList } = useMusicList();
  if (loading || musicList.length > 0) return null;
  return (
    <div className="flex flex-col gap-2 justify-center items-center w-full">
      <Rabbit size={64} />
      没有找到相关歌曲
    </div>
  );
};

export default MusicList;