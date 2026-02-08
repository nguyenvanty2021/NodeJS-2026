import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'

// Define Collection (name & schema)
const COLUMN_COLLECTION_NAME = 'columns'
const COLUMN_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  cardOrderIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await COLUMN_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const addNewColumn = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    // eslint-disable-next-line no-console
    console.log('validData: ', validData)

    const createdColumn = await GET_DB().collection(COLUMN_COLLECTION_NAME).insertOne({ ...validData,
      boardId: new ObjectId(validData.boardId)
    })
    return createdColumn
  } catch (error) { throw new Error(error) }
}

const findOneById = async (_id) => {
  try {
    const result = await GET_DB().collection(COLUMN_COLLECTION_NAME).findOne({
      _id: new ObjectId(_id)
    })
    return result
  } catch (error) { throw new Error(error) }
}

// Nhiệm vụ của func này là push một cái giá trị columnId vào cuối mảng columnOrderIds
const pushCardOrderIds = async (card) => {
  try {
    const result = await GET_DB().collection(COLUMN_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(card.columnId) },
      { $push: { cardOrderIds: new ObjectId(card._id) } }, // mỗi khi column được tạo thì sau đó column sẽ được push vào cuối mảng theo id của boardId nằm trong column
      { returnDocument: 'after' } // trả về document sau khi update => hay nói 1 cách dễ hiểu hơn là return về object sau khi push column vào field columnOrderIds
    )
    return result
  } catch (error) { throw new Error(error) }
}
const INVALID_UPDATE_FIELDS = ['_id', 'boardId', 'createdAt']

const updateColumn = async ({ columnId, objectColumn }) => {
  try {
    Object.keys(objectColumn).forEach(key => {
      if (INVALID_UPDATE_FIELDS.includes(key)) {
        delete objectColumn[key]
      }
    })
    const result = await GET_DB().collection(COLUMN_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(columnId) },
      { $set: objectColumn },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}
const deleteOneById = async (columnId) => {
  try {
    const result = await GET_DB().collection(COLUMN_COLLECTION_NAME).deleteOne({
      _id: new ObjectId(columnId)
    })
    return result
  } catch (error) { throw new Error(error) }
}

export const columnModel = {
  COLUMN_COLLECTION_NAME,
  COLUMN_COLLECTION_SCHEMA,
  pushCardOrderIds,
  addNewColumn,
  findOneById,
  updateColumn,
  deleteOneById
}
