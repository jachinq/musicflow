// pages/HomePage.tsx
import "../styles/HomePage.css"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MusicCard from "../components/MusicCard";

import { API_URL, getMusicUrl } from "../lib/api";
import { Pagination } from "../components/Pagination";
import { Music } from "../def/CommDef";
import { readMeta } from "../lib/readmeta";
import { FlameKindling, Loader, Play } from "lucide-react";
import { usePlaylist } from "../store/playlist";
import AudioPlayer from "../components/Player";

function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [musicList, setMusicList] = useState<Music[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const { currentSong, setAllSongs, setCurrentSong } = usePlaylist();

  const fetchList = async (onSuccess: (data: any) => void, onError: (error: any) => void, currentPage: number, pageSize?: number) => {
    let url = API_URL + "/musics";
    currentPage && (url += `?page=${currentPage}`);
    pageSize && (url += `&page_size=${pageSize}`);

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
      currentPage);
    setLoading(false);
  };


  useEffect(() => {
    fetchMusicList(currentPage);
  }, []);

  function handleMusicClick(musicId: string) {
    navigate(`/music/${musicId}`);
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
      setAllSongs(data.musics);
    },
      (error) => {
        console.error("获取音乐列表失败", error);
        setError(error);
      },
      currentPage,
      totalCount);
  }

  const onPlayEnd = () => { // 播放结束后，自动下一首
    if (currentSong) {
      const index = musicList.findIndex((music) => music.id === currentSong.id);
      const nextIndex = (index + 1) % musicList.length;
      const nextSong = musicList[nextIndex];
      setCurrentSong(nextSong);
    }
  }

  return (
    <>
      <div className="cursor-pointer hover:scale-105" onClick={playAllSongs}>
        <Play />
      </div>
      <div className="card-container grid gap-4">
        {musicList.map((music: any) => (
          <MusicCard
            key={music.id}
            music={music}
            onClick={() => handleMusicClick(music.id)}
          />
        ))}
      </div>
      {totalCount > 0 && (
        <Pagination currentPage={currentPage} total={totalCount} onPageChange={onPageChange} className={`mt-4 ${currentSong && "mb-16"}`} />
      )}

      {
        currentSong && (
          <div className="fixed bottom-0 left-0 w-full p-4 bg-gray-500">
            <div className="flex justify-between items-center">
              <AudioPlayer music={currentSong} fiexd={true} onPlayEnd={onPlayEnd} />
            </div>
          </div>
        )
      }
    </>
  );
}

export default HomePage;
