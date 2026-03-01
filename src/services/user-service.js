import { userModel } from '~/models/user-model'
import ApiError from '~/utils/api-error'
import { StatusCodes } from 'http-status-codes'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickData } from '~/utils/formatters'
import { WEBSITE_DOMAIN, MAILER_SEND_TEMPLATE_IDS } from '~/utils/constants'
import { BrevoProvider } from '~/providers/brevo-provider'
import { TwilioSmsProvider } from '~/providers/twilio-sms-providers'
import { ResendProvider } from '~/providers/resend-providers'
import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/jwt-providers'
import { CloudinaryProvider } from '~/providers/cloudinary-providers'
import { MailerSendProvider } from '~/providers/mailer-send-providers'
import { MailerSendTemplateProvider } from '~/providers/mailer-send-template-providers'

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


    // Gửi mail cho user sau khi đăng ký tài khoản
    // Bước gửi mail này sẽ là việc gửi hành động đến một dịch vụ Email as a Service.
    const to = getNewUser.email
    const toName = 'username123'
    const subject = 'Trello MERN Stack Advanced: Please verify your email before using our services!'
    const html = `
      <img src="cid:idImgHero" alt="Hero Image" width="400" height="400" />
      <h3>Here is your verification link:</h3>
      <h3>${verificationLink}</h3>
      <h3>Sincerely,<br/> - Company Name - </h3>
    `

    const personalizationData = [
      {
        email: to,
        data: {
          name: 'User ABC',
          youtube_channel_name: 'Channel Fullstack',
          account_name: 'Company ABC'
        }
      }
    ]

    const attachments = [
      {
        filePath: 'src/files/Nguyen-Van-Ty-Middle-ReactJS-n.pdf',
        filename: 'Nguyen-Van-Ty-Middle-ReactJS-n.pdf',
        attachmentType: 'attachment'
      }
    ]

    const imgAttachments = [
      {
        filePath: 'src/files/hero.png',
        filename: 'hero.png',
        attachmentType: 'inline',
        fileId: 'idImgHero'
      }
    ]

    const mailerSendEmailWithTemplateDataResponse = await MailerSendTemplateProvider.sendEmail({
      to,
      toName,
      subject,
      templateId: MAILER_SEND_TEMPLATE_IDS.REGISTER_ACCOUNT, // templateId của email, khi có nhiều thì nên tách ra một file riêng phía BE để lưu lại và gọi ra sử dụng nhé.
      personalizationData,
      attachments
    })
    // eslint-disable-next-line no-console
    console.log('mailerSendEmailWithTemplateDataResponse: ', mailerSendEmailWithTemplateDataResponse)

    // Gửi mail với MailerSend
    const sentMailerSendEmailResponse = await MailerSendProvider.sendEmail({ to, subject, html, toName, attachments: imgAttachments })
    // eslint-disable-next-line no-console
    console.log('MailerSend: Sent email done: ', sentMailerSendEmailResponse)

    // Gửi mail với Resend
    const sentResendEmailResponse = await ResendProvider.sendEmail({ to, subject, html })
    // eslint-disable-next-line no-console
    console.log('Resend: Sent email done: ', sentResendEmailResponse)

    // gọi hàm gửi email
    await BrevoProvider.sendEmail({ recipientEmail: getNewUser.email, customSubject, customHtmlContent: htmlContent })

    // Gửi sms cho user sau khi đăng ký tài khoản, có thể là sms xác nhận, sms welcome...vv
    // Bước gửi sms này sẽ là việc gửi hành động đến một dịch vụ bên thứ 3.
    const smsResponse = await TwilioSmsProvider.sendSMS({
      to: '+84384943497', // vì là account trial nên sdt to này chỉ gửi được qua sdt đăng ký account thôi
      body: `Đã gửi email xác thực tài khoản thành công! Vui lòng kiểm tra email của bạn! Hoặc có thể sử dụng verify link: ${verificationLink}`
    })
    // eslint-disable-next-line no-console
    console.log('Twilio SMS Response:', smsResponse)

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
    const userInfo = { _id: existUser._id, email: existUser.email, role: existUser.role }

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
      email: refreshTokenDecoded.email,
      role: refreshTokenDecoded.role
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

