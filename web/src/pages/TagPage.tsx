import { useEffect, useState } from "react";
import { getAlbumList, getArtistList, getTagList } from "../lib/api";
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
    <div className={"px-8 py-4 grid gap-4 " + getLayout()}>
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
      {tabId == "albums" && <AlbumList />}
      {tabId == "artists" && <ArtistList />}
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

const AlbumList = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<Album>();
  const [showDrawer, setShowDrawer] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [filterText, setFilterText] = useState("");
  const {online_engine} = useSettingStore();
  const {id} = useParams();

  const fetchAlbums = (currentPage: number, pageSize?: number) => {
    setCurrentPage(currentPage);
    if (!pageSize) {
      pageSize = 30;
    }
    setPageSize(pageSize);
    getAlbumList(
      currentPage,
      pageSize,
      filterText,
      (result) => {
        if (result && result.success) {
          setAlbums(result.data.list);
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
    fetchAlbums(currentPage);
  }, []);
  useEffect(() => {
    fetchAlbums(1, pageSize);
  }, [filterText]);
  useEffect(() => {
    if (id) {
      const album = albums.find((item) => item.name === id);
      // console.log("hit album", album);
      if (album) {
        setSelectedAlbum(album);
        setShowDrawer(true);
      }
    }
  }, [id, albums]);

  const navigate = useNavigate();
  const { setNeedFilter, setFilter, filter } = useMusicList();
  const filterAlbum = (item: Album) => {
    setFilter({ ...filter, album: [item.name] });
    setNeedFilter(true);
    navigate("/");
  };
  const onlineSearch = () => {
    if (!selectedAlbum) return;
    window.open(getOnlineEngineUrl(online_engine, selectedAlbum.name), "_blank");
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
          placeholder="搜索专辑"
          value={filterText}
          onChange={setFilterText}
        />
        <Pagination
          total={total}
          limit={pageSize}
          currentPage={currentPage}
          onPageChange={fetchAlbums}
        />
      </div>
      <div className="flex flex-wrap gap-4 mb-4">
        {albums.map((album, index) => (
          <AlbumItem key={album.name + index} album={album} onSelect={() => { setShowDrawer(true); setSelectedAlbum(album); }} />
        ))}
      </div>
      <Drawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} title="专辑详情">
        <div>
          {selectedAlbum && (
            <div className="grid grid-cols-1 gap-4 justify-center text-center">
              <div className="w-full flex justify-center">
                <AlbumItem album={selectedAlbum} onSelect={filterAlbum} type="detail" />
              </div>
              <div className="flex justify-center items-center gap-2 cursor-pointer" onClick={onlineSearch}>
                <SearchIcon />
                <span>在线搜索</span>
              </div>
              <div className="font-bold">{selectedAlbum.name || "暂无专辑名"}</div>
              <div>{selectedAlbum.description || "暂无描述"}</div>
            </div>)
          }
        </div>
      </Drawer>
    </div>
  );
};

const AlbumItem = ({ album, type = "thumbnail", onSelect }: { album: Album, type?: string, onSelect?: (item: Album) => void }) => {
  const iconSize = type == 'thumbnail' ? 80 : 120;
  const cutSize = type == 'thumbnail' ? 4 : 8;
  const handleClick = () => {
    onSelect && onSelect(album);
  };
  const fallback = () => {
    return <div className="group-hover:text-primary-hover">
      {album.name.slice(0, Math.min(album.name.length, cutSize))}
    </div>
  }
  return (
    <div className="bg-muted rounded-md cursor-pointer group" onClick={handleClick}>
      <Cover src={album.cover} alt={album.name} type="avatar" fallback={fallback()} size={iconSize} />
    </div>
  );
};

const ArtistList = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [filterText, setFilterText] = useState("");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist>();
  const {online_engine} = useSettingStore();

  const fetchArtists = (currentPage: number, pageSize?: number) => {
    setCurrentPage(currentPage);
    if (!pageSize) pageSize = 30;
    setPageSize(pageSize);
    getArtistList(
      currentPage,
      pageSize,
      filterText,
      (result) => {
        if (result && result.success) {
          setArtists(result.data.list);
          setTotal(result.data.total);
        } else {
          toast.error("获取歌手列表失败", {
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
    fetchArtists(currentPage);
  }, []);
  useEffect(() => {
    fetchArtists(1, pageSize);
  }, [filterText]);

  const navigate = useNavigate();
  const { setNeedFilter, setFilter, filter } = useMusicList();
  const filterArtist = (item: Artist) => {
    setFilter({ ...filter, artist: [item.id] });
    setNeedFilter(true);
    navigate("/");
  };
  const onlineSearch = () => {
    if (!selectedArtist) return;
    window.open(getOnlineEngineUrl(online_engine, selectedArtist.name), "_blank");
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
          placeholder="搜索歌手"
          value={filterText}
          onChange={setFilterText}
        />
        <Pagination
          total={total}
          limit={pageSize}
          currentPage={currentPage}
          onPageChange={fetchArtists}
        />
      </div>
      <div className="flex flex-wrap gap-4 my-4">
        {artists.map((artist, index) => (
          <ArtistItem key={artist.name + index} artist={artist} onSelect={(item) => {
            setSelectedArtist(item);
            setOpenDrawer(true);
          }} />
        ))}
      </div>
      <Drawer isOpen={openDrawer} onClose={() => setOpenDrawer(false)} title="歌手详情">
        <div>
          {selectedArtist && (
            <div className="grid grid-cols-1 gap-4 justify-center text-center">
              <div className="w-full flex justify-center">
                <ArtistItem type="detail" artist={selectedArtist} onSelect={filterArtist} />
              </div>
              <div className="flex justify-center items-center gap-2 cursor-pointer" onClick={onlineSearch}>
                <SearchIcon />
                <span>在线搜索</span>
              </div>
              <div className=" font-bold">{selectedArtist.name || "暂无歌手名"}</div>
              <div>{selectedArtist.description || "暂无描述"}</div>
            </div>)}
        </div>
      </Drawer>
    </div>
  );
};

const ArtistItem = ({ artist, onSelect, type = 'thumnail' }: {
  artist: Artist, type?: string, onSelect?: (item: Artist) => void
}) => {
  const iconSize = type == 'thumnail' ? 80 : 120;
  const cutSize = type == 'thumnail' ? 4 : 8;
  const handleClick = () => {
    onSelect && onSelect(artist);
  };
  if (type == 'detail') console.log(artist);
  return (
    <div className="cursor-pointer" onClick={handleClick} >
      <Cover src={artist.cover} alt={artist.name} type="avatar" fallback={artist.name.slice(0, Math.min(artist.name.length, cutSize))} size={iconSize} />
    </div>
  );
};
