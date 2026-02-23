import { StatusCodes } from 'http-status-codes'
import { RBAC_LEVEL_2 } from '~/utils/constants'
import { getPermissionsFromRole } from '~/utils/rbac-util'

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
    // role ở level 3 là 1 mảng không còn là string nữa
    // level 1 và level 2 dùng dòng: const userRole = req.jwtDecoded.role
    // const userRole = req.jwtDecoded.role
    // level 3 dùng dòng: const userRole = ['client']
    const userRole = ['client']

    // Bước 03: Kiểm tra role, đơn giản nếu user không tồn tại role hoặc role của user không thuộc scope
    // role hợp lệ của api thì sẽ không truy cập được.
    // role ở level 3 là 1 mảng không còn là string nữa
    if (!Array.isArray(userRole) || userRole.length === 0) {
      res.status(StatusCodes.FORBIDDEN).json({
        message: 'User has no assigned role!'
      })
      return
    }
    // Bước 04: Dựa theo mảng userRoles của user rồi tìm tiếp trong database để lấy đầy đủ thông tin của
    // role đó
    // Đối với các thao tác cần hiệu suất cao khi duyệt qua các phần tử thì dùng Set object để tối ưu hiệu
    // năng xử lý (tìm kiếm / thêm / xóa) hơn xử lý array thông thường
    // Ví dụ Array.includes() sẽ chậm: O(n) nếu so với Set.has() có độ phức tạp O(1)
    let userPermissions = new Set()
    for (const roleName of userRole) {
      const rolePermissions = await getPermissionsFromRole(roleName)
      rolePermissions.forEach(i => userPermissions.add(i))
    }

    console.log('userPermissions: ', userPermissions)
    console.log('Array.from(userPermissions): ', Array.from(userPermissions))

    /**
     * Bước 5: Kiểm tra quyền truy cập.
     * Lưu ý nếu không cung cấp mảng hoặc mảng requiredPermissions là rỗng thì ý nghĩa ở
     * đây thường là không check quyền => luôn cho phép truy cập API.
     * Hàm Every của JS sẽ luôn trả về true nếu như mảng sử dụng là rỗng.
     */
    const hasPermission = requiredPermissions?.every(i => userPermissions.has(i))
    if (!hasPermission) {
      res.status(StatusCodes.FORBIDDEN).json({
        message: 'You do not have permission to access this API!'
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

export const rbacMiddleware_Level_3 = {
  isValidPermission
}
