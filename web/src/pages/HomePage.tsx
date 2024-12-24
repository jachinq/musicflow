// pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MusicCard from "../components/MusicCard";

import { API_URL } from "../lib/api";

function HomePage() {
  const [musicList, setMusicList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 调用后端接口获取音乐列表
    fetch(API_URL + "/musics")
      .then((response) => response.json())
      .then((data) => {
        setMusicList(data.musics);
      })
      .catch((error) => console.error("获取音乐列表失败", error));
  }, []);

  function handleMusicClick(musicId: string) {
    navigate(`/music/${musicId}`);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {musicList.map((music: any) => (
        <MusicCard
          key={music.id}
          music={music}
          onClick={() => handleMusicClick(music.id)}
        />
      ))}
    </div>
  );
}

export default HomePage;
