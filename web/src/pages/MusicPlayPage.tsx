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
  const { isSmallDevice } = useDevice();

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

  if (isSmallDevice) {
    return (
      <div className="flex flex-col justify-center items-center w-full">
        <div className="flex justify-center items-center w-full my-10">
          <div className={`album-spin-wrapper border-[60px]`}>
            <img
              src={getCoverMediumUrl(song_id)}
              alt=""
              width={250}
              height={250}
              className={`${isPlaying ? "album-spin" : ""} object-cover`}
            />
          </div>
        </div>
        <div className="flex gap-2 flex-col justify-center items-center w-full p-8 sticky top-0 bg-background">
          <h1 className="text-3xl font-bold">{detailSong?.title}</h1>
          <div className="flex justify-cetner items-center gap-4 text-muted-foreground">
            <span>专辑：{detailSong?.album}</span>
            <span>歌手：{detailSong?.artist}</span>
          </div>
          <OptionGroup
            defaultValue={tabId}
            setValue={(value: any) => setTabId(value)}
            className="flex justify-evenly items-center gap-4"
          >
            <Option value={1}>歌词</Option>
            <Option value={2}>信息</Option>
          </OptionGroup>
        </div>
        <div className="">
          {tabId === 1 && <Lyrics song_id={song_id} />}
          {tabId === 2 && <DetailInfo song={detailSong} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row justify-center items-center w-full p-4">
      <div className="grid grid-cols-[1fr,2fr] gap-8">
        <div className="flex justify-center items-center w-full min-h-[calc(100vh-150px)]">
          <div className={`album-spin-wrapper border-[80px]`}>
            <img
              src={getCoverMediumUrl(song_id)}
              alt=""
              width={400}
              height={400}
              className={`${isPlaying ? "album-spin" : ""} object-cover`}
            />
          </div>
        </div>
        <div className="grip grid-rows-[180px, 1fr] relative">
          <div className="flex gap-2 flex-col justify-center items-center w-full py-8 bg-background sticky top-0">
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
    </div>
  );
}

export default MusicPlayPage;
