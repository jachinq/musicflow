// pages/MusicPlayPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Lyrics from '../components/Lyrics';
import Playlist from '../components/Playlist';
import { API_URL, getMusicUrl } from '../lib/api';
import AudioPlayer from '../components/Player';
import { readMeta } from '../lib/readmeta';
import { useCurrentPlay } from '../store/current-play';
import { Loader } from 'lucide-react';

function MusicPlayPage() {
    const { id } = useParams<{ id: string }>();
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
    const { metadata, setMetadata, music, setMusic} = useCurrentPlay();

    useEffect(() => {
        // 根据音乐ID获取音乐详情
        fetch(`${API_URL}/music-detail/${id}`)
            .then(response => response.json())
            .then(data => setMusic({...data, url: getMusicUrl(data) }))
            .catch(error => console.error('获取音乐详情失败', error));
    }, [id]);

    useEffect(() => {
        // 根据音乐ID获取音乐元数据
        if (music) readMeta(music.url).then(meta => setMetadata(meta));
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
                    <AudioPlayer music={music as any} />
                    <Lyrics lyrics={metadata?.lyrics || []} />
                    <Playlist onSelect={setSelectedPlaylistId} />
                    <button onClick={addToPlaylist} className="p-2 bg-blue-500 text-white rounded-lg">
                        添加到歌单
                    </button>
                </div>
            ) : (
                <div className='flex justify-center items-center h-full w-full'>
                    <Loader className='animate-spin' size={48} />
                </div>
            )}
        </div>
    );
}

export default MusicPlayPage;
