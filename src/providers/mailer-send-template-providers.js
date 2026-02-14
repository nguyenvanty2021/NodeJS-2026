import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'
import { env } from '~/config/environment'

// LƯU Ý QUAN TRỌNG VỀ BẢO MẬT: Trong thực tế những cái API Key này sẽ được lưu trữ trong file .env (TUYỆT
// ĐỐI KHÔNG PUSH KEY LÊN GITHUB)
// Vì làm nhanh gọn nên mình sẽ bỏ qua. Bởi vì mình đã có video hướng dẫn về biến môi trường ở đây rồi, nếu
// bạn chưa xem thì hãy xem nhé:
// Tổ chức biến môi trường ENV đúng cách: https://youtu.be/Vgr3MWb7aOw?si=r8zOi2xGD6pnAN6g
const MAILER_SEND_API_KEY = env.MAILER_SEND_API_KEY
const ADMIN_SENDER_EMAIL = env.ADMIN_SENDER_EMAIL_MAILER
const ADMIN_SENDER_NAME = env.ADMIN_SENDER_NAME_MAILER

// Tạo Instance của MailerSend để sử dụng
const mailerSendInstance = new MailerSend({ apiKey: MAILER_SEND_API_KEY })
// Tạo biến sentFrom: người gửi email
const sentFrom = new Sender(ADMIN_SENDER_EMAIL, ADMIN_SENDER_NAME)

// Function để gửi email
const sendEmail = async ({ to, subject, toName, templateId, personalizationData }) => {
  try {
    // Setup email và tên của người nhận, (hoặc nhiều người nhận, dữ liệu trong mảng)
    const recipients = [
      new Recipient(to, toName)
    ]


    // CC (Carbon Copy): Gửi bản sao công khai, nghĩa là gửi bản sao của email cho người khác để họ biết nội
    // dung email, nhưng không cần phản hồi.
    // Người nhận chính và người được CC đều thấy email của nhau.
    // const cc = [
    //   new Recipient('your_cc_01@trungquandev.com', 'Your Client CC 01'),
    //   new Recipient('your_cc_02@trungquandev.com', 'Your Client CC 02'),
    //   new Recipient('your_cc_03@trungquandev.com', 'Your Client CC 03')
    // ]
    // BCC (Blind Carbon Copy): Gửi bản sao ẩn danh, nghĩa là người nhận chính không biết ai đang nhận BCC.
    // BCC rất hữu ích khi gửi email hàng loạt (VD: thông báo đến nhiều khách hàng mà không cho phép họ thấy
    // thông tin nhau).
    // const bcc = [
    //   new Recipient('your_bcc_01@trungquandev.com', 'Your Client BCC 01'),
    //   new Recipient('your_bcc_02@trungquandev.com', 'Your Client BCC 02'),
    //   new Recipient('your_bcc_03@trungquandev.com', 'Your Client BCC 03')
    // ]

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      .setTemplateId(templateId) // template được tạo trên mailer send dashboard
      .setPersonalization(personalizationData)
    //   .setHtml(html)
    //   .setCc(cc)
    //   .setBcc(bcc)
      // .setText() // email dạng text cực kỳ đơn giản, ít dùng

    const data = await mailerSendInstance.email.send(emailParams)
    return data
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('MailerSend Error:', error)
    throw error
  }
}

export const MailerSendTemplateProvider = {
  sendEmail
}
