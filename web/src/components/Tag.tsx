import { useNavigate } from "react-router-dom";
import { Tag } from "../lib/defined";
import { useMusicList } from "../store/musicList";

export const TagElement = ({ tag, onClick, children, className }: { tag: Tag, onClick?: (tag: Tag) => void } & React.HTMLAttributes<HTMLDivElement>) => {
  const { filterTags, setFilterTags, filter, setNeedFilter, setFilter } = useMusicList();
  const navigate = useNavigate();
  const selectTag = () => {
    if (!tag) return;
    if (onClick) {
      onClick(tag); // 执行外部传入的点击事件，阻止默认跳转行为
      return;
    }
    // console.log("select tag", tagId);
    if (!filter.tags) filter.tags = [];
    const index = filter.tags.findIndex((t) => t === tag.id);
    if (index === -1) {
      filterTags.push(tag);
      setFilterTags([...filterTags]);
      filter.tags = filterTags.map((t) => t.id);
      setFilter({...filter });
      setNeedFilter(true);
    }
    navigate("/");
  }
  return (
    <div className={"tag " + className} key={tag.id} onClick={selectTag}>
      {tag.name}
      {children}
    </div>
  );
};
