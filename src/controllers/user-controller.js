import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/user-service'
import ms from 'ms'
import ApiError from '~/utils/api-error'

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

const logout = async (req, res, next) => {
  try {
    // Xóa cookie - đơn giản là làm ngược lại so với việc gán cookie ở hàm login
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (error) { next(error) }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req.cookies?.refreshToken)

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'Please Sign In! (Error from refresh Token)'))
  }
}

const updateAccount = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const userAvatarFile = req.file
    const updatedUser = await userService.updateAccount({ userId, body: req.body, userAvatarFile })
    res.status(StatusCodes.OK).json(updatedUser)
  } catch (error) { next(error) }
}


const hookLogin = async (req, res) => {
  try {
    // console.log('req.auth: ', req.auth)
    // req.auth.header // The decoded JWT header.
    // req.auth.payload // The decoded JWT payload.
    // req.auth.token // The raw JWT token.

    const newUser = req.body
    console.log('newUser: ', newUser)

    const existingUser = await userService.findOneByEmail(newUser.email)
    console.log('existingUser: ', existingUser)

    // Chưa tồn tại user thì tiếp tục xuống dưới insert vào DB, ngược lại thì tùy spec dự án để xử lý
    if (existingUser) {
      res.status(StatusCodes.OK).json({ message: 'User already exists. Continue login...' })
      return
    }

    // NeDB sẽ lưu dữ liệu trong JSON mà không cần phân cách bằng dấu phẩy, mỗi bản ghi được lưu trên một dòng riêng biệt
    // Mục đích để dễ dàng đọc và ghi dữ liệu mà không cần phải xử lý toàn bộ tệp JSON mỗi lần truy vấn
    // NeDB tự động thêm _id cho mỗi bản ghi nếu chúng ta không chỉ định
    const insertedUser = await userService.createNew(newUser)
    console.log('insertedUser: ', insertedUser)

    res.status(StatusCodes.CREATED).json(insertedUser)
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error)
  }
}

const getAll = async (req, res) => {
  // eslint-disable-next-line no-empty
  try {

  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error)
  }
}

export const userController = {
  register,
  verifyAccount,
  login,
  logout,
  refreshToken,
  updateAccount,
  hookLogin,
  getAll
}
