import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/api-error'
import { JwtProvider } from '~/providers/jwt-providers'
import { env } from '~/config/environment'

// Middleware này sẽ đảm nhiệm việc quan trọng: Xác thực cái JWT accessToken nhận được từ phía FE có hợp lệ hay không
const isAuthorized = async (req, res, next) => {
  // Lấy accessToken nằm trong request cookies phía client - withCredentials trong file authorizeAxios
  const clientAccessToken = req.cookies?.accessToken

  // Nếu như cái clientAccessToken không tồn tại thì trả về lỗi luôn
  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (token not found)'))
    return
  }

  try {
    // Bước 01: Thực hiện giải mã token xem nó có hợp lệ hay là không
    const accessTokenDecoded = await JwtProvider.verifyToken({
      token: clientAccessToken,
      secretSignature: env.ACCESS_TOKEN_SECRET_SIGNATURE
    })

    console.log(accessTokenDecoded)

    // Bước 02: Quan trọng: Nếu như cái token hợp lệ, thì sẽ cần phải lưu thông tin giải mã được vào cái req.jwtDecoded, để sử dụng cho các tầng cần xử lý ở phía sau
    // accessTokenDecoded chứa: { _id, email, iat, exp } - giúp controller/service phía sau biết user nào đang gọi API mà không cần query DB lại
    // lưu lại thông tin trong accessToken sau khi decoded vào req.jwtDecoded => ở những tầng sau chỉ cần req.jwtDecoded là get được data accessTokenDecoded
    req.jwtDecoded = accessTokenDecoded

    // Bước 03: Cho phép cái request đi tiếp
    next()
  } catch (error) {
    console.log('authMiddleware: ', error)
    // Nếu cái accessToken nó bị hết hạn (expired) thì mình cần trả về một cái mã lỗi GONE - 410 cho phía FE biết để gọi api refreshToken
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token.'))
      return
    }

    // Nếu như cái accessToken nó không hợp lệ do bất kỳ điều gì khác vụ hết hạn thì chúng ta cứ thẳng tay trả về mã 401 cho phía FE gọi api sign_out luôn
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'))
  }
}

export const authMiddleware = { isAuthorized }

