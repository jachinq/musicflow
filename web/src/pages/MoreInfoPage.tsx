import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAlbumById,
  getAlbumList,
  getAlbumSongs,
  getArtistById,
  getArtistList,
  getArtistSongs,
  getCoverMediumUrl,
  getCoverSmallUrl,
  getGenreList,
  getSongsByGenre,
  setArtistCover,
} from "../lib/api";
import { Album, Artist, Genre, JsonResult, Music, MyRoutes } from "../lib/defined";
import { toast } from "sonner";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Input } from "../components/Input";
import { useDevice } from "../hooks/use-device";
import { create } from "zustand";
import { Option, OptionGroup } from "../components/Option";
import {
  AlbumIcon,
  Loader,
  PlayIcon,
  SearchIcon,
  TagIcon,
  User2Icon,
} from "lucide-react";
import { Cover } from "../components/Cover";
import { Drawer } from "../components/Drawer";
import { useSettingStore } from "../store/setting";
import { formatTime, getOnlineEngineUrl } from "../lib/utils";
import { usePlaylist } from "../store/playlist";
import { Form } from "../components/Form";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";

type TabId = "genres" | "albums" | "artists";
interface TagPageState {
  type: DrawerType;
  setType: (type: DrawerType) => void;
  showDrawer: boolean;
  setShowDrawer: (show: boolean) => void;
  selectedItem: WithDrawerItem | null;
  setSelectedItem: (item: WithDrawerItem | null) => void;
  tabId: TabId;
  setTabId: (tabId: TabId) => void;
  filterText: string;
  setFilterText: (filterText: string) => void;
  showEditForm: boolean;
  setShowEditForm: (show: boolean) => void;
}
const useTagPageStore = create<TagPageState>((set) => ({
  type: DrawerType.ALBUM,
  setType: (type) => set(() => ({ type })),
  showDrawer: false,
  setShowDrawer: (show) => set(() => ({ showDrawer: show })),
  selectedItem: null,
  setSelectedItem: (item) => set(() => ({ selectedItem: item })),
  tabId: "albums",
  setTabId: (tabId) => set(() => ({ tabId })),
  filterText: "",
  setFilterText: (filterText) => set(() => ({ filterText })),
  showEditForm: false,
  setShowEditForm: (show) => set(() => ({ showEditForm: show })),
}));

export const MoreInfoPage = () => {
  // const param = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { isSmallDevice } = useDevice();
  const { tabId, setTabId, setType, setShowDrawer, setSelectedItem } =
    useTagPageStore();
  const getLayout = () => {
    return isSmallDevice ? "grid-cols-1" : "grid-cols-[auto,1fr]";
  };
  useEffect(() => {
    // console.log("param", param);
    // console.log("location", location);
    let pathname = location.pathname;
    let parseTabId = pathname.split("/")[1] as TabId;
    if (parseTabId === "artists") {
      setType(DrawerType.ARTIST);
    } else if (parseTabId === "albums") {
      setType(DrawerType.ALBUM);
    } else if (parseTabId === "genres") {
      setType(DrawerType.GENRE);
    }
    setTabId(parseTabId);
    setShowDrawer(false);
    setSelectedItem(null);
  }, [location]);
  const changeTab = (tabId: TabId) => {
    setTabId(tabId);
    let newPathname = "/" + tabId;
    navigate(newPathname);
  };
  return (
    <div className={"px-8 py-4 grid gap-8 " + getLayout()}>
      <OptionGroup
        defaultValue={tabId}
        setValue={changeTab}
        drirection={isSmallDevice ? "row" : "column"}
        between
      >
        <Option value={"albums"} icon={<AlbumIcon />}>
          专辑
        </Option>
        <Option value={"artists"} icon={<User2Icon />}>
          歌手
        </Option>
        <Option value={"genres"} icon={<TagIcon />}>
          风格
        </Option>
      </OptionGroup>
      {tabId == "genres" && <WithDrawerList type={DrawerType.GENRE} />}
      {tabId == "albums" && <WithDrawerList type={DrawerType.ALBUM} />}
      {tabId == "artists" && <WithDrawerList type={DrawerType.ARTIST} />}
    </div>
  );
};

