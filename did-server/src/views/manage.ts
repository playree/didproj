import { didMgr, prisma } from '../common'
import { DidObject, EntityStyles, OutputDescriptor } from 'did-sdk'
import express from 'express'

export const getManageIssuer = async (
  _req: express.Request,
  res: express.Response
) => {
  // Issuer全件取得
  const issuerList = await prisma.issuer.findMany()
  console.log('Issuer selected: %d', issuerList.length)

  res.render('manage/issuer', {
    issuerList,
    createByJsonString: DidObject.createByJsonString,
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

const OUTPUT_DESCRIPTIOR_SAMPLE = {
  id: 'driver_license_output',
  schema: 'https://schema.org/EducationalOccupationalCredential',
  display: {
    title: {
      path: ['$.name', '$.vc.name'],
      schema: {
        type: 'string',
      },
      fallback: 'Washington State Driver License',
    },
    subtitle: {
      path: ['$.class', '$.vc.class'],
      schema: {
        type: 'string',
      },
      fallback: 'Class A, Commercial',
    },
    description: {
      text: 'License to operate a vehicle with a gross combined weight rating',
    },
  },
  styles: {
    background: {
      color: '#444444s',
    },
    text: {
      color: '#ffffff',
    },
  },
}

export const getManageCredentialManifest = async (
  req: express.Request,
  res: express.Response
) => {
  const issuerId = req.params.issuer_id

  // Issuer取得
  const issuer = await prisma.issuer.findUnique({ where: { id: issuerId } })
  console.log('Issuer selected: %o', issuer)

  // CredentialManifest全件取得
  const credentialManifestList = await prisma.credentialManifest.findMany({
    where: {
      issuerId,
    },
  })

  res.render('manage/credentialManifest', {
    issuer,
    credentialManifestList,
    outputDescriptorSampleJson: JSON.stringify(
      OUTPUT_DESCRIPTIOR_SAMPLE,
      null,
      2
    ),
  })
}

export const postManageCredentialManifest = async (
  req: express.Request,
  res: express.Response
) => {
  if (req.body._save !== undefined) {
    const outputDescriptor: OutputDescriptor = JSON.parse(
      req.body.output_descriptor
    )

    if (req.body.id) {
      // 更新
      const credentialManifest = await prisma.credentialManifest.update({
        where: { id: req.body.id },
        data: {
          name: req.body.name,
          outputDescriptorJson: JSON.stringify(outputDescriptor),
        },
      })
      console.log('CredentialManifest updated: %o', credentialManifest)
    } else {
      // 新規

      // CredentialManifest登録
      const credentialManifest = await prisma.credentialManifest.create({
        data: {
          issuerId: req.body.issuer_id,
          name: req.body.name,
          outputDescriptorJson: JSON.stringify(outputDescriptor),
        },
      })
      console.log('CredentialManifest created: %o', credentialManifest)
    }
  }

  res.redirect('.')
}
