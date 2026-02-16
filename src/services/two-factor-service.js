import { twoFactorSecretKeyModel } from '~/models/two-factor-secret-key-model'
import { generateSecret, generateURI } from 'otplib'
import QRCode from 'qrcode'

const get2FA_QRCode = async (userId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Lấy 2fa secret key của user từ bảng 2fa_secret_keys
    const twoFactorSecretKey = await twoFactorSecretKeyModel.findOne({ user_id: userId })

    let twoFactorSecretKeyValue = null

    if (!twoFactorSecretKey) {
      // Nếu chưa có secret key riêng của user thì tạo mới secret key cho user
      const newTwoFactorSecretKey = await twoFactorSecretKeyModel.insert({
        user_id: userId,
        value: generateSecret() // generateSecret() là một hàm từ otplib để tạo một random secret key mới, đúng chuẩn.
      })
      twoFactorSecretKeyValue = newTwoFactorSecretKey.value
    } else {
      // Ngược lại nếu user đã có rồi thì lấy ra sử dụng luôn.
      twoFactorSecretKeyValue = twoFactorSecretKey.value
    }

    // Tạo otpAuth URL để generate QR code
    const otpAuth = generateURI({ issuer: 'TrelloApp', label: userId, secret: twoFactorSecretKeyValue })

    // Tạo QR code dạng data URL từ otpAuth
    const qrCodeDataURL = await QRCode.toDataURL(otpAuth)

    return { qrCode: qrCodeDataURL }
  } catch (error) { throw error }
}

const setup2FA = async (userId, reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // TODO: Implement setup2FA logic
  } catch (error) { throw error }
}

export const twoFactorService = {
  get2FA_QRCode,
  setup2FA
}