type WithDrawerItem = Album | Artist | Genre;
enum DrawerType {
  ALBUM = "专辑",
  ARTIST = "歌手",
  GENRE = "风格",
}
const WithDrawerList = ({ type }: { type: DrawerType }) => {
  // const navigate = useNavigate();
  const [items, setItems] = useState<WithDrawerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentPageRef = useRef(1); // 使用 ref 避免闭包问题
  const [pageSize] = useState(30);
  const [filterText, setFilterText] = useState("");
  const [startSearch, setStartSearch] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true); // 根据返回数据判断是否还有更多
  const { setShowDrawer, setSelectedItem } = useTagPageStore();
  const { isSmallDevice } = useDevice();
  const iconSize = isSmallDevice ? 80 : 120;

  const fetchItems = useCallback((page: number, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    let fetchFunc = undefined;
    switch (type) {
      case DrawerType.ALBUM:
        fetchFunc = getAlbumList;
        break;
      case DrawerType.ARTIST:
        fetchFunc = getArtistList;
        break;
      case DrawerType.GENRE:
        fetchFunc = getGenreList;
        break;
      default:
        return;
    }
    fetchFunc(
      page,
      pageSize,
      filterText,
      (result) => {
        if (result && result.success) {
          const newData = result.data.list || [];

          if (append) {
            setItems((prevItems) => {
              // 根据id去重
              const newList = newData.filter((item: WithDrawerItem) =>
                !prevItems.some((oldItem) => oldItem.id === item.id)
              );
              return [...prevItems, ...newList]
            });
          } else {
            // 替换数据（用于搜索或初始加载）
            setItems(newData);
          }

          // 如果返回的数据少于请求的页大小，说明没有更多数据了
          if (newData.length != pageSize) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }

          currentPageRef.current = page;
        } else {
          toast.error("获取专辑列表失败", {
            description: result.message,
          });
          setError(result.message as any);
          setHasMore(false);
        }
        setLoading(false);
        setIsLoadingMore(false);
        setStartSearch(false);
      },
      (error) => {
        console.error(error);
        toast.error(error.message);
        setError(error.message);
        setLoading(false);
        setIsLoadingMore(false);
        setStartSearch(false);
      }
    );
  }, [type, pageSize, startSearch]);

  const loadMore = useCallback(() => {
    const nextPage = currentPageRef.current + 1;
    console.log('loadMore 被调用，加载第', nextPage, '页');
    fetchItems(nextPage, true);
  }, [fetchItems]);

  useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: hasMore,
    isLoading: isLoadingMore,
    threshold: 200,
  });

  useEffect(() => {
    // 重置并重新加载
    setItems([]);
    currentPageRef.current = 1;
    setHasMore(true); // 重置 hasMore 状态
    fetchItems(1, false);
  }, [startSearch, fetchItems]);

  if (loading) {
    return <Loader className="animate-spin" size={32} />
  }
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div className="grid gap-4 mb-4 grid-cols-1">
        <Input
          placeholder={"搜索" + type}
          value={filterText}
          onChange={setFilterText}
          onEnter={() => setStartSearch(true)}
          onBlur={() => setStartSearch(true)}
        />
      </div>
      <div
        className="gap-10 justify-center grid"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${iconSize}px, 1fr))`,
        }}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex flex-col justify-center items-center gap-2 m-x-auto"
          >
            <CoverItem
              key={item.name + index}
              item={item}
              type={type}
              onSelect={() => {
                setShowDrawer(true);
                setSelectedItem(item);
                // navigate(`/${tabId}/${item.id}`);
              }}
            />
            {
              type !== DrawerType.GENRE &&
              <div className="w-[100px] overflow-hidden text-center">
                <span className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.name}
                </span>
              </div>
            }
          </div>
        ))}
      </div>
      {isLoadingMore && <Loader className="animate-spin" size={32} />}

      {!hasMore && items.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">
          已加载全部 {items.length} 项
        </div>
      )}
      {items.length === 0 && !loading && !error && (
        <div>
          暂无数据
        </div>
      )}
      <DetaialDrawer />
      <EditForm onSussess={() => {
        // 刷新当前列表
        setItems([]);
        currentPageRef.current = 1;
        setHasMore(true);
        fetchItems(1, false);
      }} />
    </div>
  );
};

const CoverItem = ({
  item,
  onSelect,
  type = DrawerType.ARTIST,
}: {
  item: WithDrawerItem;
  type?: DrawerType;
  onSelect?: (item: WithDrawerItem) => void;
}) => {
  const { isSmallDevice } = useDevice();
  const cutSize = isSmallDevice ? 4 : 8;
  const iconSize = useMemo(() => {
    if (type === DrawerType.ALBUM) {
      return isSmallDevice ? 80 : 140;
    }
    return isSmallDevice ? 70 : 120;
    // return isSmallDevice ? 60 : 100;
  }, [type]);
  const handleClick = () => {
    onSelect && onSelect(item);
  };
  const getSrc = useCallback(() => {
    if (type === DrawerType.ARTIST) {
      return iconSize > 140
        ? getCoverMediumUrl(item.cover_art)
        : getCoverSmallUrl(item.cover_art);
    }
    if (type === DrawerType.ALBUM) {
      return iconSize > 140
        ? getCoverMediumUrl(item.cover_art)
        : getCoverSmallUrl(item.cover_art);
    }
    return "";
  }, [item.cover_art, type]);
  const getClass = () => {
    if (type === DrawerType.ALBUM) {
      return "bg-muted rounded-md cursor-pointer group";
    }
    return "cursor-pointer group";
  };
  const fallback = () => (
    <div className="group-hover:text-primary-hover">
      {item.name?.length == 0 ? "空" : item.name.slice(0, Math.min(item.name.length, cutSize))}
    </div>
  );
  return (
    <div className={getClass()} onClick={handleClick}>
      <Cover
        src={getSrc()}
        alt={item.name}
        roundType={type === DrawerType.ARTIST ? "circle" : "round"}
        fallback={fallback()}
        size={iconSize}
      />
    </div>
  );
};

const DetaialDrawer = () => {
  const { showDrawer, setShowDrawer, selectedItem, type, setSelectedItem, setShowEditForm } =
    useTagPageStore();
  const { online_engine } = useSettingStore();
  const { playSingleSong } = usePlaylist();
  const [musicList, setMusicList] = useState<Music[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [serchId, setSerchId] = useState<string | null>(null);
  const { id } = useParams();
  const [statistic, setStatistic] = useState<{
    total: number;
    duration: number;
  }>({ total: 0, duration: 0 });

  useEffect(() => {
    if (!id) return;
    const num_id = parseInt(id);
    if (isNaN(num_id)) return;
    setSerchId(num_id.toString());
  }, [id]);
  useEffect(() => {
    if (!selectedItem) return;
    if (selectedItem.id.toString() === serchId) return;
    setSerchId(selectedItem.id.toString());
    if (type === DrawerType.GENRE) {
      setSerchId(selectedItem.name);
    }
  }, [selectedItem]);

  useEffect(() => {
    setMusicList([]);
    if (!serchId) return;
    setLoading(true);

    let fetchFunc;
    let fetchSongs;
    switch (type) {
      case DrawerType.ALBUM:
        fetchFunc = getAlbumById;
        fetchSongs = getAlbumSongs;
        break;
      case DrawerType.ARTIST:
        fetchFunc = getArtistById;
        fetchSongs = getArtistSongs;
        break;
      case DrawerType.GENRE:
        fetchFunc = () => ({ success: true, message: "", data: { id: serchId, name: "未知" } });
        fetchSongs = getSongsByGenre;
        break;
      default:
        return;
    }

    fetchFunc(
      serchId,
      (result) => {
        if (result && result.success) {
          setSelectedItem(result.data);
          setShowDrawer(true);
        } else {
          toast.error("获取详情失败", {
            description: result.message,
          });
        }
      },
      (error) => {
        console.error(error);
        toast.error(error.message);
      }
    );

    fetchSongs(
      serchId,
      (result: JsonResult<Music[]>) => {
        setLoading(false);
        if (result && result.success) {
          setMusicList(result.data);
        } else {
          toast.error("获取歌曲列表失败", {
            description: result.message,
          });
        }
      },
      (error) => {
        setLoading(false);
        console.error(error);
        toast.error(error.message);
      }
    );
  }, [serchId]);

  useEffect(() => {
    if (!musicList) return;
    const total = musicList.length;
    const duration = musicList.reduce((acc, cur) => acc + cur.duration, 0);
    setStatistic({ total, duration });
  }, [musicList]);

  const onlineSearch = () => {
    if (!selectedItem) return;
    window.open(
      getOnlineEngineUrl(online_engine, `${type} ${selectedItem.name}`),
      "_blank"
    );
  };
  const navigate = useNavigate();
  // const location = useLocation();
  // const { setNeedFilter, setFilter, filter } = useMusicList();
  const onSelect = (_item: any) => {
    // if (type === DrawerType.ALBUM) {
    //   setFilter({ ...filter, album: [item.id] });
    // } else if (type === DrawerType.ARTIST) {
    //   setFilter({ ...filter, artist: [item.id] });
    // }
    // setNeedFilter(true);
    // navigate("/");
  };

  const { isSmallDevice } = useDevice();
  const getGripCols = () => {
    return isSmallDevice ? "grid-cols-[2fr,auto]" : "grid-cols-[1fr,auto]";
  };

  const { setAllSongs, setCurrentSong } = usePlaylist();
  const playAllSongs = () => {
    if (!musicList) return;
    if (musicList.length === 0) return;
    // 随机播放全部歌曲
    setAllSongs(musicList);
    setCurrentSong(musicList[0]);
  };

  const handleCoverClick = () => {
    if (type !== DrawerType.ARTIST) return;
    setShowDrawer(false);
    setShowEditForm(true);
  };

  if (!selectedItem) return null;
  return (
    <Drawer
      isOpen={showDrawer}
      onClose={() => {
        setShowDrawer(false);
        setSelectedItem(null);
        // navigate(-1);
        // console.log("location", location);
      }}
      hasTitle={false}
    >
      <div className="px-4 py-2">
        <div className="flex flex-col gap-4 justify-center text-center">
          <div className="meta-info flex gap-4 items-end">
            <div className="flex justify-center" onClick={handleCoverClick}>
              <CoverItem type={type} item={selectedItem} onSelect={onSelect} />
            </div>
            <div className="flex flex-col gap-2 justify-start text-start">
              <div className="flex gap-2">
                <span className="text-sm font-bold">{type}</span>
                <div
                  className="flex justify-center items-center cursor-pointer text-sm hover:text-primary-hover"
                  onClick={onlineSearch}
                >
                  <SearchIcon size={16} />
                  <span>在线搜索</span>
                </div>
              </div>
              <div className="font-bold text-4xl">
                {selectedItem.name || "暂无专辑名"}
              </div>
              <div className="text-sm overflow-hidden">
                <span className="text-wrap break-all">
                  {/* {type === DrawerType.ARTIST && (
                    <div className="max-h-[100px] overflow-y-scroll">
                      {selectedItem.description || "暂无描述"}
                    </div>
                  )} */}
                  {/* {type === DrawerType.ALBUM && ( */}
                  <div className="flex gap-2">
                    {type === DrawerType.ALBUM && (
                      <span>{selectedItem.year}年发行</span>
                    )}
                    <span>{statistic.total}首歌曲</span>
                    <span>{formatTime(statistic.duration)}</span>
                  </div>
                  {/* )} */}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-start items-center gap-4">
            <PlayIcon
              size={32}
              className="cursor-pointer hover:text-primary-hover hover:scale-110 transition-all duration-300"
              onClick={playAllSongs}
            />
            <span>播放全部</span>
          </div>
          <div>
            {loading && <Loader className="animate-spin" size={32} />}

            {musicList.map((item, index) => (
              <div
                key={item.id}
                className={
                  "group flex gap-2 p-2 justify-between rounded-md cursor-pointer hover:bg-muted " +
                  getGripCols()
                }
              >
                <div className="grid grid-cols-[15px,1fr] gap-4">
                  <div className="flex justify-center items-center text-muted-foreground">
                    <span className="text-sm text-start group-hover:hidden">
                      {index + 1}
                    </span>
                    <span className="hidden group-hover:flex hover:text-primary-hover hover:scale-110 transition-all duration-300">
                      <PlayIcon size={16} onClick={() => playSingleSong(item)} />
                    </span>
                  </div>
                  <div className="flex gap-2 flex-col justify-center items-start">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground hover:underline" onClick={() => {
                      if (type === DrawerType.ARTIST && item.artist_id === selectedItem.id) return;
                      setShowDrawer(false);
                      setSelectedItem(null);
                      navigate(`${MyRoutes.Artists}/${item.artist_id}`);
                    }}>
                      {item.artist}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatTime(item.duration)}
                </span>
              </div>
            ))}

            {musicList.length === 0 && !loading &&
              <div className="text-center py-4 text-muted-foreground">
                暂无歌曲
              </div>}
          </div>
        </div>
      </div>
    </Drawer>
  );
};


const EditForm = ({ onSussess }: { onSussess: () => void }) => {
  const { showEditForm, setShowEditForm, selectedItem } = useTagPageStore();
  const [cover, setCover] = useState<string>("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedItem) return;
    setCover(selectedItem.cover_art);
  }, [selectedItem]);

  const handleSubmit = () => {
    if (!selectedItem) return;
    // console.log("values", selectedItem);

    setArtistCover(selectedItem.id, cover, (result) => {
      if (result && result.success) {
        toast.success("修改成功");
        setShowEditForm(false);
        onSussess && onSussess();
        // setSelectedItem(null);
      } else {
        toast.error("修改失败", {
          description: result.message,
        });
      }
    }, (error) => {
      console.error(error);
      toast.error(error.message);
    });
  };

  const handleCancel = () => {
    setShowEditForm(false);
  };

  useEffect(() => {
    // console.log("ref", ref);
    if (!ref.current) return;
    ref.current.focus();
  }, [showEditForm]);

  if (!showEditForm || !selectedItem) return null;

  return (<>
    <Form title={"修改图片"} onSubmit={handleSubmit} onCancel={handleCancel}>
      <div>
        <Input ref={ref} value={cover} onChange={setCover} onEnter={handleSubmit} />
      </div>
    </Form>
  </>)
}