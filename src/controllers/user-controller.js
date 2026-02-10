import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/user-service'
import ms from 'ms'

const register = async (req, res, next) => {
  try {
    // eslint-disable-next-line no-console
    console.log('req.body: ', req.body)
    const createdUser = await userService.register(req.body)
    res.status(StatusCodes.CREATED).json(createdUser)
  } catch (error) {
    // next(error) sẽ chuyển lỗi này sang middleware xử lý lỗi tập trung trong file server.js
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}

const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)

    /**
     * Xử lý trả về http only cookie cho phía trình duyệt
     * Về cái maxAge và thư viện ms: https://expressjs.com/en/api.html
     * Đối với cái maxAge - thời gian sống của Cookie thì chúng ta sẽ để tối đa 14 ngày, tùy dự án. Lưu ý
     * thời gian sống của cookie khác với cái thời gian sống của token nhé. Đừng bị nhầm lẫn :D
     */
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true, // Cookie chỉ được truy cập bởi server, không thể đọc bằng JavaScript phía client (chống XSS)
      secure: true, // Cookie chỉ được gửi qua HTTPS (bắt buộc khi sameSite: 'none')
      sameSite: 'none', // Cho phép gửi cookie cross-site (cần thiết khi FE và BE khác domain)
      maxAge: ms('14 days') // Thời gian sống của cookie - 14 ngày (tính bằng milliseconds nhờ thư viện ms)
    })
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, // Cookie chỉ được truy cập bởi server, không thể đọc bằng JavaScript phía client (chống XSS)
      secure: true, // Cookie chỉ được gửi qua HTTPS (bắt buộc khi sameSite: 'none')
      sameSite: 'none', // Cho phép gửi cookie cross-site (cần thiết khi FE và BE khác domain)
      maxAge: ms('14 days') // Thời gian sống của cookie - 14 ngày (tính bằng milliseconds nhờ thư viện ms)
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

export const userController = {
  register,
  verifyAccount,
  login
}
