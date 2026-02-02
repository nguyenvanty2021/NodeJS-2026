import { StatusCodes } from 'http-status-codes'

const addNewBoard = async (req, res, next) => {
  try {
    // eslint-disable-next-line no-console
    console.log('req.body: ', req.body)
    res.status(StatusCodes.CREATED).json({ message: 'POST from Validation: API create new board' })
  } catch (error) {
    // next(error) sẽ chuyển lỗi này sang middleware xử lý lỗi tập trung trong file server.js
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}

export const boardController = {
  addNewBoard
}
