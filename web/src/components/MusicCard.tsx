// components/MusicCard.tsx
import { Music } from "../def/CommDef";

interface MusicCardProps {
  music: Music;
  onClick: () => void;
}

function MusicCard({ music, onClick }: MusicCardProps) {
  if (!music.metadata) {
    return <div>Loading...</div>;
  }
  const { metadata } = music;
  return (
    <div onClick={onClick} className="w-[140px] h-[240px] cursor-pointer">
        <img src={metadata.cover} alt="" width={140}/>
      <div
        className="p-2 shadow-md bg-slate-700 w-full"
      >
        <span className=" break-keep text-center overflow-hidden text-ellipsis whitespace-nowrap ">{metadata.title || music.name}</span>
        <span className="">{metadata.artist || music.artist}</span>
      </div>
    </div>
  );
}

export default MusicCard;
