// pages/MusicPlayPage.tsx
import { useParams } from "react-router-dom";
import Lyrics from "../components/Lyrics";
import { useEffect, useState } from "react";
import { usePlaylist } from "../store/playlist";
import { getCoverMediumUrl, getMusicDetail } from "../lib/api";
import { Music } from "../lib/defined";
import { useCurrentPlay } from "../store/current-play";
import { Option, OptionGroup } from "../components/Option";
import { useDevice } from "../hooks/use-device";
import { DetailInfo } from "../components/DetailInfo";

function MusicPlayPage() {
  const { id } = useParams<{ id: string }>();
  const { isPlaying } = useCurrentPlay();
  const { currentSong, allSongs, setCurrentSong, setAllSongs } = usePlaylist();
  const [song_id, setSongId] = useState<string>("");
  const [detailSong, setDetailSong] = useState<Music>();
  const [tabId, setTabId] = useState<number>(1);
  const {
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isHugeDevice,
    windowWidth,
  } = useDevice();
  const gridCols = `${
    isSmallDevice ? "1fr" : isMediumDevice ? "1fr 1fr" : "1fr 2fr"
  }`;
  // const album_size = isSmallDevice? 250 : isMediumDevice? 300 : 400;
  // const album_border_width = isSmallDevice? 60 : isMediumDevice? 70 : 80;
  const x = windowWidth
    ? isHugeDevice
      ? windowWidth / 2.5
      : isLargeDevice
      ? windowWidth / 1.5
      : windowWidth / 1.2
    : 0;
  const album_size = windowWidth
    ? 0.00016666 * (x * x) + 0.05 * x + 83.335
    : isSmallDevice
    ? 250
    : isMediumDevice
    ? 300
    : 400;
  const album_border_width = album_size / 3;
  // windowWidth 和 album_size 的关系是一个二次方程。已知公式 ax^2 + bx + c = y, 且 x=500时y=150、x=700时y=200、x=1000时y=300，求公式中的a、b、c，解得 a=0.00016666、b=0.05、c=83.335

  useEffect(() => {
    const song_id = currentSong?.id || id || "";
    setSongId(song_id);
    // console.log("song_id", song_id, "currentSong", currentSong, "id==", id);
  }, [id, currentSong]);

  useEffect(() => {
    if (!song_id || song_id === "") return;
    if (currentSong && currentSong.id != song_id) {
      setDetailSong(currentSong);
      return;
    }
    if (detailSong) return;
    getMusicDetail(
      song_id,
      (result) => {
        const music = result.data;
        setDetailSong(music);
        if (!isPlaying) {
          // navigate(`/detail/${musicId}`);
          const index = allSongs.findIndex((song) => song.id === music.id);
          if (index === -1) {
            setAllSongs([...allSongs, music]);
            console.log("add music to playlist", music.title);
          }
          setCurrentSong(music);
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }, [song_id, currentSong]);

  if (!song_id && !currentSong && !detailSong) {
    return (
      <div className="flex justify-center items-center h-full w-full p-4">
        查询不到信息
      </div>
    );
  }

  return (
    <div
      className="grid gap-8 items-start px-8"
      style={{ gridTemplateColumns: gridCols }}
    >
      <div
        className={`flex justify-center w-full ${
          !isSmallDevice
            ? "min-h-[calc(100vh-150px)] items-center"
            : "p-8 items-start"
        }`}
      >
        <div
          className="album-spin-wrapper"
          style={{ borderWidth: album_border_width }}
        >
          <img
            src={getCoverMediumUrl(currentSong?.album_id || 0)}
            alt=""
            width={album_size}
            height={album_size}
            className={`${isPlaying ? "album-spin" : ""} object-cover`}
          />
        </div>
      </div>
      <div className="grip grid-rows-[180px, 1fr] relative">
        <div className="flex gap-2 flex-col justify-center items-center w-full py-8 bg-background sticky top-[60px]">
          <h1 className="text-3xl font-bold">{detailSong?.title}</h1>
          <div className="flex justify-between items-center gap-4 text-muted-foreground">
            <span>专辑：{detailSong?.album}</span>
            <span>歌手：{detailSong?.artist}</span>
          </div>
          <OptionGroup
            defaultValue={tabId}
            setValue={(value: any) => setTabId(value)}
            className="flex justify-center items-center gap-4"
          >
            <Option value={1}>歌词</Option>
            <Option value={2}>信息</Option>
          </OptionGroup>
        </div>
        <div className="mt-8">
          {tabId === 1 && <Lyrics song_id={song_id} />}
          {tabId === 2 && <DetailInfo song={detailSong} />}
        </div>
      </div>
    </div>
  );
}

export default MusicPlayPage;
