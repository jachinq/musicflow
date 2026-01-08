import { Link, useNavigate } from "react-router-dom";
import { Music2Icon, SettingsIcon, TagIcon, Heart } from "lucide-react";
import { useState } from "react";
import { MyRoutes } from "../lib/defined";
import { toast } from "sonner";
import { usePlaylist } from "../store/playlist";
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
            <span className="hover:text-primary-hover sm:block hidden">Musicflow</span>
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
          <Link to="/favorites" className="navigation" title="我的收藏">
            <Heart />
          </Link>
          <Link to="/playlist" className="navigation" title="歌单">
            <Music2Icon />
          </Link>
          <Link to="/albums" className="navigation" title="专辑/艺术家/风格">
            <TagIcon />
          </Link>
          <Link to="/settings" className="navigation" title="设置">
            <SettingsIcon />
          </Link>
        </div>
      </div>
    </nav>
  );
};
