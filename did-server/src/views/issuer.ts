import { PrismaClient } from '@prisma/client'
import express from 'express'

const prisma = new PrismaClient()

export const getOpenidConfigration = async (
  req: express.Request,
  res: express.Response
) => {
  const manifestId = req.params.manifest_id

  // CredentialManifest取得
  const credentialManifest = await prisma.credentialManifest.findUnique({
    where: { id: manifestId },
    include: { issuer: true },
  })
  console.log('CredentialManifest selected: %o', credentialManifest)

  if (!credentialManifest) {
    return res.status(404).send()
  }

  const outputDescriptor = JSON.parse(credentialManifest.outputDescriptorJson)

  res.json({
    issuer: '',
    authorization_endpoint: '',
    token_endpoint: '',
    credential_manifests: [
      {
        id: credentialManifest.id,
        issuer: {
          id: credentialManifest.issuer.id,
          name: credentialManifest.issuer.name,
        },
        output_descriptors: [outputDescriptor],
      },
    ],
  })
}

export const getIssuer = async (
  _req: express.Request,
  res: express.Response
) => {
  // Issuer全件取得
  const issuerList = await prisma.issuer.findMany({
    include: { credentialManifest: true },
  })
  console.log('Issuer selected: %d', issuerList.length)

  res.render('manage/issuer', {
    issuerList,
  })
}
