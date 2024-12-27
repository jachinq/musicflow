// components/MusicCard.tsx
import { Music } from "../def/CommDef";
import { getCoverSmallUrl } from "../lib/api";

interface MusicCardProps {
  music: Music;
  onClick: () => void;
}

function MusicCard({ music, onClick }: MusicCardProps) {
  return (
    <div className="w-[140px] max-h-[240px]">
      <img src={getCoverSmallUrl(music.id)} alt="cover" width={140} />
      <div className="p-2 shadow-md bg-card text-card-foreground flex flex-col"
        style={{borderRadius: "0 0 8px 8px"}}
      >
        <div onClick={onClick} className="cursor-pointer break-keep overflow-hidden overflow-ellipsis w-[124px] hover:underline">
          <span className="whitespace-nowrap" title={music.title}>{music.title || 'unknown'}</span>
        </div>
        <div className="w-[124px] overflow-hidden overflow-ellipsis">
          <span className="whitespace-nowrap text-sm" title={music.artist}>{music.artist}</span>
        </div>
      </div>
    </div>
  );
}

export default MusicCard;
