// pages/MusicPlayPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Lyrics from '../components/Lyrics';
import Playlist from '../components/Playlist';
import { API_URL, getMusicUrl } from '../lib/api';
import { Music } from '../def/CommDef';
import AudioPlayer from '../components/Player';
import { readMeta } from '../lib/readmeta';
import { useCurrentPlay } from '../store/current-play';

function MusicPlayPage() {
    const { id } = useParams<{ id: string }>();
    const [music, setMusic] = useState<Music | null>(null);
    // const [currentTime, setCurrentTime] = useState<number>(0);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
    // const [metadata, setMetadata] = useState<IMeta | null>(null);
    const { metadata, setMetadata} = useCurrentPlay();

    useEffect(() => {
        // 根据音乐ID获取音乐详情
        fetch(`${API_URL}/music-detail/${id}`)
            .then(response => response.json())
            .then(data => setMusic(data))
            .catch(error => console.error('获取音乐详情失败', error));
    }, [id]);

    useEffect(() => {
        // 根据音乐ID获取音乐元数据
        if (music) readMeta(getMusicUrl(music)).then(meta => setMetadata(meta));
    }, [music]);

    function addToPlaylist() {
        if (selectedPlaylistId && music) {
            fetch(`/api/add-to-playlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ playlistId: selectedPlaylistId, musicId: music.id }),
            })
                .then(response => response.json())
                .then(data => console.log(data))
                .catch(error => console.error('添加音乐到歌单失败', error));
        }
    }

    return (
        <div className="p-4">
            {metadata ? (
                <div>
                    {/* <MusicPlayer music={music} onTimeUpdate={handleTimeUpdate} currentTime={currentTime} /> */}
                    <AudioPlayer audioFile={getMusicUrl(music as Music)}/>
                    <Lyrics lyrics={metadata?.lyrics || []} />
                    <Playlist onSelect={setSelectedPlaylistId} />
                    <button onClick={addToPlaylist} className="p-2 bg-blue-500 text-white rounded-lg">
                        添加到歌单
                    </button>
                </div>
            ) : (
                <p>正在加载音乐...</p>
            )}
        </div>
    );
}

export default MusicPlayPage;
