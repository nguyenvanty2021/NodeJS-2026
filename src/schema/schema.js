import { gql } from 'apollo-server-express'

const typeDefs = gql`
  type Book {
    id: ID
    name: String
    genre: String
    author: Author
  }

  type Author {
    # Dấu ! (Non-Null) nghĩa là field này bắt buộc phải có giá trị, không được trả về null
    # Nếu không có ! thì field có thể trả về null (mặc định trong GraphQL tất cả field đều nullable)
    id: ID!
    name: String
    age: Int
    books: [Book]
  }

  # ROOT TYPE
  # QUERY
  type Query {
    getAllBook: [Book]
    getBookById(id: ID!): Book
    getAllAuthor: [Author]
    getAuthorById(id: ID!): Author
  }

  # MUTATION
  type Mutation {
    # ": Book" ở cuối là Return Type - kiểu dữ liệu mà mutation sẽ TRẢ VỀ sau khi thực hiện xong
    # Nghĩa là sau khi tạo book mới, server sẽ trả về chính object Book vừa tạo (gồm id, name, genre, author)
    # Điều này giúp client nhận được dữ liệu mới ngay mà không cần query lại
    addNewBook(name: String!, genre: String!, authorId: ID!): Book
    # Tương tự, ": Author" nghĩa là sau khi tạo author, server trả về object Author vừa tạo
    addNewAuthor(name: String!, age: Int!): Author
    # Update - các field không có ! nghĩa là optional, chỉ cần truyền field muốn cập nhật
    updateBookById(id: ID!, name: String, genre: String, authorId: ID): Book
    updateAuthorById(id: ID!, name: String, age: Int): Author
  }
`

export default typeDefs
