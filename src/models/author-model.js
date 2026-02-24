import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'

// Define Collection (name & schema)
const AUTHOR_COLLECTION_NAME = 'authors'
const AUTHOR_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required().min(1).max(200).trim().strict(),
  age: Joi.number().integer().required(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null)
})

const validateBeforeCreate = async (data) => {
  return await AUTHOR_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const addNewAuthor = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const createdAuthor = await GET_DB().collection(AUTHOR_COLLECTION_NAME).insertOne(validData)
    return createdAuthor
  } catch (error) { throw new Error(error) }
}

const getAllAuthors = async () => {
  try {
    const result = await GET_DB().collection(AUTHOR_COLLECTION_NAME).find({}).toArray()
    return result
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(AUTHOR_COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    })
    return result
  } catch (error) { throw new Error(error) }
}

const updateAuthor = async (id, updateData) => {
  try {
    // Lọc bỏ những field không được phép update
    delete updateData._id
    delete updateData.createdAt

    // Cập nhật thời gian updatedAt
    updateData.updatedAt = Date.now()

    const result = await GET_DB().collection(AUTHOR_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

export const authorModel = {
  AUTHOR_COLLECTION_NAME,
  AUTHOR_COLLECTION_SCHEMA,
  addNewAuthor,
  getAllAuthors,
  findOneById,
  updateAuthor
}
