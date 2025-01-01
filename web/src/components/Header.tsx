import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "./Input";
import { Music2Icon, SearchIcon, SettingsIcon, TagIcon } from "lucide-react";
import { usePlaylist } from "../store/playlist";
import { useMusicList } from "../store/musicList";
import { useHomePageStore } from "../pages/HomePage";
import { useEffect, useState } from "react";

export const Header = () => {
  const { showPlaylist } = usePlaylist();
  const { filter, setFilter, setTotalCount, fetchMusicList } = useMusicList();
  const { pageSize, setLoading, setError } = useHomePageStore();
  const [fitlerText, setFitlerText] = useState("");
  useEffect(() => {
    setFilter({ ...filter, any: fitlerText });
    if (fitlerText==="") { // 如果搜索框为空，则显示全部
      search();
    }
  }, [fitlerText]);

  const location = useLocation();
  const navigate = useNavigate();
  const search = () => {
    fetchMusicList(1, pageSize, setTotalCount, setLoading, setError);
    // 如果不是首页，则跳转到首页
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  return (
    <nav
      className={
        "px-4 py-3 bg-primary-foreground top-0 w-full sticky" +
        (showPlaylist ? "" : " z-[1]")
      }
    >
      <div className="flex justify-between gap-2">
        <Link to="/" className="font-bold text-lg flex items-center justify-center ">
          <div className="flex items-center justify-center gap-1">
            <div className="rounded-full overflow-hidden">
              <img src="/favicon.ico" alt="" width={28} />
            </div>
            <span className="hover:text-primary-hover">Musicflow</span>
          </div>
        </Link>
        <div className="w-1/2 flex justify-end items-center gap-2">
          <Input value={fitlerText} onChange={setFitlerText} placeholder="搜索音乐/歌手/专辑/标签/年份" onEnter={search} />
          <SearchIcon onClick={search} className="cursor-pointer hover:text-primary-hover" />
        </div>
        <div className="flex space-x-4 items-center">
          <Link to="/playlist" className="navigation">
            <Music2Icon />
          </Link>
          <Link to="/tags" className="navigation">
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
