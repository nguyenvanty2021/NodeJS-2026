import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import { videoStatusModel } from '~/models/video-status-model'
import { EncodingStatus } from '~/utils/constants'
import { getNameFromFullname } from '~/utils/file'
import fs from 'fs/promises'

/**
 * Hàng đợi (Queue) xử lý encode video HLS — dạng function (không dùng class)
 *
 * ==================== NGUYÊN LÝ HOẠT ĐỘNG CỦA QUEUE ====================
 *
 * Queue (hàng đợi) là pattern xử lý tác vụ TUẦN TỰ, gồm 4 bước cốt lõi:
 *   ① Tạo biến global (state)      → let items = [], let processing = false
 *   ② Push data vào hàng đợi       → items.push(item)
 *   ③ Xử lý item đầu tiên + KHÓA  → processing = true → xử lý items[0]
 *   ④ Xong → MỞ KHÓA → ĐỆ QUY     → processing = false → gọi lại chính nó
 *
 * Pattern này dùng ở nhiều nơi, không chỉ encode video:
 *   - Gửi email hàng loạt     → push emails vào queue → gửi 1 email/lần
 *   - Resize ảnh               → push images vào queue → resize 1 ảnh/lần
 *   - Push notification        → push user IDs → gửi 1 notification/lần
 *   - Import CSV               → push file paths → parse 1 file/lần
 *
 * Ở production, thường dùng thư viện chuyên nghiệp hơn:
 *   - BullMQ, Bull: queue cho Node.js (hỗ trợ retry, persist, monitor)
 *   - RabbitMQ, Redis Queue: distributed queue (chạy trên nhiều server)
 *   → Các thư viện này vẫn dùng CÙNG NGUYÊN LÝ, chỉ thêm tính năng nâng cao
 *
 * Lưu ý: Biến state (items, encoding) tồn tại suốt đời server
 *   - Nếu server restart → mất hết data trong queue (video chưa encode sẽ mất)
 *   - Muốn persist qua restart → cần lưu queue vào DB hoặc dùng BullMQ + Redis
 *
 * ==================== ÁP DỤNG CHO ENCODE VIDEO HLS ====================
 *
 * Tại sao cần Queue?
 * - Encode HLS rất tốn CPU + RAM (ffmpeg re-encode video sang nhiều resolution)
 * - Nếu 10 user upload cùng lúc → 10 ffmpeg chạy song song → server quá tải, crash
 * - Queue đảm bảo chỉ encode 1 video tại 1 thời điểm, các video khác xếp hàng chờ
 *
 * ==================== FLOW CHẠY CHI TIẾT (Debug) ====================
 *
 * Ví dụ: User upload 2 video liên tiếp (video1 trước, video2 sau 10 giây)
 *
 * ── Upload video 1 ──
 * enqueue('video1.mp4')
 *   → items.push('video1.mp4')            // items = ['video1.mp4']
 *   → processEncode()
 *       → encoding = false → KHÔNG return
 *       → items.length = 1 > 0 → vào if
 *       → encoding = true                 // 🔒 KHÓA LẠI
 *       → videoPath = items[0] = 'video1.mp4'
 *       → await encodeHLS(videoPath)       // ⏳ ĐANG ENCODE (3 phút)...
 *
 * ── Upload video 2 (trong lúc video 1 đang encode) ──
 * enqueue('video2.mp4')
 *   → items.push('video2.mp4')            // items = ['video1.mp4', 'video2.mp4']
 *   → processEncode()
 *       → encoding = true → RETURN NGAY!  // ❌ Video 2 chỉ nằm chờ trong items
 *
 * ── 3 phút sau: Video 1 encode xong ──
 *       → await encodeHLS(videoPath) XONG  // ✅ Encode video 1 hoàn thành
 *       → items.shift()                    // items = ['video2.mp4'] (xóa video1)
 *       → fs.unlink(videoPath)             // Xóa file video1.mp4 gốc
 *       → log 'Encode video1 success'
 *       → encoding = false                // 🔓 MỞ KHÓA
 *       → processEncode()                 // ← GỌI LẠI CHÍNH NÓ (đệ quy)
 *
 * ── processEncode() lần 2: Xử lý video 2 ──
 *       → encoding = false → KHÔNG return
 *       → items.length = 1 > 0 → vào if
 *       → encoding = true                 // 🔒 KHÓA LẠI
 *       → videoPath = items[0] = 'video2.mp4'
 *       → await encodeHLS(videoPath)       // ⏳ ĐANG ENCODE VIDEO 2 (3 phút)...
 *       → items.shift()                    // items = []
 *       → fs.unlink(videoPath)             // Xóa file video2.mp4 gốc
 *       → log 'Encode video2 success'
 *       → encoding = false                // 🔓 MỞ KHÓA
 *       → processEncode()                 // ← GỌI LẠI LẦN NỮA
 *
 * ── processEncode() lần 3: Hàng đợi rỗng ──
 *       → encoding = false → KHÔNG return
 *       → items.length = 0 → vào else
 *       → log 'Encode video queue is empty' // ✅ DỪNG, không gọi đệ quy nữa
 *
 * ==================== TÓM TẮT ====================
 * Chìa khóa: biến "encoding" hoạt động như ổ khóa (lock)
 *   - encoding = true  → 🔒 đang encode, video mới chỉ nằm chờ trong items
 *   - encoding = false → 🔓 rảnh, lấy video tiếp theo ra encode
 *   - processEncode() gọi lại chính nó (đệ quy) sau mỗi video → xử lý hết hàng đợi
 */

