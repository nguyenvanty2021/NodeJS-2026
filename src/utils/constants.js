
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