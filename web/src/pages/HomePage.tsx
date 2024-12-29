// pages/HomePage.tsx
import "../styles/HomePage.css";
import { createContext, useContext, useEffect, useState } from "react";
import { MusicCard } from "../components/MusicCard";

import { getMusicList, getMusicUrl } from "../lib/api";
import { Pagination } from "../components/Pagination";
import { Music, Tag } from "../lib/defined";
import { FlameKindling, Loader, Play, Rabbit, X } from "lucide-react";
import { usePlaylist } from "../store/playlist";
import { useMusicList } from "../store/musicList";
import { useDevice } from "../hooks/use-device";
import { useKeyPress } from "../hooks/use-keypress";

interface ContextProps {
  pageSize: number;
  currentPage: number;
  setCurrentPage: (currentPage: number) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  fetchMusicList: (currentPage: number) => void;
}
const defaultContext: ContextProps = {
  pageSize: 30,
  currentPage: 1,
  setCurrentPage: () => {},
  setError: () => {},
  setLoading: () => {},
  fetchMusicList: () => {},
};
const context = createContext<ContextProps>(defaultContext);

export const HomePage = () => {
  const { isSmallDevice } = useDevice();
  const pageSize = isSmallDevice ? 6 : 30;
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { filterTags, setMusicList, setTotalCount } = useMusicList();

  const fetchMusicList = async (currentPage: number) => {
    setLoading(true);
    setMusicList([]);
    getMusicList(
      (data) => {
        if (!data || !data.musics) {
          return;
        }
        // 更新音乐列表和分页信息
        setMusicList(data.musics);
        setTotalCount(data.total);
        setLoading(false);
        data.musics.forEach((music: Music) => {
          music.file_url = getMusicUrl(music);
        });
      },
      (error) => {
        console.error("获取音乐列表失败", error);
        setError(error);
        setLoading(false);
      },
      currentPage,
      pageSize,
      {
        tags: filterTags.map((tag) => tag.id),
      }
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-68px)]">
        <Loader className="animate-spin" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 justify-center items-center p-4">
        <div className="flex flex-col gap-2 justify-center items-center text-destructive">
          <FlameKindling size={64} />
          加载失败，请稍后再试
        </div>
        <div className="text-xs text-muted-foreground">
          {JSON.stringify(error, null, 2)}
        </div>
      </div>
    );
  }

  return (
    <context.Provider value={{ pageSize, currentPage, setCurrentPage, setError, setLoading, fetchMusicList }}>
      <div className="p-4">
        <Control />
        <MusicList />
        <HomePagePagination />
        <NotFound loading={loading} />
      </div>
    </context.Provider>
  );
};


const Control = () => {
  const { filterTags, setFilterTags, setNeedFilter, totalCount } =
    useMusicList();
  const { setAllSongs, setCurrentSong } = usePlaylist();
  const { setError } = useContext(context);

  const playAllSongs = () => {
    getMusicList(
      (data) => {
        if (!data || !data.musics || data.musics.length === 0) {
          return;
        }
        // 随机播放全部歌曲
        const randomList = data.musics.sort(() => 0.5 - Math.random());
        setAllSongs(randomList);
        setCurrentSong(randomList[0]);
      },
      (error) => {
        console.error("获取音乐列表失败", error);
        setError(error);
      },
      1,
      totalCount,
      {
        tags: filterTags.map((tag) => tag.id),
      }
    );
  };

  const removeSelectedTag = (tag: Tag) => {
    const newFilterTags = filterTags.filter((t) => t.id !== tag.id);
    setFilterTags(newFilterTags);
    setNeedFilter(true);
  };

  useKeyPress("o", playAllSongs); // o键播放全部歌曲

  return (
    <div className="flex justify-center items-center">
      <div className="control mb-4 flex flex-row gap-4 justify-start items-center w-full select-none">
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-primary-hover p-2 rounded-md bg-primary text-primary-foreground transition-all duration-300"
          onClick={playAllSongs}
          title="随机播放全部歌曲"
        >
          <Play />
          播放全部
        </div>

        <div>
          {filterTags.length > 0 && (
            <div>
              <div className="flex flex-row gap-2 justify-center items-center w-full">
                <div className="text-sm ">标签</div>
                <div className="flex gap-2 flex-wrap">
                  {filterTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-1 p-1 rounded-md bg-muted text-muted-foreground transition-all duration-300"
                    >
                      {tag.name}
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
      </div>
    </div>
  );
};


const MusicList = () => {
  const { allSongs, setAllSongs, setCurrentSong } = usePlaylist();
  const { filterTags, needFilter, setNeedFilter, musicList } = useMusicList();
  const { setLoading, fetchMusicList } = useContext(context);

  useEffect(() => {
    // 第一次加载页面时获取音乐列表
    if (musicList.length > 0) {
      setLoading(false);
      return;
    }
    fetchMusicList(1);
  }, []);

  useEffect(() => {
    if (!needFilter) return;
    fetchMusicList(1); // 标签切换时重新获取音乐列表
    setNeedFilter(false);
  }, [filterTags]);

  function handleMusicClick(music: Music) {
    // navigate(`/music/${musicId}`);
    const index = allSongs.findIndex((song) => song.id === music.id);
    if (index === -1) {
      setAllSongs([...allSongs, music]);
      console.log("add music to playlist", music.title);
    }
    setCurrentSong(music);
  }
  return (
    <div className="flex justify-center items-center">
      <div className="card-container grid gap-4 w-full">
        {musicList.map((music: any) => (
          <MusicCard
            key={music.id}
            music={music}
            onClick={() => handleMusicClick(music)}
          />
        ))}
      </div>
    </div>
  );
};

const HomePagePagination = () => {
  const { isSmallDevice } = useDevice();
  const pageSize = isSmallDevice ? 6 : 30;
  const { totalCount } = useMusicList();
  const { showPlaylist } = usePlaylist();
  const { currentPage, setCurrentPage, fetchMusicList } = useContext(context);

  // 左右箭头控制翻页
  useKeyPress("ArrowRight", () => {
    if (
      !showPlaylist &&
      totalCount > 0 &&
      currentPage < Math.ceil(totalCount / pageSize)
    ) {
      onPageChange(currentPage + 1);
    }
  });
  useKeyPress("ArrowLeft", () => {
    if (!showPlaylist && totalCount > 0 && currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  });
  const onPageChange = (page: number) => {
    setCurrentPage(page);
    fetchMusicList(page);
  };

  if (totalCount <= 0) return null;

  return (
    <Pagination
      currentPage={currentPage}
      limit={pageSize}
      total={totalCount}
      onPageChange={onPageChange}
      className="mt-4"
    />
  );
};

interface NotFoundProps {
  loading: boolean;
}
const NotFound = ({ loading }: NotFoundProps) => {
  const { totalCount } = useMusicList();
  if (loading || totalCount > 0) return null;
  return (
    <div className="flex flex-col gap-2 justify-center items-center w-full">
      <Rabbit size={64} />
      没有找到相关歌曲
    </div>
  );
};
