import formidable from 'formidable'

export const uploadSingleImageController = async (req, res, next) => {
  const form = formidable({})

  return res.json({
    message: 'Upload image successfully'
  })
}
