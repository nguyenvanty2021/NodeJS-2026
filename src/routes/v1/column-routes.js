import express from 'express'
import { columnValidation } from '~/validations/column-validation'
import { columnController } from '~/controllers/column-controller'

const Router = express.Router()

Router.route('/')
  // phải pass validation trước sau đó mới đẩy qua controller
  .post(columnValidation.addNewColumn, columnController.addNewColumn)

Router.route('/:id')
  .put(columnValidation.updateColumn, columnController.updateColumn)

export const columnRoutes = Router
