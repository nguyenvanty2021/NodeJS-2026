import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'

// Define Collection (name & schema)
const TWO_FACTOR_SECRET_KEY_COLLECTION_NAME = '2fa_secret_keys'
const TWO_FACTOR_SECRET_KEY_COLLECTION_SCHEMA = Joi.object({
  user_id: Joi.string().required(),
  value: Joi.string().required(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null)
})

const validateBeforeCreate = async (data) => {
  return await TWO_FACTOR_SECRET_KEY_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

/**
 * Thêm mới một 2FA secret key vào database
 * @param {Object} data - Dữ liệu đầu vào: { user_id: string, value: string }
 *   - user_id: ID của user từ JWT token (req.jwtDecoded._id)
 *   - value: Secret key được tạo từ authenticator.generateSecret() (otplib)
 * @returns {Object} - Document đã được lưu vào DB, bao gồm:
 *   { _id: ObjectId, user_id: string, value: string, createdAt: number, updatedAt: null }
 *   - createdAt và updatedAt được Joi schema tự thêm default value
 */
const insert = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const result = await GET_DB().collection(TWO_FACTOR_SECRET_KEY_COLLECTION_NAME).insertOne(validData)
    return {
      ...validData,
      _id: result.insertedId
    }
  } catch (error) { throw new Error(error) }
}

/**
 * Tìm một 2FA secret key trong database
 * @param {Object} filter - Điều kiện tìm kiếm MongoDB, ví dụ: { user_id: "6abc123..." }
 * @returns {Object|null} - Trả về full document nếu tìm thấy:
 *   { _id: ObjectId, user_id: string, value: string, createdAt: number, updatedAt: null }
 *   - Trả về null nếu không tìm thấy
 */
const findOne = async (filter) => {
  try {
    const result = await GET_DB().collection(TWO_FACTOR_SECRET_KEY_COLLECTION_NAME).findOne(filter)
    return result
  } catch (error) { throw new Error(error) }
}

export const twoFactorSecretKeyModel = {
  TWO_FACTOR_SECRET_KEY_COLLECTION_NAME,
  insert,
  findOne
}
