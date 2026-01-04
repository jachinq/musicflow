import { Album } from '../lib/defined';
import { Cover } from './Cover';
import { getCoverSmallUrl } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface AlbumCardProps {
  album: Album;
  onClick?: (album: Album) => void;
}

/**
 * 专辑卡片组件
 * 展示专辑封面、名称和艺术家，点击跳转到专辑详情页
 */
export function AlbumCard({ album, onClick }: AlbumCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(album);
    } else {
      navigate(`/albums/${album.id}`);
    }
  };

  return (
      <div className={`w-[140px] max-h-[240px] flex-shrink-0`}
        onClick={handleClick}
      >
        <div className={`group relative w-[140px] h-[140px] overflow-hidden`}>
          <Cover
            src={getCoverSmallUrl(album.cover_art)}
            roundType="card_text"
            className="group-hover:opacity-75 group-hover:scale-105 transition-all duration-300 ease-in-out"
          />
        </div>

        {/* 卡片信息 */}
        <div
          className="p-2 bg-card text-card-foreground flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200"
          style={{ borderRadius: "0 0 8px 8px" }}
        >
          <div className={`cursor-pointer break-keep overflow-hidden overflow-ellipsis w-[124px] hover:text-primary-hover transition-colors duration-200`}>
            <span className="whitespace-nowrap font-medium" title={album.name}>
              {album.name || "unknown"}
            </span>
          </div>
          <div className={`w-[124px] overflow-hidden overflow-ellipsis`}>
            <span className="whitespace-nowrap text-sm text-muted-foreground" title={album.artist}>
              {album.artist}
            </span>
          </div>
        </div>
      </div>

  );
}
