// pages/MusicPlayPage.tsx
import { useParams } from "react-router-dom";
import Lyrics from "../components/Lyrics";
import { useEffect } from "react";

function MusicPlayPage() {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    
  }, [id]);

  return (
    <>
      <div>
        {/* <MusicPlayer music={music} onTimeUpdate={handleTimeUpdate} currentTime={currentTime} /> */}
        {/* <AudioPlayer fiexd={true} /> */}
        <Lyrics />
      </div>
    </>
  );
}

export default MusicPlayPage;
