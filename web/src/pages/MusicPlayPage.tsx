// pages/MusicPlayPage.tsx
// import { useParams } from 'react-router-dom';
import Lyrics from '../components/Lyrics';
import { useCurrentPlay } from '../store/current-play';
import { Loader } from 'lucide-react';

function MusicPlayPage() {
    // const { id } = useParams<{ id: string }>();
    const { metadata} = useCurrentPlay();

    function addToPlaylist() {

    }

    return (
        <div className="p-4">
            {metadata ? (
                <div>
                    {/* <MusicPlayer music={music} onTimeUpdate={handleTimeUpdate} currentTime={currentTime} /> */}
                    {/* <AudioPlayer fiexd={true} /> */}
                    <Lyrics lyrics={metadata?.lyrics || []} />
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
