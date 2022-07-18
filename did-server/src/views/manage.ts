import { didMgr } from '../didMgr'
import { PrismaClient, Issuer } from '@prisma/client'
import { DidObject, EntityStyles } from 'did-sdk'
import express from 'express'

const prisma = new PrismaClient()

type IssuerP = Issuer & {
  styles?: EntityStyles
  didObject?: DidObject
}

export const getManageIssuer = async (
  _req: express.Request,
  res: express.Response
) => {
  // Issuer全件取得
  const issuerList: IssuerP[] = await prisma.issuer.findMany()
  console.log('Issuer selected: %d', issuerList.length)

  // JSON項目のParse
  for (const issuer of issuerList) {
    issuer.styles = JSON.parse(issuer.stylesJson)
    issuer.didObject = DidObject.createByJsonString(issuer.didObjectJson)
  }

  res.render('manage/issuer', {
    issuerList,
  })
}

export const postManageIssuer = async (
  req: express.Request,
  res: express.Response
) => {
  if (req.body._save !== undefined) {
    const styles: EntityStyles = {
      background: { color: req.body.background_color },
      text: { color: req.body.text_color },
    }

    if (req.body.id) {
      // 更新
      const issuer = await prisma.issuer.update({
        where: { id: req.body.id },
        data: {
          name: req.body.name,
          stylesJson: JSON.stringify(styles),
        },
      })
      console.log('Issuer updated: %o', issuer)
    } else {
      // 新規

      // DID作成
      const didObj = await didMgr.createDid({ signingKeyId: 'signingKey' })
      console.log('DID created: %o', didObj)

      // Issuer登録
      const issuer = await prisma.issuer.create({
        data: {
          name: req.body.name,
          didObjectJson: JSON.stringify(didObj),
          stylesJson: JSON.stringify(styles),
        },
      })
      console.log('Issuer created: %o', issuer)
    }
  }

  res.redirect('.')
}
