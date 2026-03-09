import { hanldeUploadSingleImage, handleUploadVideo, getNameFromFullname } from '~/utils/file'
import { UPLOAD_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { env } from '~/config/environment'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

/**
 * Xử lý upload ảnh: parse file → convert WebP bằng sharp → xóa file tạm → trả URL
 * Hỗ trợ upload nhiều ảnh cùng lúc (maxFiles: 4)
 */
export const handleUploadSingleImage = async (req) => {
  const files = await hanldeUploadSingleImage(req)

  // vì allow upload multi file nên dùng Promise.all
  const result = await Promise.all(files.map(async (file) => {
    // Cắt bỏ extension gốc (.png, .jpg, .bmp...) vì sharp sẽ convert sang WebP
    // Ví dụ: 'abc123.png' → 'abc123'
    const newName = getNameFromFullname(file.newFilename)
    // Gắn lại đuôi .webp vì output luôn là WebP, tránh đuôi kép (abc123.png.webp)
    const newPath = path.resolve(UPLOAD_DIR, `${newName}.webp`)

    // Dùng sharp để xử lý ảnh trước khi lưu:
    // 1. Chuẩn hóa format: user upload .png/.jpg/.bmp → convert hết về WebP (nhẹ hơn JPEG 25-35%)
    // 2. Nén dung lượng: quality 80 = giữ 80% chất lượng, mắt thường gần như không thấy khác biệt
    // 3. Có thể resize nếu cần: .resize({ width: 800 }) để giảm kích thước pixel
    // → Giúp web load nhanh hơn và tiết kiệm dung lượng server
    await sharp(file.filepath).webp({ quality: 80 }).toFile(newPath)
    // Ví dụ thêm resize: sharp(file.filepath).resize({ width: 800, height: 800 }).webp({ quality: 60 }).toFile(newPath)

    // Xóa file tạm trong uploads/temp/
    fs.unlinkSync(file.filepath)

    // Trả URL tùy theo môi trường (production hoặc development)
    const baseUrl = env.BUILD_MODE === 'production'
      ? env.HOST
      : `http://localhost:${env.APP_PORT}`

    return {
      url: `${baseUrl}/static/${newName}.webp`,
      type: 'image'
    }
  }))

  return result
}

/**
 * Xử lý upload video: parse file → move từ temp sang uploads/videos → trả URL
 * Video không qua sharp (sharp chỉ xử lý ảnh)
 */
export const handleUploadVideoService = async (req) => {
  const files = await handleUploadVideo(req)

  const result = await Promise.all(files.map(async (file) => {
    const newName = getNameFromFullname(file.newFilename)
    const mimetype = file.mimetype || ''

    // Lấy extension từ mimetype (không dùng tên file gốc vì có thể bị sai, vd: ssstwitter.com → .com)
    const videoExt = mimetype.includes('mp4') ? '.mp4' : '.mov'
    const videoFileName = `${newName}${videoExt}`
    const newPath = path.resolve(UPLOAD_VIDEO_DIR, videoFileName)

    // Move file từ temp sang uploads/videos
    fs.renameSync(file.filepath, newPath)

    const baseUrl = env.BUILD_MODE === 'production'
      ? env.HOST
      : `http://localhost:${env.APP_PORT}`

    return {
      url: `${baseUrl}/v1/media/video-stream/${videoFileName}`,
      type: 'video'
    }
  }))

  return result
}
