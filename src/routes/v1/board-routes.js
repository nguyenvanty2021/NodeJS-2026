import express from 'express'
import { boardValidation } from '~/validations/board-validation'
import { boardController } from '~/controllers/board-controller'
import { authMiddleware } from '~/middlewares/auth-middleware'

const Router = express.Router()

Router.route('/')
  .get(authMiddleware.isAuthorized, boardController.getAllBoard)
  // phải pass validation trước sau đó mới đẩy qua controller
  .post(authMiddleware.isAuthorized, boardValidation.addNewBoard, boardController.addNewBoard)

Router.route('/:id')
  .get(authMiddleware.isAuthorized, boardController.getBoardById)
  .put(authMiddleware.isAuthorized, boardValidation.updateBoard, boardController.updateBoard)

export const boardRoutes = Router
