import { ErrorWithLog } from '../common/utils'
import { DidDocument, JwkEs256k } from './didDocument'
import base64url from 'base64url'

/**
 * 秘密鍵＆公開鍵のペア
 */
export interface DidKeyPair {
  public: JwkEs256k
  private: JwkEs256k
}

/**
 * DIDの情報オブジェクト
 */
export class DidObject {
  /**
   * did = scheme:method:didSuffix:longFormSuffixData
   */
  constructor(
    public scheme: string,
    public method: string,
    public didSuffix: string,
    public longFormSuffixData: string,
    public signingKeyId: string,
    public published: boolean,
    public keys: {
      signing: DidKeyPair
      update?: DidKeyPair
      recovery?: DidKeyPair
    }
  ) {}

  static parseDid(didString: string) {
    const didParts = didString.split(':')
    const scheme = didParts[0]
    let longFormSuffixData = ''

    let lastIndex = didParts.length - 1
    if (lastIndex > 2) {
      try {
        // JSON形式かチェック
        JSON.parse(base64url.decode(didParts[lastIndex]))
        // JSON形式であれば、DidLongとして処理
        longFormSuffixData = didParts[lastIndex]
        lastIndex--
      } catch {}
    }
    const didSuffix = didParts[lastIndex]
    const method = didParts.slice(1, lastIndex).join(':')

    return {
      scheme,
      method,
      didSuffix,
      longFormSuffixData,
    }
  }

  static createByDidString(
    didString: string,
    signingKeyId: string,
    published: boolean,
    keys: {
      signing: DidKeyPair
      update?: DidKeyPair
      recovery?: DidKeyPair
    }
  ) {
    const { scheme, method, didSuffix, longFormSuffixData } =
      DidObject.parseDid(didString)
    return new DidObject(
      scheme,
      method,
      didSuffix,
      longFormSuffixData,
      signingKeyId,
      published,
      keys
    )
  }

  get did() {
    return this.published ? this.didShort : this.didLong
  }

  get didShort() {
    return [this.scheme, this.method, this.didSuffix].join(':')
  }

  get didLong() {
    return [
      this.scheme,
      this.method,
      this.didSuffix,
      this.longFormSuffixData,
    ].join(':')
  }

  get kid() {
    return `${this.did}#${this.signingKeyId}`
  }
}

/**
 * DID生成インターフェース
 */
export interface IDidCreater {
  get key(): string
  create(signingKeyId: string): Promise<DidObject>
}

/**
 * DID解決インターフェース
 */
export interface IDidResolver {
  get key(): string
  resolve(did: string): Promise<DidDocument>
}

/**
 * DIDの各種操作を提供する
 */
export class DidManager {
  private didCreaterMap: Record<string, IDidCreater>
  private didCreaterDefaultKey: string
  private didResolverMap: Record<string, IDidResolver>

  constructor(createrList: IDidCreater[], resolverList: IDidResolver[]) {
    // CreaterMapの作成
    this.didCreaterMap = {}
    this.didCreaterDefaultKey = createrList ? createrList[0].key : ''
    for (const didCreater of createrList) {
      this.didCreaterMap[didCreater.key] = didCreater
    }

    // ResolverMapの作成
    this.didResolverMap = {}
    for (const didResolver of resolverList) {
      this.didResolverMap[didResolver.key] = didResolver
    }
  }

  /**
   *
   * @param __namedParameters.signingKeyId 署名鍵ID
   * @param __namedParameters.signingKeyId IDidCreater登録キー
   * @returns
   */
  createDid({ signingKeyId, key }: { signingKeyId: string; key?: string }) {
    if (!key) {
      // key未指定の場合はdefaultを実行
      if (!this.didCreaterDefaultKey) {
        throw ErrorWithLog('Not found DidCreater')
      }
      return this.didCreaterMap[this.didCreaterDefaultKey].create(signingKeyId)
    }
    if (key in this.didCreaterMap) {
      return this.didCreaterMap[key].create(signingKeyId)
    }
    throw ErrorWithLog(`Not found in DidCreater: ${key}`)
  }

  /**
   * DID解決
   * @param did DID
   * @returns
   */
  resolveDid(did: string) {
    const { method } = DidObject.parseDid(did)
    if (method in this.didResolverMap) {
      return this.didResolverMap[method].resolve(did)
    }
    throw ErrorWithLog(`Not found in DidResolver: ${method}`)
  }
}
