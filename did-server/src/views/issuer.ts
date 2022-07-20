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
