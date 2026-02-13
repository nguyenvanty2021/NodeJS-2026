import twilio from 'twilio'
import { env } from '~/config/environment'

const accountSid = env.TWILIO_ACCOUNT_SID
const authToken = env.TWILIO_AUTH_TOKEN
const fromPhone = env.TWILIO_FROM_PHONE

// Tạo instance của Twilio để sử dụng
const twilioInstance = twilio(accountSid, authToken)

// Tạo một function để gửi SMS
const sendSMS = async ({ to, body }) => {
  try {
    const message = await twilioInstance.messages.create({
      to,
      body,
      from: fromPhone
    })
    return message
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error from Twilio SMS Provider:', error)
    throw error
  }
}

export const TwilioSmsProvider = {
  sendSMS
}
