// components/MusicCard.tsx
import React from 'react';
import { Music } from '../def/CommDef';

interface MusicCardProps {
    music: Music;
    onClick: () => void;
}

function MusicCard({ music, onClick }: MusicCardProps) {
    return (
        <div className="p-4 rounded-lg shadow-md cursor-pointer bg-slate-700" onClick={onClick}>
            <h2 className="text-xl font-bold">{music.name}</h2>
            <p className="">{music.artist}</p>
        </div>
    );
}

export default MusicCard;
