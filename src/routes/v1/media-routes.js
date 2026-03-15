import express from 'express'
import {
  uploadSingleImageController,
  getStaticImageController,
  uploadVideoController,
  serveVideoStreamController,
  uploadVideoHLSController,
  serveVideoHLSController,
  getVideoStatusController
} from '~/controllers/media-controller'

const Router = express.Router()

// ============================ IMAGE ============================

// Upload ảnh (form-data key: 'image', max 4 files, 10MB/file)
// Công dụng: User tải ảnh lên → server convert sang WebP (nhẹ hơn) → lưu vào uploads/images/
// Trả về URL ảnh tĩnh để hiển thị (vd: avatar, banner, thumbnail)
Router.route('/upload_file').post(uploadSingleImageController)

// Lấy ảnh tĩnh theo tên (ví dụ: /static/abc123.webp)
// Công dụng: Khi user/browser cần hiển thị ảnh → request URL này → server trả file ảnh
// Ảnh nhẹ (vài MB) nên tải hết 1 lần rồi hiển thị → OK, không cần streaming
Router.route('/static/:name').get(getStaticImageController)

// ============================ VIDEO (Stream thường) ============================

// Upload video thường (form-data key: 'video', max 1 file, 50MB)
// Công dụng: User tải video lên → server lưu file gốc vào uploads/videos/
// Trả về URL video-stream để phát video
// Ưu điểm: Đơn giản, nhanh (không cần encode)
// Nhược điểm: Chỉ có 1 chất lượng (file gốc), không hỗ trợ multi-quality
Router.route('/upload_video').post(uploadVideoController)

// Stream video theo tên (ví dụ: /video-stream/abc123.mp4)
// Công dụng: Phát video đã upload, hỗ trợ Range header để tua/seek
// So với tải file thường (express.static): đã CẢI TIẾN bằng cách chia chunk 1MB
//   - Phát ngay khi có chunk đầu (không chờ tải hết)
//   - Tua tự do bằng Range header (không cần tải từ đầu)
//   - Tiết kiệm bandwidth (chỉ tải phần đang xem)
// Nhược điểm so với HLS: CHỈ CÓ 1 CHẤT LƯỢNG (file gốc)
//   - Mạng chậm → video giật, không tự hạ quality
//   - Không có adaptive bitrate (720p/1080p tự chuyển)
Router.route('/video-stream/:name').get(serveVideoStreamController)

// ============================ VIDEO HLS (Streaming nâng cao) ============================

// Upload video HLS (form-data key: 'video', max 1 file, 50MB)
// Công dụng: User tải video lên → server encode thành NHIỀU CHẤT LƯỢNG (720p, 1080p, 1440p)
// bằng ffmpeg → chia thành chunks nhỏ (.ts, mỗi chunk ~6 giây) + playlist (.m3u8)
// HLS = HTTP Live Streaming, chuẩn của Apple, dùng bởi YouTube, Netflix, Facebook
// Ưu điểm so với video-stream thường:
//   ✅ Multi-quality: có 720p, 1080p, 1440p
//   ✅ Adaptive bitrate: mạng nhanh → 1080p, mạng chậm → tự hạ 720p (không giật)
//   ✅ Chunks 6 giây: phát ngay, tua tự do, tiết kiệm bandwidth
// Nhược điểm: Encode lâu (vài phút), tốn dung lượng lưu trữ (nhiều quality)
Router.route('/upload_video_hls').post(uploadVideoHLSController)

// Serve file HLS (.m3u8 playlist và .ts segments)
// Công dụng: Player request file HLS để phát video multi-quality
// Dùng catch-all param /*path vì HLS có nhiều level path lồng nhau:
// (Express 5 dùng path-to-regexp v8, cú pháp catch-all: /*tên_param)
//   /video-hls/abc123/master.m3u8           → req.params.path = ['abc123', 'master.m3u8']
//   /video-hls/abc123/v0/prog_index.m3u8    → req.params.path = ['abc123', 'v0', 'prog_index.m3u8']
//   /video-hls/abc123/v0/fileSequence0.ts   → req.params.path = ['abc123', 'v0', 'fileSequence0.ts']
// Nếu dùng :param bình thường (vd: /video-hls/:name) thì chỉ match được 1 level, không match nested path
// /*path = "bắt tất cả level" → match bao nhiêu level cũng được, trả về mảng các segment
Router.get('/video-hls/*path', serveVideoHLSController)

// Lấy trạng thái encode video HLS theo tên (id)
// Công dụng: Frontend gọi API này để biết video encode xong chưa
// Ví dụ: GET /video-status/abc123 → { name: 'abc123', status: 'success' }
// Các trạng thái: pending (chờ) → processing (đang encode) → success (xong) / failed (lỗi)
Router.route('/video-status/:id').get(getVideoStatusController)

export const mediaRoutes = Router
