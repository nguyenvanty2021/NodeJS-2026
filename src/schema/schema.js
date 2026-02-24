import { gql } from 'apollo-server-express'

const typeDefs = gql`
  type Book {
    id: ID
    name: String
    genre: String
  }

  type Author {
    # Dấu ! (Non-Null) nghĩa là field này bắt buộc phải có giá trị, không được trả về null
    # Nếu không có ! thì field có thể trả về null (mặc định trong GraphQL tất cả field đều nullable)
    id: ID!
    name: String
    age: Int
  }

  # ROOT TYPE
  type Query {
    getAllBook: [Book]
    getBookById(id: ID!): Book
    getAllAuthor: [Author]
    getAuthorById(id: ID!): Author
  }
`

export default typeDefs
