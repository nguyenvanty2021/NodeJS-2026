import express from 'express'
import { mediaController } from '~/controllers/media-controller'

const Router = express.Router()

Router.route('/upload_avatar')
  .post(mediaController.uploadAvatar)

export const mediaRoutes = Router
