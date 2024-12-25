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
    <div onClick={onClick} className="w-[140px] max-h-[240px] cursor-pointer">
      <img src={metadata.title || metadata.cover} alt="cover" width={140} />
      {/* <img src={metadata.cover} alt="cover" width={140} /> */}
      <div
        className="p-2 shadow-md bg-slate-700 flex flex-col"
      >
        <div className="break-keep overflow-hidden overflow-ellipsis w-[124px] hover:underline">
          <span className="whitespace-nowrap">{metadata.title || music.name}</span>
        </div>
        <div className="break-keep overflow-hidden w-[140px]">
          <span className="whitespace-nowrap text-sm">{metadata.artist || music.artist}</span>
        </div>
      </div>
    </div>
  );
}

export default MusicCard;
