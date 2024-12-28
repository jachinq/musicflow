import { useNavigate } from "react-router-dom";
import { Tag } from "../lib/defined";
import { useMusicList } from "../store/musicList";

export const TagElement = ({ tag, onClick }: { tag: Tag, onClick?: (tag: Tag) => void }) => {
  const { filterTags, setFilterTags } = useMusicList();
  const navigate = useNavigate();
  const selectTag = () => {
    if (!tag) return;
    if (onClick) {
      onClick(tag); // 执行外部传入的点击事件，阻止默认跳转行为
      return;
    }
    // console.log("select tag", tagId);
    const index = filterTags.findIndex((t) => t.id === tag.id);
    if (index === -1) {
      filterTags.push(tag);
      setFilterTags([...filterTags]);
    }
    navigate("/");
  }
  return (
    <div className="tag" key={tag.id} onClick={selectTag}>
      {tag.name}
    </div>
  );
};
