// pages/HomePage.tsx
import "../styles/HomePage.css"
import { useEffect, useState } from "react";
import MusicCard from "../components/MusicCard";

import { API_URL, getMusicUrl } from "../lib/api";
import { Pagination } from "../components/Pagination";
import { Music } from "../def/CommDef";
import { readMeta } from "../lib/readmeta";
import { FlameKindling, Loader, Play } from "lucide-react";
import { usePlaylist } from "../store/playlist";
import { useMusicList } from "../store/musicList";
const pageSize = 30;

function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {musicList, setMusicList, totalCount, setTotalCount} = useMusicList();
  const [currentPage, setCurrentPage] = useState(1);
  const { allSongs, setAllSongs, setCurrentSong } = usePlaylist();

  const fetchList = async (
    onSuccess: (data: any) => void,
    onError: (error: any) => void,
    currentPage: number,
    pageSize?: number) => {
    let url = API_URL + "/musics";
    currentPage && (url += `?page=${currentPage}`);
    pageSize && (url += `&page_size=${pageSize}`);
    console.log("fetching music list from", url);

    // 调用后端接口获取音乐列表
    fetch(url)
      .then((response) => response.json())
      .then(async (data) => {
        if (!data || !data.musics || data.musics.length === 0) {
          return;
        }
        onSuccess(data);
      })
      .catch((error) => {
        onError(error);
      });
  };

  const fetchMusicList = async (currentPage: number) => {
    setLoading(true);
    fetchList((data) => {
      // 更新音乐列表和分页信息
      setMusicList(data.musics);
      setTotalCount(data.total);
      setLoading(false);
      data.musics.forEach((music: Music) => {
        music.url = getMusicUrl(music);
      });
      data.musics.forEach((music: Music) => {
        readMeta(music.url).then((metadata) => {
          music.metadata = metadata;
          setMusicList([...data.musics]);
        });
      });
    },
      (error) => {
        console.error("获取音乐列表失败", error);
        setError(error);
      },
      currentPage, pageSize);
    setLoading(false);
  };


  useEffect(() => {
    if (musicList.length > 0) {
      setLoading(false);
      return;
    }
    fetchMusicList(currentPage);
  }, []);

  function handleMusicClick(music: Music) {
    // navigate(`/music/${musicId}`);
    const index = allSongs.findIndex((song) => song.id === music.id);
    if (index === -1) {
      setAllSongs([...allSongs, music]);
      console.log("add music to playlist", music);
    }
    setCurrentSong(music);
  }

  const onPageChange = (page: number) => {
    setMusicList([]);
    setCurrentPage(page);
    fetchMusicList(page);
  }

  if (loading) {
    return <div className="flex justify-center items-center">
      <Loader className="animate-spin" size={64} />
    </div>;
  }

  if (error) {
    return <div className="text-center">
      <FlameKindling size={64} />
      加载失败，请稍后再试
    </div>;
  }

  const playAllSongs = () => {
    fetchList((data) => {
      // 随机播放全部歌曲
      const randomList = data.musics.sort(() => 0.5 - Math.random());
      setAllSongs(randomList);
    },
      (error) => {
        console.error("获取音乐列表失败", error);
        setError(error);
      },
      currentPage,
      totalCount);
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 items-start">
        <div className="flex items-center gap-2 cursor-pointer hover:bg-blue-600 p-2 rounded-md bg-blue-900 transition-all duration-300" onClick={playAllSongs}>
          <Play />播放全部
        </div>
        <div className="text-sm text-gray-500">
          {/* <input type="checkbox" /> */}
          随机播放全部歌曲
        </div>
      </div>
      <div className="card-container grid gap-4">
        {musicList.map((music: any) => (
          <MusicCard
            key={music.id}
            music={music}
            onClick={() => handleMusicClick(music)}
          />
        ))}
      </div>
      {totalCount > 0 && (
        <Pagination currentPage={currentPage} limit={pageSize} total={totalCount} onPageChange={onPageChange} className="mt-4" />
      )}
    </>
  );
}

export default HomePage;