// Dùng closure để giữ state (thay vì this.items, this.encoding trong class)
//
// Tại sao 2 biến này KHÔNG bị reset lại data?
// → Vì chúng nằm NGOÀI function (module scope), không nằm trong function
// → Node.js chỉ chạy file queue.js MỘT LẦN DUY NHẤT khi import lần đầu
// → Sau đó các lần import tiếp theo đều dùng lại kết quả đã cache
// → Nên items và encoding được tạo 1 lần, tồn tại trong bộ nhớ SUỐT ĐỜI SERVER
//
// So sánh:
//   Biến trong function → tạo MỚI mỗi lần gọi function → mất data sau khi return
//   Biến ngoài function (module scope) → tạo 1 lần → giữ data mãi mãi
//
// items: mảng chứa đường dẫn video cần encode (tích lũy qua các lần upload)
// encoding: cờ đánh dấu đang encode hay không (tránh chạy song song)
let items = []
let encoding = false

// Thêm video vào hàng đợi
// Ví dụ: enqueue('/uploads/videos/abc123/abc123.mp4')
const enqueue = async (item) => {
  items.push(item)

  // Lấy tên video từ đường dẫn (bỏ extension)
  // Ví dụ: '/uploads/videos/abc123/abc123.mp4' → 'abc123'
  const idName = getNameFromFullname(item.split('/').pop())

  // Lưu vào DB với status = Pending (đang chờ trong hàng đợi)
  await videoStatusModel.insertOne({ name: idName, status: EncodingStatus.PENDING })

  console.log(`Enqueue video: ${item}. Queue length: ${items.length}`)
  // Tự động bắt đầu xử lý nếu chưa có video nào đang encode
  processEncode()
}

// Xử lý encode từng video trong hàng đợi (1 video tại 1 thời điểm)
const processEncode = async () => {
  // Nếu đang encode video khác → return, chờ video đó xong rồi sẽ gọi lại
  if (encoding) return

  // Nếu hàng đợi còn video cần encode
  if (items.length > 0) {
    // Đánh dấu đang encode (ngăn video khác chen vào)
    encoding = true

    // Lấy video đầu tiên trong hàng đợi (FIFO: First In First Out)
    const videoPath = items[0]

    // Lấy tên video để update status trong DB
    const idName = getNameFromFullname(videoPath.split('/').pop())

    // Update status → Processing (đang encode)
    await videoStatusModel.updateStatusByName(idName, EncodingStatus.PROCESSING)

    try {
      // Encode HLS: convert video gốc → multi-resolution (.ts chunks + .m3u8 playlists)
      // Quá trình này mất vài phút tùy dung lượng video
      await encodeHLSWithMultipleVideoStreams(videoPath)

      // Encode xong → xóa video đầu tiên khỏi hàng đợi
      items.shift()

      // Xóa file video gốc (chỉ giữ lại HLS segments .ts và .m3u8)
      await fs.unlink(videoPath)

      // Update status → Success (encode thành công)
      await videoStatusModel.updateStatusByName(idName, EncodingStatus.SUCCESS)

      console.log(`Encode video ${videoPath} success`)
    } catch (error) {
      // Update status → Failed (encode thất bại)
      await videoStatusModel.updateStatusByName(idName, EncodingStatus.FAILED)

      console.error(`Encode video ${videoPath} error`)
      console.error(error)
    }

    // Đánh dấu encode xong
    encoding = false

    // Gọi lại processEncode() để xử lý video tiếp theo trong hàng đợi (đệ quy)
    // Nếu hàng đợi rỗng → sẽ vào nhánh else và dừng
    processEncode()
  } else {
    // Hàng đợi rỗng, không còn video cần encode
    console.log('Encode video queue is empty')
  }
}

export { enqueue, processEncode }
