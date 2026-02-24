# Trello Clone - Backend API (MERN Stack)

RESTful API và GraphQL API cho ứng dụng quản lý Board (Trello Clone) - xây dựng bằng Node.js, Express và MongoDB.

## ✨ Tính năng

### Authentication & Authorization
- Đăng ký, đăng nhập, xác thực email
- JWT Authentication (Access Token + Refresh Token lưu trong httpOnly Cookie)
- Auth0 SSO Integration (RS256) với Post Login Hook
- Two-Factor Authentication (2FA) bằng OTP (Google Authenticator, Authy)

### Board Management
- CRUD Boards với phân quyền Owner/Member
- Drag & Drop Columns và Cards (cập nhật thứ tự)
- Tìm kiếm và phân trang

### GraphQL API - Books & Authors
- CRUD Books và Authors qua GraphQL (Apollo Server)
- Nested queries: Book → Author, Author → Books (quan hệ 1-nhiều)
- Apollo Sandbox tại `http://localhost:8017/graphql`

### Tính năng khác
- Upload ảnh lên Cloudinary (avatar, card cover)
- Real-time với Socket.IO (mời user vào board)
- Gửi email xác thực (Brevo, Resend, MailerSend)
- Gửi SMS thông báo (Twilio)
- Swagger API Documentation

## 🛠 Tech Stack

| Công nghệ | Mô tả |
|---|---|
| **Express 5** | Web framework |
| **MongoDB** | Database (MongoDB Atlas) |
| **Apollo Server** | GraphQL server (Books & Authors API) |
| **Babel** | Transpiler (ES Modules, path alias `~`) |
| **JWT** | Authentication (jsonwebtoken) |
| **Auth0** | SSO với express-oauth2-jwt-bearer (RS256) |
| **Socket.IO** | Real-time communication |
| **Cloudinary** | Image upload & storage |
| **Joi** | Request validation |
| **Swagger UI** | API documentation |
| **Nodemon** | Hot reload (development) |

## 📁 Cấu trúc thư mục

```
src/
├── config/          # Cấu hình (environment, MongoDB, CORS)
├── controllers/     # Xử lý request/response
├── middlewares/     # Auth middleware, error handling, file upload
├── models/          # MongoDB schemas & data access (bao gồm book-model, author-model)
├── providers/       # Dịch vụ bên thứ 3 (Brevo, Cloudinary, JWT, Twilio, Resend, MailerSend)
├── routes/v1/       # API routes
├── schema/          # GraphQL type definitions (schema.js)
├── resolver/        # GraphQL resolvers (resolver.js)
├── scripts/         # Seed data scripts (seed-graphql-data.js)
├── services/        # Business logic
├── sockets/         # Socket.IO event handlers
├── utils/           # Helpers, constants, validators
├── validations/     # Joi validation schemas
└── server.js        # Entry point
```

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Node.js >= 18
- Yarn hoặc npm
- MongoDB Atlas account

### 1. Clone & Install

```bash
git clone https://github.com/nguyenvanty2021/NodeJS-2026.git
cd NodeJS-2026
yarn install
```

### 2. Cấu hình Environment

Copy file `.env.example` thành `.env` và điền các giá trị:

```bash
cp .env.example .env
```

| Biến | Mô tả |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `DATABASE_NAME` | Tên database |
| `APP_HOST` | Host (mặc định: `localhost`) |
| `APP_PORT` | Port (mặc định: `8017`) |
| `ACCESS_TOKEN_SECRET_SIGNATURE` | Secret key cho access token |
| `ACCESS_TOKEN_LIFE` | Thời gian sống access token (vd: `1h`) |
| `REFRESH_TOKEN_SECRET_SIGNATURE` | Secret key cho refresh token |
| `REFRESH_TOKEN_LIFE` | Thời gian sống refresh token (vd: `14 days`) |
| `CLOUDINARY_*` | Cloudinary credentials |
| `BREVO_API_KEY` | Brevo email API key |
| `RESEND_API_KEY` | Resend email API key |
| `MAILER_SEND_API_KEY` | MailerSend email API key |
| `TWILIO_*` | Twilio SMS credentials |
| `WEBSITE_DOMAIN_*` | Frontend domain (dev/production) |

### 3. Seed dữ liệu mẫu cho GraphQL

```bash
npx babel-node ./src/scripts/seed-graphql-data.js
```

### 4. Chạy

```bash
# Development (hot reload)
yarn dev

# Build production
yarn build

# Run production
yarn production
```

## 📖 API Documentation

### REST API
Swagger UI có sẵn tại: `http://localhost:8017/api-docs`

