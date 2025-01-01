// components/MusicCard.tsx
import { Music } from "../lib/defined";
import { getCoverSmallUrl } from "../lib/api";
import { Cover } from "./Cover";

interface MusicCardProps {
  music: Music;
  onClick: (music: Music) => void;
}

export const MusicCard = ({ music, onClick }: MusicCardProps) => {
  return (
    <div className="w-[140px] max-h-[240px]">
      <Cover src={getCoverSmallUrl(music.album_id)} roundType="card_text"/>
      <div
        className="p-2 shadow-md bg-card text-card-foreground flex flex-col"
        style={{ borderRadius: "0 0 8px 8px" }}
      >
        <div
          onClick={onClick.bind(null, music)}
          className="cursor-pointer break-keep overflow-hidden overflow-ellipsis w-[124px] hover:underline"
        >
          <span className="whitespace-nowrap" title={music.title}>
            {music.title || "unknown"}
          </span>
        </div>
        <div className="w-[124px] overflow-hidden overflow-ellipsis">
          <span className="whitespace-nowrap text-sm" title={music.artist}>
            {music.artist}
          </span>
        </div>
      </div>
    </div>
  );
};