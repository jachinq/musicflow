import React, { useEffect, useState } from "react";
import { Music, MyRoutes, SongList } from "../lib/defined";
import { addGenreToSong, getGenreList, removeGenreFromSong, getSongList, addSongToSongList } from "../lib/api";
import { PlusIcon, X, ListPlus } from "lucide-react";
import { Input } from "./Input";
import { GenreElement } from "./Genre";
import { toast } from "sonner";
import { useConfirm } from "./confirm";
import { useNavigate } from "react-router-dom";

export const DetailInfo = ({ song, contentH = false }: { song?: Music, contentH?: boolean }) => {
  const navigate = useNavigate();
  if (!song) return <div>暂无数据</div>;

  const [genres, setGenres] = useState<string[]>([]);
  useEffect(() => {
    if (song) {
      setGenres(song.genres || []);
    }
  }, [song]);

  const gotoArtist = () => {
    navigate(`${MyRoutes.Artists}/${song.artist_id}`);
  };
  const gotoAlbum = () => {
    navigate(`${MyRoutes.Albums}/${song.album_id}`);
  };

  return (
    <div className={`flex flex-col items-center px-8 py-4 ${contentH? "h-full" : "min-h-[calc(100vh-270px)]"}`}>
      <div className="flex flex-col gap-4">
        <ShowItem name="名称" value={song.title} />
        <ShowItem name="歌手" value={song.artist || (song.artists && song.artists.join(" / "))} className="cursor-pointer hover:text-primary-hover" onClick={() => { gotoArtist() }}/>
        <ShowItem name="专辑" value={song.album} className="cursor-pointer hover:text-primary-hover" onClick={() => { gotoAlbum() }} />
        {song.bitrate && <ShowItem name="比特率" value={`${song.bitrate / 1000} kbps`} />}
        {song.samplerate && <ShowItem name="采样率" value={song.samplerate} />}
        <ShowItem name="年份" value={song.year} />
        <ShowItem name="时长" value={song.duration.toFixed(2)} />
        <ShowItem
          name="风格"
          value={<Genres song={song} genres={genres} setGenres={setGenres} />}
        />
        <ShowItem
          name="歌单"
          value={<SongListManager song={song} />}
        />
        <ShowItem name="路径" value={song.file_path} />
      </div>
    </div>
  );
};

const Genres = ({
  song,
  genres,
  setGenres,
}: {
  song: Music;
  genres: string[];
  setGenres: (genres: string[]) => void;
}) => {
  const confirm = useConfirm();
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const handleAddTag = (tagname: string) => {
    tagname = (tagname || "").trim();
    if (tagname === "") return;
    addGenreToSong(
      song.id,
      tagname,
      (result) => {
        if (!result || !result.success) {
          toast.error("添加风格失败", {
            description: result?.message || "未知错误",
          });
          return;
        }
        setGenres(result.data.genres || []);
        setShowNewTagForm(false);
        toast.success("添加风格成功");
      },
      (error) => {
        console.log(error);
        toast.error("添加风格失败");
      }
    );
  };

  const handleDeleteGenre = (evt: React.MouseEvent, genre: string) => {
    evt.stopPropagation();
    const confirmDeleteTag = () => {
      removeGenreFromSong(
        song.id,
        genre,
        (result) => {
          if (!result || !result.success) {
            toast.error("删除风格失败", {
              description: result?.message || "未知错误",
            });
            return;
          }
          setGenres(result.data.genres || []);
          toast.success("删除风格成功");
        },
        (error) => {
          console.log(error);
          toast.error("删除风格失败");
        }
      )
    };
    confirm({ message: "确认删除风格？", onConfirm: confirmDeleteTag });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre, index) => (
        <GenreElement key={genre + index} genre={genre} className="flex items-center gap-1 text-xs">
          <X
            onClick={(e) => handleDeleteGenre(e, genre)}
            className="hover:text-destructive"
            size={12}
          />
        </GenreElement>
      ))}
      <div className="genre" onClick={setShowNewTagForm.bind(null, true)}>
        <PlusIcon size={12} />
      </div>
      {showNewTagForm && (
        <NewTagForm
          genres={genres}
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
  className,
  onClick
}: {
  name: string;
  value: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`grid grid-cols-[1fr,4fr] items-center gap-4 ${className}`} onClick={onClick}>
      <div>{name}</div>
      <div>{value}</div>
    </div>
  );
};

