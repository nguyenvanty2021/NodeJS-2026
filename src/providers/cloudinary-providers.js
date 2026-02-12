// Import thư viện cloudinary SDK - dùng để tương tác với dịch vụ lưu trữ ảnh/video Cloudinary
import cloudinary from 'cloudinary'
// Import thư viện streamifier - dùng để chuyển Buffer (dữ liệu file trong bộ nhớ) thành Readable Stream
import streamifier from 'streamifier'
// Import biến môi trường từ file config
import { env } from '~/config/environment'

/**
 * Tài liệu tham khảo
 * https://cloudinary.com/blog/node_js_file_upload_to_a_local_server_or_to_the_cloud
 */

// Bước cấu hình cloudinary, sử dụng v2 - version 2 (phiên bản mới nhất, được khuyến khích sử dụng)
const cloudinaryV2 = cloudinary.v2
// Khởi tạo kết nối tới tài khoản Cloudinary bằng 3 thông tin xác thực từ biến môi trường
cloudinaryV2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME, // Tên cloud của bạn trên Cloudinary
  api_key: env.CLOUDINARY_API_KEY, // Khóa API công khai
  api_secret: env.CLOUDINARY_CLOUD_SECRET // Khóa API bí mật
})

// Khởi tạo một cái function để thực hiện upload file lên Cloudinary
// fileBuffer: dữ liệu file dạng Buffer từ multer (file lưu trong RAM, không lưu ra ổ cứng)
// folderName: tên folder trên Cloudinary để lưu file vào
const streamUpload = (fileBuffer, folderName) => {
  // Trả về một Promise vì quá trình upload là bất đồng bộ (async), cho phép dùng await khi gọi function này
  return new Promise((resolve, reject) => {
    // Tạo một cái luồng upload (writable stream) lên cloudinary
    // { folder: folderName } - chỉ định folder đích trên Cloudinary
    // (err, result) - callback xử lý kết quả sau khi upload xong
    const stream = cloudinaryV2.uploader.upload_stream({ folder: folderName }, (err, result) => {
      if (err) reject(err) // Nếu có lỗi thì reject (Promise thất bại)
      else resolve(result) // Nếu thành công thì resolve trả về thông tin file đã upload (URL, public_id, size...)
    })
    // Chuyển Buffer thành Readable Stream rồi pipe (đẩy dữ liệu) vào luồng upload Cloudinary
    // Flow: Buffer (file) → Readable Stream → pipe → Upload Stream (Cloudinary)
    streamifier.createReadStream(fileBuffer).pipe(stream)
  })
}

// Export object CloudinaryProvider chứa function streamUpload để các file khác có thể import và sử dụng
export const CloudinaryProvider = { streamUpload }
