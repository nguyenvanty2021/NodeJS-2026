import { handleUploadSingleImage, handleUploadVideoService } from '~/services/media-service'
import { UPLOAD_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { StatusCodes } from 'http-status-codes'
import mime from 'mime'
import path from 'path'
import fs from 'fs'

// Controller xử lý upload ảnh
export const uploadSingleImageController = async (req, res, next) => {
  const data = await handleUploadSingleImage(req)

  return res.json({
    message: 'Upload image successfully',
    data
  })
}

// Controller xử lý upload video
export const uploadVideoController = async (req, res, next) => {
  const data = await handleUploadVideoService(req)

  return res.json({
    message: 'Upload video successfully',
    data
  })
}

// Controller trả về file ảnh tĩnh theo tên
export const getStaticImageController = async (req, res, next) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_DIR, name), (err) => {
    if (err) {
      res.status(err.status).send('Not found')
    }
  })
}

/**
 * Controller stream video — phục vụ việc XEM video đã upload
 *
 * Công dụng chính: Cho phép client (browser, app) xem/phát video đã upload trên server.
 *
 * Tại sao cần streaming thay vì dùng express.static như ảnh?
 * - Ảnh nhẹ (vài MB) → express.static tải hết 1 lần rồi hiển thị → OK
 * - Video nặng (100MB, 1GB...) → nếu tải hết mới phát thì quá lâu
 * - User có thể chỉ xem 30 giây rồi tắt → tải hết = lãng phí bandwidth
 * - User muốn tua đến phút thứ 5 → không stream thì phải chờ tải từ đầu
 *
 * Giải pháp: Stream video bằng Range header
 * - Server gửi từng chunk nhỏ (1MB) thay vì gửi toàn bộ file
 * - Browser phát ngay khi nhận chunk đầu tiên (không chờ tải hết)
 * - Tua/seek tự do: browser gửi Range mới → server trả đúng phần cần xem
 *
 * Hỗ trợ 2 chế độ:
 * 1. Không có Range header → trả về TOÀN BỘ video (200 OK)
 *    Ví dụ: paste URL vào browser, browser download toàn bộ file rồi phát
 * 2. Có Range header → trả về TỪNG PHẦN video (206 Partial Content)
 *    Ví dụ: thẻ <video> trong HTML, player gửi Range header để stream từng chunk
 *    Cho phép tua, seek mà không cần tải toàn bộ file
 */
export const serveVideoStreamController = (req, res, next) => {
  // Lấy tên file video từ URL params (vd: /video-stream/abc123.mp4 → name = 'abc123.mp4')
  const { name } = req.params

  // Tạo đường dẫn tuyệt đối đến file video trong folder uploads/videos
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)

  // fs.statSync: lấy thông tin file → .size = dung lượng file (bytes)
  // Ví dụ: video 5MB → videoSize = 5,000,000 bytes
  // 1MB = 10^6 bytes (hệ 10, hiển thị trên UI) | 1MB = 2^20 bytes (hệ nhị phân, 1024 * 1024)
  const videoSize = fs.statSync(videoPath).size

  // mime.getType: xác định Content-Type từ đuôi file
  // Ví dụ: .mp4 → 'video/mp4', .mov → 'video/quicktime'
  // Nếu không xác định được → fallback 'video/*'
  const contentType = mime.getType(videoPath) || 'video/*'

  // Range header: trình duyệt gửi kèm request để chỉ định muốn nhận phần nào của file
  // Ví dụ: Range: bytes=0- (bắt đầu từ byte 0), Range: bytes=1000000- (bắt đầu từ byte 1MB)
  const range = req.headers.range

  // TRƯỜNG HỢP 1: Không có Range header
  // Khi paste URL trực tiếp vào browser → browser không gửi Range header
  // → Trả về toàn bộ video (200 OK), browser tự download rồi phát
  if (!range) {
    const headers = {
      'Content-Length': videoSize, // Cho browser biết tổng dung lượng file
      'Content-Type': contentType // Cho browser biết đây là video để phát đúng
    }
    // 200 OK: trả về toàn bộ nội dung
    res.writeHead(StatusCodes.OK, headers)
    // fs.createReadStream: đọc file video thành stream (không load toàn bộ file vào RAM)
    // .pipe(res): đẩy dữ liệu từ stream file → response (gửi về client)
    const videoStream = fs.createReadStream(videoPath)
    return videoStream.pipe(res)
  }

  // TRƯỜNG HỢP 2: Có Range header (thẻ <video>, player hỗ trợ streaming)
  // Stream từng chunk nhỏ (1MB) thay vì gửi toàn bộ file
  // → Cho phép tua, seek video mà không cần tải hết file

  // Mỗi lần request, server chỉ gửi 1MB (10^6 bytes = 1,000,000 bytes)
  const CHUNK_SIZE = 10 ** 6 // 1MB

  // Lấy vị trí bắt đầu từ Range header
  // range = 'bytes=1000000-' → replace hết ký tự không phải số → '1000000' → Number = 1000000
  const start = Number(range.replace(/\D/g, ''))

  // Vị trí kết thúc = bắt đầu + 1MB, nhưng không vượt quá cuối file
  // Math.min đảm bảo end không vượt quá videoSize - 1 (index cuối cùng)
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1)

  // Dung lượng chunk thực tế (bytes)
  // Ví dụ: start=0, end=999999 → contentLength = 1,000,000 (1MB)
  const contentLength = end - start + 1

  const headers = {
    // Content-Range: cho browser biết đang nhận phần nào / tổng dung lượng
    // Ví dụ: 'bytes 0-999999/5000000' = nhận byte 0-999999 trong tổng 5MB
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    // Accept-Ranges: cho browser biết server hỗ trợ Range request
    'Accept-Ranges': 'bytes',
    // Content-Length: dung lượng chunk đang gửi (không phải tổng file)
    'Content-Length': contentLength,
    // Content-Type: loại video
    'Content-Type': contentType
  }

  // 206 Partial Content: HTTP status code cho biết chỉ trả 1 phần nội dung
  // Browser/player sẽ tự động request tiếp các phần còn lại khi cần (tua, phát tiếp)
  res.writeHead(StatusCodes.PARTIAL_CONTENT, headers)

  // Đọc file video từ vị trí start → end (chỉ đọc 1MB, không load toàn bộ file)
  // Ví dụ: createReadStream(path, { start: 0, end: 999999 }) → đọc 1MB đầu tiên
  const videoStream = fs.createReadStream(videoPath, { start, end })
  // Pipe: đẩy chunk từ file stream → response → gửi về client
  videoStream.pipe(res)
}