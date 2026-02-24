/**
 * Script để seed data mẫu vào MongoDB cho collections 'books' và 'authors'
 * Chạy: npx babel-node ./src/scripts/seed-graphql-data.js
 */
import 'dotenv/config'
import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from '~/config/environment'

const booksData = [
  { name: 'De Men Phieu Luu Ky', genre: 'Adventure', createdAt: Date.now(), updatedAt: null },
  { name: 'Lam giau khong kho', genre: 'Education', createdAt: Date.now(), updatedAt: null }
]

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

    // Seed books
    const existingBooks = await db.collection('books').countDocuments()
    if (existingBooks === 0) {
      await db.collection('books').insertMany(booksData)
      // eslint-disable-next-line no-console
      console.log(`✅ Đã seed ${booksData.length} books vào MongoDB`)
    } else {
      // eslint-disable-next-line no-console
      console.log(`⚠️  Collection 'books' đã có ${existingBooks} documents, bỏ qua seed`)
    }

    // Seed authors
    const existingAuthors = await db.collection('authors').countDocuments()
    if (existingAuthors === 0) {
      await db.collection('authors').insertMany(authorsData)
      // eslint-disable-next-line no-console
      console.log(`✅ Đã seed ${authorsData.length} authors vào MongoDB`)
    } else {
      // eslint-disable-next-line no-console
      console.log(`⚠️  Collection 'authors' đã có ${existingAuthors} documents, bỏ qua seed`)
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
