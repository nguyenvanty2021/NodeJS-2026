import express from 'express'
import { boardValidation } from '~/validations/board-validation'
import { boardController } from '~/controllers/board-controller'

const Router = express.Router()

Router.route('/')
  .get(boardController.getAllBoard)
  // phải pass validation trước sau đó mới đẩy qua controller
  .post(boardValidation.addNewBoard, boardController.addNewBoard)

Router.route('/:id')
  .get(boardController.getBoardById)
  // .put() // update - sẽ thêm handler sau

export const boardRoutes = Router
