import express from 'express'

export const pageTop = async (req: express.Request, res: express.Response) => {
  res.render('top')
}
