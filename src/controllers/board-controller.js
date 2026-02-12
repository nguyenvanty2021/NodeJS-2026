import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/board-service'

const addNewBoard = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    // eslint-disable-next-line no-console
    console.log('req.body: ', req.body)
    const createdBoard = await boardService.addNewBoard({ userId, reqBody: req.body })
    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (error) {
    // next(error) sẽ chuyển lỗi này sang middleware xử lý lỗi tập trung trong file server.js
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}

const getBoardById = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const boardId = req.params.id // id này là id bên router: Router.route('/:id') => Router.route('/:idparams') thì sẽ là: req.params.idparams
    // Sau này ở khóa MERN Stack Advance nâng cao học trực tiếp sẽ có thêm userId nữa để chỉ lấy board thuộc về user đó thôi chẳng hạn...vv
    const board = await boardService.getBoardById({ userId, boardId })
    res.status(StatusCodes.OK).json(board)
  } catch (error) { next(error) }
}

const getAllBoard = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { page, limit } = req.query
    const boards = await boardService.getAllBoard({ userId, page, limit })
    res.status(StatusCodes.OK).json(boards)
  } catch (error) { next(error) }
}

const updateBoard = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const updatedBoard = await boardService.updateBoard({ boardId, reqBody: req.body })

    res.status(StatusCodes.OK).json(updatedBoard)
  } catch (error) { next(error) }
}

export const boardController = {
  addNewBoard,
  getBoardById,
  getAllBoard,
  updateBoard
}
