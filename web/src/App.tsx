// App.tsx
import "./styles/globals.css";
import { Toaster } from "sonner";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import MusicPlayPage from "./pages/MusicPlayPage";
import SettingsPage from "./pages/SettingsPage";
import { usePlaylist } from "./store/playlist";
import { AudioPlayer } from "./components/AudioPlayer";
import { ThemeProvider } from "./components/theme-provider";
import { MoreInfoPage } from "./pages/TagPage";
import { SongListPage } from "./pages/SongListPage";
import { Header } from "./components/Header";

function App() {
  const { currentSong } = usePlaylist();
 
  return (
    <ThemeProvider defaultTheme="dark">
      <Router>
        <div className="min-w-[320px] min-h-screen ">
          <Header />

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
