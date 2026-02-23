
import { env } from '~/config/environment'

// những domain được phép truy cập đến tài nguyên của server
export const WHITELIST_DOMAINS = [
  'http://localhost:5173',
  'https://nodejs-2026.onrender.com'
  // ...vv ví dụ sau này sẽ deploy lên domain chính thức ...vv
]
export const BOARD_TYPE = {
  PUBLIC: 'public',
  PRIVATE: 'private'
}

export const WEBSITE_DOMAIN = (env.BUILD_MODE === 'production') ? env.WEBSITE_DOMAIN_PRODUCTION : env.WEBSITE_DOMAIN_DEVELOPMENT

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 10

export const MAILER_SEND_TEMPLATE_IDS = {
  REGISTER_ACCOUNT: 'z86org8z9rkgew13'
}
export const RBAC_LEVEL_1 = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  CLIENT: 'client'
}
export const RBAC_PERMISSIONS = {
  CREATE_BOARD: 'create_board',
  READ_BOARD: 'read_board',
  UPDATE_BOARD: 'update_board',
  DELETE_BOARD: 'delete_board',
  CREATE_COLUMN: 'create_column',
  READ_COLUMN: 'read_column',
  UPDATE_COLUMN: 'update_column',
  DELETE_COLUMN: 'delete_column',
  CREATE_CARD: 'create_card',
  READ_CARD: 'read_card',
  UPDATE_CARD: 'update_card',
  DELETE_CARD: 'delete_card'
}
export const RBAC_LEVEL_2 = [
  {
    _id: 'admin',
    name: 'admin',
    permissions: [
      // RBAC_PERMISSIONS.CREATE_BOARD, RBAC_PERMISSIONS.READ_BOARD, RBAC_PERMISSIONS.UPDATE_BOARD, RBAC_PERMISSIONS.DELETE_BOARD,
      // RBAC_PERMISSIONS.CREATE_COLUMN, RBAC_PERMISSIONS.READ_COLUMN, RBAC_PERMISSIONS.UPDATE_COLUMN, RBAC_PERMISSIONS.DELETE_COLUMN,
      RBAC_PERMISSIONS.CREATE_CARD, RBAC_PERMISSIONS.READ_CARD, RBAC_PERMISSIONS.UPDATE_CARD, RBAC_PERMISSIONS.DELETE_CARD
    ],
    inherits: ['client', 'moderator'] // admin kế thừa role của client và moderator
  },
  {
    _id: 'moderator',
    name: 'moderator',
    permissions: [
      // RBAC_PERMISSIONS.CREATE_BOARD, RBAC_PERMISSIONS.READ_BOARD, RBAC_PERMISSIONS.UPDATE_BOARD, RBAC_PERMISSIONS.DELETE_BOARD,
      RBAC_PERMISSIONS.CREATE_COLUMN, RBAC_PERMISSIONS.READ_COLUMN, RBAC_PERMISSIONS.UPDATE_COLUMN, RBAC_PERMISSIONS.DELETE_COLUMN
    ],
    inherits: ['client'] // moderator kế thừa role của client
  },
  {
    _id: 'client',
    name: 'client',
    permissions: [
      RBAC_PERMISSIONS.CREATE_BOARD, RBAC_PERMISSIONS.READ_BOARD, RBAC_PERMISSIONS.UPDATE_BOARD, RBAC_PERMISSIONS.DELETE_BOARD
    ],
    inherits: [] // client không kế thừa từ role nào cả
  }
]
