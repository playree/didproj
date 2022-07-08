import {
  IonDid,
  IonDocumentModel,
  IonKey,
  IonRequest,
  IonPublicKeyPurpose,
  JwkEs256k,
} from '@decentralized-identity/ion-sdk'
import { dexieDb } from '../dexie'
import urljoin from 'url-join'
import base64url from 'base64url'
import { BinaryLike, createHash } from 'crypto'
import { ES256K } from '@transmute/did-key-secp256k1'

export type JWTObject = {
  header: any
  payload: any
  jws: string
}

export class DidTool {
  static ACTION_PATH = {
    OPERATIONS: 'operations',
    IDENTIFIERS: 'identifiers',

    PROOF: 'proof-of-work-challenge',
  }

  static async create(url: string, needChallenge: boolean, keyid = '') {
    const signingKeyId = keyid || VerifiableTool.generateKid()

    // 鍵生成
    const [recoveryKey, recoveryPrivateKey] =
      await IonKey.generateEs256kOperationKeyPair()
    const [updateKey, updatePrivateKey] =
      await IonKey.generateEs256kOperationKeyPair()
    const [signingKey, signingPrivateKey] =
      await IonKey.generateEs256kDidDocumentKeyPair({ id: signingKeyId })

    // 追加属性
    signingKey.purposes = [IonPublicKeyPurpose.Authentication]
    const publicKeys = [signingKey]

    // DID作成リクエスト
    const document: IonDocumentModel = {
      publicKeys,
    }
    const input = { recoveryKey, updateKey, document }
    const createRequest = IonRequest.createCreateRequest(input)
    const longFormDid = IonDid.createLongFormDid(input)
    const longFormSuffixData = longFormDid.substring(
      longFormDid.lastIndexOf(':') + 1
    )

    // const resText = needChallenge ?
    //   await IonProofOfWork.submitIonRequest(
    //     urljoin(url, DidTool.ACTION_PATH.PROOF),
    //     urljoin(url, DidTool.ACTION_PATH.OPERATIONS),
    //     JSON.stringify(createRequest)
    //   ) :
    //   await DidTool._submitIonRequest(
    //     urljoin(url, DidTool.ACTION_PATH.OPERATIONS),
    //     JSON.stringify(createRequest)
    //   );
    const resText = await DidTool._submitIonRequest(
      urljoin(url, DidTool.ACTION_PATH.OPERATIONS),
      JSON.stringify(createRequest)
    )
    if (!resText) {
      return null
    }

    // 各種パラメータ生成
    const resObj = JSON.parse(resText)
    const did: string = resObj.didDocument.id
    const didParts = did.split(':')
    const scheme = didParts[0]
    const didSuffix = didParts[didParts.length - 1]
    let method = didParts[1]
    if (didParts.length === 4) {
      method += ':' + didParts[2]
    }
    const published = resObj.didDocumentMetadata.method.published

    const didModel = new DidModel(
      scheme,
      method,
      didSuffix,
      longFormSuffixData,
      signingKeyId,
      published
    )

    return {
      didModel,
      signingPrivateKey,
      recoveryPrivateKey,
      updatePrivateKey,
    }
  }

  static async _submitIonRequest(
    solveChallengeUri: string,
    requestBody: string
  ) {
    const response = await fetch(solveChallengeUri, {
      method: 'POST',
      mode: 'cors',
      body: requestBody,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.status >= 500) {
      console.log(`Unexpected 5xx response: ${await response.text()}`)
    } else if (response.status >= 400) {
      // 400 means bad request, so should retry with a new challenge
      console.log(`Bed request: ${await response.text()}`)
      console.log('Retrying with new challenge and difficulty')
    } else if (response.status >= 300) {
      console.log(`Unexpected 3xx response: ${await response.text()}`)
    } else {
      // success
      console.log(`Successful registration`)
      const responseText = await response.text()
      console.log(responseText)
      return responseText
    }
  }

  static async resolve(url: string, did: string) {
    const res = await fetch(urljoin(url, DidTool.ACTION_PATH.IDENTIFIERS, did))
    if (res.status !== 200) {
      return {
        error: {
          status: res.status,
          text: await res.text(),
        },
      }
    }
    return await res.json()
  }

  static async save(didModel: DidModel) {
    await dexieDb.did.put(didModel)
  }

  static async load() {
    const didModel = await dexieDb.did.get(DidModel.ID)
    if (didModel) {
      return new DidModel(
        didModel.scheme,
        didModel.method,
        didModel.didSuffix,
        didModel.longFormSuffixData,
        didModel.signingKeyId,
        didModel.published
      )
    }
    return null
  }

  static async clear() {
    await dexieDb.did.clear()
  }
}

export class PrivateKeyTool {
  static RESERVE_ID = {
    RECOVERY: '@RECOVERY',
    UPDATE: '@UPDATE',
  }

