import express from 'express'
import { twoFactorController } from '~/controllers/two-factor-controller'
import { authMiddleware } from '~/middlewares/auth-middleware'

const Router = express.Router()

Router.route('/get_2fa_qr_code')
  .get(authMiddleware.isAuthorized, twoFactorController.get2FA_QRCode)

Router.route('/setup_2fa')
  .post(authMiddleware.isAuthorized, twoFactorController.setup2FA)

export const twoFactorRoutes = Router
