import { useEffect, useState } from "react";
import { getArtistList, getTagList } from "../lib/api";
import { Artist, Tag } from "../lib/defined";
import { TagElement } from "../components/Tag";
import { toast } from "sonner";
import { Pagination } from "../components/Pagination";
import { useMusicList } from "../store/musicList";
import { useNavigate } from "react-router-dom";

export const TagsPage = () => {
  return <div className="p-4">
    <Layout title="标签列表">
      <TagList />
    </Layout>
    <Layout title="专辑">
      <AlbumList />
    </Layout>
    <Layout title="歌手">
      <ArtistList />
    </Layout>
  </div>;
};

const Layout = ({ title, children }: any) => {
  return (
    <div className="mx-auto mb-4">
      <div className="text-2xl font-bold mb-4">{title}</div>
      {children}
    </div>
  )
}

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
    )
  }, []);
  return <div className="flex flex-wrap gap-4">
    {tags.map((tag) => (
      <TagElement key={tag.id} tag={tag} />
    ))}
  </div>
}

const AlbumList = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {

  }, [])
  return <div>AlbumList</div>
}

const ArtistList = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchArtists = (currentPage: number, pageSize?: number) => {
    setCurrentPage(currentPage);
    if (pageSize) {
      setPageSize(pageSize);
    } else {
      pageSize = 30;
    }
    getArtistList(
      currentPage,
      pageSize,
      (result) => {
        if (result && result.success) {
          setArtists(result.data.list);
          setTotal(result.data.total);
        } else {
          toast.error("获取歌手列表失败", {
            description: result.message
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
    )
  }
  useEffect(() => {
    fetchArtists(currentPage);
  }, [])

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div className="flex flex-wrap gap-4">
    {artists.map((artist) => (
      <ArtistItem key={artist.id} artist={artist} />
    ))}
    <Pagination total={total} limit={pageSize} currentPage={currentPage} onPageChange={fetchArtists} />
  </div>
}

const ArtistItem = ({ artist }: { artist: Artist }) => {
  const navigate = useNavigate();
  const { setNeedFilter, setFilter, filter } =  useMusicList();
  const handleClick = () => {
    setFilter({...filter, artist: [artist.id]});
    setNeedFilter(true);
    navigate("/");
  }
  return <div className="bg-muted p-4 rounded-md cursor-pointer hover:text-primary-hover" onClick={handleClick}>
    <div>{artist.name}</div>
    <div>{artist.description}</div>
  </div>
}