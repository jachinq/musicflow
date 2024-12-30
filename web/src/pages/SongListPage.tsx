import React, { useEffect, useState } from "react";
import {
  addSongToSongList,
  createSongList,
  getCoverSmallUrl,
  getMusicList,
  getSongList,
  getSongListSongs,
  updateSongList,
} from "../lib/api";
import { Music, SongList } from "../lib/defined";
import { toast } from "sonner";
import { useConfirm } from "../components/confirm";
import { Form } from "../components/Form";
import { Input } from "../components/Input";
import { useDevice } from "../hooks/use-device";
import { MusicCard } from "../components/MusicCard";
import { PlusCircle } from "lucide-react";
import { Cover } from "../components/Cover";
import { usePlaylist } from "../store/playlist";

const buildSongList = (name: string, description?: string): SongList => {
  return {
    id: 0,
    name,
    user_id: 1,
    description: description || name,
    cover: "",
    created_at: new Date().toLocaleString(),
  };
};

export const SongListPage = () => {
  const confirm = useConfirm();
  const [songLists, setSongLists] = useState<SongList[]>([]);
  const [selectSongList, setSelectSongList] = useState<SongList | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [musicList, setMusicList] = useState<Music[]>([]);

  const [showAddSongDialog, setShowAddSongDialog] = useState(false);

  const fetchSongList = (autoSelect?: boolean) => {
    getSongList(
      (result) => {
        if (result && result.success) {
          setSongLists(result.data);
          autoSelect &&
            result.data.length > 0 &&
            setSelectSongList(result.data[0]);
        }
      },
      (error) => console.log(error)
    );
  };

  useEffect(() => {
    fetchSongList(true);
  }, []);

  useEffect(() => {
    if (selectSongList) {
      getSongListSongs(
        selectSongList.id,
        (result) => {
          if (result && result.success) {
            setMusicList(result.data);
          }
        },
        (error) => {
          console.log(error);
          toast.error("获取歌单失败", {
            description: "获取歌单失败" + error.message || "未知错误",
          });
        }
      );
    }
  }, [selectSongList]);

  const handleCreateSongList = () => {
    const { name } = formValues;
    if (!name) {
      toast.error("歌单名称不能为空");
      return;
    }

    const songList = formValues as SongList;
    const operation = songList.id > 0 ? "更新" : "创建";
    const operationFunc = songList.id > 0 ? updateSongList : createSongList;

    operationFunc(
      songList,
      (result) => {
        if (result && result.success) {
          fetchSongList(true);
          setShowForm(false);
        } else {
          toast.error(operation + "歌单失败", {
            description: operation + "歌单失败" + result.message || "未知错误",
          });
        }
      },
      (error) => {
        console.log(error);
        toast.error(operation + "歌单失败");
      }
    );
  };
  const handleUpdateSongList = () => {
    if (!selectSongList) return;
    setFormValues({ ...selectSongList });
    setShowForm(true);
  };
  const handleDeleteSongList = () => {};

  const handleAddSong = () => {
    setShowAddSongDialog(true);
  };
  const handleAddSongToSongList = (music: Music) => {
    if (!selectSongList) return;
    if (!music) return;
    // confirm(
    //   `是否要将 "${music.title}" 添加到 "${selectSongList.name}" 歌单？`,
    //   () => {
    addSongToSongList(
      selectSongList.id,
      music.id,
      (result) => {
        if (result && result.success) {
          toast.success("添加歌曲成功", {
            description: `"${music.title}" 已添加到 "${selectSongList.name}" 歌单`,
          });
          fetchSongList(true);
          setShowAddSongDialog(false);
        } else {
          toast.error("添加歌曲失败", {
            description: "添加歌曲失败" + result.message || "未知错误",
          });
        }
      },
      (error) => {
        console.log(error);
        toast.error("添加歌曲失败");
      }
    );
    //   },
    //   () => {}
    // );
  };

  const handleRemoveSong = () => {};
  const handlePlayAll = () => {
    if (!selectSongList) return;
    getSongListSongs(
      selectSongList.id,
      (result) => {
        if (!result || !result.success) {
          return;
        }
        const randomList = result.data;
        setAllSongs(randomList);
        setCurrentSong(randomList[0]);
      },
      (error) => {
        console.error("获取音乐列表失败", error);
        toast.error("获取歌单失败");
      }
    );
  };
  const handleImportSong = () => {};

  const { allSongs, setAllSongs, setCurrentSong } = usePlaylist();
  const handleMusicClick = (music: Music) => {
    // navigate(`/music/${musicId}`);
    const index = allSongs.findIndex((song) => song.id === music.id);
    if (index === -1) {
      setAllSongs([...allSongs, music]);
      console.log("add music to playlist", music.title);
    }
    setCurrentSong(music);
  };

  return (
    <>
      <div className=" p-4 grid grid-rows-[auto,1fr] gap-4">
        <div className="text-2xl font-bold mb-4">歌单</div>
        <div className="grid grid-cols-[auto,1fr] gap-4">
          <div className="list flex gap-2 flex-col">
            {songLists.map((item) => (
              <SongListItem
                key={item.id}
                songList={item}
                onClick={() => setSelectSongList(item)}
              />
            ))}
            <SongListItem
              songList={buildSongList("创建歌单")}
              onClick={() => setShowForm(true)}
              className="flex gap-1 items-center"
            >
              <PlusCircle size={16} />
            </SongListItem>
          </div>

          <div className="container px-4">
            {selectSongList && (
              <>
                {selectSongList.cover && (
                  <div className="flex mb-2">
                    <Cover
                      src={selectSongList.cover}
                      alt={selectSongList.name}
                      type="songlist"
                    />
                  </div>
                )}
                <div className="text-2xl font-bold mb-4">
                  {selectSongList.name}
                </div>
                <div className="flex gap-4 flex-wrap items-center">
                  <div>{selectSongList.description}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectSongList.created_at}
                  </div>
                </div>
                <div className="flex gap-4 my-2">
                  <div className="button" onClick={handlePlayAll}>
                    播放全部
                  </div>
                  <div className="button" onClick={handleImportSong}>
                    导入歌曲
                  </div>
                  <div className="button" onClick={handleAddSong}>
                    添加歌曲
                  </div>
                  <div className="button" onClick={handleUpdateSongList}>
                    修改歌单
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {musicList.map((item) => (
                    <MusicCard
                      key={item.id}
                      music={item}
                      onClick={handleMusicClick}
                    />
                  ))}
                  {musicList.length === 0 && (
                    <div className="text-center py-4">
                      还没有歌曲，快去添加吧！
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <SongListForm
        show={showForm}
        setShow={setShowForm}
        onSubmit={handleCreateSongList}
        formValues={formValues}
        setFormValues={setFormValues}
      />
      <AddSongDialog
        show={showAddSongDialog}
        setShow={setShowAddSongDialog}
        onSelectSong={handleAddSongToSongList}
        // formValues={addSongFormValues}
        // setFormValues={setAddSongFormValues}
      />
    </>
  );
};

const SongListItem = ({
  songList,
  onClick,
  children,
  className,
}: { songList: SongList } & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      key={songList.id}
      className={
        "card hover:text-primary py-2 rounded-lg min-w-[150px] cursor-pointer " +
        className
      }
      onClick={(e) => onClick && onClick(e)}
    >
      {/* <img src={item.coverUrl} alt={item.name} /> */}
      <div className="songlist-name">{songList.name}</div>
      {children}
    </div>
  );
};

const defaultFormValues = {
  id: 0,
  user_id: 1,
  name: "",
  description: "",
  cover: "",
  created_at: "",
};
interface DialogProps {
  show: boolean;
  setShow: (show: boolean) => void;
  onSubmit?: (data?: any) => void;
}
interface SongListFormProps extends DialogProps {
  formValues: SongList;
  setFormValues: (formValues: SongList) => void;
}
const SongListForm = ({
  show,
  setShow,
  onSubmit,
  formValues,
  setFormValues,
}: SongListFormProps) => {
  const { isSmallDevice } = useDevice();
  if (!show) return null;
  return (
    <Form
      title="创建歌单"
      onSubmit={() => onSubmit && onSubmit()}
      onCancel={() => setShow(false)}
    >
      <div className="grid grid-rows-2 gap-4 mt-4">
        <div
          className={
            "grid gap-4 " +
            (isSmallDevice ? "grid-rows-[auto,1fr]" : "grid-cols-[auto,1fr]")
          }
        >
          <span>歌单名称</span>
          <Input
            type="text"
            value={formValues.name}
            onChange={(name) => setFormValues({ ...formValues, name })}
          />
        </div>
        <div
          className={
            "grid gap-4 " +
            (isSmallDevice ? "grid-rows-[auto,1fr]" : "grid-cols-[auto,1fr]")
          }
        >
          <span>歌单描述</span>
          <Input
            type="text"
            value={formValues.description}
            onChange={(description) =>
              setFormValues({ ...formValues, description })
            }
          />
        </div>
        <div
          className={
            "grid gap-4 " +
            (isSmallDevice ? "grid-rows-[auto,1fr]" : "grid-cols-[auto,1fr]")
          }
        >
          <span>歌单封面</span>
          <Input
            type="text"
            value={formValues.cover}
            onChange={(cover) => setFormValues({ ...formValues, cover })}
          />
        </div>
      </div>
    </Form>
  );
};

interface AddSongDialogProps extends DialogProps {
  onSelectSong: (music: Music) => void;
}
const AddSongDialog = ({
  show,
  setShow,
  // formValues,
  // setFormValues,
  onSelectSong,
}: AddSongDialogProps) => {
  if (!show) return null;

  const [musicList, setMusicList] = useState<Music[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    getMusicList(
      (result) => {
        if (result) {
          setMusicList(result.musics);
        }
      },
      (error) => {
        console.log(error);
        toast.error("获取歌曲失败", {
          description: "获取歌曲失败" + error.message || "未知错误",
        });
      },
      1,
      10,
      {
        any: searchText,
      }
    );
  }, [searchText]);

  return (
    <Form
      title="添加歌曲"
      onSubmit={() => setShow(false)}
      onCancel={() => setShow(false)}
    >
      <div>
        <Input
          type="text"
          placeholder="搜索歌曲"
          value={searchText}
          onChange={(e) => setSearchText(e)}
        />
        <div className="mt-4 flex flex-wrap gap-2 justify-center flex-col">
          {musicList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectSong(item)}
              className="grid grid-cols-[auto,1fr,1fr,1fr] items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted"
            >
              <Cover
                src={getCoverSmallUrl(item.id)}
                alt={item.title}
                type=""
                size={48}
              />
              <span>{item.title}</span>
              <span>{item.artist}</span>
              <span>{item.album}</span>
            </div>
          ))}
          {musicList.length === 0 && (
            <div className="text-center py-4">没有找到相关歌曲</div>
          )}
        </div>
      </div>
    </Form>
  );
};
