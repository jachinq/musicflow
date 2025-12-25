// pages/HomePage.tsx

import { FlameKindling, Loader } from "lucide-react";
import { useHomePageStore } from "../store/home-page";
import RandomSongs from "../components/RandomSongs";
import { useEffect } from "react";
import { usePlaylist } from "../store/playlist";
import { getPlayList } from "../lib/api";

export const HomePage = () => {
  const { error, loading, setError } = useHomePageStore();
  const { setAllSongs, setCurrentSong, initial, setInitial } = usePlaylist();

  useEffect(() => {
    console.log("HomePage render, playlist initial", initial);
    if (initial) {
      return;
    }
        setInitial(true);
    // 获取播放列表
    getPlayList(1, 0, (data) => {
      if (!data || !data.success) {
        console.error("获取播放列表失败", data);
        return;
      }
      setAllSongs(data.data.list, true);
      if (data.data.current_song) {
        setCurrentSong(data.data.current_song);
      }
    },
      (error) => {
        console.error("获取播放列表失败", error);
        setError(error);
      }
    );
  }, [])

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
    <div className="p-4 grid gap-4">
      <RandomSongs />
    </div>
  );
};
