/**
 * Media Session API 管理模块
 * 用于在操作系统级别显示和控制音乐播放（Windows 音量面板、通知中心、锁屏界面等）
 */

export interface MediaMetadata {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
}

export interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSeek?: (time: number) => void;
}

class MediaSessionManager {
  private isSupported: boolean;

  constructor() {
    // 检查浏览器是否支持 Media Session API
    this.isSupported = 'mediaSession' in navigator;

    // if (this.isSupported) {
    //   console.log('[MediaSession] Media Session API 已启用');
    // } else {
    //   console.warn('[MediaSession] Media Session API 不被当前浏览器支持');
    // }
  }

  /**
   * 更新媒体元数据
   */
  updateMetadata(metadata: MediaMetadata) {
    if (!this.isSupported) {
      console.warn('[MediaSession] 更新元数据失败: Media Session API 不被当前浏览器支持');
      return;
    }

    try {
      // 构建封面图片数组（需要绝对 URL）
      const artworkArray = metadata.artwork
        ? [
            { src: metadata.artwork, sizes: '96x96', type: 'image/png' },
            { src: metadata.artwork, sizes: '128x128', type: 'image/png' },
            { src: metadata.artwork, sizes: '192x192', type: 'image/png' },
            { src: metadata.artwork, sizes: '256x256', type: 'image/png' },
            { src: metadata.artwork, sizes: '384x384', type: 'image/png' },
            { src: metadata.artwork, sizes: '512x512', type: 'image/png' },
          ]
        : [];

      // console.log('[MediaSession] 设置元数据:', metadata);

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: metadata.title || '未知标题',
        artist: metadata.artist || '未知艺术家',
        album: metadata.album || '',
        artwork: artworkArray,
      });

      // console.log('[MediaSession] 元数据已更新:', metadata.title);
      // console.log('[MediaSession] 当前 metadata 对象:', navigator.mediaSession.metadata);
      // console.log('[MediaSession] playbackState:', navigator.mediaSession.playbackState);
    } catch (error) {
      console.error('[MediaSession] 更新元数据失败:', error);
    }
  }

  /**
   * 设置播放状态
   */
  setPlaybackState(state: 'playing' | 'paused' | 'none') {
    if (!this.isSupported) return;

    try {
      navigator.mediaSession.playbackState = state;
      // console.log('[MediaSession] 播放状态已更新:', state);
    } catch (error) {
      console.error('[MediaSession] 设置播放状态失败:', error);
    }
  }

  /**
   * 注册媒体控制事件处理器
   */
  setActionHandlers(handlers: MediaSessionHandlers) {
    if (!this.isSupported) return;

    try {
      // 播放
      if (handlers.onPlay) {
        navigator.mediaSession.setActionHandler('play', () => {
          // console.log('[MediaSession] 系统播放按钮被点击');
          handlers.onPlay?.();
        });
      }

      // 暂停
      if (handlers.onPause) {
        navigator.mediaSession.setActionHandler('pause', () => {
          // console.log('[MediaSession] 系统暂停按钮被点击');
          handlers.onPause?.();
        });
      }

      // 上一曲
      if (handlers.onPrevious) {
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          // console.log('[MediaSession] 系统上一曲按钮被点击');
          handlers.onPrevious?.();
        });
      }

      // 下一曲
      if (handlers.onNext) {
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          // console.log('[MediaSession] 系统下一曲按钮被点击');
          handlers.onNext?.();
        });
      }

      // 进度条拖动（可选）
      if (handlers.onSeek) {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            // console.log('[MediaSession] 系统进度条被拖动到:', details.seekTime);
            handlers.onSeek?.(details.seekTime);
          }
        });
      }

      // console.log('[MediaSession] 事件处理器已注册');
    } catch (error) {
      console.error('[MediaSession] 注册事件处理器失败:', error);
    }
  }

  /**
   * 更新播放位置（用于进度条同步）
   */
  updatePositionState(duration: number, currentTime: number, playbackRate: number = 1.0) {
    if (!this.isSupported) return;

    try {
      // 确保值有效
      if (duration > 0 && currentTime >= 0 && currentTime <= duration) {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: playbackRate,
          position: currentTime,
        });
      }
    } catch (error) {
      // 某些浏览器可能不支持 setPositionState，静默失败
      console.debug('[MediaSession] 更新播放位置失败:', error);
    }
  }

  /**
   * 清除媒体会话（组件卸载时调用）
   */
  clear() {
    if (!this.isSupported) return;

    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';

      // 移除所有事件处理器
      const actions: MediaSessionAction[] = ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto'];
      actions.forEach(action => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {
          // 忽略不支持的 action
        }
      });

      // console.log('[MediaSession] 媒体会话已清除');
    } catch (error) {
      console.error('[MediaSession] 清除媒体会话失败:', error);
    }
  }

  /**
   * 检查是否支持 Media Session API
   */
  isApiSupported(): boolean {
    return this.isSupported;
  }
}

// 导出单例
export const mediaSessionManager = new MediaSessionManager();
