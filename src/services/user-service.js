import { userModel } from '~/models/user-model'
import ApiError from '~/utils/api-error'
import { StatusCodes } from 'http-status-codes'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickData } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { BrevoProvider } from '~/providers/brevo-provider'
import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/jwt-providers'

const register = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Kiểm tra xem email đã tồn tại trong hệ thống của chúng ta hay chưa
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists!')
    }

    // Tạo data để lưu vào Database
    // nameFromEmail: nếu email là trungquandev@gmail.com thì sẽ lấy được "trungquandev"
    const nameFromEmail = reqBody.email.split('@')[0]
    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 8), // Tham số thứ hai là độ phức tạp, giá trị càng cao thì băm càng lâu
      username: nameFromEmail,
      displayName: nameFromEmail, // mặc định để giống username khi user đăng ký mới, về sau làm tính năng update cho user
      verifyToken: uuidv4()
    }

    // Thực hiện lưu thông tin user vào Database
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // Gửi email cho người dùng xác thực tài khoản (buổi sau...)
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const customSubject = 'Trello MERN Stack Advanced: Please verify your email before using our services!'
    const htmlContent = `
      <h3>Here is your verification link:</h3>
      <h3>${verificationLink}</h3>
      <h3>Sincerely,<br/> - Company Name - </h3>
    `

    // gọi hàm gửi email
    await BrevoProvider.sendEmail({ recipientEmail: getNewUser.email, customSubject, customHtmlContent: htmlContent })

    // return trả về dữ liệu cho phía Controller
    // bỏ password khỏi object getNewUser => không return password sau khi hash cho frontend
    return pickData({ objectPick: getNewUser, getListFields: ['_id', 'email', 'username', 'displayName', 'avatar', 'role', 'isActive', 'createdAt', 'updatedAt'] })
  } catch (error) { throw error }
}
const verifyAccount = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Query user trong Database
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // Các bước kiểm tra cần thiết
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is already active!')
    if (reqBody.token !== existUser.verifyToken) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid!')
    }

    // Nếu như mọi thứ ok thì chúng ta bắt đầu update lại thông tin của thằng user để verify account
    const updateData = {
      isActive: true,
      verifyToken: null
    }
    const updatedUser = await userModel.update(existUser._id, updateData)

    return pickData({ objectPick: updatedUser, getListFields: ['_id', 'email', 'username', 'displayName', 'avatar', 'role', 'isActive', 'createdAt', 'updatedAt'] })
  } catch (error) { throw error }
}

const login = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Query user trong Database
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // Các bước kiểm tra cần thiết
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')
    if (!bcryptjs.compareSync(reqBody.password, existUser.password)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your Email or Password is incorrect!')
    }

    /** Nếu mọi thứ ok thì bắt đầu tạo Tokens đăng nhập để trả về cho phía FE */
    // Tạo thông tin để đính kèm trong JWT Token: bao gồm _id và email của user
    const userInfo = { _id: existUser._id, email: existUser.email }

    // Tạo ra 2 loại token, accessToken và refreshToken để trả về cho phía FE
    const accessToken = await JwtProvider.generateToken({
      userInfo,
      secretSignature: env.ACCESS_TOKEN_SECRET_SIGNATURE,
      tokenLife: env.ACCESS_TOKEN_LIFE
    })

    const refreshToken = await JwtProvider.generateToken({
      userInfo,
      secretSignature: env.REFRESH_TOKEN_SECRET_SIGNATURE,
      tokenLife: env.REFRESH_TOKEN_LIFE
    })

    // Trả về thông tin của user kèm theo 2 cái token vừa tạo ra
    return { accessToken, refreshToken, ...pickData({ objectPick: existUser, getListFields: ['_id', 'email', 'username', 'displayName', 'avatar', 'role', 'isActive', 'createdAt', 'updatedAt'] }) }
  } catch (error) { throw error }
}


const refreshToken = async (clientRefreshToken) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Verify / giải mã cái refresh token xem có hợp lệ không
    const refreshTokenDecoded = await JwtProvider.verifyToken({
      token: clientRefreshToken,
      secretSignature: env.REFRESH_TOKEN_SECRET_SIGNATURE
    })

    // Đoạn này vì chúng ta chỉ lưu những thông tin unique và cố định của user trong token rồi, vì vậy có thể lấy luôn từ decoded ra, tiết kiệm query vào DB để lấy data mới.
    const userInfo = {
      _id: refreshTokenDecoded._id,
      email: refreshTokenDecoded.email
    }

    // Tạo accessToken mới
    const accessToken = await JwtProvider.generateToken({
      userInfo,
      secretSignature: env.ACCESS_TOKEN_SECRET_SIGNATURE,
      // 5 // 5 giây để test accessToken hết hạn
      tokenLife: env.ACCESS_TOKEN_LIFE // 1 tiếng
    })

    return { accessToken }
  } catch (error) { throw error }
}

export const userService = {
  register,
  verifyAccount,
  login,
  refreshToken
}
