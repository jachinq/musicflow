import { useNavigate } from "react-router-dom";
import { useMusicList } from "../store/musicList";

export const GenreElement = ({ tag, onClick, children, className }: { tag: string, onClick?: (tag: string) => void } & React.HTMLAttributes<HTMLDivElement>) => {
  const { filter, setNeedFilter, setFilter } = useMusicList();
  const navigate = useNavigate();
  const selectTag = () => {
    if (!tag) return;
    if (onClick) {
      onClick(tag); // 执行外部传入的点击事件，阻止默认跳转行为
      return;
    }
    // console.log("select tag", tagId);
    if (!filter.genres) filter.genres = [];
    const index = filter.genres.findIndex((t) => t === tag);
    if (index === -1) {
      filter.genres = [...filter.genres, tag];
      setFilter({...filter });
      setNeedFilter(true);
    }
    navigate("/");
  }
  return (
    <div className={"tag " + className} key={tag} onClick={selectTag}>
      {tag}
      {children}
    </div>
  );
};
