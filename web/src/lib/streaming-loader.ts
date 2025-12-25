/**
 * 流式音频加载器
 * 支持渐进式加载和快速首次播放
 */

export interface StreamingLoaderOptions {
  /** 音频 URL */
  url: string;
  /** 进度回调 */
  onProgress?: (progress: number, loaded: number, total: number) => void;
  /** 是否启用快速首播(仅下载部分数据) */
  fastFirstPlay?: boolean;
  /** 快速首播的数据量(字节),默认 512KB */
  fastFirstPlaySize?: number;
}

export class StreamingAudioLoader {
  private controller: AbortController | null = null;

  /**
   * 加载完整音频文件(带进度)
   */
  async loadFull(options: StreamingLoaderOptions): Promise<ArrayBuffer> {
    const { url, onProgress } = options;
    this.controller = new AbortController();

    const response = await fetch(url, { signal: this.controller.signal });

    if (!response.body) {
      // 降级到传统方式
      return await response.arrayBuffer();
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // 触发进度回调
        if (onProgress && contentLength > 0) {
          const progress = (receivedLength / contentLength) * 100;
          onProgress(progress, receivedLength, contentLength);
        }
      }

      // 合并所有分片
      return this.mergeChunks(chunks, receivedLength);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Download cancelled');
      }
      throw error;
    }
  }

  /**
   * 快速首播模式:先下载部分数据用于快速解码播放
   * 然后在后台继续下载剩余数据
   */
  async loadWithFastFirstPlay(
    options: StreamingLoaderOptions
  ): Promise<{
    partialBuffer: ArrayBuffer;
    fullBufferPromise: Promise<ArrayBuffer>;
  }> {
    const { url, onProgress, fastFirstPlaySize = 512 * 1024 } = options;

    // 第一阶段:使用 Range 请求下载前 N 字节
    const partialResponse = await fetch(url, {
      headers: {
        Range: `bytes=0-${fastFirstPlaySize - 1}`,
      },
    });

    const partialBuffer = await partialResponse.arrayBuffer();

    // 第二阶段:在后台下载完整文件
    const fullBufferPromise = this.loadFull({
      url,
      onProgress,
    });

    return {
      partialBuffer,
      fullBufferPromise,
    };
  }

  /**
   * 使用 HTTP Range 请求加载指定范围的数据
   */
  async loadRange(
    url: string,
    start: number,
    end: number
  ): Promise<ArrayBuffer> {
    const response = await fetch(url, {
      headers: {
        Range: `bytes=${start}-${end}`,
      },
    });

    if (response.status !== 206 && response.status !== 200) {
      throw new Error(`Range request failed: ${response.status}`);
    }

    return await response.arrayBuffer();
  }

  /**
   * 取消下载
   */
  cancel(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  /**
   * 合并数据块
   */
  private mergeChunks(chunks: Uint8Array[], totalLength: number): ArrayBuffer {
    const result = new Uint8Array(totalLength);
    let position = 0;

    for (const chunk of chunks) {
      result.set(chunk, position);
      position += chunk.length;
    }

    return result.buffer;
  }

  /**
   * 检测服务器是否支持 Range 请求
   */
  static async supportsRangeRequests(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
      });

      return response.headers.get('accept-ranges') === 'bytes';
    } catch {
      return false;
    }
  }
}
