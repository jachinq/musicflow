import { Metadata, Sharp } from "sharp";
import sharp from "sharp";

// const sharp = require('sharp');

/**
 * 压缩比率说明：
 * 
 * - 对于 JPEG 和 WebP 格式，压缩比率的数值范围是 0 到 100。
 *   数值越大，图片质量越高，文件大小也越大；
 *   数值越小，图片质量越低，文件大小越小。
 * 
 * - 对于 PNG 格式，压缩比率的数值范围是 0 到 9。
 *   数值越大，文件大小越小，处理时间可能更长；
 *   数值越小，文件大小越大，处理速度更快。
 * 
 * - 对于其他格式如 AVIF,IF,TIFF，压缩比率数值范围通常是 0 到 100，
 *   数值越大，图片质量越高，文件大小也越大；
 *   数值越小，图片质量越低，文件大小越小。
 * 
 */
interface Options {
  width?: number;
  height?: number;
  quality?: number;
  format: "jpeg" | "png" | "webp" | "tiff" | "raw" | "heif";
}

/**
 * 处理图片的压缩和格式转换
 * @param {string} base64String - 图片的 Base64 字符串
 * @param {Object} options - 配置参数
 * @param {number} options.width - 目标图片的宽度（可选）
 * @param {number} options.height - 目标图片的高度（可选）
 * @param {number} options.quality - 压缩比率（可选）
 * @param {string} options.format - 目标图片的格式（如 'webp', 'jpeg', 'png' 等）
 * @returns {Promise<string>} - 处理后的图片的 Base64 字符串
 */
export async function processImage(base64String: string, options: Options): Promise<string> {
  // 将 Base64 字符串解码为 Buffer
  const buffer = Buffer.from(base64String, 'base64');

  // 使用 sharp 处理图片
  let image = sharp(buffer);

  // 调整尺寸
  if (options.width && options.height) {
    image = image.resize(options.width, options.height);
  } else if (options.width) {
    image = image.resize(options.width, null);
  } else if (options.height) {
    image = image.resize(null, options.height);
  }

  // 设置压缩比率和格式
  if (options.quality) {
    image = image[options.format]({ quality: options.quality });
  } else {
    image = image[options.format]();
  }

  // 将处理后的图片转换为 Buffer
  const processedBuffer = await image.toBuffer();

  // 将 Buffer 编码为 Base64 字符串
  const processedBase64String = processedBuffer.toString('base64');

  return processedBase64String;
}

export const getPictureInfo = async (buffer: Buffer): Promise<Metadata> => {
  // 将 Base64 字符串解码为 Buffer
  // const buffer = Buffer.from(base64String, 'base64');

  // 使用 sharp 获取图片信息
  const image = sharp(buffer);
  const metadata: Metadata = await image.metadata();
  return metadata;
}

/* 
// 示例用法
const base64String = 'your_base64_encoded_image_string_here';
const options = {
  width: 300,
  height: 200,
  quality: 80,
  format: 'webp'
};

processImage(base64String, options)
  .then(processedBase64String => {
    console.log(processedBase64String);
  })
  .catch(error => {
    console.error('Error processing image:', error);
  });
 */