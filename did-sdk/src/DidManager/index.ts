import { DidDocument, JwkEs256k } from './didDocument'
import {
  DidKeyPair,
  DidManager,
  DidObject,
  IDidCreater,
  IDidResolver,
} from './didManager'
import {
  IonDidCreaterNoChallenge,
  IonDidCreaterWithChallenge,
} from './ionDidManager'

/**
 * デフォルト設定のDidManagerを生成する。
 * カスタイムする場合は new DidManager() で生成してください。
 */
const newDefaultDidManager = () => {
  return new DidManager([
    new IonDidCreaterWithChallenge(),
    new IonDidCreaterNoChallenge(),
  ])
}

export {
  DidDocument,
  JwkEs256k,
  DidKeyPair,
  DidManager,
  newDefaultDidManager,
  DidObject,
  IDidCreater,
  IDidResolver,
  IonDidCreaterNoChallenge,
  IonDidCreaterWithChallenge,
}
