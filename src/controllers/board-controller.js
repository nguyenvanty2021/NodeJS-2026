import { StatusCodes } from 'http-status-codes'

const addNewBoard = async (req, res) => {
  try {
    // eslint-disable-next-line no-console
    console.log('req.body: ', req.body)
    res.status(StatusCodes.CREATED).json({ message: 'POST from Validation: API create new board' })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      errors: error.message
    })
  }
}

export const boardController = {
  addNewBoard
}
