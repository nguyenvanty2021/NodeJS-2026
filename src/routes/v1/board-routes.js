import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardValidation } from '~/validations/board-validation'
import { boardController } from '~/controllers/board-controller'

const Router = express.Router()

Router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({ message: 'GET: API get list boards' })
  })
  .post(boardValidation.addNewBoard, boardController.addNewBoard)

export const boardRoutes = Router
