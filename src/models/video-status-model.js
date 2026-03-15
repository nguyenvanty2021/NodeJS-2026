import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { EncodingStatus } from '~/utils/constants'

// Define Collection (name & schema)
const VIDEO_STATUS_COLLECTION_NAME = 'videoStatus'

// Schema validate trước khi insert vào MongoDB
const VIDEO_STATUS_COLLECTION_SCHEMA = Joi.object({
  // Tên video (lấy từ formidable newFilename, bỏ extension)
  // Ví dụ: 'gryjnj00ghii9svrn5vlx91w1'
  name: Joi.string().required().trim().strict(),

  // Trạng thái encode: pending → processing → success / failed
  status: Joi.string()
    .valid(EncodingStatus.PENDING, EncodingStatus.PROCESSING, EncodingStatus.SUCCESS, EncodingStatus.FAILED)
    .default(EncodingStatus.PENDING),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null)
})

// Validate data trước khi insert
const validateBeforeCreate = async (data) => {
  return await VIDEO_STATUS_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

// Insert 1 document mới với status = Pending (khi enqueue video)
const insertOne = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const result = await GET_DB().collection(VIDEO_STATUS_COLLECTION_NAME).insertOne(validData)
    return result
  } catch (error) { throw new Error(error) }
}

// Update status của video theo tên (khi bắt đầu encode, encode xong, hoặc encode lỗi)
// Ví dụ: updateStatusByName('abc123', EncodingStatus.PROCESSING)
const updateStatusByName = async (name, status) => {
  try {
    const result = await GET_DB().collection(VIDEO_STATUS_COLLECTION_NAME).updateOne(
      { name: name },
      {
        $set: { status: status },
        $currentDate: { updatedAt: true }
      }
    )
    return result
  } catch (error) { throw new Error(error) }
}

// Lấy status của video theo tên (để frontend query trạng thái encode)
const findByName = async (name) => {
  try {
    const result = await GET_DB().collection(VIDEO_STATUS_COLLECTION_NAME).findOne({ name: name })
    return result
  } catch (error) { throw new Error(error) }
}

export const videoStatusModel = {
  VIDEO_STATUS_COLLECTION_NAME,
  VIDEO_STATUS_COLLECTION_SCHEMA,
  insertOne,
  updateStatusByName,
  findByName
}
