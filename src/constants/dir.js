import path from 'path'

// Đường dẫn tuyệt đối đến folder lưu file tạm (formidable lưu file vào đây trước khi xử lý)
export const UPLOAD_TEMP_DIR = path.resolve('uploads/temp')

// Đường dẫn tuyệt đối đến folder lưu file đã xử lý (sharp output)
export const UPLOAD_DIR = path.resolve('uploads')

// Đường dẫn tuyệt đối đến folder lưu video
export const UPLOAD_VIDEO_DIR = path.resolve('uploads/videos')
