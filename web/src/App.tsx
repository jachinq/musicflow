// App.tsx
import "./styles/globals.css";
import { Toaster } from "sonner";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { HomePage } from "./pages/HomePage";
import MusicPlayPage from "./pages/MusicPlayPage";
import SettingsPage from "./pages/SettingsPage";
import { usePlaylist } from "./store/playlist";
import { useFavoriteStore } from "./store/favorite";
import { AudioPlayer } from "./components/AudioPlayer";
import { ThemeProvider } from "./components/theme-provider";
import { MoreInfoPage } from "./pages/MoreInfoPage";
import { SongListPage } from "./pages/SongListPage";
import { SearchPage } from "./pages/SearchPage";
import { RecommendationAlbumsPage } from "./pages/RecommendationAlbumsPage";
import { RecommendationRandomPage } from "./pages/RecommendationRandomPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { Header } from "./components/Header";
import { MyRoutes } from "./lib/defined";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingBar from "./components/LoadingBar";
// import { MobileBottomNav } from "./components/MobileBottomNav";
import { PageTransition } from "./components/PageTransition";
import { getPlayQueue, getStarredList } from "./lib/api";

function App() {
  const { currentSong, isDetailPage, setAllSongs, setCurrentSong } = usePlaylist();
  const { setStarredSongs } = useFavoriteStore();

  // 应用启动时初始化
  useEffect(() => {

    // 获取播放列表
    getPlayQueue(1, 0, (data) => {
      if (!data || !data.success) {
        console.error("获取播放列表失败", data);
        return;
      }
      setAllSongs(data.data.list, true);
      if (data.data.current_song) {
        // 应用首次加载，标记为用户未交互。不进行自动播放
        setCurrentSong(data.data.current_song, false);
      }
    },
      (error) => {
        console.error("获取播放列表失败", error);
      }
    );

    // 收藏数据
    getStarredList(
      (result) => {
        if (result && result.success) {
          const songs = result.data.songs || [];
          setStarredSongs(songs);
        }
      },
      (error) => {
        console.error("初始化收藏数据失败:", error);
      }
    );
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <Router>
          <LoadingBar />
          <div className="min-w-[320px] min-h-screen ">
            {!isDetailPage && <Header />}

            <div
              className={`${currentSong && "sm:mb-[100px] mb-[200px]"
                } flex justify-center items-center w-full h-full `}
            >
              <div className="max-w-[1560px] w-full">
                <PageTransition>
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
                    <Route path={MyRoutes.Search} element={<SearchPage />} />
                    <Route path={MyRoutes.Favorites} element={<FavoritesPage />} />
                    <Route path="/recommendations/albums/:type" element={<RecommendationAlbumsPage />} />
                    <Route path="/recommendations/random" element={<RecommendationRandomPage />} />
                  </Routes>
                </PageTransition>
              </div>
            </div>

            {currentSong && <AudioPlayer />}
            {/* <MobileBottomNav /> */}
          </div>
          <Toaster />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
