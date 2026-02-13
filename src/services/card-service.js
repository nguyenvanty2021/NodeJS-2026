import { slugify } from '~/utils/formatters'
import { cardModel } from '~/models/card-model'
import { columnModel } from '~/models/column-model'
import { CloudinaryProvider } from '~/providers/cloudinary-providers'

const addNewCard = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Xử lý logic dữ liệu tùy đặc thù dự án
    const newCard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    // Gọi tới tầng Model để xử lý lưu bản ghi newBoard vào trong Database
    const createdCard = await cardModel.addNewCard(newCard)

    // Lấy bản ghi board sau khi gọi (tùy mục đích dự án mà có cần bước này hay không)
    // eslint-disable-next-line no-console
    const getNewCard = await cardModel.findOneById(createdCard.insertedId)
    // eslint-disable-next-line no-console
    console.log(getNewCard)
    if (getNewCard) {
      await columnModel.pushCardOrderIds(getNewCard)
    }
    // Làm thêm các xử lý logic khác với các Collection khác tùy đặc thù dự án...vv
    // Bắn email, notification về cho admin khi có 1 cái board mới được tạo...vv

    // Trả kết quả về, trong Service luôn phải có return
    return getNewCard
  } catch (error) { throw error }
}


const updateCard = async ({ cardId, reqBody, cardCoverFile, userInfo }) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Khởi tạo object chứa các field cần update
    let updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }

    // Xử lý upload card cover lên Cloudinary (nếu có) - trường hợp đặc biệt cần xử lý riêng
    if (cardCoverFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(cardCoverFile.buffer, 'card-covers')
      updateData.cover = uploadResult.secure_url
    }

    if (updateData?.comments) {
      const commentData = {
        ...updateData.comments,
        commentedAt: Date.now(),
        userId: userInfo._id,
        userEmail: userInfo.email,
        userAvatar: userInfo.avatar,
        userName: userInfo.username
      }
      updateData = await cardModel.unshiftNewComment({ cardId, commentData })
    }

    // Gom tất cả lại và update 1 lần duy nhất vào DB
    const updatedCard = await cardModel.updateCard({ cardId, updateData })

    return updatedCard
  } catch (error) { throw error }
}

export const cardService = {
  addNewCard,
  updateCard
}
