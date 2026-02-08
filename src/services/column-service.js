import { slugify } from '~/utils/formatters'
import { columnModel } from '~/models/column-model'
import { cardModel } from '~/models/card-model'
import { boardModel } from '../models/board-model'
import { ObjectId } from 'mongodb'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/api-error'

const addNewColumn = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Xử lý logic dữ liệu tùy đặc thù dự án
    const newColumn = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    // Gọi tới tầng Model để xử lý lưu bản ghi newBoard vào trong Database
    const createdColumn = await columnModel.addNewColumn(newColumn)

    // Lấy bản ghi board sau khi gọi (tùy mục đích dự án mà có cần bước này hay không)
    // eslint-disable-next-line no-console
    const getNewColumn = await columnModel.findOneById(createdColumn.insertedId)
    // eslint-disable-next-line no-console
    console.log(getNewColumn)
    // vì khi add 1 column thì mặc định phải truyền thêm boardId => nghĩa là đã xác định column này có liên quan đến board nào rồi
    // => nên khi tạo xong 1 column mình phải update lại field columnOrderIds trong board theo boardId đó
    if (getNewColumn) {
      getNewColumn.cards = []
      await boardModel.pushColumnOrderIds(getNewColumn)
    }
    // Làm thêm các xử lý logic khác với các Collection khác tùy đặc thù dự án...vv
    // Bắn email, notification về cho admin khi có 1 cái board mới được tạo...vv

    // Trả kết quả về, trong Service luôn phải có return
    return getNewColumn
  } catch (error) { throw error }
}
const updateColumn = async ({ columnId, reqBody }) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const updateData = { ...reqBody, updatedAt: Date.now() }
    // Convert cardOrderIds từ string sang ObjectId nếu có
    if (updateData?.cardOrderIds?.length > 0) {
      updateData.cardOrderIds = updateData.cardOrderIds.map(id => new ObjectId(id))
    }
    const updatedColumn = await columnModel.updateColumn({ columnId, objectColumn: updateData })
    return updatedColumn
  } catch (error) { throw error }
}
const deleteColumn = async ({ columnId }) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const targetColumn = await columnModel.findOneById(columnId)
    if (!targetColumn) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Column not found!')
    }
    // Xóa Column
    await columnModel.deleteOneById(columnId)
    // Xóa toàn bộ Cards thuộc Column trên
    await cardModel.deleteManyByColumnId(columnId)
    // Sau khi xóa column thì phải xóa luôn column này trong board => vì 1 board sẽ có nhiều column và nhiều card
    await boardModel.pullColumnOrderIds({ columnId, boardId: targetColumn.boardId })

    return { deleteResult: 'Column and its Cards deleted successfully!' }
  } catch (error) { throw error }
}

export const columnService = {
  addNewColumn,
  updateColumn,
  deleteColumn
}
