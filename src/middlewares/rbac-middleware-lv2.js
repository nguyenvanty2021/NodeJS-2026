import { StatusCodes } from 'http-status-codes'
import { RBAC_LEVEL_2 } from '~/utils/constants'

// Middleware Level 2 phức tạo hơn level 1: lúc này chúng ta sẽ nhận tham số đầu vào là một mảng các
// permissions được phép truy cập vào API.
// Nhận vào requiredPermissions là một mảng những permissions được phép truy cập vào API.
const isValidPermission = (requiredPermissions) => async (req, res, next) => {
  try {
    // Bước 01: Phải hiểu được luồng: middleware RBAC sẽ luôn chạy sau authMiddleware, vì vậy đảm bảo
    // JWT token phải hợp lệ và đã có dữ liệu decoded.
    // console.log(req.jwtDecoded)

    // Bước 02: Lấy role của user trong dữ liệu payload decoded của jwt token.
    // Lưu ý tùy vào từng loại dự án, nếu sẵn sàng đánh đổi về hiệu năng thì có những dự án sẽ truy cập
    // vào Database ở bước này để lấy full thông tin user (bao gồm cả role) từ DB ra và sử dụng.
    const userRole = req.jwtDecoded.role

    // Bước 03: Kiểm tra role, đơn giản nếu user không tồn tại role hoặc role của user không thuộc scope
    // role hợp lệ của api thì sẽ không truy cập được.
    if (!userRole) {
      res.status(StatusCodes.FORBIDDEN).json({
        message: 'User has no assigned role!'
      })
      return
    }

    // Bước 04: Lấy toàn bộ quyền hạn của user từ DB ra.
    const roleData = RBAC_LEVEL_2.find(role => role.name === userRole)

    if (!roleData) {
      res.status(StatusCodes.FORBIDDEN).json({
        message: 'Assigned role not found in the system!'
      })
      return
    }
    // Bước 05: Kiểm tra quyền hạn, đơn giản nếu user không tồn tại quyền hạn hoặc quyền hạn của user không thuộc scope
    // quyền hạn hợp lệ của api thì sẽ không truy cập được.
    const hasPermission = requiredPermissions?.every(permission => roleData.permissions.includes(permission))

    if (!hasPermission) {
      res.status(StatusCodes.FORBIDDEN).json({
        message: 'You are not allowed to access this API!'
      })
      return
    }

    // Bước 06: Nếu quyền hạn hợp lệ thì Cho phép request đi tiếp (sang controller)
    next()
  } catch (error) {
    console.log('Error from rbacMiddleware Level 2: ', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })
  }
}

export const rbacMiddleware_Level_2 = {
  isValidPermission
}
