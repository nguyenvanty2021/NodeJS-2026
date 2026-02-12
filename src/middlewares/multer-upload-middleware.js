import multer from 'multer'
import { LIMIT_COMMON_FILE_SIZE, ALLOW_COMMON_FILE_TYPES } from '~/utils/validators'
import { StatusCodes } from 'http-status-codes'
import { ApiError } from '~/utils/api-error'

/** Hầu hết những thứ bên dưới đều có ở docs của multer, chỉ là anh tổ chức lại sao cho khoa học và gọn
 * gàng nhất có thể
 * https://www.npmjs.com/package/multer
 *
 * Multer là middleware dùng để xử lý upload file (multipart/form-data) trong Express
 * - Express mặc định KHÔNG parse được file upload, cần multer để làm việc này
 * - Multer sẽ parse file từ request, validate (kiểu file, kích thước), rồi đưa vào req.file (single) hoặc req.files (multiple)
 * - Flow: Client gửi file → Multer parse & validate → Controller nhận req.file → Upload lên Cloudinary
 */

// Function Kiểm tra loại file nào được chấp nhận
const customFileFilter = (req, file, callback) => {
  // eslint-disable-next-line no-console
  console.log('Multer File: ', file)

  // Đối với thằng multer, kiểm tra kiểu file thì sử dụng mimetype
  if (!ALLOW_COMMON_FILE_TYPES.includes(file.mimetype)) {
    const errMessage = 'File type is invalid. Only accept jpg, jpeg, webp and png'
    return callback(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errMessage), null)
  }

  // Nếu như kiểu file hợp lệ:
  return callback(null, true) // callback(null, true) cho phép upload file
}

const upload = multer({
  limits: { fileSize: LIMIT_COMMON_FILE_SIZE },
  fileFilter: customFileFilter
})

export const multerUploadMiddleware = { upload }
