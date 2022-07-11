import { JwkEs256k } from '@decentralized-identity/ion-sdk'
import { dexieDb } from '../dexie'
import urljoin from 'url-join'
import base64url from 'base64url'
import { BinaryLike, createHash } from 'crypto'
import { ES256K } from '@transmute/did-key-secp256k1'
import { DidObject, DidKeyPair } from 'did-sdk'

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
        didModel.published,
        didModel.keys
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

export class DidModel extends DidObject {
  public id: string

  constructor(
    scheme: string,
    method: string,
    didSuffix: string,
    longFormSuffixData: string,
    signingKeyId: string,
    published: boolean,
    keys: {
      signing: DidKeyPair
      update?: DidKeyPair
      recovery?: DidKeyPair
    }
  ) {
    super(
      scheme,
      method,
      didSuffix,
      longFormSuffixData,
      signingKeyId,
      published,
      keys
    )
    this.id = DidModel.ID
  }

  static ID = 'onlyid'

  static createByDidObject(didObject: DidObject) {
    return new DidModel(
      didObject.scheme,
      didObject.method,
      didObject.didSuffix,
      didObject.longFormSuffixData,
      didObject.signingKeyId,
      didObject.published,
      didObject.keys
    )
  }
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