  static async save(id: string, privateKey: JwkEs256k) {
    await dexieDb.privatekey.put(new PrivateKeyModel(id, privateKey))
  }

  static async load(id: string) {
    return await dexieDb.privatekey.get(id)
  }

  static async clear() {
    await dexieDb.privatekey.clear()
  }
}

export class DidModel {
  // did = scheme:method:didSuffix:longFormSuffixData
  id: string
  scheme: string
  method: string
  didSuffix: string
  longFormSuffixData: string
  signingKeyId: string
  published: boolean

  constructor(
    scheme: string,
    method: string,
    didSuffix: string,
    longFormSuffixData: string,
    signingKeyId: string,
    published = false
  ) {
    this.id = DidModel.ID
    this.scheme = scheme
    this.method = method
    this.didSuffix = didSuffix
    this.longFormSuffixData = longFormSuffixData
    this.signingKeyId = signingKeyId
    this.published = published
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

  static ID = 'onlyid'
}

export class PrivateKeyModel {
  id: string
  privateKey: JwkEs256k

  constructor(id: string, privateKey: JwkEs256k) {
    this.id = id
    this.privateKey = privateKey
  }
}

export class VcModel {
  id: number | undefined
  vc: JWTObject

  constructor(vc: JWTObject) {
    this.vc = vc
  }
}

export class VcTool {
  static async save(vc: JWTObject) {
    await dexieDb.vc.put(new VcModel(vc))
  }

  static async all() {
    return await dexieDb.vc.toArray()
  }

  static async clear() {
    await dexieDb.vc.clear()
  }
}

export class VerifiableTool {
  static decodeJws(jwsString: string): JWTObject {
    const jwsParse = jwsString.split('.')
    return {
      header: JSON.parse(base64url.decode(jwsParse[0])),
      payload: JSON.parse(base64url.decode(jwsParse[1])),
      jws: jwsString,
    }
  }

  static generateSub(jwk: any) {
    const sha256 = createHash('sha256')
    const jwkString = `{"crv":"${jwk.crv}","kty":"${jwk.kty}","x":"${jwk.x}","y":"${jwk.y}"}`
    const hash = sha256.update(jwkString).digest()
    return base64url.encode(hash)
  }

  static generateHash(text: BinaryLike) {
    const sha256 = createHash('sha256')
    const hash = sha256.update(text).digest()
    return base64url.toBase64(base64url.encode(hash))
  }

  static generateKid() {
    const md5 = createHash('md5')
    return md5.update(new Date().toString()).digest('hex')
  }

  static generateNonce() {
    const md5 = createHash('md5')
    const hash = md5.update(new Date().toString()).digest()
    return base64url.toBase64(base64url.encode(hash))
  }

  static async signJws(header: any, payload: any, privateJwk: any) {
    switch (privateJwk.crv) {
      case 'secp256k1':
        return ES256K.sign(payload, privateJwk, header)
      default:
        throw new Error('Unsupported cryptographic type')
    }
  }

  static async verifyJws(jws: string, publicJwk: any) {
    switch (publicJwk.crv) {
      case 'secp256k1':
        return ES256K.verify(jws, publicJwk)
      default:
        throw new Error('Unsupported cryptographic type')
    }
  }

  static async verifyJwsByDid(jwtObj: JWTObject, resolveUrl: string) {
    try {
      // HeaderのkidからDIDとverificationMethodのidを取得
      const [did, vid] = jwtObj.header.kid.split('#')

      // DID DocumentからpublicKeyJwkを取得
      const didInfo = await DidTool.resolve(resolveUrl, did)
      let jwk
      for (const vm of didInfo.didDocument.verificationMethod) {
        if (vm.id === '#' + vid) {
          jwk = vm.publicKeyJwk
          break
        }
      }
      if (!jwk) {
        return false
      }

      // 署名検証
      return await VerifiableTool.verifyJws(jwtObj.jws, jwk)
    } catch (e) {
      return false
    }
  }
}
