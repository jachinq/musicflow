import { useEffect, useState } from "react";
import {
  getAlbumList,
  getArtistList,
  getCoverSmallUrl,
  getTagList,
} from "../lib/api";
import { Album, Artist, Tag } from "../lib/defined";
import { TagElement } from "../components/Tag";
import { toast } from "sonner";
import { Pagination } from "../components/Pagination";
import { useMusicList } from "../store/musicList";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Input } from "../components/Input";
import { useDevice } from "../hooks/use-device";
import { create } from "zustand";
import { Option, OptionGroup } from "../components/Option";
import { AlbumIcon, SearchIcon, TagIcon, User2Icon } from "lucide-react";
import { Cover } from "../components/Cover";
import { Drawer } from "../components/Drawer";
import { useSettingStore } from "../store/setting";
import { getOnlineEngineUrl } from "../lib/utils";

type TabId = "tags" | "albums" | "artists";
interface TagPageState {
  tabId: TabId;
  setTabId: (tabId: TabId) => void;
  filterText: string;
  setFilterText: (filterText: string) => void;
}
const useTagPageStore = create<TagPageState>((set) => ({
  tabId: "albums",
  setTabId: (tabId) => set(() => ({ tabId })),
  filterText: "",
  setFilterText: (filterText) => set(() => ({ filterText })),
}));
export const MoreInfoPage = () => {
  const param = useParams();
  const location = useLocation();

  const { isSmallDevice } = useDevice();
  const { tabId, setTabId } = useTagPageStore();
  const getLayout = () => {
    return isSmallDevice ? "grid-cols-1" : "grid-cols-[auto,1fr]";
  };
  useEffect(() => {
    console.log("param", param);
    console.log("location", location);
    let pathname = location.pathname;
    let parseTabId = pathname.split("/")[1] as TabId;
    setTabId(parseTabId);
  }, []);
  return (
    <div className={"px-8 py-4 grid gap-8 " + getLayout()}>
      <OptionGroup
        defaultValue={tabId}
        setValue={setTabId}
        drirection={isSmallDevice ? "row" : "column"}
        between
      >
        <Option value={"tags"} icon={<TagIcon />}>
          标签
        </Option>
        <Option value={"albums"} icon={<AlbumIcon />}>
          专辑
        </Option>
        <Option value={"artists"} icon={<User2Icon />}>
          歌手
        </Option>
      </OptionGroup>
      {tabId == "tags" && <TagList />}
      {tabId == "albums" && <WithDrawerList type={DrawerType.ALBUM} />}
      {tabId == "artists" && <WithDrawerList type={DrawerType.ARTIST} />}
    </div>
  );
};

const TagList = () => {
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
    );
  }, []);
  return (
    <div className="flex flex-wrap gap-4">
      {tags.map((tag) => (
        <TagElement key={tag.id} tag={tag} />
      ))}
    </div>
  );
};

type WithDrawerItem = Album | Artist;
enum DrawerType{
  ALBUM = "专辑",
  ARTIST = "歌手",
} 
const WithDrawerList = ({type}: {type: DrawerType}) => {
  const [selectedItem, setSelectedItem] = useState<WithDrawerItem>();
  const [showDrawer, setShowDrawer] = useState(false);
  const [items, setItems] = useState<WithDrawerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [filterText, setFilterText] = useState("");
  const { online_engine } = useSettingStore();
  const { id } = useParams();

  const fetchItems = (currentPage: number, pageSize?: number) => {
    setCurrentPage(currentPage);
    if (!pageSize) {
      pageSize = 30;
    }
    setPageSize(pageSize);
    const fetchFunc = type === DrawerType.ALBUM? getAlbumList : getArtistList;
    fetchFunc(
      currentPage,
      pageSize,
      filterText,
      (result) => {
        if (result && result.success) {
          setItems(result.data.list);
          setTotal(result.data.total);
        } else {
          toast.error("获取专辑列表失败", {
            description: result.message,
          });
          setError(result.message as any);
        }
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error(error.message);
        setError(error.message);
      }
    );
  };
  useEffect(() => {
    fetchItems(currentPage);
  }, []);
  useEffect(() => {
    fetchItems(1, pageSize);
  }, [filterText]);
  useEffect(() => {
    if (id) {
      const item = items.find((item) => item.name === id);
      if (item) {
        setSelectedItem(item);
        setShowDrawer(true);
      }
    }
  }, [id, items]);

  const navigate = useNavigate();
  const { setNeedFilter, setFilter, filter } = useMusicList();
  const onSelect = (item: any) => {
    if (type === DrawerType.ALBUM) {
      setFilter({ ...filter, album: [item.id] });
    } else if (type === DrawerType.ARTIST) {
      setFilter({ ...filter, artist: [item.id] });
    }
    setNeedFilter(true);
    navigate("/");
  };
  const onlineSearch = () => {
    if (!selectedItem) return;
    window.open(
      getOnlineEngineUrl(online_engine, selectedItem.name),
      "_blank"
    );
  };

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
        <Pagination
          total={total}
          limit={pageSize}
          currentPage={currentPage}
          onPageChange={fetchItems}
        />
      </div>
      <div className="flex flex-wrap gap-10 mb-4">
        {items.map((album, index) => (
          <div className="flex flex-col items-center gap-2">
            <CoverItem
              key={album.name + index}
              item={album}
              type={type}
              onSelect={() => {
                setShowDrawer(true);
                setSelectedItem(album);
              }}
            />
            <div className="w-[100px] overflow-hidden text-center">
              <span className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                {album.name}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Drawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={type + "详情"}
      >
        <div>
          {selectedItem && (
            <div className="grid grid-cols-1 gap-4 justify-center text-center">
              <div className="w-full flex justify-center">
                <CoverItem type={type} item={selectedItem} onSelect={onSelect} />
              </div>
              <div
                className="flex justify-center items-center gap-2 cursor-pointer"
                onClick={onlineSearch}
              >
                <SearchIcon />
                <span>在线搜索</span>
              </div>
              <div className="font-bold">
                {selectedItem.name || "暂无专辑名"}
              </div>
              <div>{selectedItem.description || "暂无描述"}</div>
            </div>
          )}
        </div>
      </Drawer>
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
  const iconSize = isSmallDevice ? 80 : 120;
  const cutSize = isSmallDevice ? 4 : 8;
  const handleClick = () => {
    onSelect && onSelect(item);
  };
  const getSrc = () => {
    if (type === DrawerType.ARTIST) {
      return item.cover;
    }
    if (type === DrawerType.ALBUM) {
      return getCoverSmallUrl(item.id);
    }
    return "";
  };
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
