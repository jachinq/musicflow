// components/MusicCard.tsx
import React, { useMemo } from 'react';
import { Music } from "../lib/defined";
import { delLyric, getCoverSmallUrl, starSong, unstarSong } from "../lib/api";
import { Cover } from "./Cover";
import { PlayIcon, MoreVertical, Heart } from "lucide-react";
import { useState } from "react";
import { Drawer } from "./Drawer";
import { DetailInfo } from "./DetailInfo";
import Lyrics from "./Lyrics";
import { toast } from "sonner";
import { useFavoriteStore } from "../store/favorite";

interface MusicCardProps {
  music: Music;
  onClickTitle?: (music: Music) => void;
  onPlay?: (music: Music) => void;
  size?: 'small' | 'medium' | 'large';
  showActions?: boolean;
}

export const MusicCard = ({
  music,
  onClickTitle,
  onPlay,
  size = 'medium',
  showActions = true
}: MusicCardProps) => {

  const sizeNum = useMemo(() => {
    switch (size) {
      case'small':
        return 120;
      case 'large':
        return 180;
      default:
        return 140;
    }
  }, [size])

  const sizeClasses = {
    small: 'w-[120px] h-[120px]',
    medium: 'w-[140px] h-[140px]',
    large: 'w-[180px] h-[180px]',
  };

  const containerWidth = {
    small: 'w-[120px]',
    medium: 'w-[140px]',
    large: 'w-[180px]',
  };

  const textWidth = {
    small: 'w-[104px]',
    medium: 'w-[124px]',
    large: 'w-[164px]',
  };

  const [isHovered, setIsHovered] = useState(false);
  const { isStarred, addStarredSong, removeStarredSong } = useFavoriteStore();
  const isFavorite = isStarred(music);

  const handleOnPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("play music", music);
    onPlay && onPlay(music);
  };

  const handleOnClickTitle = () => {
    onClickTitle && onClickTitle(music);
    setShowDetail(true);
  };

  // 收藏/取消收藏处理
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isFavorite) {
      // 取消收藏
      unstarSong(
        music.id,
        (result) => {
          if (result && result.success) {
            removeStarredSong(music.id);
            toast.success("已取消收藏");
          } else {
            toast.error("取消收藏失败", {
              description: result.message,
            });
          }
        },
        (error) => {
          console.error("取消收藏失败", error);
          toast.error("取消收藏失败");
        }
      );
    } else {
      // 收藏
      starSong(
        music.id,
        (result) => {
          if (result && result.success) {
            addStarredSong(music);
            toast.success("已添加到收藏");
          } else {
            toast.error("收藏失败", {
              description: result.message,
            });
          }
        },
        (error) => {
          console.error("收藏失败", error);
          toast.error("收藏失败");
        }
      );
    }
  };

  const [showDetail, setShowDetail] = useState(false);
  const [confirmDeleteLyrics, setConfirmDeleteLyrics] = useState(false);
  const [deleteLyricsBtnText, setDeleteLyricsBtnText] = useState("删除歌词");

  const onDeleteLyrics = async (song_id: string) => {
    if (confirmDeleteLyrics) {
      delLyric(song_id,
        (result) => {
          if (result.success) {
            toast.success("歌词删除成功");
            setShowDetail(false);
          } else {
            toast.error(result.message)
          }
        },
        (error) => {
          toast.error(error);
          console.error(error);
        }
      );
    } else {
      setConfirmDeleteLyrics(true);
      setDeleteLyricsBtnText("确认删除");
      setTimeout(() => {
        setConfirmDeleteLyrics(false);
        setDeleteLyricsBtnText("删除歌词");
      }, 3000);
    }
  };

  return (
    <>
      <div
        className={`${containerWidth[size]} max-h-[240px] flex-shrink-0`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`group relative ${sizeClasses[size]} overflow-hidden`}>
          <Cover
            size={sizeNum}
            src={getCoverSmallUrl(music.cover_art)}
            roundType="card_text"
            className="group-hover:opacity-75 group-hover:scale-105 transition-all duration-300 ease-in-out"
          />

          {/* 悬浮操作层 */}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300 ease-in-out ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* 播放按钮 */}
            <button
              onClick={handleOnPlay}
              className="rounded-full p-3 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary-hover hover:scale-110 transition-all duration-200 shadow-lg"
              aria-label="播放"
            >
              <PlayIcon className="w-6 h-6" fill="currentColor" />
            </button>
          </div>

          {/* 右上角操作按钮 */}
          {showActions && (
            <div className={`absolute top-2 right-2 flex gap-1 transition-all duration-300 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}>
              <button
                onClick={handleToggleFavorite}
                className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all duration-200"
                aria-label={isFavorite ? "取消收藏" : "收藏"}
              >
                <Heart
                  className="w-4 h-4"
                  fill={isFavorite ? "currentColor" : "none"}
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetail(true);
                }}
                className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all duration-200"
                aria-label="更多选项"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 卡片信息 */}
        <div
          className="p-2 bg-card text-card-foreground flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200"
          style={{ borderRadius: "0 0 8px 8px" }}
        >
          <div
            onClick={handleOnClickTitle}
            className={`cursor-pointer break-keep overflow-hidden overflow-ellipsis ${textWidth[size]} hover:text-primary-hover transition-colors duration-200`}
          >
            <span className="whitespace-nowrap font-medium" title={music.title}>
              {music.title || "unknown"}
            </span>
          </div>
          <div className={`${textWidth[size]} overflow-hidden overflow-ellipsis`}>
            <span className="whitespace-nowrap text-sm text-muted-foreground" title={music.artist}>
              {music.artist}
            </span>
          </div>
        </div>
      </div>

      <Drawer isOpen={showDetail} onClose={() => setShowDetail(false)} title="歌曲详情">
        <div className="p-4">
          <div className="flex flex-col gap-2">
            <DetailInfo song={music} contentH />
            <div className="font-bold text-lg">
              <span>歌词</span>
              <span className={`button text-sm ml-2 ${confirmDeleteLyrics && 'button-danger'}`}
                onClick={() => onDeleteLyrics(music.id)}>{deleteLyricsBtnText}</span>
            </div>
            <Lyrics song_id={music.id} filterEmpty />
          </div>
        </div>
      </Drawer>
    </>
  );
};