const NewTagForm = ({
  genres,
  onSubmit,
  onCancel,
}: {
  genres: string[];
  onSubmit: (tagname: string) => void;
  onCancel?: () => void;
}) => {
  const [newTag, setNewTag] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);

  const handleAddTag = () => {
    if (newTag.trim() === "") return;
    onSubmit && onSubmit(newTag.trim());
  };

  useEffect(() => {
    getGenreList(
      1,
      9999,
      "",
      (result) => {
        if (result && result.success) {
          const tagList = result.data;
          const filteredTagList = tagList.filter((genre: string) => {
            return !genres.some((t) => {
              return t === genre;
            });
          });
          setTagList(filteredTagList);
        }
      },
      (error) => console.log(error)
    );
  }, []);

  const selectTag = (genre: string) => {
    onSubmit && onSubmit(genre);
  };
  return (
    <>
      <div className="mask" onClick={onCancel}></div>
      <div className="dialog flex flex-col gap-2 z-20 p-8">
        <div className="text-lg font-bold">为当前歌曲添加一个新风格</div>
        <Input
          type="text"
          value={newTag}
          onChange={setNewTag}
          placeholder="输入新风格"
        />
        <div className="flex flex-wrap gap-2 max-h-[calc(100vh-200px)] overflow-y-scroll">
          {tagList.map((genre, index) => (
            <GenreElement key={genre + index} genre={genre} onClick={() => selectTag(genre)} />
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

// 歌单管理组件
const SongListManager = ({ song }: { song: Music }) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <div
        className="genre flex items-center gap-1 cursor-pointer"
        onClick={() => setShowDialog(true)}
      >
        <ListPlus size={16} />
        <span className="text-xs">添加到歌单</span>
      </div>
      {showDialog && (
        <SongListSelectorDialog
          song={song}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  );
};

// 歌单选择对话框
const SongListSelectorDialog = ({
  song,
  onClose,
}: {
  song: Music;
  onClose: () => void;
}) => {
  const [songLists, setSongLists] = useState<SongList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSongList(
      (result) => {
        if (result && result.success) {
          setSongLists(result.data);
        }
        setIsLoading(false);
      },
      (error) => {
        console.log(error);
        toast.error("获取歌单列表失败");
        setIsLoading(false);
      }
    );
  }, []);

  const handleSelectSongList = (songList: SongList) => {
    addSongToSongList(
      songList.id,
      [song.id],
      (result) => {
        if (result && result.success) {
          toast.success("添加到歌单成功", {
            description: `已添加到歌单：${songList.name}`,
          });
          onClose();
        } else {
          toast.error("添加到歌单失败", {
            description: result?.message || "未知错误",
          });
        }
      },
      (error) => {
        console.log(error);
        toast.error("添加到歌单失败");
      }
    );
  };

  return (
    <>
      <div className="mask" onClick={onClose}></div>
      <div className="dialog flex flex-col gap-4 z-20 p-8 max-w-md">
        <div className="text-lg font-bold">选择歌单</div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : songLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p>暂无歌单</p>
            <p className="text-sm">请先创建歌单</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[calc(100vh-300px)] overflow-y-scroll">
            {songLists.map((songList) => (
              <div
                key={songList.id}
                className="card p-4 cursor-pointer hover:bg-primary-hover transition-colors"
                onClick={() => handleSelectSongList(songList)}
              >
                <div className="font-medium">{songList.name}</div>
                {songList.description && (
                  <div className="text-sm text-muted-foreground truncate">
                    {songList.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={onClose} className="button-info">
            取消
          </button>
        </div>
      </div>
    </>
  );
};
