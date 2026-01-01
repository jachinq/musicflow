import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  addSongToSongList,
  createSongList,
  deleteSongList,
  getCoverSmallUrl,
  getMusicList,
  getSongList,
  getSongListDetail,
  updateSongList,
} from "../lib/api";
import { Music, SongList } from "../lib/defined";
import { toast } from "sonner";
import { Form } from "../components/Form";
import { Input } from "../components/Input";
import { useDevice } from "../hooks/use-device";
import { MusicCard } from "../components/MusicCard";
import { PlusCircle, X, Play, Edit, Upload, Plus, Music2 } from "lucide-react";
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
  currentPage: number;
  setCurrentPage: (page: number) => void;
  tabId: "songlist" | "music";
  setTabId: (tabId: "songlist" | "music") => void;
  handleOperateSongList: () => void;
  fetchSongList: (autoSelect?: boolean) => void;
  fetchSongListDetail: () => void;
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
  fetchSongListDetail: () => {
    const { selectSongList } = get();
    if (!selectSongList) return;
    getSongListDetail(
      selectSongList.id,
      (result) => {
        if (result && result.success) {
          get().setSelectSongList(result.data);
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
  const { selectSongList, fetchSongListDetail, fetchSongList, tabId, setTabId, songLists } =
    useSongListStore();

  useEffect(() => {
    // 只在歌单列表为空时才自动选中第一个，避免覆盖已选中的歌单
    fetchSongList(songLists.length === 0);
  }, []);

  useEffect(() => {
    fetchSongListDetail();
  }, [selectSongList?.id, fetchSongListDetail]);

  if (isSmallDevice) {
    return (
      <div className="p-4 flex flex-col h-full">
        {/* Tab 切换 */}
        <div className="w-full mb-4">
          <OptionGroup
            defaultValue={tabId}
            setValue={setTabId}
            className="font-bold text-xl"
            between
          >
            <Option value="songlist">歌单列表</Option>
            <Option value="music">歌单详情</Option>
          </OptionGroup>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {tabId === "songlist" && (
            <div className="h-full overflow-y-scroll hide-scrollbar">
              <SongListSelector />
            </div>
          )}
          {tabId === "music" && selectSongList && (
            <div className="h-full overflow-y-scroll hide-scrollbar flex flex-col gap-4">
              <SongListHeader />
              <SongListContent />
            </div>
          )}
          {tabId === "music" && !selectSongList && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <Music2 size={64} className="opacity-30" />
              <p>请先选择一个歌单</p>
            </div>
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
        {songLists.map((item, index) => (
          <div
            key={item.id}
            style={{
              animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
            }}
          >
            <SongListItem
              songList={item}
              onClick={() => {
                setSelectSongList(item);
                setTabId("music");
              }}
              className="group"
            >
              <button
                onClick={(e) => handleDelSongList(e, item)}
                className="
                  opacity-0 group-hover:opacity-100
                  transition-all duration-200
                  p-1.5 rounded-full
                  hover:bg-destructive hover:text-destructive-foreground
                  text-muted-foreground
                "
                aria-label="删除歌单"
              >
                <X size={18} />
              </button>
            </SongListItem>
          </div>
        ))}
        <div
          style={{
            animation: `fadeInUp 0.3s ease-out ${songLists.length * 0.05}s both`,
          }}
        >
          <SongListItem
            songList={buildSongList("创建歌单")}
            onClick={() => {
              setFormValues(buildSongList(""));
              setShowForm(true);
            }}
          />
        </div>
      </div>
      <SongListForm
        show={showForm}
        setShow={setShowForm}
        onSubmit={handleOperateSongList}
        formValues={formValues}
        setFormValues={setFormValues}
      />
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
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
    fetchSongListDetail,
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
          fetchSongListDetail();
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
    getSongListDetail(
      selectSongList.id,
      (result) => {
        if (!result || !result.success) {
          return;
        }
        const randomList = result.data.songs || [];
        if (randomList.length === 0) {
          toast.error("歌单为空");
          return;
        }
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
  console.log(selectSongList);
  return (
    <>
      <div className="px-4 w-full flex flex-col gap-4">
        <div className="grid grid-cols-[auto,1fr] gap-6 items-center">
          {/* 歌单封面 */}
          <div className="relative group">
            {selectSongList.cover ? (
              <Cover
                src={getCoverSmallUrl(selectSongList.cover)}
                alt={selectSongList.name}
                size={isSmallDevice ? 120 : 160}
                className="shadow-2xl"
              />
            ) : (
              <div className={`
                ${isSmallDevice ? 'w-[120px] h-[120px]' : 'w-[160px] h-[160px]'}
                rounded-lg shadow-2xl
                bg-gradient-to-br from-primary/40 via-primary/20 to-primary/5
                flex items-center justify-center
              `}>
                <Music2 size={isSmallDevice ? 48 : 64} className="text-primary/60" />
              </div>
            )}
          </div>

          {/* 歌单信息 */}
          <div className="flex flex-col justify-center gap-3 min-w-0">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                歌单
              </div>
              <h1 className={`${isSmallDevice ? 'text-2xl' : 'text-4xl'} font-bold mb-2 truncate`}>
                {selectSongList.name}
              </h1>
            </div>
            <div className="flex flex-col gap-2">
              {selectSongList.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {selectSongList.description}
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                创建于 {selectSongList.created_at}
              </div>
            </div>
          </div>
        </div>

        <div className={`${isSmallDevice ? "grid grid-cols-2 gap-3" : "flex gap-4"}`}>
          <button
            className="button flex items-center justify-center gap-2 flex-1 hover:scale-105 transition-transform"
            onClick={handlePlayAll}
          >
            <Play size={18} fill="currentColor" />
            <span>播放全部</span>
          </button>
          <button
            className="button flex items-center justify-center gap-2 flex-1 hover:scale-105 transition-transform"
            onClick={handleUpdateSongList}
          >
            <Edit size={18} />
            <span>修改歌单</span>
          </button>
          <button
            className="button flex items-center justify-center gap-2 flex-1 hover:scale-105 transition-transform"
            onClick={handleImportSong}
          >
            <Upload size={18} />
            <span>导入歌曲</span>
          </button>
          <button
            className="button flex items-center justify-center gap-2 flex-1 hover:scale-105 transition-transform"
            onClick={() => setShowAddSongDialog(true)}
          >
            <Plus size={18} />
            <span>添加歌曲</span>
          </button>
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
  const { selectSongList } = useSongListStore();
  const { playSingleSong } = usePlaylist();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectSongList) {
      setIsLoading(true);
      // 模拟加载延迟,实际项目中由 API 调用控制
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [selectSongList]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (selectSongList?.songs?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="flex flex-col items-center gap-4 text-muted-foreground max-w-sm">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Music2 size={40} className="text-primary/40" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium mb-2">歌单暂无歌曲</p>
            <p className="text-sm">点击"添加歌曲"按钮来添加你喜欢的音乐吧！</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 w-full px-4 pb-4">
      {selectSongList?.songs?.map((item) => (
        <MusicCard key={item.id} music={item} onPlay={playSingleSong} />
      ))}
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
  const { selectSongList } = useSongListStore();
  const isSelected = selectSongList?.id === songList.id;
  const isCreateButton = songList.id === 0;

  return (
    <div
      key={songList.id}
      className={`
        card rounded-lg min-w-[150px] cursor-pointer
        transition-all duration-300 ease-in-out
        ${isCreateButton
          ? 'hover:border-primary hover:bg-primary/5 border-2 border-dashed border-muted'
          : 'hover:shadow-lg hover:scale-[1.02]'
        }
        ${isSelected && !isCreateButton ? 'ring-2 ring-primary shadow-lg bg-primary/10' : ''}
        ${className}
      `}
      onClick={(e) => onClick && onClick(e)}
    >
      <div className="flex items-center gap-3 p-3">
        {/* 歌单封面或图标 */}
        {!isCreateButton && songList.cover ? (
          <Cover
            src={songList.cover}
            alt={songList.name}
            size={48}
            className="flex-shrink-0"
          />
        ) : (
          <div className={`
            w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center
            ${isCreateButton ? 'bg-primary/20' : 'bg-gradient-to-br from-primary/30 to-primary/10'}
          `}>
            {isCreateButton ? (
              <PlusCircle size={24} className="text-primary" />
            ) : (
              <span className="text-lg font-bold text-primary">
                {songList.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}

        {/* 歌单信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`
              font-medium truncate
              ${isCreateButton ? 'text-primary' : ''}
              ${isSelected ? 'text-primary' : ''}
            `}>
              {songList.name}
            </span>
            {children}
          </div>
          {!isCreateButton && songList.description && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {songList.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
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
  const { selectSongList } = useSongListStore(); // 拿到当前歌单的歌曲
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
    setSelectMusics([...selectSongList?.songs || []]);
  }, [selectSongList?.songs]);

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
        {/* 搜索栏 */}
        <div className="sticky top-0 bg-background z-10">
          <Input
            type="text"
            placeholder="搜索歌曲名、艺术家或专辑..."
            value={searchText}
            onChange={(e) => setSearchText(e)}
          />
        </div>

        {/* 歌曲列表 */}
        <div
          ref={scrollContainerRef}
          className="overflow-y-scroll hide-scrollbar flex gap-2 flex-col max-h-[calc(100vh-400px)]"
        >
          {/* 表头 */}
          <div
            className={`
              sticky top-0 bg-card z-10
              text-sm font-medium grid items-center gap-2 p-3 border-b-2 border-border
              ${getGripCols()}
            `}
          >
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-primary cursor-pointer"
                onChange={(e) => selectAll(e.target.checked)}
              />
            </label>
            <strong>封面</strong>
            <strong>歌曲信息</strong>
            <strong>专辑</strong>
          </div>

          {/* 歌曲列表项 */}
          {fmusicList.map((item) => {
            const selected = isSelected(item);
            return (
              <div
                key={item.id}
                onClick={() => onSelectSong(item)}
                className={`
                  grid items-center gap-2 p-3 rounded-lg cursor-pointer
                  transition-all duration-200
                  ${getGripCols()}
                  ${selected
                    ? 'bg-primary/20 ring-2 ring-primary shadow-md'
                    : 'hover:bg-muted hover:shadow-sm'
                  }
                `}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                  checked={selected}
                  onChange={() => { }}
                />
                <Cover
                  src={getCoverSmallUrl(item.cover_art)}
                  alt={item.title}
                  size={48}
                  className="shadow-sm"
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-medium truncate">{item.title}</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {item.artist}
                  </span>
                </div>
                <span className="truncate text-sm">{item.album}</span>
              </div>
            );
          })}

          {/* 加载状态 */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>加载中...</span>
            </div>
          )}

          {/* 加载完成提示 */}
          {!hasMore && fmusicList.length > 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground border-t border-border">
              已加载全部 {fmusicList.length} 首歌曲
            </div>
          )}

          {/* 空状态 */}
          {fmusicList.length === 0 && !isLoadingMore && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <Music2 size={48} className="opacity-50" />
              <p>没有找到相关歌曲</p>
              <p className="text-sm">试试其他搜索词吧</p>
            </div>
          )}
        </div>

        {/* 已选择提示 */}
        {selectMusics.length > 0 && (
          <div className="sticky bottom-0 bg-primary border border-primary rounded-lg p-3 text-sm">
            <span className="font-medium">已选择 {selectMusics.length} 首歌曲</span>
          </div>
        )}
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
