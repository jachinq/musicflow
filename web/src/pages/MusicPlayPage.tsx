// pages/MusicPlayPage.tsx
import { useParams } from "react-router-dom";
import Lyrics from "../components/Lyrics";
import { useCurrentPlay } from "../store/current-play";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import { getMusicDetail, getMusicUrl } from "../lib/api";
import { readMeta } from "../lib/readmeta";
import { Music } from "../def/CommDef";

function MusicPlayPage() {
  const { id } = useParams<{ id: string }>();
  const { metadata, setMetadata, setMusic } = useCurrentPlay();

  useEffect(() => {
    if (!id) return;
    if (metadata) return;
    getMusicDetail(
      id,
      (music: Music) => {
        if (!music) return;
        music.url = getMusicUrl(music);
        readMeta(music.url).then((meta) => {
          music.metadata = meta;
          setMusic(music);
          setMetadata(meta);
        });
      },
      (error) => {
        console.error(error);
      }
    );
  }, [id]);

  return (
    <>
      {metadata ? (
        <div>
          {/* <MusicPlayer music={music} onTimeUpdate={handleTimeUpdate} currentTime={currentTime} /> */}
          {/* <AudioPlayer fiexd={true} /> */}
          <Lyrics lyrics={metadata?.lyrics || []} />
        </div>
      ) : (
        <div className="flex justify-center items-center h-full w-full">
          <Loader className="animate-spin" size={48} />
        </div>
      )}
    </>
  );
}

export default MusicPlayPage;
