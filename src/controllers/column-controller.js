import { StatusCodes } from 'http-status-codes'
import { columnService } from '~/services/column-service'

const addNewColumn = async (req, res, next) => {
  try {
    // eslint-disable-next-line no-console
    console.log('req.body: ', req.body)
    const createdColumn = await columnService.addNewColumn(req.body)
    res.status(StatusCodes.CREATED).json(createdColumn)
  } catch (error) {
    // next(error) sẽ chuyển lỗi này sang middleware xử lý lỗi tập trung trong file server.js
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}

export const columnController = {
  addNewColumn
}