const updateAccount = async ({ userId, body: reqBody, userAvatarFile }) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Query User và kiểm tra cho chắc chắn
    const existUser = await userModel.findOneById(userId)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')

    // Khởi tạo object chứa các field cần update
    let updateData = {}

    // Xử lý đổi mật khẩu (nếu có)
    if (reqBody.current_password && reqBody.new_password) {
      // Kiểm tra xem cái current_password có đúng hay không
      if (!bcryptjs.compareSync(reqBody.current_password, existUser.password)) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your Current Password is incorrect!')
      }
      // Nếu như current_password là đúng thì hash mật khẩu mới
      updateData.password = bcryptjs.hashSync(reqBody.new_password, 8)
    }

    // Xử lý upload avatar lên Cloudinary (nếu có)
    if (userAvatarFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(userAvatarFile.buffer, 'users')
      updateData.avatar = uploadResult.secure_url
    }

    // Xử lý update các thông tin chung, ví dụ như displayName (nếu có)
    if (reqBody.displayName) {
      updateData.displayName = reqBody.displayName
    }

    // Gom tất cả lại và update 1 lần duy nhất vào DB
    const updatedUser = await userModel.update(existUser._id, updateData)

    return pickData({ objectPick: updatedUser, getListFields: ['_id', 'email', 'username', 'displayName', 'avatar', 'role', 'isActive', 'createdAt', 'updatedAt'] })
  } catch (error) { throw error }
}

/**
 * Các hàm dành cho Auth0 Hook Login
 */
const findOneByEmail = async (emailValue) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const user = await userModel.findOneByEmail(emailValue)
    return user
  } catch (error) { throw error }
}

const createNew = async (auth0UserData) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Map dữ liệu từ Auth0 event.user sang schema của userModel
    // Auth0 event.user có các field: email, nickname, name, picture, user_id, ...
    const nameFromEmail = auth0UserData.email.split('@')[0]
    const newUser = {
      email: auth0UserData.email,
      password: bcryptjs.hashSync(uuidv4(), 8), // Tạo password ngẫu nhiên vì Auth0 quản lý authentication
      username: auth0UserData.nickname || nameFromEmail,
      displayName: auth0UserData.name || nameFromEmail,
      avatar: auth0UserData.picture || null,
      isActive: true // User từ Auth0 đã được xác thực rồi
    }

    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    return pickData({ objectPick: getNewUser, getListFields: ['_id', 'email', 'username', 'displayName', 'avatar', 'role', 'isActive', 'createdAt', 'updatedAt'] })
  } catch (error) { throw error }
}

const getAll = async () => {
  // eslint-disable-next-line no-useless-catch
  try {
    const users = await userModel.getAll()
    return users
  } catch (error) { throw error }
}

/**
 * Google OAuth 2.0 Login
 * Bước 1: Đổi authorization code lấy access_token từ Google
 * Bước 2: Dùng access_token lấy thông tin user (email, name, picture)
 * Bước 3: Tìm hoặc tạo user trong DB
 * Bước 4: Tạo JWT tokens (accessToken, refreshToken)
 */
const loginWithGoogle = async (code) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Bước 1: Đổi authorization code lấy access_token từ Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    })
    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to get access token from Google!')
    }

    // Bước 2: Dùng access_token lấy thông tin user từ Google
    const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenData.access_token}`)
    const googleUser = await userInfoResponse.json()

    if (!googleUser.email) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to get user info from Google!')
    }

    // Bước 3: Kiểm tra user đã tồn tại trong DB chưa
    let user = await userModel.findOneByEmail(googleUser.email)

    if (!user) {
      // User chưa tồn tại => Tạo mới
      const nameFromEmail = googleUser.email.split('@')[0]
      const newUser = {
        email: googleUser.email,
        password: bcryptjs.hashSync(uuidv4(), 8), // Password ngẫu nhiên vì Google quản lý authentication
        username: nameFromEmail,
        displayName: googleUser.name || nameFromEmail,
        avatar: googleUser.picture || null,
        isActive: true // User từ Google đã được xác thực
      }

      const createdUser = await userModel.createNew(newUser)
      user = await userModel.findOneById(createdUser.insertedId)
    }

    // Nếu user tồn tại nhưng chưa active thì active luôn
    if (!user.isActive) {
      user = await userModel.update(user._id, { isActive: true, verifyToken: null })
    }

    // Bước 4: Tạo JWT tokens
    const userInfo = { _id: user._id, email: user.email, role: user.role }

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

    return {
      accessToken,
      refreshToken,
      ...pickData({ objectPick: user, getListFields: ['_id', 'email', 'username', 'displayName', 'avatar', 'role', 'isActive', 'createdAt', 'updatedAt'] })
    }
  } catch (error) { throw error }
}

export const userService = {
  register,
  verifyAccount,
  login,
  refreshToken,
  updateAccount,
  findOneByEmail,
  createNew,
  getAll,
  loginWithGoogle
}
