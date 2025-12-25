// pages/HomePage.tsx

import { FlameKindling, Loader } from "lucide-react";
import { useHomePageStore } from "../store/home-page";
import RandomSongs from "../components/RandomSongs";


export const HomePage = () => {
  const { error, loading } = useHomePageStore();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-68px)]">
        <Loader className="animate-spin" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 justify-center items-center p-4">
        <div className="flex flex-col gap-2 justify-center items-center text-destructive">
          <FlameKindling size={64} />
          加载失败，请稍后再试
        </div>
        <div className="text-xs text-muted-foreground">
          {JSON.stringify(error, null, 2)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 grid gap-4">
      <RandomSongs />
    </div>
  );
};
