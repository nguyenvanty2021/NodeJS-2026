import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoutes } from '~/routes/v1/board-routes'
import { columnRoutes } from '~/routes/v1/column-routes'
import { cardRoutes } from '~/routes/v1/card-routes'
import { userRoutes } from '~/routes/v1/user-routes'
import { twoFactorRoutes } from '~/routes/v1/two-factor-routes'
import { mediaRoutes } from '~/routes/v1/media-routes'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use.', code: StatusCodes.OK })
})

Router.use('/boards', boardRoutes)

Router.use('/columns', columnRoutes)

Router.use('/cards', cardRoutes)

Router.use('/users', userRoutes)

Router.use('/2fa', twoFactorRoutes)

Router.use('/media', mediaRoutes)

export const APIs_V1 = Router
