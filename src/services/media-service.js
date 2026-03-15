import { hanldeUploadSingleImage, handleUploadVideo, getNameFromFullname } from '~/utils/file'
import { UPLOAD_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { env } from '~/config/environment'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { handleUploadVideoHLS } from '~/utils/file'
import { enqueue } from '~/utils/queue'
import { videoStatusModel } from '~/models/video-status-model'

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

/**
 * Xử lý upload video HLS: parse file → encode HLS (multi-resolution) → xóa file tạm → trả URL master.m3u8
 *
 * Flow:
 * 1. Upload video → lưu vào uploads/videos/temp/abc123.mp4
 * 2. Tạo folder riêng theo tên video: uploads/videos/abc123/
 * 3. Copy file gốc vào folder đó: uploads/videos/abc123/abc123.mp4
 * 4. Encode HLS → tạo segments trong uploads/videos/abc123/
 *    ├── master.m3u8 (playlist chính)
 *    ├── v0/prog_index.m3u8 (720p playlist)
 *    ├── v0/fileSequence0.ts (720p chunk)
 *    └── ...
 * 5. Xóa file gốc (.mp4) sau khi encode xong
 * 6. Trả URL: http://localhost:8017/v1/media/video-hls/abc123/master.m3u8
 */
export const handleUploadVideoHLSService = async (req) => {
  const files = await handleUploadVideoHLS(req)

  const result = await Promise.all(files.map(async (file) => {
    const newName = getNameFromFullname(file.newFilename)

    // Tạo folder riêng cho mỗi video (chứa file HLS segments)
    // Ví dụ: uploads/videos/abc123/
    const videoFolder = path.resolve(UPLOAD_VIDEO_DIR, newName)
    if (!fs.existsSync(videoFolder)) {
      fs.mkdirSync(videoFolder, { recursive: true })
    }

    // Copy file gốc từ temp vào folder video
    // Ví dụ: uploads/videos/temp/abc123.mp4 → uploads/videos/abc123/abc123.mp4
    const mimetype = file.mimetype || ''
    const videoExt = mimetype.includes('mp4') ? '.mp4' : '.mov'
    const videoFilePath = path.resolve(videoFolder, `${newName}${videoExt}`)
    fs.renameSync(file.filepath, videoFilePath)

    // Encode HLS (HTTP Live Streaming) — convert video gốc thành nhiều phiên bản chất lượng khác nhau
    //
    // HLS là gì? Là chuẩn streaming của Apple, được dùng rộng rãi (YouTube, Netflix, Facebook...)
    // Thay vì gửi 1 file video lớn, HLS chia video thành nhiều đoạn nhỏ (.ts, mỗi đoạn ~6 giây)
    // và tạo file playlist (.m3u8) để player biết load đoạn nào tiếp theo
    //
    // Adaptive Bitrate: tùy tốc độ mạng của user, player tự chọn chất lượng phù hợp
    // - Mạng nhanh → xem 1080p
    // - Mạng chậm → tự hạ xuống 720p (không bị buffer/giật)
    //
    // Sau khi encode xong, folder video sẽ có cấu trúc:
    // uploads/videos/abc123/
    // ├── master.m3u8          ← playlist chính (chứa link đến các quality)
    // ├── v0/prog_index.m3u8   ← playlist 720p
    // ├── v0/fileSequence0.ts  ← chunk 720p (6 giây đầu)
    // ├── v0/fileSequence1.ts  ← chunk 720p (6 giây tiếp)
    // ├── v1/prog_index.m3u8   ← playlist 1080p (nếu video gốc >= 1080p)
    // ├── v1/fileSequence0.ts  ← chunk 1080p
    // └── ...
    //
    // Quá trình encode khá lâu (vài phút tùy dung lượng video) vì ffmpeg phải:
    // 1. Đọc toàn bộ video gốc
    // 2. Re-encode sang nhiều resolution (720p, 1080p, 1440p)
    // 3. Chia thành từng segment .ts (mỗi segment ~6 giây)
    // 4. Tạo file playlist .m3u8 cho từng resolution + master playlist
    //
    // → Dùng Queue để encode ở background, không bắt user chờ:
    // Thêm video vào hàng đợi (Queue) để encode HLS ở background
    // Không await ở đây → API trả response ngay lập tức, không bắt user chờ encode (vài phút)
    // ẩn 2 dòng 147 và 148 vì đã dùng enqueue
    // await encodeHLSWithMultipleVideoStreams(videoFilePath)
    // fs.unlinkSync(videoFilePath)
    // Queue xử lý tuần tự (1 video tại 1 thời điểm) để tránh server quá tải:
    //   Upload video 1 → enqueue → encode → xong
    //   Upload video 2 → enqueue → chờ video 1 xong → encode → xong
    //   Upload video 3 → enqueue → chờ video 2 xong → encode → xong
    //
    // Sau khi encode xong, queue tự động:
    //   1. Convert video gốc → HLS multi-resolution (720p, 1080p, 1440p)
    //   2. Xóa file video gốc (chỉ giữ HLS segments)
    //   3. Log kết quả (thành công / lỗi)
    enqueue(videoFilePath)

    const baseUrl = env.BUILD_MODE === 'production'
      ? env.HOST
      : `http://localhost:${env.APP_PORT}`

    return {
      // Trả URL trỏ đến master.m3u8 — file playlist chính (giống "mục lục" của video)
      // master.m3u8 chứa danh sách tất cả quality có sẵn (720p, 1080p,...)
      // Player chỉ cần URL này, nó sẽ tự tìm các file còn lại:
      //   1. Player request master.m3u8 → đọc danh sách quality
      //   2. Player chọn quality phù hợp (vd: 1080p) → request v1/prog_index.m3u8
      //   3. Player đọc playlist 1080p → request từng chunk .ts để phát
      //   4. Nếu mạng chậm → tự chuyển sang quality thấp hơn (720p)
      // Tên "master.m3u8" do ffmpeg tự đặt (option -master_pl_name trong video.js)
      url: `${baseUrl}/v1/media/video-hls/${newName}/master.m3u8`,
      type: 'hls'
    }
  }))

  return result
}

/**
 * Lấy trạng thái encode video HLS theo tên (id)
 * Frontend gọi API này để biết video đang ở trạng thái nào: pending / processing / success / failed
 * Ví dụ: GET /v1/media/video-status/abc123 → { name: 'abc123', status: 'processing' }
 */
export const getVideoStatusService = async (id) => {
  const result = await videoStatusModel.findByName(id)
  return result
}
