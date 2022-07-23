import { createEjsOpt } from '../common'
import express from 'express'

export const pageTop = async (_req: express.Request, res: express.Response) => {
  res.render('top', createEjsOpt())
}
