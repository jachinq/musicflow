// App.tsx
import "./styles/globals.css";
import { Toaster } from 'sonner';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {HomePage} from "./pages/HomePage";
import MusicPlayPage from "./pages/MusicPlayPage";
import SettingsPage from "./pages/SettingsPage";
import { usePlaylist } from "./store/playlist";
import { AudioPlayer } from "./components/AudioPlayer";
import { ThemeProvider } from "./components/theme-provider";
import { Settings, Tag } from "lucide-react";
import { TagsPage } from "./pages/TagPage";

function App() {
  const { currentSong } = usePlaylist();
  return (
    <ThemeProvider defaultTheme="dark">
      <Router>
        <div className="min-w-[320px] min-h-screen ">
          <nav className="p-4 bg-primary-foreground sticky top-0">
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
                <Link
                  to="/tags"
                  className="text-muted-foreground hover:text-primary-hover"
                >
                  <Tag />
                </Link>
                <Link
                  to="/settings"
                  className="text-muted-foreground hover:text-primary-hover"
                >
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
                <Route path="/tags" element={<TagsPage />} />
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
