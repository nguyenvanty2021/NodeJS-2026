import { slugify } from '~/utils/formatters'
import { cardModel } from '~/models/card-model'
import { columnModel } from '~/models/column-model'

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

export const cardService = {
  addNewCard
}
