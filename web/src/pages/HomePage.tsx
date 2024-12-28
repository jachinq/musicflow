// pages/HomePage.tsx
import "../styles/HomePage.css";
import { useEffect, useState } from "react";
import MusicCard from "../components/MusicCard";

import { getMusicList, getMusicUrl } from "../lib/api";
import { Pagination } from "../components/Pagination";
import { Music, Tag } from "../lib/defined";
import { FlameKindling, Loader, Play, Rabbit, X } from "lucide-react";
import { usePlaylist } from "../store/playlist";
import { useMusicList } from "../store/musicList";
import { useDevice } from "../hooks/use-device";
let pageSize = 30;

function HomePage() {
  const { isSmallDevice } = useDevice();
  if (isSmallDevice) {
    pageSize = 6;
  }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    filterTags,
    setFilterTags,
    musicList,
    setMusicList,
    totalCount,
    setTotalCount,
  } = useMusicList();
  const [currentPage, setCurrentPage] = useState(1);
  const { allSongs, setAllSongs, setCurrentSong } = usePlaylist();

  const fetchMusicList = async (currentPage: number) => {
    setLoading(true);
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
      },
      currentPage,
      pageSize,
      {
        tags: filterTags.map((tag) => tag.id),
      }
    );
    setLoading(false);
  };

  useEffect(() => {
    if (filterTags.length === 0) return; // 初始加载全部歌曲
    if (musicList.length > 0) {
      setLoading(false);
      return;
    }
    fetchMusicList(currentPage);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchMusicList(currentPage); // 标签切换时重新获取音乐列表
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

  const onPageChange = (page: number) => {
    setMusicList([]);
    setCurrentPage(page);
    fetchMusicList(page);
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

  const playAllSongs = () => {
    getMusicList(
      (data) => {
        if (!data || !data.musics || data.musics.length === 0) {
          return;
        }
        // 随机播放全部歌曲
        const randomList = data.musics.sort(() => 0.5 - Math.random());
        setAllSongs(randomList);
      },
      (error) => {
        console.error("获取音乐列表失败", error);
        setError(error);
      },
      currentPage,
      totalCount,
      {
        tags: filterTags.map((tag) => tag.id),
      }
    );
  };

  const removeSelectedTag = (tag: Tag) => {
    const newFilterTags = filterTags.filter((t) => t.id !== tag.id);
    setFilterTags(newFilterTags);
  };

  return (
    <div className="p-4">
      <div className="flex justify-center items-center">
        <div className="control mb-4 flex flex-row gap-4 justify-start items-center w-full max-w-[1560px] select-none">
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
                <div className="flex flex-row gap-2 justify-center items-center w-full max-w-[1560px]">
                  <div className="text-sm ">标签</div>
                  <div className="flex gap-2">
                    {filterTags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-1 p-1 rounded-md bg-muted text-muted-foreground transition-all duration-300"
                      >
                        {tag.name}
                        <div onClick={() => removeSelectedTag(tag)} className="hover:text-primary-hover cursor-pointer">
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
      <div className="flex justify-center items-center">
        <div className="card-container grid gap-4 w-full max-w-[1560px]">
          {musicList.map((music: any) => (
            <MusicCard
              key={music.id}
              music={music}
              onClick={() => handleMusicClick(music)}
            />
          ))}
        </div>
      </div>
      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          limit={pageSize}
          total={totalCount}
          onPageChange={onPageChange}
          className="mt-4"
        />
      )}
      {!loading && musicList.length === 0 && (
        <div className="flex flex-col gap-2 justify-center items-center w-full">
          <Rabbit size={64} />
          没有找到相关歌曲
        </div>
      )}
    </div>
  );
}

export default HomePage;
