import { DidDocument, JwkEs256k } from './didDocument'
import { DidKeyPair, DidManager, DidObject, IDidCreater } from './didManager'
import { IonDidCreater } from './ionDidManager'

/**
 * デフォルト設定のDidManagerを生成する。
 * カスタイムする場合は new DidManager() で生成してください。
 */
const newDefaultDidManager = () => {
  return new DidManager([new IonDidCreater()])
}

export {
  DidDocument,
  JwkEs256k,
  DidKeyPair,
  DidManager,
  newDefaultDidManager,
  DidObject,
  IDidCreater,
  IonDidCreater,
}
