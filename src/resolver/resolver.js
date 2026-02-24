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
      if (!book) return null
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
      if (!author) return null
      return { ...author, id: author._id.toString() }
    }
  },

  // Resolver cho nested field: Book.author
  // Khi query book có chứa field author, GraphQL sẽ gọi resolver này
  // parent ở đây chính là object Book đã được resolve ở trên (chứa authorId)
  Book: {
    author: async (parent) => {
      if (!parent.authorId) return null
      const author = await authorModel.findOneById(parent.authorId.toString())
      if (!author) return null
      return { ...author, id: author._id.toString() }
    }
  },

  // Resolver cho nested field: Author.books
  // Khi query author có chứa field books, GraphQL sẽ gọi resolver này
  // parent ở đây chính là object Author, dùng _id để tìm tất cả books có authorId trùng khớp
  Author: {
    books: async (parent) => {
      const books = await bookModel.findByAuthorId(parent._id || parent.id)
      return books.map(book => ({ ...book, id: book._id.toString() }))
    }
  },

  // Mutation resolvers - xử lý các thao tác tạo/sửa/xóa dữ liệu
  Mutation: {
    // Tạo book mới, args chứa các tham số truyền vào từ client (name, genre, authorId)
    addNewBook: async (parent, args) => {
      const result = await bookModel.addNewBook({
        name: args.name,
        genre: args.genre,
        authorId: args.authorId
      })
      // insertOne trả về insertedId, dùng nó để lấy lại document vừa tạo
      const createdBook = await bookModel.findOneById(result.insertedId)
      return { ...createdBook, id: createdBook._id.toString() }
    },
    // Tạo author mới
    addNewAuthor: async (parent, args) => {
      const result = await authorModel.addNewAuthor({
        name: args.name,
        age: args.age
      })
      const createdAuthor = await authorModel.findOneById(result.insertedId)
      return { ...createdAuthor, id: createdAuthor._id.toString() }
    },
    // Cập nhật book theo id, chỉ update những field được truyền vào
    updateBookById: async (parent, args) => {
      const { id, ...updateData } = args
      // Lọc bỏ các field undefined (không được truyền từ client)
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key]
      })
      const updatedBook = await bookModel.updateBookById({ id, updateData })
      if (!updatedBook) return null
      return { ...updatedBook, id: updatedBook._id.toString() }
    },
    // Cập nhật author theo id
    updateAuthorById: async (parent, args) => {
      const { id, ...updateData } = args
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key]
      })
      const updatedAuthor = await authorModel.updateAuthor(id, updateData)
      if (!updatedAuthor) return null
      return { ...updatedAuthor, id: updatedAuthor._id.toString() }
    },
    // Xóa book theo id, trả về book đã xóa
    deleteBookById: async (parent, args) => {
      const deletedBook = await bookModel.deleteBookById(args.id)
      if (!deletedBook) return null
      return { ...deletedBook, id: deletedBook._id.toString() }
    },
    // Xóa author theo id, trả về author đã xóa
    deleteAuthorById: async (parent, args) => {
      const deletedAuthor = await authorModel.deleteAuthorById(args.id)
      if (!deletedAuthor) return null
      return { ...deletedAuthor, id: deletedAuthor._id.toString() }
    }
  }
}

export default resolvers
