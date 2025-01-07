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
import { MoreInfoPage } from "./pages/MoreInfoPage";
import { SongListPage } from "./pages/SongListPage";
import { Header } from "./components/Header";
import { MyRoutes } from "./lib/defined";

function App() {
  const { currentSong } = usePlaylist();

  return (
    <ThemeProvider defaultTheme="dark">
      <Router>
        <div className="min-w-[320px] min-h-screen ">
          <Header />

          <div
            className={`${currentSong && "mb-[90px]"
              } flex justify-center items-center w-full h-full `}
          >
            <div className="max-w-[1560px] w-full">
              <Routes>
                <Route path={MyRoutes.Home} element={<HomePage />} />
                <Route path={MyRoutes.Playlist} element={<SongListPage />} />
                <Route path={MyRoutes.Genres} element={<MoreInfoPage />} />
                <Route path={MyRoutes.Albums} element={<MoreInfoPage />} />
                <Route path={MyRoutes.Artists} element={<MoreInfoPage />} />
                <Route path={MyRoutes.AlbumDetail} element={<MoreInfoPage />} />
                <Route path={MyRoutes.ArtistDetail} element={<MoreInfoPage />} />
                <Route path={MyRoutes.Player} element={<MusicPlayPage />} />
                <Route path={MyRoutes.Settings} element={<SettingsPage />} />
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
