import express from 'express'
import { cardValidation } from '~/validations/card-validation'
import { cardController } from '~/controllers/card-controller'
import { authMiddleware } from '~/middlewares/auth-middleware'
import { multerUploadMiddleware } from '~/middlewares/multer-upload-middleware'
const Router = express.Router()

Router.route('/')
  // phải pass validation trước sau đó mới đẩy qua controller
  .post(authMiddleware.isAuthorized, cardValidation.addNewCard, cardController.addNewCard)


Router.route('/:id')
  .put(authMiddleware.isAuthorized, multerUploadMiddleware.upload.single('cardCover'), cardValidation.updateCard, cardController.updateCard)

export const cardRoutes = Router
