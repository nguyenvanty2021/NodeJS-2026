import { StatusCodes } from 'http-status-codes'
import { cardService } from '~/services/card-service'

const addNewCard = async (req, res, next) => {
  try {
    // eslint-disable-next-line no-console
    console.log('req.body: ', req.body)
    const createdCard = await cardService.addNewCard(req.body)
    res.status(StatusCodes.CREATED).json(createdCard)
  } catch (error) {
    // next(error) sẽ chuyển lỗi này sang middleware xử lý lỗi tập trung trong file server.js
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}

export const cardController = {
  addNewCard
}
