// Author: TrungQuanDev: https://youtube.com/@trungquandev
import { StatusCodes } from 'http-status-codes'

// Middleware Level 1: Đơn giản nhất và cũng khá phổ biến, đó là một user chỉ được gắn với một quyền hạn
// duy nhất.
// Nhận vào allowedRoles là một mảng những role được phép truy cập vào API.
const isValidPermission = (allowedRoles) => async (req, res, next) => {
  console.log('allowedRoles 123: ', allowedRoles)
  try {
    // Bước 01: Phải hiểu được luồng: middleware RBAC sẽ luôn chạy sau authMiddleware, vì vậy đảm bảo JWT
    // token phải hợp lệ và đã có dữ liệu decoded.
    console.log('req.jwtDecoded 123: ', req.jwtDecoded)

    // Bước 02: Lấy role của user trong dữ liệu payload decoded của jwt token.
    // Lưu ý tùy vào từng loại dự án, nếu sẵn sàng đánh đổi về hiệu năng thì có những dự án sẽ truy cập
    // vào Database ở bước này để lấy full thông tin user (bao gồm cả role) từ DB ra và sử dụng.
    const userRole = req.jwtDecoded.role

    // Bước 03: Kiểm tra role, đơn giản nếu user không tồn tại role hoặc role của user không thuộc scope
    // role hợp lệ của api thì sẽ không truy cập được.
    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(StatusCodes.FORBIDDEN).json({
        message: 'You are not allowed to access this API!'
      })
      return
    }

    // Bước 04: Nếu role hợp lệ thì Cho phép request đi tiếp (sang controller)
    next()
  } catch (error) {
    console.log('Error from authMiddleware: ', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
  }
}

export const rbacMiddleware_Level_1 = {
  isValidPermission
}
