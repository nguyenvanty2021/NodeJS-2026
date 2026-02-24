/**
 * Script để seed data mẫu vào MongoDB cho collections 'books' và 'authors'
 * Chạy: npx babel-node ./src/scripts/seed-graphql-data.js
 */
import 'dotenv/config'
import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from '~/config/environment'

const authorsData = [
  { name: 'Ngo Tat To', age: 127, createdAt: Date.now(), updatedAt: null },
  { name: 'Nam Cao', age: 106, createdAt: Date.now(), updatedAt: null },
  { name: 'Vu Trong Phung', age: 109, createdAt: Date.now(), updatedAt: null }
]

const seedData = async () => {
  const client = new MongoClient(env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  })

  try {
    await client.connect()
    const db = client.db(env.DATABASE_NAME)

    // Seed authors TRƯỚC (vì books cần authorId)
    let authorIds = []
    const existingAuthors = await db.collection('authors').countDocuments()
    if (existingAuthors === 0) {
      const result = await db.collection('authors').insertMany(authorsData)
      authorIds = Object.values(result.insertedIds)
      // eslint-disable-next-line no-console
      console.log(`✅ Đã seed ${authorsData.length} authors vào MongoDB`)
    } else {
      // Nếu authors đã tồn tại, lấy _id của chúng để gán cho books
      const existingAuthorDocs = await db.collection('authors').find({}).toArray()
      authorIds = existingAuthorDocs.map(a => a._id)
      // eslint-disable-next-line no-console
      console.log(`⚠️  Collection 'authors' đã có ${existingAuthors} documents, bỏ qua seed`)
    }

    // Seed books SAU (gắn authorId từ authors đã seed ở trên)
    const existingBooks = await db.collection('books').countDocuments()
    if (existingBooks === 0) {
      const booksData = [
        { name: 'De Men Phieu Luu Ky', genre: 'Adventure', authorId: authorIds[0], createdAt: Date.now(), updatedAt: null },
        { name: 'Lam giau khong kho', genre: 'Education', authorId: authorIds[1], createdAt: Date.now(), updatedAt: null }
      ]
      await db.collection('books').insertMany(booksData)
      // eslint-disable-next-line no-console
      console.log(`✅ Đã seed ${booksData.length} books vào MongoDB (với authorId)`)
    } else {
      // eslint-disable-next-line no-console
      console.log(`⚠️  Collection 'books' đã có ${existingBooks} documents, bỏ qua seed`)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Seed thất bại:', error)
  } finally {
    await client.close()
    // eslint-disable-next-line no-console
    console.log('🔒 Đã đóng kết nối MongoDB')
  }
}

seedData()
