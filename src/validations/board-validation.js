import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/api-error'
import { BOARD_TYPE } from '~/utils/constants'

const addNewBoard = async (req, res, next) => {
  const correctCondition = Joi.object({
    // .strict() - ngăn Joi tự động trim, nếu có khoảng trắng đầu/cuối sẽ báo lỗi thay vì tự động sửa
    title: Joi.string().required().min(3).max(50).trim().strict().messages({
      'any.required': 'Title is required',
      'string.empty': 'Title is not allowed to be empty',
      'string.min': 'Title length must be at least 3 characters long',
      'string.max': 'Title length must be less than or equal to 50 characters long',
      'string.trim': 'Title must not have leading or trailing whitespace'
    }),
    // .strict() - ngăn Joi tự động trim, nếu có khoảng trắng đầu/cuối sẽ báo lỗi thay vì tự động sửa
    description: Joi.string().required().min(3).max(256).trim().strict().messages({
      'any.required': 'Description is required',
      'string.empty': 'Description is not allowed to be empty',
      'string.min': 'Description length must be at least 3 characters long',
      'string.max': 'Description length must be less than or equal to 256 characters long',
      'string.trim': 'Description must not have leading or trailing whitespace'
    }),
    type: Joi.string().valid(BOARD_TYPE.PUBLIC, BOARD_TYPE.PRIVATE).required()
    // .messages({
    //   'any.required': 'Type is required',
    //   'string.empty': 'Type is not allowed to be empty',
    //   'any.only': 'Type must be either public or private'
    // })
  })

  try {
    // eslint-disable-next-line no-console
    // console.log(req.body)
    // abortEarly: false - trả về tất cả các lỗi validation thay vì chỉ dừng ở lỗi đầu tiên => nghĩa là trả về error tất cả các field chứ không phải chỉ duy nhất 1 field đầu tiên
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    // res.status(StatusCodes.CREATED).json({ message: 'POST from Validation: API create new board' })
    // next() này chạy sang tham số thứ 2 là: boardController.addNewBoard trong file routes/v1/board-routes.js
    next()
  } catch (error) {
    /**
     * Tại sao dùng ApiError thay vì next(error)?
     * - Nếu dùng next(error) thì middleware sẽ mặc định trả về status 500 (INTERNAL_SERVER_ERROR)
     * - Nhưng lỗi validation là lỗi từ phía client gửi dữ liệu sai, nên cần trả về status 422 (UNPROCESSABLE_ENTITY)
     * - ApiError cho phép ta kiểm soát chính xác HTTP status code trả về
     * - new Error(error).message để convert Joi ValidationError thành string message đẹp hơn
     */
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const updateBoard = async (req, res, next) => {
  // tính năng update thì bỏ required đi
  const correctCondition = Joi.object({
    title: Joi.string().min(3).max(50).trim().strict(),
    description: Joi.string().min(3).max(256).trim().strict(),
    type: Joi.string().valid(BOARD_TYPE.PUBLIC, BOARD_TYPE.PRIVATE)
  })

  try {
    // abortEarly: false - trả về tất cả các lỗi validation thay vì chỉ dừng ở lỗi đầu tiên => nghĩa là trả về error tất cả các field chứ không phải chỉ duy nhất 1 field đầu tiên
    // allowUnknown: true - cho phép request body chứa các field không được định nghĩa trong schema mà không báo lỗi
    // Ví dụ: khi update board, client có thể gửi thêm columnOrderIds, cardOrderIds...
    // mà không cần phải khai báo tất cả trong validation schema
    // Nếu không có allowUnknown: true, Joi sẽ báo lỗi "field is not allowed" cho những field không có trong schema
    await correctCondition.validateAsync(req.body, { abortEarly: false, allowUnknown: true })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const boardValidation = {
  addNewBoard,
  updateBoard
}
