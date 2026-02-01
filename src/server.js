import express from 'express'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1'

const START_SERVER = () => {
  const app = express()
  // Enable req.body JSON data - Middleware để parse dữ liệu JSON từ request body
  // Nếu không có middleware này, req.body sẽ là undefined khi client gửi JSON data
  app.use(express.json())
  app.use('/v1', APIs_V1)

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`3. Hi ${env.AUTHOR}, I am running at http://${env.APP_HOST}:${env.APP_PORT}/`)
  })
  // thực hiện các tác vụ cleanup trước khi dừng server
  exitHook(() => {
    // eslint-disable-next-line no-console
    console.log('4. Server is shutting down...')
    CLOSE_DB()
    // eslint-disable-next-line no-console
    console.log('5. Server is shut down!')
  })
}

// Chỉ khi Kết nối tới Database thành công thì mới Start Server Back-end lên.
// Immediately-invoked / Anonymous Async Functions (IIFE)
(async () => {
  try {
    // phải kết nối mongoDB thành công trước
    // eslint-disable-next-line no-console
    console.log('1. Connecting to MongoDB Cloud Atlas...')
    await CONNECT_DB()
    // eslint-disable-next-line no-console
    console.log('2. Connected to MongoDB Cloud Atlas!')
    // sau đó mới start server
    START_SERVER()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    // Dừng chương trình Node.js ngay lập tức
    // 0 = thoát bình thường, 1 = thoát do lỗi (nên dùng 1 khi có lỗi)
    process.exit(0)
  }
})()

// Cách 2: Dùng Promise chain (thay thế cho IIFE ở trên)
// CONNECT_DB()
//   .then(() => console.log('Connected to MongoDB Cloud Atlas!'))
//   .then(() => START_SERVER())
//   .catch(error => {
//     console.error(error)
//     process.exit(0)
//   })
