// components/Playlist.tsx
import React, { useState, useEffect } from 'react';

interface Playlist {
    id: string;
    name: string;
}

interface PlaylistProps {
    onSelect: (playlistId: string) => void;
}

function Playlist({ onSelect }: PlaylistProps) {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    useEffect(() => {
        // 获取歌单列表
        fetch('/api/playlists')
            .then(response => response.json())
            .then(data => setPlaylists(data))
            .catch(error => console.error('获取歌单列表失败', error));
    }, []);

    return (
        <div>
            {playlists.map(playlist => (
                <button key={playlist.id} onClick={() => onSelect(playlist.id)} className="p-2 bg-gray-200 dark:bg-gray-600 m-1 rounded-lg">
                    {playlist.name}
                </button>
            ))}
        </div>
    );
}

export default Playlist;
