import { Link, useNavigate } from "react-router-dom";
import { Music2Icon, SettingsIcon, TagIcon } from "lucide-react";
import { useState } from "react";
import { MyRoutes } from "../lib/defined";
import { toast } from "sonner";
import { useEffect } from "react";
import { usePlaylist } from "../store/playlist";
import { getPlayQueue } from "../lib/api";
import { SearchInput } from "./SearchInput";

export const Header = () => {
  const { showPlaylist } = usePlaylist();
  const [fitlerText, setFitlerText] = useState("");
  const changeFitlerText = (value: string) => {
    setFitlerText(value);
  };

  const navigate = useNavigate();
  const search = (query: string) => {
    const trimmedText = query.trim();
    if (!trimmedText || trimmedText === "") {
      toast.error("请输入搜索关键字");
      return;
    }

    // 跳转到搜索结果页面
    navigate(`${MyRoutes.Search}?q=${encodeURIComponent(trimmedText)}`);
  };

    const { setAllSongs, setCurrentSong } = usePlaylist();

  useEffect(() => {
    // 获取播放列表
    getPlayQueue(1, 0, (data) => {
      if (!data || !data.success) {
        console.error("获取播放列表失败", data);
        return;
      }
      setAllSongs(data.data.list, true);
      if (data.data.current_song) {
        // 应用首次加载，标记为用户未交互。不进行自动播放
        setCurrentSong(data.data.current_song, false);
      }
    },
      (error) => {
        console.error("获取播放列表失败", error);
      }
    );
  }, [])

  return (
    <nav
      className={
        "px-4 py-3 bg-primary-foreground top-0 w-full sticky" +
        (showPlaylist ? " z-[1]" : " z-[10]")
      }
    >
      <div className="flex justify-between gap-2">
        <Link
          to="/"
          className="font-bold text-lg flex items-center justify-center "
        >
          <div className="flex items-center justify-center gap-1">
            <div className="rounded-full overflow-hidden">
              <img src="/favicon.ico" alt="" width={28} />
            </div>
            <span className="hover:text-primary-hover">Musicflow</span>
          </div>
        </Link>
        <div className="w-1/2 flex justify-end items-center gap-2">
          <SearchInput
            value={fitlerText}
            onChange={changeFitlerText}
            onSearch={search}
            placeholder="搜索音乐/歌手/专辑"
            className="flex-1"
          />
        </div>
        <div className="flex space-x-4 items-center">
          <Link to="/playlist" className="navigation">
            <Music2Icon />
          </Link>
          <Link to="/albums" className="navigation">
            <TagIcon />
          </Link>
          <Link to="/settings" className="navigation">
            <SettingsIcon />
          </Link>
        </div>
      </div>
    </nav>
  );
};
