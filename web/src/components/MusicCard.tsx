// components/MusicCard.tsx
import { Music } from "../lib/defined";
import { delLyric, getCoverSmallUrl } from "../lib/api";
import { Cover } from "./Cover";
import { PlayIcon } from "lucide-react";
import { useState } from "react";
import { Drawer } from "./Drawer";
import { DetailInfo } from "./DetailInfo";
import Lyrics from "./Lyrics";
import { toast } from "sonner";

interface MusicCardProps {
  music: Music;
  onClickTitle?: (music: Music) => void;
  onPlay?: (music: Music) => void;
}

export const MusicCard = ({ music, onClickTitle, onPlay }: MusicCardProps) => {
  const handleOnPlay = () => {
    console.log("play music", music);
    onPlay && onPlay(music);
  };
  const handleOnClickTitle = () => {
    onClickTitle && onClickTitle(music);
    setShowDetail(true);
  };

  const [showDetail, setShowDetail] = useState(false);

  const [confirmDeleteLyrics, setConfirmDeleteLyrics] = useState(false);
  const [deleteLyricsBtnText, setDeleteLyricsBtnText] = useState("删除歌词");
  const onDeleteLyrics = async (song_id: string) => {
    if (confirmDeleteLyrics) {
      delLyric(song_id,
        (result) => {
          if (result.success) {
            toast.success("歌词删除成功");
            setShowDetail(false);
          } else {
            toast.error(result.message)
          }
        },
        (error) => {
          toast.error(error);
          console.error(error);
        }
      );
    } else {
      setConfirmDeleteLyrics(true);
      setDeleteLyricsBtnText("确认删除");
      setTimeout(() => {
        setConfirmDeleteLyrics(false);
        setDeleteLyricsBtnText("删除歌词");
      }, 3000);
    }
  };
  return (
    <>
      <div className="w-[140px] max-h-[240px]">
        <div className="group relative w-[140px] h-[140px]">
          <Cover
            src={getCoverSmallUrl(music.cover_art)}
            roundType="card_text"
            className="group-hover:opacity-75 transition-all duration-300 ease-in-out"
          />
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
            <div
              onClick={handleOnPlay}
              className="cursor-pointer rounded-full p-4 flex items-center justify-center bg-card text-card-foreground hover:text-primary-hover"
            >
              <PlayIcon />
            </div>
          </div>
        </div>
        <div
          className="p-2 shadow-md bg-card text-card-foreground flex flex-col"
          style={{ borderRadius: "0 0 8px 8px" }}
        >
          <div
            onClick={handleOnClickTitle}
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
      <Drawer isOpen={showDetail} onClose={() => setShowDetail(false)} title="歌曲详情">
        <div className="p-4">
          <div className="flex flex-col gap-2">
            <DetailInfo song={music} contentH />
            <div className="font-bold text-lg">
              <span>歌词</span>
              <span className={`button ml-2 ${confirmDeleteLyrics && 'button-danger'}`}
                onClick={() => onDeleteLyrics(music.id)}>{deleteLyricsBtnText}</span>
            </div>
            <Lyrics song_id={music.id} filterEmpty />
          </div>
        </div>
      </Drawer>
    </>
  );
};
