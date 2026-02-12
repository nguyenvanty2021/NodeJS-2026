import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/board-model'
import { ApiError } from '~/utils/api-error'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '~/utils/constants'

const addNewBoard = async ({ userId, reqBody }) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Xử lý logic dữ liệu tùy đặc thù dự án
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    // Gọi tới tầng Model để xử lý lưu bản ghi newBoard vào trong Database
    const createdBoard = await boardModel.addNewBoard({ userId, newBoard })

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

const getBoardById = async ({ boardId, userId }) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const board = await boardModel.getBoardById({ boardId, userId })
    console.log('board: ', board)
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

const updateBoard = async ({ boardId, reqBody }) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const updateData = { ...reqBody, updatedAt: Date.now() }
    const updateBoard = await boardModel.updateBoard({ boardId, objectBoard:updateData })
    return updateBoard
  } catch (error) { throw error }
}

const getAllBoard = async ({ userId, page, limit }) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Nếu không tồn tại page hoặc itemsPerPage từ phía FE thì BE sẽ cần phải luôn gán giá trị mặc định
    if (!page) page = DEFAULT_PAGE
    if (!limit) limit = DEFAULT_LIMIT

    const results = await boardModel.getAllBoard({ userId, page: parseInt(page, 10), limit: parseInt(limit, 10) })

    return results
  } catch (error) { throw error }
}

export const boardService = {
  addNewBoard,
  getBoardById,
  updateBoard,
  getAllBoard
}
