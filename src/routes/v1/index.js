import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoutes } from '~/routes/v1/board-routes'
import { columnRoutes } from '~/routes/v1/column-routes'
import { cardRoutes } from '~/routes/v1/card-routes'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use.', code: StatusCodes.OK })
})

Router.use('/boards', boardRoutes)

Router.use('/columns', columnRoutes)

Router.use('/cards', cardRoutes)

export const APIs_V1 = Router
