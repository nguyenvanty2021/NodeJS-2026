import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { BOARD_TYPE } from '~/utils/constants'
import { columnModel } from '~/models/column-model'
import { cardModel } from '~/models/card-model'

// Define Collection (name & schema)
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  description: Joi.string().required().min(3).max(256).trim().strict(),
  type: Joi.string().valid(BOARD_TYPE.PUBLIC, BOARD_TYPE.PRIVATE).required(),
  // Lưu ý các item trong mảng columnOrderIds là ObjectId nên cần thêm pattern cho chuẩn nhé, (lúc quay video số 57 mình quên nhưng sang đầu video sau sẽ bổ sung)
  columnOrderIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const addNewBoard = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    // eslint-disable-next-line no-console
    console.log('validData: ', validData)

    const createdBoard = await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(validData)
    return createdBoard
  } catch (error) { throw new Error(error) }
}

const findOneById = async (_id) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({
      _id: new ObjectId(_id)
    })
    return result
  } catch (error) { throw new Error(error) }
}
// query tổng hợp (aggregate) để lấy toàn bộ columns and cards thuộc về board
const getBoardById = async (id) => {
  try {
    // Hôm nay tạm thời giống hệt hàm findOneById - và sẽ update phần aggregate tiếp ở những video tới
    // const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({ _id: new ObjectId(id) })
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
      { $match: {
        _id: new ObjectId(id),
        _destroy: false
      } },
      // Khi bạn chỉ get board theo ID, bạn chỉ nhận được:
      // { _id: ObjectId("690d2b84a123456789abcdef"), title: "Board 1", ... }
      // Bạn chưa nhận được columns và cards thuộc về board đó.
      // Để lấy được columns và cards thuộc về board, bạn cần sử dụng $lookup để join với column collection.
      // Quan hệ: 1 Board → Nhiều Columns (One-to-Many)
      // - 1 Board có thể có nhiều Columns
      // - 1 Column chỉ thuộc về 1 Board duy nhất (thông qua field boardId)
      // => get all columns có boardId = id current board
      { $lookup: {
        from: columnModel.COLUMN_COLLECTION_NAME, // Tìm trong bảng 'columns'
        localField: '_id', // Lấy _id của board hiện tại
        foreignField: 'boardId', // So sánh với field 'boardId' trong columns
        as: 'columns' // Kết quả đặt vào field 'columns'
      } },
      // Sau khi $lookup, bạn sẽ nhận được:
      // { _id: ObjectId("690d2b84a123456789abcdef"), title: "Board 1", ..., columns: [ { _id: ObjectId("690d2b84a123456789abcdee"), title: "Column 1", ... }, ... ] }
      // => get all cards có boardId = id current board
      { $lookup: {
        from: cardModel.CARD_COLLECTION_NAME, // Tìm trong bảng 'cards'
        localField: '_id', // Lấy _id của board hiện tại
        foreignField: 'boardId', // So sánh với field 'boardId' trong cards
        as: 'cards' // Kết quả đặt vào field 'cards'
      } }
    ]).next()
    console.log(123)
    // 1 board có nhiều columns và nhiều cards
    // 1 column chỉ thuộc về 1 board
    // 1 column có nhiều cards
    // 1 card chỉ thuộc về 1 column và 1 board
    return result || null
    // .toArray() // có thể thay thế .toArray() thành .next() cũng được
    // return result?.[0] || null // nếu dùng .next() thì chỉ cần return result || {}
  } catch (error) { throw new Error(error) }
}

const getAllBoard = async () => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).find({}).toArray()
    return result
  } catch (error) { throw new Error(error) }
}


// Nhiệm vụ của func này là push một cái giá trị columnId vào cuối mảng columnOrderIds
const pushColumnOrderIds = async (column) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(column.boardId) },
      { $push: { columnOrderIds: new ObjectId(column._id) } }, // mỗi khi column được tạo thì sau đó column sẽ được push vào cuối mảng theo id của boardId nằm trong column
      { returnDocument: 'after' } // trả về document sau khi update => hay nói 1 cách dễ hiểu hơn là return về object sau khi push column vào field columnOrderIds
    )
    return result
  } catch (error) { throw new Error(error) }
}

const updateBoard = async ({ boardId, objectBoard }) => {
  try {
    Object.keys(objectBoard).forEach(key => {
      if (INVALID_UPDATE_FIELDS.includes(key)) {
        delete objectBoard[key]
      }
    })
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(boardId) },
      { $set: objectBoard },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}
// Nhiệm vụ của func này là pull một cái giá trị columnId ra khỏi mảng columnOrderIds => có thể hiểu là xóa column này khỏi field columnOrderIds trong board
const pullColumnOrderIds = async ({ boardId, columnId }) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(boardId) },
      { $pull: { columnOrderIds: new ObjectId(columnId) } }, // vì là pull nên có nghĩa là: xóa hay kéo column này ra khỏi list columnOrderIds theo boardId này
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  addNewBoard,
  findOneById,
  getBoardById,
  getAllBoard,
  pushColumnOrderIds,
  pullColumnOrderIds,
  updateBoard
}
