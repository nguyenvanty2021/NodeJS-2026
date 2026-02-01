import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'

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
    })
  })

  try {
    // eslint-disable-next-line no-console
    console.log(req.body)
    // abortEarly: false - trả về tất cả các lỗi validation thay vì chỉ dừng ở lỗi đầu tiên => nghĩa là trả về error tất cả các field chứ không phải chỉ duy nhất 1 field đầu tiên
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    res.status(StatusCodes.CREATED).json({ message: 'POST from Validation: API create new board' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    // console.log(new Error(error))
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      errors: new Error(error).message
    })
  }
}

export const boardValidation = {
  addNewBoard
}
