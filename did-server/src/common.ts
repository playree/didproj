import { PrismaClient } from '@prisma/client'
import { DidManager, IonDidCreaterWithChallenge, IonDidResolver } from 'did-sdk'

export const didMgr = new DidManager(
  [new IonDidCreaterWithChallenge()],
  [new IonDidResolver()]
)

export const prisma = new PrismaClient()
