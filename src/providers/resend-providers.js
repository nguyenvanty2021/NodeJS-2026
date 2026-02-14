import { Resend } from 'resend'
import { env } from '~/config/environment'

// LƯU Ý QUAN TRỌNG VỀ BẢO MẬT: Trong thực tế những cái API Key này sẽ được lưu trữ trong file .env (TUYỆT
// ĐỐI KHÔNG PUSH KEY LÊN GITHUB)
// Vì làm nhanh gọn nên mình sẽ bỏ qua. Bởi vì mình đã có video hướng dẫn về biến môi trường ở đây rồi, nếu
// bạn chưa xem thì hãy xem nhé:
// Tổ chức biến môi trường ENV đúng cách: https://youtu.be/Vgr3MWb7aOw?si=r8zOi2xGD6pnAN6g
const RESEND_API_KEY = env.RESEND_API_KEY

// Để gửi email, bạn phải chứng minh được rằng bạn sở hữu và có quyền kiểm soát tên miền (domain) mà bạn
// đang dùng để gửi. Giống như mình có domain là trungquandev.com chẳng hạn.
// Nếu bạn không có domain thì bắt buộc phải dùng tạm email dev này của Resend để test gửi mail.
const ADMIN_SENDER_EMAIL = env.ADMIN_SENDER_EMAIL

// Tạo một cái instance của Resend để sử dụng
const resendInstance = new Resend(RESEND_API_KEY)

// Function để gửi email
const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resendInstance.emails.send({
      from: ADMIN_SENDER_EMAIL,
      to, // Nếu chưa có valid domain thì chỉ được gửi đến email mà bạn đăng ký tài khoản với Resend.
      subject,
      html
    })
    return data
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('ResendProvider.sendEmail error: ', error)
    throw error
  }
}

export const ResendProvider = {
  sendEmail
}
