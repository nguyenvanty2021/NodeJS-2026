import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/board-model'
import { ApiError } from '~/utils/api-error'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'

const addNewBoard = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Xử lý logic dữ liệu tùy đặc thù dự án
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    // Gọi tới tầng Model để xử lý lưu bản ghi newBoard vào trong Database
    const createdBoard = await boardModel.addNewBoard(newBoard)

    // Lấy bản ghi board sau khi gọi (tùy mục đích dự án mà có cần bước này hay không)
    // eslint-disable-next-line no-console
    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId)
    // eslint-disable-next-line no-console
    console.log(getNewBoard)

    // Làm thêm các xử lý logic khác với các Collection khác tùy đặc thù dự án...vv
    // Bắn email, notification về cho admin khi có 1 cái board mới được tạo...vv

    // Trả kết quả về, trong Service luôn phải có return
    return getNewBoard
  } catch (error) { throw error }
}

const getBoardById = async (boardId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const board = await boardModel.getBoardById(boardId)
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found')

    const resBoard = cloneDeep(board)
    // B2: Đưa card về đúng column của nó
    resBoard.columns.forEach(column => {
      column.cards = resBoard.cards.filter(card => card.columnId.toString() === column._id.toString())
      delete column.cardOrderIds
    })

    // Xóa mảng cards khỏi board ban đầu
    delete resBoard.cards

    return resBoard
  } catch (error) { throw error }
}

const getAllBoard = async () => {
  // eslint-disable-next-line no-useless-catch
  try {
    const boards = await boardModel.getAllBoard()
    return boards
  } catch (error) { throw error }
}

export const boardService = {
  addNewBoard,
  getBoardById,
  getAllBoard
}
