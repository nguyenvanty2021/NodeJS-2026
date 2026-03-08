import fs from 'fs'
import { UPLOAD_TEMP_DIR } from '~/constants/dir'

/**
 * Khởi tạo folder uploads/temp nếu chưa tồn tại
 * Gọi 1 lần khi server khởi động (trong server.js)
 */
export const initFolder = () => {
  if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
    fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true })
  }
}

/**
 * Parse file upload từ request bằng formidable
 * @param {Request} req - Express request object
 * @returns {Promise<Array>} Mảng PersistentFile đã upload
 */
export const hanldeUploadSingleImage = async (req) => {
  const formidable = (await import('formidable')).default

  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIR,
    maxFiles: 4,
    // Giữ nguyên phần mở rộng file gốc (.jpg, .png, .doc...)
    // Nếu true: file lưu là 'abc123.jpg' | Nếu false: file lưu là 'abc123' (không có đuôi)
    keepExtensions: true,
    maxFileSize: 10000 * 1024, // 10MB
    // nếu không check filter thì upload được tất cả file bao gồm: pdf, json, jpg, png,...
    filter: function ({ name, originalFilename, mimetype }) {
      // Kiểm tra 2 điều kiện:
      // 1. name === 'image': key trong form-data phải đặt tên là 'image' (không phải 'file', 'photo',...)
      // 2. mimetype?.includes('image/'): loại file phải là ảnh (image/jpeg, image/png, image/webp,...)
      // Cả 2 điều kiện đều đúng thì valid = true, ngược lại valid = false → reject file
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error', new Error('File type is not valid'))
      }
      return valid
    }
  })

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      // run api nhưng chưa truyền file
      if (!Boolean(files.image)) return reject(new Error('File is required'))
      resolve(files.image)
    })
  })
}

/**
 * Lấy tên file không có phần mở rộng
 * Ví dụ: 'photo.jpeg' → 'photo', 'my.photo.png' → 'myphoto'
 */
export const getNameFromFullname = (fullname) => {
  const namearr = fullname.split('.')
  namearr.pop()
  return namearr.join('')
}
