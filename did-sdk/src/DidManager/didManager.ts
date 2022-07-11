import { DidDocument, JwkEs256k } from './didDocument'

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

  static createByDidString(
    didSort: string,
    longFormSuffixData: string,
    signingKeyId: string,
    published: boolean,
    keys: {
      signing: DidKeyPair
      update?: DidKeyPair
      recovery?: DidKeyPair
    }
  ) {
    const didParts = didSort.split(':')
    const scheme = didParts[0]
    const didSuffix = didParts[didParts.length - 1]
    let method = didParts[1]
    if (didParts.length === 4) {
      method += ':' + didParts[2]
    }

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
  create({
    endpointUrl,
    signingKeyId,
  }: {
    endpointUrl: string
    signingKeyId: string
  }): Promise<DidObject>
}

/**
 * DID解決インターフェース
 */
export interface IDidResolver {
  get key(): string
  resolve({
    endpointUrl,
    did,
  }: {
    endpointUrl: string
    did: string
  }): Promise<DidDocument>
}

/**
 * DIDの各種操作を提供する
 */
export class DidManager {
  private didCreaterMap: Record<string, IDidCreater>
  private didCreaterDefault: IDidCreater | null

  constructor(createrList: IDidCreater[]) {
    // CreaterMapの作成
    this.didCreaterMap = {}
    this.didCreaterDefault = createrList ? createrList[0] : null
    for (const didCreater of createrList) {
      this.didCreaterMap[didCreater.key] = didCreater
    }
  }

  /**
   *
   */
  createDid({
    endpointUrl,
    signingKeyId,
    key,
  }: {
    /** エンドポイントURL */
    endpointUrl: string
    /** 署名鍵ID */
    signingKeyId: string
    /** IDidCreater登録キー */
    key?: string
  }) {
    if (!key) {
      // key未指定の場合はdefaultを実行
      if (!this.didCreaterDefault) {
        throw Error('Not found DidCreater')
      }
      return this.didCreaterDefault.create({ endpointUrl, signingKeyId })
    }
    if (key in this.didCreaterMap) {
      return this.didCreaterMap[key].create({ endpointUrl, signingKeyId })
    }
    throw Error(`${key} not found in DidCreater`)
  }
}
