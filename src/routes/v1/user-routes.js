import express from 'express'
import { userValidation } from '~/validations/user-validation'
import { userController } from '~/controllers/user-controller'
import { authMiddleware } from '~/middlewares/auth-middleware'

const Router = express.Router()

/*
Quy trình auth như sau:
1. Register Account => Sau đó gửi url vào email xác thực
2. User vào gmail đăng ký account click vào url (url này gồm: email user vừa đăng ký và verifyToken (verifyToken này không phải là accessToken mà chỉ là uuid thôi))
3. Url này ở frontend phải setup router để hiển thị UI và chạy useEffect để call api verifyAccount
*/

Router.route('/register')
  // phải pass validation trước sau đó mới đẩy qua controller
  .post(userValidation.register, userController.register)

Router.route('/verify')
  .put(userValidation.verifyAccount, userController.verifyAccount)

Router.route('/login')
  .post(userValidation.login, userController.login)

Router.route('/logout')
  .delete(userController.logout)

Router.route('/refresh_token')
  .get(userController.refreshToken)

Router.route('/update_account') // router này là dùng để update lại thông tin account sau khi đăng nhập => user login thành công vào bên trong thì bên trong sẽ có page update lại thông tin user
  .put(authMiddleware.isAuthorized, userValidation.updateAccount, userController.updateAccount)

export const userRoutes = Router
