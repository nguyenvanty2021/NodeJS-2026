import express from 'express'
import { boardValidation } from '~/validations/board-validation'
import { boardController } from '~/controllers/board-controller'
import { authMiddleware } from '~/middlewares/auth-middleware'
// import { rbacMiddleware_Level_1 } from '~/middlewares/rbac-middleware'
import { rbacMiddleware_Level_2 } from '~/middlewares/rbac-middleware-lv2'
import { RBAC_PERMISSIONS } from '~/utils/constants'

const Router = express.Router()

Router.route('/')
  .get(authMiddleware.isAuthorized,
    // rbac level1 1 user chỉ có 1 role và check api theo đúng role này
    // rbacMiddleware_Level_1.isValidPermission([RBAC_LEVEL_1.ADMIN, RBAC_LEVEL_1.CLIENT]),
    // rbac level2 1 user chỉ có 1 role nhưng trong 1 role lại có nhiều permission
    rbacMiddleware_Level_2.isValidPermission([RBAC_PERMISSIONS.READ_BOARD, RBAC_PERMISSIONS.UPDATE_BOARD, RBAC_PERMISSIONS.DELETE_BOARD, RBAC_PERMISSIONS.CREATE_BOARD]),
    boardController.getAllBoard)
  // phải pass validation trước sau đó mới đẩy qua controller
  .post(authMiddleware.isAuthorized, boardValidation.addNewBoard, boardController.addNewBoard)

Router.route('/:id')
  .get(authMiddleware.isAuthorized, boardController.getBoardById)
  .put(authMiddleware.isAuthorized, boardValidation.updateBoard, boardController.updateBoard)

export const boardRoutes = Router
