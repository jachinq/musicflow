import { useEffect, useState } from "react";
import { getAlbumList, getArtistList, getTagList } from "../lib/api";
import { Album, Artist, Tag } from "../lib/defined";
import { TagElement } from "../components/Tag";
import { toast } from "sonner";
import { Pagination } from "../components/Pagination";
import { useMusicList } from "../store/musicList";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/Input";
import { useDevice } from "../hooks/use-device";
import { create } from "zustand";
import { Option, OptionGroup } from "../components/Option";
import { AlbumIcon, TagIcon, User2Icon } from "lucide-react";
import { Cover } from "../components/Cover";
import { Drawer } from "../components/Drawer";

type TabId = "tags" | "albums" | "artists";
interface TagPageState {
  tabId: TabId;
  setTabId: (tabId: TabId) => void;
  filterText: string;
  setFilterText: (filterText: string) => void;
}
const useTagPageStore = create<TagPageState>((set) => ({
  tabId: "artists",
  setTabId: (tabId) => set(() => ({ tabId })),
  filterText: "",
  setFilterText: (filterText) => set(() => ({ filterText })),
}));
export const TagsPage = () => {
  const { isSmallDevice } = useDevice();
  const { tabId, setTabId, filterText, setFilterText } = useTagPageStore();
  const getLayout = () => {
    return isSmallDevice ? "grid-cols-1" : "grid-cols-[auto,1fr]";
  };
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
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [filterText, setFilterText] = useState("");

  const fetchAlbums = (currentPage: number, pageSize?: number) => {
    setCurrentPage(currentPage);
    if (!pageSize) {
      pageSize = 30;
    }
    setPageSize(pageSize);
    setLoading(true);
    getAlbumList(
      currentPage,
      pageSize,
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
        {albums.map((album) => (
          <AlbumItem key={album.name} album={album} />
        ))}
      </div>
    </div>
  );
};

const AlbumItem = ({ album }: { album: Album }) => {
  const navigate = useNavigate();
  const { setNeedFilter, setFilter, filter } = useMusicList();
  const handleClick = () => {
    setFilter({ ...filter, album: [album.name] });
    setNeedFilter(true);
    navigate("/");
  };
  return (
    <div
      className="flex flex-col items-center bg-muted rounded-md cursor-pointer hover:text-primary-hover"
      onClick={handleClick}
    >
      <Cover src="/static/album.webp" alt={album.name} type="album" />
      <div className="text-center w-[132px] overflow-hidden">
        <span className="whitespace-nowrap text-ellipsis ">{album.name}</span>
      </div>
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

  const fetchArtists = (currentPage: number, pageSize?: number) => {
    setCurrentPage(currentPage);
    if (!pageSize) {
      pageSize = 30;
    }
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
        {artists.map((artist) => (
          <ArtistItem key={artist.id} artist={artist} onClick={()=>setOpenDrawer(true)}/>
        ))}
      </div>
      <Drawer isOpen={openDrawer} onClose={() => setOpenDrawer(false)}>
        <h1>{filterText}</h1>
      </Drawer>
    </div>
  );
};

const ArtistItem = ({ artist, onClick }: { artist: Artist } & React.HTMLAttributes<HTMLDivElement>) => {
  const navigate = useNavigate();
  // const { setNeedFilter, setFilter, filter } = useMusicList();
  const handleClick = (e: any) => {
    // setFilter({ ...filter, artist: [artist.id] });
    // setNeedFilter(true);
    // navigate("/");
    onClick && onClick(e);
  };
  return (
    <div
      className="flex flex-col items-center bg-muted rounded-md cursor-pointer hover:text-primary-hover"
      onClick={handleClick}
    >
      <Cover src="/static/artist.webp" alt={artist.name} type="album" />
      <div className="text-center w-[132px] overflow-hidden">
        <span className="whitespace-nowrap text-ellipsis ">{artist.name}</span>
      </div>
    </div>
  );
};
