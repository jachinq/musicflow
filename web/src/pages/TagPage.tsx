import { useEffect, useState } from "react";
import { getTagList } from "../lib/api";
import { Tag } from "../lib/defined";
import { TagElement } from "../components/Tag";

export const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);

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

  return <div className="p-4">
    <div className="text-2xl font-bold mb-4">标签列表</div>
      <div className="flex flex-wrap gap-4">
      {tags.map((tag) => (
        <TagElement key={tag.id} tag={tag} />
      ))}
    </div>
    
  </div>;
};
