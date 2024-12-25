// components/Playlist.tsx
import { Trash } from 'lucide-react';
import { Music } from '../def/CommDef';
import { formatTime } from '../lib/utils';
import { usePlaylist } from '../store/playlist';
import { Pagination } from './Pagination';
import { forwardRef, useRef } from 'react';

interface Props {
  clearPlaylist: () => void;
}
const Playlist = forwardRef<HTMLDivElement, Props>(({ clearPlaylist }, ref) => {
  const internalRef = useRef<HTMLDivElement | null>(null);
   // 将外部 ref 和内部 ref 结合
  const setRef = (node: HTMLDivElement | null) => {
    internalRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const { showPlaylist, pageSongs, currentSong, currentPage, setCurrentPage, getTotal, setCurrentSong, setShowPlaylist } = usePlaylist();

  const playSong = (song: Music) => {
    setCurrentSong(song);
  }

  if (!showPlaylist) {
    return null;
  }

  return (
    <>
    <div ref={setRef} className='fixed top-[72px] right-0 w-[calc(100vw/3)] min-w-[320px] h-[calc(100vh-160px)] bg-slate-900 rounded-md overflow-scroll z-10' style={{overscrollBehavior: 'contain'}}>      <div className='p-4 flex justify-between items-center'>
        <span className='font-bold'>播放列表</span>
        <Trash size={18} className='text-gray-500 hover:text-red-500 cursor-pointer' onClick={clearPlaylist} />
      </div>
      {getTotal() > 0 && (
        <div className='px-4'>
          <Pagination showTotal={false} currentPage={currentPage} total={getTotal()} onPageChange={setCurrentPage} className='justify-start' />
        </div>
      )}
      <div className='mt-4 flex flex-col gap-2' >
        {pageSongs.map(song => (
          <div key={song.id} onClick={() => playSong(song)} className='flex items-center justify-center cursor-pointer hover:bg-slate-700 gap-2 px-2'>
            <div className='rounded-lg overflow-hidden'>
              <img src={song.metadata?.cover} alt="" width={40} />
            </div>
            <div className={`flex justify-between items-center w-full ${currentSong?.id === song.id ? 'text-blue-400' : ''}`}>
              <div className='flex flex-col gap-1'>
                <span>{song.metadata?.title || song.name}</span>
                <span className='text-xs text-gray-400'>{song.metadata?.artist || song.artist}</span>
              </div>
              {song.metadata?.duration && <div className='text-xs text-gray-400'>
                {formatTime(song.metadata?.duration)}
              </div>}
            </div>
          </div>
        ))}
      </div>

    </div>
    <div className='fixed bottom-0 left-0 w-full h-full bg-slate-900 rounded-t-md flex justify-center items-center opacity-0' onClick={()=>{
      setShowPlaylist(false);
    }}></div>
    </>
  );
});

export default Playlist;