### GraphQL API
Apollo Sandbox có sẵn tại: `http://localhost:8017/graphql`

### Tổng quan REST API Endpoints

#### Users (Public)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/v1/users/register` | Đăng ký tài khoản |
| `PUT` | `/v1/users/verify` | Xác thực email |
| `POST` | `/v1/users/login` | Đăng nhập |
| `DELETE` | `/v1/users/logout` | Đăng xuất |
| `GET` | `/v1/users/refresh_token` | Refresh access token |
| `PUT` | `/v1/users/update_account` | Cập nhật thông tin (🔒 JWT) |

#### Users (Private - Auth0)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/v1/users/private/hook/login` | Hook Login từ Auth0 (🔒 Auth0 JWT) |
| `GET` | `/v1/users/private/get_all` | Lấy tất cả users (🔒 Auth0 JWT) |

#### Boards
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/v1/boards` | Danh sách boards (🔒 JWT) |
| `POST` | `/v1/boards` | Tạo board mới (🔒 JWT) |
| `GET` | `/v1/boards/:id` | Chi tiết board (🔒 JWT) |
| `PUT` | `/v1/boards/:id` | Cập nhật board (🔒 JWT) |

#### Columns
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/v1/columns` | Tạo column (🔒 JWT) |
| `PUT` | `/v1/columns/:id` | Cập nhật column (🔒 JWT) |
| `DELETE` | `/v1/columns/:id` | Xóa column (🔒 JWT) |

#### Cards
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/v1/cards` | Tạo card (🔒 JWT) |
| `PUT` | `/v1/cards/:id` | Cập nhật card (🔒 JWT) |

#### Two-Factor Authentication
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/v1/2fa/get_2fa_qr_code` | Lấy QR Code 2FA (🔒 JWT) |
| `POST` | `/v1/2fa/setup_2fa` | Thiết lập 2FA (🔒 JWT) |

### Tổng quan GraphQL API (Books & Authors)

Endpoint: `POST /graphql`

#### Queries
| Query | Mô tả |
|---|---|
| `getAllBook` | Lấy tất cả books (kèm nested author) |
| `getBookById(id: ID!)` | Lấy book theo ID |
| `getAllAuthor` | Lấy tất cả authors (kèm nested books) |
| `getAuthorById(id: ID!)` | Lấy author theo ID |

#### Mutations
| Mutation | Mô tả |
|---|---|
| `addNewBook(name!, genre!, authorId!)` | Tạo book mới |
| `addNewAuthor(name!, age!)` | Tạo author mới |
| `updateBookById(id!, name?, genre?, authorId?)` | Cập nhật book |
| `updateAuthorById(id!, name?, age?)` | Cập nhật author |
| `deleteBookById(id!)` | Xóa book theo ID |
| `deleteAuthorById(id!)` | Xóa author theo ID |

#### Ví dụ GraphQL Queries

```graphql
# Lấy tất cả books kèm thông tin author
query {
  getAllBook {
    id
    name
    genre
    author { id name age }
  }
}

# Lấy tất cả authors kèm danh sách books
query {
  getAllAuthor {
    id
    name
    age
    books { id name genre }
  }
}

# Tạo book mới
mutation {
  addNewBook(name: "Sách mới", genre: "Fiction", authorId: "...") {
    id name genre author { name }
  }
}

# Cập nhật book (chỉ truyền field cần thay đổi)
mutation {
  updateBookById(id: "...", name: "Tên mới") { id name }
}

# Xóa book
mutation {
  deleteBookById(id: "...") { id name }
}
```

## 🌐 Deployment

Project được deploy trên **Render** (Free tier):
- URL: `https://nodejs-2026.onrender.com`
- Auto deploy từ branch `main`

> ⚠️ Free tier sẽ spin down sau khi không hoạt động, request đầu tiên có thể mất 50 giây trở lên.

## 🏗 Kiến trúc (Layered Architecture)

```
REST API:    Request → Routes → Validation → Middleware (Auth) → Controller → Service → Model → MongoDB
GraphQL API: Request → Apollo Server → Schema → Resolver → Model → MongoDB
```

- **Routes**: Định nghĩa endpoints và gắn middleware
- **Validations**: Validate request body bằng Joi
- **Middlewares**: Xác thực JWT, Auth0 JWT, upload file (Multer)
- **Controllers**: Xử lý request/response, gọi service
- **Services**: Business logic, gọi model
- **Models**: Data access layer, tương tác MongoDB
- **Schema**: Định nghĩa GraphQL types, queries, mutations
- **Resolvers**: Xử lý logic cho GraphQL queries/mutations

## 📝 License

MIT License - [Ty Nguyen](https://github.com/nguyenvanty2021)
