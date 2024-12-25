// pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MusicCard from "../components/MusicCard";

import { API_URL, getMusicUrl } from "../lib/api";
import { Pagination } from "../components/Pagination";
import { Music } from "../def/CommDef";
import { readMeta } from "../lib/readmeta";

function HomePage() {
  const [musicList, setMusicList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  const fetchMusicList = async (currentPage: number) => {
    const url = currentPage && (currentPage > 1) && (API_URL + "/musics?page=" + currentPage);
    // 调用后端接口获取音乐列表
    fetch(url || API_URL + "/musics")
      .then((response) => response.json())
      .then(async(data) => {
        if (!data || !data.musics || data.musics.length === 0) {
          return;
        }
        // 处理meta信息
        await data.musics.forEach(async (music: Music) => {
          const metadata = await readMeta(getMusicUrl(music));
          music.metadata = metadata;
        });
        // 更新音乐列表和分页信息
        setMusicList(data.musics);
        setTotalCount(data.total);
      })
      .catch((error) => console.error("获取音乐列表失败", error));
  };

  useEffect(() => {
    fetchMusicList(currentPage);
  }, []);
  // useEffect(() => {
  //   if (musicList) {
  //     // 处理meta信息
  //     musicList.forEach(async (music: Music) => {
  //       const metadata = await readMeta(getMusicUrl(music));
  //       music.metadata = metadata;
  //     });
  //   }
  // }, [musicList]);

  function handleMusicClick(musicId: string) {
    navigate(`/music/${musicId}`);
  }

  const onPageChange = (page: number) => {
    setCurrentPage(page);
    fetchMusicList(page);
  }

  return (
    <>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {musicList.map((music: any) => (
        <MusicCard
          key={music.id}
          music={music}
          onClick={() => handleMusicClick(music.id)}
        />
      ))}
    </div>
    {totalCount > 0 && (
      <Pagination currentPage={currentPage} total={totalCount} onPageChange={onPageChange} className="mt-4" />
      )
    }
    </>
  );
}

export default HomePage;
