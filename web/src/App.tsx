// App.tsx
import "./styles/globals.css";

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MusicPlayPage from './pages/MusicPlayPage';
import SettingsPage from './pages/SettingsPage';
import { usePlaylist } from "./store/playlist";
import AudioPlayer from "./components/AudioPlayer";
import { ThemeProvider } from "./components/theme-provider";
import { Settings } from "lucide-react";

function App() {
  const { currentSong } = usePlaylist();

  return (
    <ThemeProvider defaultTheme="dark">
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <nav className="bg-white dark:bg-gray-900 p-4">
            <div className="flex justify-between">
              <Link to="/" className="font-bold text-lg">
                <div className="flex items-center justify-center gap-1">
                  <div className="rounded-full overflow-hidden">
                    <img src="/favicon.ico" alt="" width={28} />
                  </div>
                  <span className="hover:text-primary-hover">Musicflow</span>
                </div>
              </Link>
              <div className="flex space-x-4 items-center">
                {/* <Link to="/" className="text-gray-900 dark:text-gray-100">首页</Link> */}
                <Link to="/settings" className="text-gray-900 dark:text-gray-100">
                  <Settings />
                </Link>
              </div>
            </div>
          </nav>
          <div>
            <div className={`${currentSong && "mb-[90px]"}`}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/music/:id" element={<MusicPlayPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>

            {
              currentSong && (
                <AudioPlayer />
              )
            }

          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
