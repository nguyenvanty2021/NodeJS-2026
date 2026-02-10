import express from 'express'
import { columnValidation } from '~/validations/column-validation'
import { columnController } from '~/controllers/column-controller'
import { authMiddleware } from '~/middlewares/auth-middleware'

const Router = express.Router()

Router.route('/')
  // phải pass validation trước sau đó mới đẩy qua controller
  .post(authMiddleware.isAuthorized, columnValidation.addNewColumn, columnController.addNewColumn)

Router.route('/:id')
  .put(authMiddleware.isAuthorized, columnValidation.updateColumn, columnController.updateColumn)
  .delete(authMiddleware.isAuthorized, columnValidation.deleteColumn, columnController.deleteColumn)

export const columnRoutes = Router
