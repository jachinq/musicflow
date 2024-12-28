import { useEffect, useState } from "react";
import { getTagList } from "../lib/api";
import { Tag } from "../lib/defined";
import { useNavigate } from "react-router-dom";
import { useMusicList } from "../store/musicList";

export const TagsPage = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState<Tag[]>([]);
  const {filterTags, setFilterTags} = useMusicList();

  useEffect(() => {
    getTagList(
      (result) => {
        if (!result || !result.data || result.data.length === 0) {
          console.log("No tags found");
          return;
        }
        // console.log(result.data);
        setTags(result.data);
      },
      (error) => {
        console.error(error);
      }
    )
  }, []);


  const selectTag = (tag: Tag) => {
    if (!tag) return;
    // console.log("select tag", tagId);
    filterTags.push(tag);
    setFilterTags([...filterTags]);
    navigate("/");
  }
  return <div className="p-4">
    <div className="text-2xl font-bold mb-4">标签列表</div>
      <div className="flex flex-wrap gap-4">
      {tags.map((tag) => (
        <div className="bg-muted text-muted-foreground hover:bg-primary-hover rounded-md px-4 py-2 cursor-pointer" key={tag.id} onClick={() => selectTag(tag)}>{tag.name}</div>
      ))}
    </div>
    
  </div>;
};
