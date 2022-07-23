import { PrismaClient } from '@prisma/client'
import {
  DidManager,
  IonDidCreaterWithChallenge,
  IonDidResolver,
  DidObject,
} from 'did-sdk'

export const didMgr = new DidManager(
  [new IonDidCreaterWithChallenge()],
  [new IonDidResolver()]
)

export const prisma = new PrismaClient()

export const orDefault = (
  obj: Record<string, unknown>,
  propString: string,
  defaultValue = ''
) => {
  const props = propString.split('.')
  let ret = obj
  for (const item of props) {
    if (!ret[item]) {
      return defaultValue
    }
    ret = ret[item] as Record<string, unknown>
  }
  return ret
}

/**
 * EJSで利用する共通関数の定義
 * @param opt
 * @returns
 */
export const createEjsOpt = (opt: Record<string, unknown> = {}) => {
  return {
    func: {
      orDefault,
      createByJsonString: DidObject.createByJsonString,
    },
    ...opt,
  }
}
