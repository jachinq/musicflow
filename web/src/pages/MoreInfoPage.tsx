import { useCallback, useEffect, useRef, useState } from "react";
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
  setArtistCover,
} from "../lib/api";
import { Album, Artist, Music, MyRoutes } from "../lib/defined";
import { GenreElement } from "../components/Genre";
import { toast } from "sonner";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Input } from "../components/Input";
import { useDevice } from "../hooks/use-device";
import { create } from "zustand";
import { Option, OptionGroup } from "../components/Option";
import {
  AlbumIcon,
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
        <Option value={"genres"} icon={<TagIcon />}>
          风格
        </Option>
        <Option value={"albums"} icon={<AlbumIcon />}>
          专辑
        </Option>
        <Option value={"artists"} icon={<User2Icon />}>
          歌手
        </Option>
      </OptionGroup>
      {tabId == "genres" && <GenreList />}
      {tabId == "albums" && <WithDrawerList type={DrawerType.ALBUM} />}
      {tabId == "artists" && <WithDrawerList type={DrawerType.ARTIST} />}
    </div>
  );
};

const GenreList = () => {
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    getGenreList(
      (result) => {
        if (!result || !result.data || result.data.length === 0) {
          console.log("No genres found");
          return;
        }
        // console.log(result.data);
        setGenres(result.data);
      },
      (error) => {
        console.error(error);
      }
    );
  }, []);
  return (
    <div className="flex flex-wrap gap-4">
      {genres.map((genre) => (
        <GenreElement key={genre} genre={genre} />
      ))}
    </div>
  );
};

type WithDrawerItem = Album | Artist;
enum DrawerType {
  ALBUM = "专辑",
  ARTIST = "歌手",
}
const WithDrawerList = ({ type }: { type: DrawerType }) => {
  // const navigate = useNavigate();
  const [items, setItems] = useState<WithDrawerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [filterText, setFilterText] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { setShowDrawer, setSelectedItem } = useTagPageStore();
  const { isSmallDevice } = useDevice();
  const iconSize = isSmallDevice ? 80 : 120;

  const hasMore = items.length < total;

  const fetchItems = (page: number, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    const fetchFunc = type === DrawerType.ALBUM ? getAlbumList : getArtistList;
    fetchFunc(
      page,
      pageSize,
      filterText,
      (result) => {
        if (result && result.success) {
          if (append) {
            // 追加数据
            setItems((prevItems) => [...prevItems, ...result.data.list]);
          } else {
            // 替换数据（用于搜索或初始加载）
            setItems(result.data.list);
          }
          setTotal(result.data.total);
          setCurrentPage(page);
        } else {
          toast.error("获取专辑列表失败", {
            description: result.message,
          });
          setError(result.message as any);
        }
        setLoading(false);
        setIsLoadingMore(false);
      },
      (error) => {
        console.error(error);
        toast.error(error.message);
        setError(error.message);
        setLoading(false);
        setIsLoadingMore(false);
      }
    );
  };

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchItems(currentPage + 1, true);
    }
  };

  useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isLoadingMore,
    threshold: 200,
  });

  useEffect(() => {
    // 重置并重新加载
    setItems([]);
    setCurrentPage(1);
    fetchItems(1, false);
  }, [filterText]);

  if (loading) {
    return <div>Loading...</div>;
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
            <div className="w-[100px] overflow-hidden text-center">
              <span className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                {item.name}
              </span>
            </div>
          </div>
        ))}
      </div>
      {isLoadingMore && (
        <div className="text-center py-4 text-muted-foreground">
          加载中...
        </div>
      )}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">
          已加载全部 {total} 项
        </div>
      )}
      <DetaialDrawer />
      <EditForm onSussess={() => {
        // 刷新当前列表
        setItems([]);
        setCurrentPage(1);
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
  item: Artist | Album;
  type?: DrawerType;
  onSelect?: (item: Artist | Album) => void;
}) => {
  const { isSmallDevice } = useDevice();
  const iconSize = isSmallDevice ? 80 : 140;
  const cutSize = isSmallDevice ? 4 : 8;
  const handleClick = () => {
    onSelect && onSelect(item);
  };
  const getSrc = useCallback(() => {
    if (type === DrawerType.ARTIST) {
      return item.cover;
    }
    if (type === DrawerType.ALBUM) {
      return iconSize > 140
        ? getCoverMediumUrl(item.id)
        : getCoverSmallUrl(item.id);
    }
    return "";
  }, [item.cover, type]);
  const getClass = () => {
    if (type === DrawerType.ALBUM) {
      return "bg-muted rounded-md cursor-pointer group";
    }
    return "cursor-pointer group";
  };
  const fallback = () => (
    <div className="group-hover:text-primary-hover">
      {item.name.slice(0, Math.min(item.name.length, cutSize))}
    </div>
  );
  return (
    <div className={getClass()} onClick={handleClick}>
      <Cover
        src={getSrc()}
        alt={item.name}
        roundType={type === DrawerType.ALBUM ? "round" : "circle"}
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
  const [serchId, setSerchId] = useState<number | null>(null);
  const { id } = useParams();
  const [statistic, setStatistic] = useState<{
    total: number;
    duration: number;
  }>({ total: 0, duration: 0 });

  useEffect(() => {
    if (!id) return;
    const num_id = parseInt(id);
    if (isNaN(num_id)) return;
    setSerchId(num_id);
  }, [id]);
  useEffect(() => {
    if (!selectedItem) return;
    if (selectedItem.id === serchId) return;
    setSerchId(selectedItem.id);
  }, [selectedItem]);

  useEffect(() => {
    if (!serchId) return;
    const fetchFunc = type === DrawerType.ALBUM ? getAlbumById : getArtistById;
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

    const fetchSongs =
      type === DrawerType.ALBUM ? getAlbumSongs : getArtistSongs;
    fetchSongs(
      serchId,
      (result) => {
        if (result && result.success) {
          setMusicList(result.data);
        } else {
          toast.error("获取歌曲列表失败", {
            description: result.message,
          });
        }
      },
      (error) => {
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
    setCover(selectedItem.cover);
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