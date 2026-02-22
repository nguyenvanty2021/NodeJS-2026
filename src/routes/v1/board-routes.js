import express from 'express'
import { boardValidation } from '~/validations/board-validation'
import { boardController } from '~/controllers/board-controller'
import { authMiddleware } from '~/middlewares/auth-middleware'
import { rbacMiddleware_Level_1 } from '~/middlewares/rbac-middleware'
import { RBAC_LEVEL_1 } from '~/utils/constants'

const Router = express.Router()

Router.route('/')
  .get(authMiddleware.isAuthorized, rbacMiddleware_Level_1.isValidPermission([RBAC_LEVEL_1.ADMIN, RBAC_LEVEL_1.CLIENT]), boardController.getAllBoard)
  // phải pass validation trước sau đó mới đẩy qua controller
  .post(authMiddleware.isAuthorized, boardValidation.addNewBoard, boardController.addNewBoard)

Router.route('/:id')
  .get(authMiddleware.isAuthorized, boardController.getBoardById)
  .put(authMiddleware.isAuthorized, boardValidation.updateBoard, boardController.updateBoard)

export const boardRoutes = Router
