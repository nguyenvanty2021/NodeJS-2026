import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardValidation } from '~/validations/board-validation'
import { boardController } from '~/controllers/board-controller'

const Router = express.Router()

Router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({ message: 'GET: API get list boards' })
  })
  // phải pass validation trước sau đó mới đẩy qua controller
  .post(boardValidation.addNewBoard, boardController.addNewBoard)

Router.route('/:id')
  .get(boardController.getBoardById)
  // .put() // update - sẽ thêm handler sau

export const boardRoutes = Router
