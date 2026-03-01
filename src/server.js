import express from 'express'
import cors from 'cors'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from '~/middlewares/error-handling-middleware'
import { corsOptions } from '~/config/cors'
import cookieParser from 'cookie-parser'
import socketIo from 'socket.io'
import http from 'http'
import { inviteUserToBoardSocket } from '~/sockets/invite-user-to-board-socket'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import fs from 'fs'
import path from 'path'
import { ApolloServer } from 'apollo-server-express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'

// Load schema & resolvers
import typeDefs from '~/schema/schema'
import resolvers from '~/resolver/resolver'

const file = fs.readFileSync(path.resolve('./swagger.yml'), 'utf8')
const swaggerDocument = YAML.parse(file)

const START_SERVER = async () => {
  const app = express()

  // Helmet giúp bảo mật ứng dụng bằng cách thiết lập các HTTP headers khác nhau:
  // - Chống Clickjacking (X-Frame-Options)
  // - Chống XSS (X-XSS-Protection)
  // - Ngăn chặn MIME type sniffing (X-Content-Type-Options)
  // - Và nhiều cơ chế bảo mật khác...
  // https://www.npmjs.com/package/helmet
  app.use(helmet())

  // Giới hạn số lượng request từ một IP trong một khoảng thời gian (Rate Limiting)
  // Giúp ngăn chặn các cuộc tấn công Brute Force hoặc DoS (Denial of Service)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    limit: 100, // Giới hạn mỗi IP tối đa 100 requests trong 15 phút
    standardHeaders: 'draft-7', // Trả về thông tin giới hạn trong các header chuẩn `RateLimit-*`
    legacyHeaders: false, // Tắt các header cũ `X-RateLimit-*`
    message: 'Too many requests from this IP, please try again after 15 minutes',
    // eslint-disable-next-line no-unused-vars
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json({ message: options.message })
    }
  })
  // Áp dụng limiter cho tất cả các requests
  app.use(limiter)

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  // Fix cái vụ Cache from disk của ExpressJS
  // https://stackoverflow.com/a/53240717/8324172
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Cấu hình Cookie Parser
  app.use(cookieParser())

  // Xử lý CORS (Cross-Origin Resource Sharing) - cho phép hoặc chặn request từ các domain khác
  // Bảo vệ API khỏi bị gọi từ những domain không được phép
  app.use(cors(corsOptions))

  // Apollo Server - GraphQL (phải đặt trước express.json() để tránh xung đột đọc body stream)
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers
  })
  await apolloServer.start()
  apolloServer.applyMiddleware({ app })

  // Enable req.body JSON data - Middleware để parse dữ liệu JSON từ request body
  // Nếu không có middleware này, req.body sẽ là undefined khi client gửi JSON data
  app.use(express.json())
  app.use('/v1', APIs_V1)

  // middleware xử lý lỗi tập trung
  app.use(errorHandlingMiddleware)


  //
  // Tạo một cái server mới bọc thằng app của express để làm real-time với socket.io
  const server = http.createServer(app)

  /**
   * Khởi tạo biến io với server và cors
   * - socketIo(server, { cors }): gắn socket.io vào HTTP server, cho phép real-time 2 chiều giữa client và server
   * - cors: corsOptions: dùng chung cấu hình CORS với express để tránh bị block bởi trình duyệt
   */
  const io = socketIo(server, { cors: corsOptions })

  /**
   * io.on('connection'): lắng nghe sự kiện có client kết nối tới server qua socket
   * - Mỗi khi 1 client (browser) kết nối, callback chạy với tham số 'socket' đại diện cho kết nối đó
   * - Mỗi client có 1 socket riêng biệt, dùng socket này để gửi/nhận event real-time
   */
  io.on('connection', (socket) => {
    console.log('a user connected', socket)
    inviteUserToBoardSocket(socket)
  })

  if (env.BUILD_MODE === 'production') {
    // Production (Render): listen trên 0.0.0.0 để Render detect được port
    // dùng server.listen thay cho app.listen vì lúc này server đã bao gồm express app và đã config socket.io
    // nếu không dùng socket thì chỉ cần app.listen
    server.listen(env.APP_PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`3. Hi ${env.AUTHOR}, I am running at port ${env.APP_PORT}/ in production mode`)
      // eslint-disable-next-line no-console
      console.log(`GraphQL ready at http://localhost:${env.APP_PORT}${apolloServer.graphqlPath}`)
    })
  } else {
    // nếu không dùng socket thì chỉ cần app.listen
    // dùng server.listen thay cho app.listen vì lúc này server đã bao gồm express app và đã config socket.io
    // Development: listen trên localhost
    server.listen(env.APP_PORT, env.APP_HOST, () => {
      // eslint-disable-next-line no-console
      console.log(`3. Hi ${env.AUTHOR}, I am running at http://${env.APP_HOST}:${env.APP_PORT}/`)
      // eslint-disable-next-line no-console
      console.log(`GraphQL ready at http://${env.APP_HOST}:${env.APP_PORT}${apolloServer.graphqlPath}`)
    })
  }
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
