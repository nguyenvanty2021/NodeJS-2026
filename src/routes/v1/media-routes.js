import express from 'express'
import {
  uploadSingleImageController,
  getStaticImageController,
  uploadVideoController,
  serveVideoStreamController
} from '~/controllers/media-controller'

const Router = express.Router()

// Upload ảnh (form-data key: 'image', max 4 files, 10MB/file)
Router.route('/upload_file')
  .post(uploadSingleImageController)

// Upload video (form-data key: 'video', max 1 file, 50MB)
Router.route('/upload_video')
  .post(uploadVideoController)

// Lấy ảnh tĩnh theo tên (ví dụ: /static/abc123.webp)
Router.route('/static/:name')
  .get(getStaticImageController)

// Stream video theo tên (ví dụ: /video-stream/abc123.mp4) - hỗ trợ Range header, tua video
Router.route('/video-stream/:name')
  .get(serveVideoStreamController)

export const mediaRoutes = Router
