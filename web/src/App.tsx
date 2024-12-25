// App.tsx
import "./styles/globals.css";

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MusicPlayPage from './pages/MusicPlayPage';
import SettingsPage from './pages/SettingsPage';
import { usePlaylist } from "./store/playlist";
import AudioPlayer from "./components/Player";

function App() {
  const { currentSong } = usePlaylist();

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <nav className="bg-white dark:bg-gray-900 p-4">
          <div className="container mx-auto flex justify-between">
            <Link to="/" className="font-bold text-lg">音乐播放器</Link>
            <div className="flex space-x-4 items-center">
              <Link to="/" className="text-gray-900 dark:text-gray-100">首页</Link>
              <Link to="/settings" className="text-gray-900 dark:text-gray-100">设置</Link>
            </div>
          </div>
        </nav>
        <div className="container mx-auto p-4">
          <div className={`${currentSong && "mb-24"}`}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/music/:id" element={<MusicPlayPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>

          {
            currentSong && (
              <div className="fixed bottom-0 left-0 w-full px-4 py-2 bg-slate-900">
                <div className="flex justify-between items-center">
                  <AudioPlayer fiexd={true} />
                </div>
              </div>
            )
          }

        </div>
      </div>
    </Router>
  );
}

export default App;
