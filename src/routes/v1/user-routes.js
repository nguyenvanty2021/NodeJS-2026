import express from 'express'
import { userValidation } from '~/validations/user-validation'
import { userController } from '~/controllers/user-controller'

const Router = express.Router()

Router.route('/register')
  // phải pass validation trước sau đó mới đẩy qua controller
  .post(userValidation.register, userController.register)

export const userRoutes = Router
