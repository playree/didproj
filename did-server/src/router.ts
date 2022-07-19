import { errorWrap } from './middlewares/errorHandler'
import { pageTop } from './views/'
import {
  getManageIssuer,
  postManageIssuer,
  getManageCredentialManifest,
} from './views/manage'
import express from 'express'
import path from 'path'

/**
 * 画面ルーティングの設定
 * @param app
 */
export const setViewRoutings = (app: express.Express) => {
  app.set('view engine', 'ejs')
  app.set('views', path.join(__dirname, '../ejs'))
  app.use(express.static(path.join(__dirname, '../public')))

  app.get('/', errorWrap(pageTop))

  app
    .route('/manage/issuer')
    .get(errorWrap(getManageIssuer))
    .post(errorWrap(postManageIssuer))

  app
    .route('/manage/issuer/:issuer_id/cm')
    .get(errorWrap(getManageCredentialManifest))

  const issuerRt = express.Router()
  app.use(issuerRt)
}
