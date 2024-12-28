// components/MusicCard.tsx
import { Music } from "../lib/defined";
import { getCoverSmallUrl } from "../lib/api";
import { useEffect, useRef, useState } from "react";
import { Loader } from "lucide-react";

interface MusicCardProps {
  music: Music;
  onClick: () => void;
}

export const MusicCard = ({ music, onClick }: MusicCardProps) => {
  return (
    <div className="w-[140px] max-h-[240px]">
      <Cover music={music} />
      <div
        className="p-2 shadow-md bg-card text-card-foreground flex flex-col"
        style={{ borderRadius: "0 0 8px 8px" }}
      >
        <div
          onClick={onClick}
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

const Cover = ({ music }: { music: Music }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!music.id) {
      setLoaded(true);
      return;
    }
    const img = new Image();
    img.src = getCoverSmallUrl(music.id);
    img.onload = () => {
      setLoaded(true);
      // console.log(imgRef.current);
      if (imgRef.current) {
        imgRef.current.src = img.src;
        imgRef.current.style.display = "block";
      }
    };
    img.onerror = () => {
      setLoaded(true);
      if (imgRef.current) {
        imgRef.current.src = getCoverSmallUrl("xxx"); // replace with default cover
        imgRef.current.style.display = "block";
      }
    };
    return () => {
      img.onload = null;
    };
  }, [music]);

  return (
    <div
      style={{ borderRadius: "0 0 8px 8px" }}
      className="min-h-[140px] min-w-[140px] flex items-center justify-center bg-background shadow-md"
    >
      <img ref={imgRef} width={140} className="object-cover hidden" />
      {!loaded && <Loader className="animate-spin" size={32} />}
    </div>
  );
};
