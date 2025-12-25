import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { create } from "zustand";
import { searchAll } from "../lib/api";
import { Album, Artist, Music, JsonResult, MyRoutes } from "../lib/defined";
import { toast } from "sonner";
import { Loader, Music2Icon, AlbumIcon, User2Icon } from "lucide-react";
import { MusicCard } from "../components/MusicCard";
import { usePlaylist } from "../store/playlist";
import { Option, OptionGroup } from "../components/Option";
import { Cover } from "../components/Cover";
import { getCoverSmallUrl } from "../lib/api";
import LoadingIndicator from "../components/LoadingIndicator";
import { VirtualGrid } from "../components/VirtualGrid";

// 标签页 ID
type TabId = "songs" | "albums" | "artists";

// 搜索结果
interface SearchResult {
  songs: Music[];
  albums: Album[];
  artists: Artist[];
  total_songs: number;
  total_albums: number;
  total_artists: number;
}

// 页面状态管理
interface SearchPageState {
  tabId: TabId;
  setTabId: (tabId: TabId) => void;
  searchResult: SearchResult | null;
  setSearchResult: (result: SearchResult | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const useSearchPageStore = create<SearchPageState>((set) => ({
  tabId: "songs",
  setTabId: (tabId) => set({ tabId }),
  searchResult: null,
  setSearchResult: (searchResult) => set({ searchResult }),
  loading: false,
  setLoading: (loading) => set({ loading }),
}));

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("q") || "";
  const navigate = useNavigate();

  const { tabId, setTabId, searchResult, setSearchResult, loading, setLoading } =
    useSearchPageStore();
  const { playSingleSong } = usePlaylist();

  useEffect(() => {
    if (!keyword || keyword.trim() === "") {
      setSearchResult(null);
      return;
    }

    setLoading(true);
    searchAll(
      keyword,
      1,
      10000, // 当前接口分页有问题，直接先获取全部数据
      (result: JsonResult<SearchResult>) => {
        setLoading(false);
        if (result.success) {
          setSearchResult(result.data);
        } else {
          toast.error(result.message || "搜索失败");
        }
      },
      (error: any) => {
        setLoading(false);
        console.error("搜索失败:", error);
        toast.error("搜索失败,请稍后再试");
      }
    );
  }, [keyword]);

  // 空关键字处理
  if (!keyword || keyword.trim() === "") {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-68px)]">
        <div className="text-muted-foreground">请输入搜索关键字</div>
      </div>
    );
  }

  return (
    <div className="px-8 py-4 grid gap-8">
      {/* 搜索标题 */}
      <div className="text-2xl font-bold">
        搜索结果: "{keyword}"
      </div>

      {/* 标签页切换 */}
      <OptionGroup defaultValue={tabId} setValue={(value: string) => setTabId(value as TabId)}>
        <Option value="songs" icon={<Music2Icon />}>
          音乐 ({searchResult?.total_songs || 0})
        </Option>
        <Option value="albums" icon={<AlbumIcon />}>
          专辑 ({searchResult?.total_albums || 0})
        </Option>
        <Option value="artists" icon={<User2Icon />}>
          歌手 ({searchResult?.total_artists || 0})
        </Option>
      </OptionGroup>

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader className="animate-spin" size={36} />
        </div>
      )}

      {/* 结果展示 */}
      {!loading && searchResult && (
        <>
          {tabId === "songs" && (
            <SongsTab songs={searchResult.songs} onPlay={playSingleSong} />
          )}
          {tabId === "albums" && (
            <AlbumsTab albums={searchResult.albums} navigate={navigate} />
          )}
          {tabId === "artists" && (
            <ArtistsTab artists={searchResult.artists} navigate={navigate} />
          )}
        </>
      )}
      <LoadingIndicator loading={loading} />
    </div>
  );
};

// 音乐标签页
const SongsTab = ({ songs, onPlay }: { songs: Music[]; onPlay: (music: Music) => void }) => {
  if (songs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        没有找到相关音乐
      </div>
    );
  }

  // 使用虚拟滚动优化大列表渲染
  if (songs.length > 50) {
    return (
      <div style={{ height: "calc(100vh - 300px)" }}>
        <VirtualGrid
          items={songs}
          itemHeight={220}
          itemWidth={140}
          gap={16}
          overscan={2}
          renderItem={(music) => (
            <MusicCard key={music.id} music={music} onPlay={onPlay} />
          )}
        />
      </div>
    );
  }

  return (
    <div className="card-container grid gap-4 w-full justify-center grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
      {songs.map((music) => (
        <MusicCard key={music.id} music={music} onPlay={onPlay} />
      ))}
    </div>
  );
};

// 专辑标签页
const AlbumsTab = ({ albums, navigate }: { albums: Album[]; navigate: any }) => {
  if (albums.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        没有找到相关专辑
      </div>
    );
  }

  // 使用虚拟滚动优化大列表渲染
  if (albums.length > 50) {
    return (
      <div style={{ height: "calc(100vh - 300px)" }}>
        <VirtualGrid
          items={albums}
          itemHeight={170}
          itemWidth={120}
          gap={40}
          overscan={2}
          renderItem={(album) => (
            <AlbumCoverItem
              key={album.id}
              album={album}
              onClick={() => navigate(`${MyRoutes.Albums}/${album.id}`)}
            />
          )}
        />
      </div>
    );
  }

  return (
    <div className="gap-10 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
      {albums.map((album) => (
        <AlbumCoverItem
          key={album.id}
          album={album}
          onClick={() => navigate(`${MyRoutes.Albums}/${album.id}`)}
        />
      ))}
    </div>
  );
};

// 艺术家标签页
const ArtistsTab = ({ artists, navigate }: { artists: Artist[]; navigate: any }) => {
  if (artists.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        没有找到相关歌手
      </div>
    );
  }

  // 使用虚拟滚动优化大列表渲染
  if (artists.length > 50) {
    return (
      <div style={{ height: "calc(100vh - 300px)" }}>
        <VirtualGrid
          items={artists}
          itemHeight={150}
          itemWidth={120}
          gap={40}
          overscan={2}
          renderItem={(artist) => (
            <ArtistCoverItem
              key={artist.id}
              artist={artist}
              onClick={() => navigate(`${MyRoutes.Artists}/${artist.id}`)}
            />
          )}
        />
      </div>
    );
  }

  return (
    <div className="gap-10 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
      {artists.map((artist) => (
        <ArtistCoverItem
          key={artist.id}
          artist={artist}
          onClick={() => navigate(`${MyRoutes.Artists}/${artist.id}`)}
        />
      ))}
    </div>
  );
};

// 专辑卡片组件(简化版,复用 Cover 组件)
const AlbumCoverItem = ({ album, onClick }: { album: Album; onClick: () => void }) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer hover:opacity-80 transition-opacity"
    >
      <Cover
        src={getCoverSmallUrl(album.cover_art)}
        roundType="card_text"
        className="mb-2"
      />
      <div className="text-sm font-medium truncate" title={album.name}>
        {album.name}
      </div>
      <div className="text-xs text-muted-foreground truncate" title={album.artist}>
        {album.artist}
      </div>
    </div>
  );
};

// 艺术家卡片组件
const ArtistCoverItem = ({ artist, onClick }: { artist: Artist; onClick: () => void }) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer hover:opacity-80 transition-opacity"
    >
      <Cover
        src={getCoverSmallUrl(artist.cover_art)}
        roundType="card_text"
        className="mb-2"
      />
      <div className="text-sm font-medium truncate" title={artist.name}>
        {artist.name}
      </div>
    </div>
  );
};
