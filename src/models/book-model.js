import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'

// Define Collection (name & schema)
const BOOK_COLLECTION_NAME = 'books'
const BOOK_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required().min(1).max(200).trim().strict(),
  genre: Joi.string().required().min(1).max(100).trim().strict(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null)
})

const validateBeforeCreate = async (data) => {
  return await BOOK_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const addNewBook = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const createdBook = await GET_DB().collection(BOOK_COLLECTION_NAME).insertOne(validData)
    return createdBook
  } catch (error) { throw new Error(error) }
}

const getAllBooks = async () => {
  try {
    const result = await GET_DB().collection(BOOK_COLLECTION_NAME).find({}).toArray()
    return result
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(BOOK_COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    })
    return result
  } catch (error) { throw new Error(error) }
}

export const bookModel = {
  BOOK_COLLECTION_NAME,
  BOOK_COLLECTION_SCHEMA,
  addNewBook,
  getAllBooks,
  findOneById
}
