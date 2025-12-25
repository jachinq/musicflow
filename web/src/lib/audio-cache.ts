/**
 * AudioBuffer 缓存管理器
 * 使用 LRU (Least Recently Used) 策略，最多保留 3 个 AudioBuffer
 */

interface CacheEntry {
    buffer: AudioBuffer;
    timestamp: number; // 最后访问时间
}

export class AudioBufferCache {
    private cache: Map<string, CacheEntry> = new Map();
    private readonly maxSize: number;

    constructor(maxSize: number = 3) {
        this.maxSize = maxSize;
    }

    /**
     * 获取缓存的 AudioBuffer
     * @param songId 歌曲 ID
     * @returns AudioBuffer 或 null
     */
    get(songId: string): AudioBuffer | null {
        const entry = this.cache.get(songId);
        if (!entry) {
            return null;
        }

        // 更新访问时间
        entry.timestamp = Date.now();
        return entry.buffer;
    }

    /**
     * 设置缓存
     * @param songId 歌曲 ID
     * @param buffer AudioBuffer
     */
    set(songId: string, buffer: AudioBuffer): void {
        // 如果缓存已满，删除最久未使用的条目
        if (this.cache.size >= this.maxSize && !this.cache.has(songId)) {
            this.evictLRU();
        }

        this.cache.set(songId, {
            buffer,
            timestamp: Date.now(),
        });
    }

    /**
     * 删除指定歌曲的缓存
     * @param songId 歌曲 ID
     */
    delete(songId: string): void {
        this.cache.delete(songId);
    }

    /**
     * 清空所有缓存
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * 驱逐最久未使用的条目 (LRU)
     */
    private evictLRU(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            console.log(`[AudioBufferCache] 驱逐缓存: ${oldestKey}`);
            this.cache.delete(oldestKey);
        }
    }

    /**
     * 获取缓存统计信息
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            keys: Array.from(this.cache.keys()),
        };
    }

    /**
     * 检查缓存是否存在
     * @param songId 歌曲 ID
     */
    has(songId: string): boolean {
        return this.cache.has(songId);
    }
}

// 全局单例
export const audioBufferCache = new AudioBufferCache(3);
