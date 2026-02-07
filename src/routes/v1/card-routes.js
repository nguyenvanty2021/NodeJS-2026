import express from 'express'
import { cardValidation } from '~/validations/card-validation'
import { cardController } from '~/controllers/card-controller'

const Router = express.Router()

Router.route('/')
  // phải pass validation trước sau đó mới đẩy qua controller
  .post(cardValidation.addNewCard, cardController.addNewCard)

export const cardRoutes = Router
