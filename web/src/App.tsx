// App.tsx
import "./styles/globals.css";
import { Toaster } from "sonner";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import MusicPlayPage from "./pages/MusicPlayPage";
import SettingsPage from "./pages/SettingsPage";
import { usePlaylist } from "./store/playlist";
import { AudioPlayer } from "./components/AudioPlayer";
import { ThemeProvider } from "./components/theme-provider";
import { FileMusicIcon, Settings, Tag } from "lucide-react";
import { MoreInfoPage } from "./pages/TagPage";
import { SongListPage } from "./pages/SongListPage";

function App() {
  const { currentSong, showPlaylist } = usePlaylist();
  return (
    <ThemeProvider defaultTheme="dark">
      <Router>
        <div className="min-w-[320px] min-h-screen ">
          <nav
            className={
              "p-4 bg-primary-foreground top-0 w-full sticky" +
              (showPlaylist ? "" : " z-[1]")
            }
          >
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
                <Link to="/playlist" className="navigation">
                  <FileMusicIcon />
                </Link>
                <Link to="/tags" className="navigation">
                  <Tag />
                </Link>
                <Link to="/settings" className="navigation">
                  <Settings />
                </Link>
              </div>
            </div>
          </nav>

          <div
            className={`${
              currentSong && "mb-[90px]"
            } flex justify-center items-center w-full h-full `}
          >
            <div className="max-w-[1560px] w-full">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/playlist" element={<SongListPage />} />
                <Route path="/tags" element={<MoreInfoPage />} />
                <Route path="/albums" element={<MoreInfoPage />} />
                <Route path="/artists" element={<MoreInfoPage />} />
                <Route path="/albums/:id" element={<MoreInfoPage />} />
                <Route path="/artists/:id" element={<MoreInfoPage />} />
                <Route path="/detail/:id" element={<MusicPlayPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </div>

          {currentSong && <AudioPlayer />}
        </div>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;
