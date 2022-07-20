import { errorWrap } from './middlewares/errorHandler'
import { pageTop } from './views/'
import { getOpenidConfigration } from './views/issuer'
import {
  getManageIssuer,
  postManageIssuer,
  getManageCredentialManifest,
  postManageCredentialManifest,
} from './views/manage'
import { getTools, postTools } from './views/tools'
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

  // Issuer
  app.get(
    '/.well-known/openid-configuration/:manifest_id',
    errorWrap(getOpenidConfigration)
  )

  // Tools
  app.route('/tools').get(errorWrap(getTools)).post(errorWrap(postTools))

  // 管理画面
  app
    .route('/manage/issuer')
    .get(errorWrap(getManageIssuer))
    .post(errorWrap(postManageIssuer))

  app
    .route('/manage/issuer/:issuer_id/cm')
    .get(errorWrap(getManageCredentialManifest))
    .post(errorWrap(postManageCredentialManifest))

  const issuerRt = express.Router()
  app.use(issuerRt)
}
