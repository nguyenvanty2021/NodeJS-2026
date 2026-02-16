import { StatusCodes } from 'http-status-codes'
import { twoFactorService } from '~/services/two-factor-service'

const get2FA_QRCode = async (req, res, next) => {
  try {
    const result = await twoFactorService.get2FA_QRCode(req.jwtDecoded._id)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const setup2FA = async (req, res, next) => {
  try {
    const result = await twoFactorService.setup2FA(req.jwtDecoded._id, req.body.otpToken)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

export const twoFactorController = {
  get2FA_QRCode,
  setup2FA
}
