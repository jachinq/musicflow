import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  addSongToSongList,
  createSongList,
  deleteSongList,
  getCoverSmallUrl,
  getMusicList,
  getSongList,
  getSongListSongs,
  updateSongList,
} from "../lib/api";
import { Music, SongList } from "../lib/defined";
import { toast } from "sonner";
import { Form } from "../components/Form";
import { Input } from "../components/Input";
import { useDevice } from "../hooks/use-device";
import { MusicCard } from "../components/MusicCard";
import { PlusCircle, X } from "lucide-react";
import { Cover } from "../components/Cover";
import { usePlaylist } from "../store/playlist";
import { create } from "zustand";
import { Option, OptionGroup } from "../components/Option";
import { useConfirm } from "../components/confirm";

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

interface SongListState {
  selectSongList: SongList | null;
  setSelectSongList: (songList: SongList | null) => void;
  songLists: SongList[];
  setSongLists: (songLists: SongList[]) => void;
  formValues: SongList;
  setFormValues: (formValues: SongList) => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  musicList: Music[];
  setMusicList: (musicList: Music[]) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  tabId: "songlist" | "music";
  setTabId: (tabId: "songlist" | "music") => void;
  handleOperateSongList: () => void;
  fetchSongList: (autoSelect?: boolean) => void;
  fetchSongListSongs: () => void;
}

