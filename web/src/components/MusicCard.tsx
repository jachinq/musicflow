// components/MusicCard.tsx
import { LoaderCircleIcon } from "lucide-react";
import { Music } from "../def/CommDef";

interface MusicCardProps {
  music: Music;
  onClick: () => void;
}

function MusicCard({ music, onClick }: MusicCardProps) {
  if (!music.metadata) {
    return <div className="flex justify-center items-center w-[140px] h-[140px]">
      <LoaderCircleIcon className="animate-spin" />
    </div>;
  }
  const { metadata } = music;
  return (
    <div className="w-[140px] max-h-[240px]">
      {/* <img src={metadata.title || metadata.cover} alt="cover" width={140} /> */}
      <img src={metadata.cover} alt="cover" width={140} />
      <div className="p-2 shadow-md bg-card text-card-foreground flex flex-col"
        style={{borderRadius: "0 0 8px 8px"}}
      >
        <div onClick={onClick} className="cursor-pointer break-keep overflow-hidden overflow-ellipsis w-[124px] hover:underline">
          <span className="whitespace-nowrap" title={metadata.title || music.name}>{metadata.title || music.name}</span>
        </div>
        <div className="w-[124px] overflow-hidden overflow-ellipsis">
          <span className="whitespace-nowrap text-sm" title={metadata.artist || music.artist}>{metadata.artist || music.artist}</span>
        </div>
      </div>
    </div>
  );
}

export default MusicCard;
