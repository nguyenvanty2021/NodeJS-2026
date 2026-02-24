import { bookModel } from '~/models/book-model'
import { authorModel } from '~/models/author-model'

const resolvers = {
  Query: {
    // Lấy tất cả books từ MongoDB collection 'books'
    getAllBook: async () => {
      const books = await bookModel.getAllBooks()
      // Map _id (MongoDB) thành id (GraphQL)
      return books.map(book => ({ ...book, id: book._id.toString() }))
    },
    // Tên resolver phải khớp với tên field trong schema: getBookById(id: ID!)
    getBookById: async (parent, args) => {
      const book = await bookModel.findOneById(args.id)
      return { ...book, id: book._id.toString() }
    },
    // Lấy tất cả authors từ MongoDB collection 'authors'
    getAllAuthor: async () => {
      const authors = await authorModel.getAllAuthors()
      // Map _id (MongoDB) thành id (GraphQL)
      return authors.map(author => ({ ...author, id: author._id.toString() }))
    },
    // Tên resolver phải khớp với tên field trong schema: getAuthorById(id: ID!)
    getAuthorById: async (parent, args) => {
      const author = await authorModel.findOneById(args.id)
      return { ...author, id: author._id.toString() }
    }
  }
}

export default resolvers