const useSongListStore = create<SongListState>((set, get) => ({
  selectSongList: null,
  setSelectSongList: (songList: SongList | null) =>
    set(() => ({ selectSongList: songList })),
  songLists: [],
  setSongLists: (songLists: SongList[]) => set(() => ({ songLists })),
  formValues: buildSongList(""),
  setFormValues: (formValues: SongList) => set(() => ({ formValues })),
  showForm: false,
  setShowForm: (show: boolean) => set(() => ({ showForm: show })),
  musicList: [],
  setMusicList: (musicList: Music[]) => set(() => ({ musicList })),
  currentPage: 1,
  setCurrentPage: (page: number) => set(() => ({ currentPage: page })),
  fetchSongList: (autoSelect?: boolean) => {
    getSongList(
      (result) => {
        if (result && result.success) {
          get().setSongLists(result.data);
          autoSelect &&
            result.data.length > 0 &&
            get().setSelectSongList(result.data[0]);
        }
      },
      (error) => console.log(error)
    );
  },
  tabId: "songlist",
  setTabId: (tabId: "songlist" | "music") => set(() => ({ tabId })),
  handleOperateSongList: () => {
    const { name } = get().formValues;
    if (!name) {
      toast.error("歌单名称不能为空");
      return;
    }

    const songList = get().formValues as SongList;

    const operation = songList.id ? "更新" : "创建";
    const operationFunc = songList.id ? updateSongList : createSongList;

    operationFunc(
      songList,
      (result) => {
        if (result && result.success) {
          get().fetchSongList(true);
          get().setShowForm(false);
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
  },
  fetchSongListSongs: () => {
    const { selectSongList } = get();
    if (!selectSongList) return;
    getSongListSongs(
      selectSongList.id,
      (result) => {
        if (result && result.success) {
          get().setMusicList(result.data);
        }
      },
      (error) => {
        console.log(error);
        toast.error("获取歌单失败", {
          description: "获取歌单失败" + error.message || "未知错误",
        });
      }
    );
  },
}));

export const SongListPage = () => {
  const { isSmallDevice } = useDevice();
  const { selectSongList, fetchSongListSongs, fetchSongList, tabId, setTabId } =
    useSongListStore();

  useEffect(() => {
    fetchSongList(true);
  }, []);

  useEffect(() => {
    fetchSongListSongs();
  }, [selectSongList]);

  if (isSmallDevice) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="w-full px-4">
            <OptionGroup
              defaultValue={tabId}
              setValue={setTabId}
              className="font-bold text-2xl"
              between
            >
              <Option value="songlist">歌单</Option>
              <Option value="music">详情</Option>
            </OptionGroup>
          </div>
          {tabId === "songlist" && <SongListSelector />}
          {tabId === "music" && (
            <>
              <SongListHeader />
              <SongListContent />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-2xl font-bold mb-4 p-4">歌单</div>
      <div className=" p-4 grid grid-cols-[auto,1fr] gap-4">
        <SongListSelector />
        <div className="grid grid-rows-[auto,1fr] gap-4">
          <SongListHeader />
          <SongListContent />
        </div>
      </div>
    </>
  );
};

// 歌单选择器
const SongListSelector = () => {
  const {
    songLists,
    setSelectSongList,
    formValues,
    setFormValues,
    showForm,
    setShowForm,
    handleOperateSongList,
    setTabId,
    fetchSongList,
  } = useSongListStore();

  const confirm = useConfirm();

  const handleDelSongList = (evt: React.MouseEvent, item: SongList) => {
    evt.stopPropagation();
    const onConfirm = () => {
      deleteSongList(
        item.id,
        (result) => {
          if (result && result.success) {
            let [listSize, songSize] = result.data || [];
            toast.success("删除歌单成功", {
              description:
                `删除歌单数量：${listSize} 歌单关联的歌曲数量：${songSize}` ||
                "",
            });
            fetchSongList(true);
          } else {
            toast.error("删除歌单失败", {
              description: "删除歌单失败" + result.message || "未知错误",
            });
          }
        },
        (error) => {
          toast.error("删除歌单失败", {
            description: "删除歌单失败" + error.message || "未知错误",
          });
        }
      );
    };
    confirm({
      message: (
        <div>
          确定删除当前歌单吗？
          <div className="text-sm">注意：此操作不可恢复</div>
        </div>
      ),
      onConfirm,
    });
  };

  return (
    <>
      <div className="flex gap-2 flex-col w-full px-4">
        {songLists.map((item) => (
          <SongListItem
            key={item.id}
            songList={item}
            onClick={() => {
              setSelectSongList(item);
              setTabId("music");
            }}
            className="group"
          >
            <X
              size={22}
              className="hidden hover:text-destructive text-destructive-foreground group-hover:block"
              onClick={(e) => handleDelSongList(e, item)}
            />
          </SongListItem>
        ))}
        <SongListItem
          songList={buildSongList("创建歌单")}
          onClick={() => {
            setFormValues(buildSongList(""));
            setShowForm(true);
          }}
        >
          <PlusCircle size={16} />
        </SongListItem>
      </div>
      <SongListForm
        show={showForm}
        setShow={setShowForm}
        onSubmit={handleOperateSongList}
        formValues={formValues}
        setFormValues={setFormValues}
      />
    </>
  );
};

// 歌单头部
const SongListHeader = () => {
  const { isSmallDevice } = useDevice();
  const {
    showForm,
    selectSongList,
    formValues,
    setFormValues,
    setShowForm,
    fetchSongListSongs,
    handleOperateSongList, // 保存歌单
  } = useSongListStore();
  const [showAddSongDialog, setShowAddSongDialog] = useState(false);

  const handleUpdateSongList = () => {
    if (!selectSongList) return;
    setFormValues({ ...selectSongList });
    setShowForm(true);
  };

  const handleAddSongToSongList = (musics: Music[]) => {
    if (!selectSongList) return;
    if (!musics) return;

    addSongToSongList(
      selectSongList.id,
      musics.map((music) => music.id),
      (result) => {
        if (result && result.success) {
          toast.success("歌单操作成功", {
            description: `影响歌曲 ${result.data} 条`,
          });
          fetchSongListSongs();
          setShowAddSongDialog(false);
        } else {
          toast.error("歌单操作失败", {
            description: "歌单操作失败" + result.message || "未知错误",
          });
        }
      },
      (error) => {
        console.log(error);
        toast.error("添加歌曲失败");
      }
    );
  };
  const { setAllSongs, setCurrentSong } = usePlaylist();

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
  const handleImportSong = () => { };

  if (!selectSongList) return null;
  return (
    <>
      <div className="px-4 w-full flex flex-col gap-4">
        <div className="grid grid-cols-[auto,1fr] gap-4">
          {selectSongList.cover ? (
            <Cover src={selectSongList.cover} alt={selectSongList.name} />
          ) : (
            <div></div>
          )}
          <div className="flex flex-col justify-center">
            <div className="text-4xl font-bold mb-4">{selectSongList.name}</div>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="max-h-[60px] text-sm text-muted-foreground break-all overflow-scroll hide-scrollbar">
                {selectSongList.description}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectSongList.created_at}
              </div>
            </div>
          </div>
        </div>

        <div className={`${isSmallDevice ? "grid grid-cols-2 grid-rows-2" : "flex"} gap-4`}>
          <div className="button" onClick={handlePlayAll}>
            播放全部
          </div>
          <div className="button" onClick={handleUpdateSongList}>
            修改歌单
          </div>
          <div className="button" onClick={handleImportSong}>
            导入歌曲
          </div>
          <div className="button" onClick={() => setShowAddSongDialog(true)}>
            添加歌曲
          </div>
        </div>
      </div>
      <AddSongDialog
        show={showAddSongDialog}
        setShow={setShowAddSongDialog}
        onSubmit={handleAddSongToSongList}
      />

      {isSmallDevice && (
        <SongListForm
          show={showForm}
          setShow={setShowForm}
          onSubmit={handleOperateSongList}
          formValues={formValues}
          setFormValues={setFormValues}
        />
      )}
    </>
  );
};

// 歌单内容
const SongListContent = () => {
  const { musicList } = useSongListStore();
  const { playSingleSong } = usePlaylist();
  return (
    <div className="flex flex-wrap gap-4 w-full px-4">
      {musicList.map((item) => (
        <MusicCard key={item.id} music={item} onPlay={playSingleSong} />
      ))}
      {musicList.length === 0 && (
        <div className="text-center py-4">还没有歌曲，快去添加吧！</div>
      )}
    </div>
  );
};

// 歌单列表项
const SongListItem = ({
  songList,
  onClick,
  children,
  className,
}: { songList: SongList } & React.HTMLAttributes<HTMLDivElement>) => {
  // const { selectSongList } = useSongListStore();
  // if (!selectSongList) return null;
  return <div key={songList.id} className={"card hover:text-primary py-2 rounded-lg min-w-[150px] cursor-pointer flex gap-1 items-center " + className } onClick={(e) => onClick && onClick(e)}>
    {/* <img src={item.coverUrl} alt={item.name} /> */}
    <div className="songlist-name">{songList.name}</div>
    {children}
  </div>
};

// 创建、修改歌单表单
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
      title={formValues.id > 0 ? "修改歌单" : "创建歌单"}
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

// 添加歌曲对话框
interface AddSongDialogProps extends DialogProps { }
const AddSongDialog = ({ show, setShow, onSubmit }: AddSongDialogProps) => {
  if (!show) return null;
  const { isSmallDevice } = useDevice();
  const [fmusicList, setfmusicList] = useState<Music[]>([]);
  const currentPageRef = useRef(1);
  const [searchText, setSearchText] = useState("");
  const [selectMusics, setSelectMusics] = useState<Music[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = isSmallDevice ? 5 : 10;
  const { musicList } = useSongListStore(); // 拿到当前歌单的歌曲
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filterMusicList = useCallback((page: number, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    }

    getMusicList(
      (result) => {
        if (result && result.success) {
          const newData = result.data.list;

          if (append) {
            setfmusicList((prev) => [...prev, ...newData]);
          } else {
            setfmusicList(newData);
          }

          // 判断是否还有更多数据
          if (newData.length < pageSize) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }

          currentPageRef.current = page;
        }
        setIsLoadingMore(false);
      },
      (error) => {
        console.log(error);
        toast.error("获取歌曲失败", {
          description: "获取歌曲失败" + error.message || "未知错误",
        });
        setIsLoadingMore(false);
      },
      page,
      pageSize,
      {
        any: searchText,
      }
    );
  }, [pageSize, searchText]);

  const loadMore = useCallback(() => {
    const nextPage = currentPageRef.current + 1;
    console.log('loadMore 被调用，加载第', nextPage, '页');
    filterMusicList(nextPage, true);
  }, [filterMusicList]);

  // 监听滚动容器的滚动事件
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isLoadingMore || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      // 当滚动到距离底部 100px 时触发加载
      if (scrollHeight - scrollTop - clientHeight < 100) {
        console.log('触发加载更多');
        loadMore();
      }
    };

    const throttledScroll = throttle(handleScroll, 100);
    container.addEventListener('scroll', throttledScroll);

    return () => {
      container.removeEventListener('scroll', throttledScroll);
    };
  }, [loadMore, isLoadingMore, hasMore]);

  useEffect(() => {
    // 搜索文本变化时重置
    setfmusicList([]);
    currentPageRef.current = 1;
    setHasMore(true);
    filterMusicList(1, false);
  }, [searchText, filterMusicList]);

  useEffect(() => {
    setSelectMusics([...musicList]);
  }, [musicList]);

  const onSelectSong = (music: Music) => {
    if (selectMusics.includes(music)) {
      setSelectMusics(selectMusics.filter((item) => item.id !== music.id));
    } else {
      setSelectMusics([...selectMusics, music]);
    }
  };
  const isSelected = (music: Music) => {
    return selectMusics.findIndex((item) => item.id === music.id) !== -1;
  };
  const getGripCols = () => {
    return isSmallDevice
      ? "grid-cols-[auto,48px,2fr,1fr]"
      : "grid-cols-[auto,48px,1fr,1fr]";
  };
  const selectAll = (checked: boolean) => {
    if (checked) {
      setSelectMusics([...selectMusics, ...fmusicList]);
    } else {
      setSelectMusics([]);
    }
  };

  return (
    <Form
      title="添加歌曲"
      onSubmit={() => onSubmit && onSubmit(selectMusics)}
      onCancel={() => setShow(false)}
    >
      <div className="flex flex-col gap-4">
        <Input
          type="text"
          placeholder="搜索歌曲"
          value={searchText}
          onChange={(e) => setSearchText(e)}
        />
        <div
          ref={scrollContainerRef}
          className="overflow-scroll hide-scrollbar flex gap-2 justify-center flex-col overflow-y-scroll max-h-[calc(100vh-200px)]"
        >
          <div
            className={
              "text-sm grid items-center justify-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted " +
              getGripCols()
            }
          >
            <span>
              <input
                type="checkbox"
                onChange={(e) => selectAll(e.target.checked)}
              />
            </span>
            <span>封面</span>
            <span>歌曲名/歌手</span>
            <span>专辑</span>
          </div>
          {fmusicList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectSong(item)}
              className={
                "grid items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted " +
                getGripCols()
              }
            >
              <input
                type="checkbox"
                checked={isSelected(item)}
                onChange={() => { }}
              />
              <Cover
                src={getCoverSmallUrl(item.cover_art)}
                alt={item.title}
                size={48}
              />
              <div className="flex gap-1 flex-col">
                <span>{item.title}</span>
                <span className="text-sm text-muted-foreground">
                  {item.artist}
                </span>
              </div>
              <span>{item.album}</span>
            </div>
          ))}
          {isLoadingMore && (
            <div className="text-center py-4 text-muted-foreground">
              加载中...
            </div>
          )}
          {!hasMore && fmusicList.length > 0 && (
            <div className="text-center py-4 text-muted-foreground">
              已加载全部 {fmusicList.length} 项
            </div>
          )}
          {fmusicList.length === 0 && !isLoadingMore && (
            <div className="text-center py-4">没有找到相关歌曲</div>
          )}
        </div>
      </div>
    </Form>
  );
};

// 节流函数
function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func(...args);
    }
  };
}
