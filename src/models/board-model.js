import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { BOARD_TYPE } from '~/utils/constants'
import { columnModel } from '~/models/column-model'
import { cardModel } from '~/models/card-model'
import { pagingSkipValue } from '~/utils/algorithms'

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

  // Những Admin của cái board
  ownerIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  // Những thành viên của cái board
  memberIds: Joi.array().items(
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
    ],
    // Khai báo thêm thuộc tính collation locale 'en' để fix vụ chữ B hoa và a thường ở trên
    { collation: { locale: 'en' } }
    ).next()
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


/**
 * Query tất cả boards thuộc về user hiện tại (là owner hoặc member) với hỗ trợ phân trang
 * Flow: Lọc theo điều kiện → Sắp xếp → Phân trang → Đếm tổng → Trả kết quả
 */
const getAllBoard = async ({ userId, page, limit }) => {
  try {
    // Mảng queryConditions chứa các điều kiện lọc, sẽ được kết hợp bằng $and bên dưới
    const queryConditions = [
      // Điều kiện 01: Board chưa bị xóa
      { _destroy: false },
      /**
       * Điều kiện 02: userId phải nằm trong ownerIds HOẶC memberIds
       * - $or: chỉ cần 1 trong 2 điều kiện đúng là match
       * - $all: kiểm tra mảng trong DB có chứa tất cả phần tử ta liệt kê không
       *   Ở đây chỉ check 1 phần tử [userId], nên tương đương check "userId có nằm trong mảng không"
       * - Ví dụ: userId = "abc123"
       *   + Board A: ownerIds = ["abc123", "def456"] → ✅ Match (abc123 là owner)
       *   + Board B: memberIds = ["abc123"]          → ✅ Match (abc123 là member)
       *   + Board C: ownerIds = ["xyz789"]           → ❌ Không match
       * => Đảm bảo user chỉ thấy những board thuộc về mình
       */
      { $or: [
        { ownerIds: { $all: [new ObjectId(userId)] } },
        { memberIds: { $all: [new ObjectId(userId)] } }
      ] }
    ]

    const query = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
      // $match + $and: lọc boards thỏa mãn TẤT CẢ các điều kiện trong queryConditions
      { $match: { $and: queryConditions } },
      /**
       * $sort: Sắp xếp kết quả theo field 'title' theo thứ tự A-Z (tăng dần)
       * - Giá trị 1: tăng dần (A → Z, 0 → 9) - ascending
       * - Giá trị -1: giảm dần (Z → A, 9 → 0) - descending
       * Lưu ý: Mặc định MongoDB sort theo bảng mã ASCII, nên chữ HOA sẽ đứng trước chữ thường
       * (ví dụ: "Board" sẽ đứng trước "apple" vì 'B' có mã ASCII nhỏ hơn 'a')
       * => Cần thêm collation locale 'en' bên dưới để fix vấn đề này
       */
      { $sort: { title: 1 } },
      /**
       * $facet: Cho phép chạy NHIỀU pipeline con song song trong 1 query duy nhất
       * - Thay vì phải gọi DB 2 lần (1 lần lấy danh sách boards, 1 lần đếm tổng), ta gộp lại 1 lần duy nhất
       * - Mỗi key trong $facet là 1 "luồng" xử lý riêng biệt, nhận cùng input data từ các stage trước đó ($match, $sort)
       * - Kết quả trả về là 1 object duy nhất, mỗi key chứa mảng kết quả của luồng tương ứng
       * - Ví dụ kết quả: { queryBoards: [...boards], queryTotalBoards: [{ countedAllBoards: 50 }] }
       */
      { $facet: {
        // Luồng 01: Query danh sách boards đã phân trang
        'queryBoards': [
          { $skip: pagingSkipValue({ page, limit }) }, // Bỏ qua số lượng bản ghi của những page trước đó
          { $limit: limit } // Giới hạn tối đa số lượng bản ghi trả về trên một page
        ],

        // Luồng 02: Đếm tổng tất cả boards (để frontend biết tổng số page)
        // $count sẽ đếm tổng documents và lưu vào field 'countedAllBoards'
        'queryTotalBoards': [{ $count: 'countedAllBoards' }]
      } }
    ],
    // collation locale 'en': fix vụ sắp xếp chữ B hoa đứng trước chữ a thường
    // Khi có collation, MongoDB sẽ so sánh không phân biệt hoa/thường khi sort
    { collation: { locale: 'en' } }
    ).next() // Lấy trực tiếp 1 document duy nhất từ aggregate cursor (vì $facet luôn trả về đúng 1 document)

    // eslint-disable-next-line no-console
    console.log('query: ', query)

    // Lấy tổng số boards
    const totalBoards = query.queryTotalBoards[0]?.countedAllBoards || 0

    return {
      listBoards: query.queryBoards || [], // Danh sách boards đã phân trang
      pagination: {
        totalBoards, // Tổng số boards
        currentPage: page, // Trang hiện tại
        currentLimit: limit, // Số lượng bản ghi trên mỗi trang hiện tại
        totalPages: Math.ceil(totalBoards / limit) // Tổng số trang = tổng boards / số bản ghi mỗi trang (làm tròn lên)
      }
    }
  } catch (error) { throw new Error(error) }
}

// const getAllBoard = async () => {
//   try {
//     const result = await GET_DB().collection(BOARD_COLLECTION_NAME).find({}).toArray()
//     return result
//   } catch (error) { throw new Error(error) }
// }

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
