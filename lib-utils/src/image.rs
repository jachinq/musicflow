use std::{
    fs::File,
    io::{BufWriter, Write},
};

use image::{DynamicImage, GenericImageView};

use super::log::log_time_used;

pub const THUMB_QUALITY: i8 = 10;

// 缩小图片
pub fn resize_image(img: Box<DynamicImage>, target_size: u32) -> Box<DynamicImage> {
    // let thumbnail_size = 300;
    let (width, height) = img.dimensions();

    // if width <= thumbnail_size || height <= thumbnail_size {
    //     return img;
    // }

    let mut nwidth = width;
    let mut nheight = height;

    if width == height {
        nwidth = target_size;
        nheight = target_size;
    } else if width > height {
        // h=316 target_h=250 w=1415
        // target_w=250/316*1415
        nwidth = (target_size as f32 / height as f32 * width as f32) as u32;
        nheight = target_size;
    } else if height > width {
        nheight = (target_size as f32 / width as f32 * height as f32) as u32;
        nwidth = target_size;
    }
    // println!(
    //     "resize image from {}x{} to {}x{}, target_size={}",
    //     width, height, nwidth, nheight, target_size
    // );

    // 将原始尺寸的图片缩小到指定尺寸
    return Box::new(img.resize(nwidth, nheight, image::imageops::FilterType::Nearest));
}

// 根据 img 压缩成 webp 格式
pub fn compress_img(img: &DynamicImage, qulity: i8) -> Result<Vec<u8>, String> {
    match webp::Encoder::from_image(img) {
        Err(err) => Err(err.to_string()),
        Ok(encoder) => {
            let webp = encoder.encode(qulity as f32);
            Ok(webp.to_vec())
        }
    }
}

// 保存图片到指定路径
pub fn save_img(buf: &[u8], file_path: &str) -> Result<usize, String> {
    let start_time = std::time::Instant::now();
    let create_result = File::create(file_path);
    if let Err(err) = create_result {
        return Err(err.to_string());
    }
    let file = create_result.expect("create file error.");
    let write_result = BufWriter::new(file).write(&buf);
    if let Err(err) = write_result {
        return Err(err.to_string());
    }
    let size = write_result.expect("write img error.");
    let info = format!("save img path={}, size={}", file_path, size);
    log_time_used(start_time, &info);
    Ok(size)
}
