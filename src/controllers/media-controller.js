import { handleUploadSingleImage } from '~/services/media-service'
import { UPLOAD_DIR } from '~/constants/dir'
import path from 'path'

// Controller xử lý upload ảnh
export const uploadSingleImageController = async (req, res, next) => {
  const data = await handleUploadSingleImage(req)

  return res.json({
    message: 'Upload image successfully',
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