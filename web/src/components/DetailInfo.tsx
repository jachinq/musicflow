import React, { useEffect, useState } from "react";
import { Music, Tag } from "../lib/defined";
import { addTagToSong, getSongTags, getTagList, removeTagFromSong } from "../lib/api";
import { SquarePlus, X } from "lucide-react";
import { Input } from "./Input";
import { TagElement } from "./Tag";
import { toast } from "sonner";
import { useConfirm } from "./confirm";

export const DetailInfo = ({ song }: { song?: Music }) => {
  if (!song) return <div>暂无数据</div>;

  const [tags, setTags] = useState<Tag[]>([]);
  useEffect(() => {
    getSongTags(
      song.id,
      (result) => {
        if (result && result.success) {
          setTags(result.data);
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }, [song]);

  return (
    <div className="flex flex-col justify-center items-center px-8 py-4">
      <div className="flex flex-col gap-4">
        <ShowItem name="名称" value={song.title} />
        <ShowItem name="歌手" value={JSON.parse(song.artists).join(" / ")} />
        <ShowItem name="专辑" value={song.album} />
        <ShowItem name="比特率" value={song.bitrate.toFixed(2)} />
        <ShowItem name="采样率" value={song.samplerate.toFixed(2)} />
        <ShowItem name="年份" value={song.year} />
        <ShowItem name="时长" value={song.duration.toFixed(2)} />
        <ShowItem
          name="标签"
          value={<Tags song={song} tags={tags} setTags={setTags} />}
        />
      </div>
    </div>
  );
};

const Tags = ({
  song,
  tags,
  setTags,
}: {
  song: Music;
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
}) => {
  const confirm = useConfirm();
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const handleAddTag = (tagname: string) => {
    tagname = (tagname || "").trim();
    if (tagname === "") return;
    addTagToSong(
      song.id,
      tagname,
      (result) => {
        if (!result || !result.success) {
          toast.error("添加标签失败", {
            description: result?.message || "未知错误",
          });
          return;
        }
        setTags(result.data);
        setShowNewTagForm(false);
        toast.success("添加标签成功");
      },
      (error) => {
        console.log(error);
        toast.error("添加标签失败");
      }
    );
  };

  const handleDeleteTag = (evt: React.MouseEvent, tag: Tag) => {
    evt.stopPropagation();
    const confirmDeleteTag = () => {
      removeTagFromSong(
        song.id,
        tag.id,
        (result) => {
          if (!result || !result.success) {
            toast.error("删除标签失败", {
              description: result?.message || "未知错误",
            });
            return;
          }
          setTags(result.data);
          toast.success("删除标签成功");
        },
        (error) => {
          console.log(error);
          toast.error("删除标签失败");
        }
      )
    };
    confirm({ message: "确认删除标签？", onConfirm: confirmDeleteTag });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <TagElement key={tag.id} tag={tag} className="flex items-center gap-1">
          <X
            onClick={(e) => handleDeleteTag(e, tag)}
            className="hover:text-red-500"
          />
        </TagElement>
      ))}
      <div className="tag" onClick={setShowNewTagForm.bind(null, true)}>
        <SquarePlus strokeWidth={1} />
      </div>
      {showNewTagForm && (
        <NewTagForm
          tags={tags}
          onSubmit={handleAddTag}
          onCancel={setShowNewTagForm.bind(null, false)}
        />
      )}
    </div>
  );
};

const ShowItem = ({
  name,
  value,
}: {
  name: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="grid grid-cols-[1fr,4fr] gap-4">
      <div>{name}</div>
      <div>{value}</div>
    </div>
  );
};

const NewTagForm = ({
  tags,
  onSubmit,
  onCancel,
}: {
  tags: Tag[];
  onSubmit: (tagname: string) => void;
  onCancel?: () => void;
}) => {
  const [newTag, setNewTag] = useState("");
  const [tagList, setTagList] = useState<Tag[]>([]);

  const handleAddTag = () => {
    if (newTag.trim() === "") return;
    onSubmit && onSubmit(newTag.trim());
  };

  useEffect(() => {
    getTagList(
      (result) => {
        if (result && result.success) {
          const tagList = result.data;
          const filteredTagList = tagList.filter((tag: Tag) => {
            return !tags.some((t: Tag) => {
              return t.id === tag.id || t.name === tag.name;
            });
          });
          setTagList(filteredTagList);
        }
      },
      (error) => console.log(error)
    );
  }, []);

  const selectTag = (tag: Tag) => {
    onSubmit && onSubmit(tag.name);
  };
  return (
    <>
      <div className="mask" onClick={onCancel}></div>
      <div className="dialog flex flex-col gap-2 z-20 p-8">
        <div className="text-lg font-bold">为当前歌曲添加一个新标签</div>
        <Input
          type="text"
          value={newTag}
          onChange={setNewTag}
          placeholder="输入新标签"
        />
        <div className="flex flex-wrap gap-2 max-h-[calc(100vh-200px)] overflow-y-scroll">
          {tagList.map((tag) => (
            <TagElement key={tag.id} tag={tag} onClick={() => selectTag(tag)} />
          ))}
        </div>
        <div className="flex justify-end gap-2 items-center mt-4">
          <button onClick={handleAddTag} className="button">
            添加
          </button>
          <button onClick={onCancel} className="button-info">
            取消
          </button>
        </div>
      </div>
    </>
  );
};
