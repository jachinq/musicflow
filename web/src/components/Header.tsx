import { Link, useNavigate } from "react-router-dom";
import { Input } from "./Input";
import { Music2Icon, SearchIcon, SettingsIcon, TagIcon } from "lucide-react";
import { usePlaylist } from "../store/playlist";
import { useState } from "react";
import { MyRoutes } from "../lib/defined";
import { toast } from "sonner";

export const Header = () => {
  const { showPlaylist } = usePlaylist();
  const [fitlerText, setFitlerText] = useState("");
  const changeFitlerText = (value: string) => {
    setFitlerText(value);
  };

  const navigate = useNavigate();
  const search = () => {
    const trimmedText = fitlerText.trim();
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
        (showPlaylist ? "" : " z-[1]")
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
          <Input
            value={fitlerText}
            onChange={changeFitlerText}
            placeholder="搜索音乐/歌手/专辑"
            onEnter={search}
          />
          <SearchIcon
            onClick={search}
            className="cursor-pointer hover:text-primary-hover"
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
