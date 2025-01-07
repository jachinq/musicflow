import { useNavigate } from "react-router-dom";
import { useMusicList } from "../store/musicList";
import { MyRoutes } from "../lib/defined";

export const GenreElement = ({ genre, onClick, children, className }: { genre: string, onClick?: (genre: string) => void } & React.HTMLAttributes<HTMLDivElement>) => {
  const { filter, setNeedFilter, setFilter } = useMusicList();
  const navigate = useNavigate();
  const handleOnClick = () => {
    if (!genre) return;
    if (onClick) {
      onClick(genre); // 执行外部传入的点击事件，阻止默认跳转行为
      return;
    }
    // console.log("select genre", tagId);
    if (!filter.genres) filter.genres = [];
    const index = filter.genres.findIndex((t) => t === genre);
    if (index === -1) {
      filter.genres = [...filter.genres, genre];
      setFilter({...filter });
      setNeedFilter(true);
    }
    navigate(MyRoutes.Home);
  }
  return (
    <div className={"genre " + className} key={genre} onClick={handleOnClick}>
      {genre}
      {children}
    </div>
  );
};
