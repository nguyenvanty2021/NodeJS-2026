import express from 'express'
import { uploadSingleImageController, getStaticImageController } from '~/controllers/media-controller'

const Router = express.Router()

Router.route('/upload_file')
  .post(uploadSingleImageController)

Router.route('/static/:name')
  .get(getStaticImageController)

export const mediaRoutes = Router
