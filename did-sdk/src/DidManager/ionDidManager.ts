import {
  IonDid,
  IonKey,
  IonPublicKeyPurpose,
  IonRequest,
} from '@decentralized-identity/ion-sdk'
import axios from 'axios'
import { Buffer } from 'buffer'
import { argon2id } from 'hash-wasm'
import urljoin from 'url-join'
import { DidDocument, JwkEs256k } from './didDocument'
import { DidObject, IDidCreater } from './didManager'

const ACTION_PATH = {
  OPERATIONS: 'operations',
  IDENTIFIERS: 'identifiers',

  PROOF: 'proof-of-work-challenge',
}

/**
 * DID生成(ION Challengeあり版)
 */
export class IonDidCreaterWithChallenge implements IDidCreater {
  get key() {
    return 'ion-with-challenge'
  }

  async create({
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
    console.debug(
      'IonDidCreater.create: %s, %s, %s',
      endpointUrl,
      signingKeyId,
      key
    )

    // 鍵生成
    const recoveryKeyPair = await IonKey.generateEs256kOperationKeyPair()
    const updateKeyPair = await IonKey.generateEs256kOperationKeyPair()
    const signingDocKeyPair = await IonKey.generateEs256kDidDocumentKeyPair({
      id: signingKeyId,
      purposes: [
        IonPublicKeyPurpose.Authentication,
        IonPublicKeyPurpose.AssertionMethod,
      ],
    })

    // DID作成リクエスト
    const input = {
      document: {
        publicKeys: [signingDocKeyPair[0]],
      },
      updateKey: updateKeyPair[0],
      recoveryKey: recoveryKeyPair[0],
    }
    const createRequest = IonRequest.createCreateRequest(input)
    const longFormDid = IonDid.createLongFormDid(input)
    const longFormSuffixData = longFormDid.substring(
      longFormDid.lastIndexOf(':') + 1
    )
    console.debug('createRequest: %o', createRequest)

    // エンドポイントへリクエスト
    const createResponse = await this.submitIonRequest(
      urljoin(endpointUrl, ACTION_PATH.PROOF),
      urljoin(endpointUrl, ACTION_PATH.OPERATIONS),
      JSON.stringify(createRequest)
    )

    // DidObjectにして返却
    return DidObject.createByDidString(
      createResponse.didDocument.id,
      longFormSuffixData,
      signingKeyId,
      createResponse.didDocumentMetadata.method.published,
      {
        signing: {
          public: signingDocKeyPair[0].publicKeyJwk as JwkEs256k,
          private: signingDocKeyPair[1],
        },
        update: { public: updateKeyPair[0], private: updateKeyPair[1] },
        recovery: { public: recoveryKeyPair[0], private: recoveryKeyPair[1] },
      }
    )
  }

  private async submitIonRequest(
    getChallengeUri: string,
    solveChallengeUri: string,
    requestBody: string
  ) {
    // Challengeリクエスト
    const challengeResponse = await axios.get(getChallengeUri)
    if (challengeResponse.status !== 200) {
      throw Error(challengeResponse.statusText)
    }
    console.debug('challengeResponse: %o', challengeResponse.data)

    const challengeNonce = challengeResponse.data.challengeNonce
    const largestAllowedHash = challengeResponse.data.largestAllowedHash
    const validDuration =
      challengeResponse.data.validDurationInMinutes * 60 * 1000

    // Answer生成
    const startTime = Date.now()
    let answerHash = ''
    let answerNonce = ''
    do {
      answerNonce = this.randomHexString()
      answerHash = await argon2id({
        password: Buffer.from(answerNonce, 'hex').toString() + requestBody,
        salt: Buffer.from(challengeNonce, 'hex'),
        parallelism: 1,
        iterations: 1,
        memorySize: 1000,
        hashLength: 32, // output size = 32 bytes
        outputType: 'hex',
      })
      console.log(answerHash)
      console.log(largestAllowedHash)
    } while (
      answerHash > largestAllowedHash &&
      Date.now() - startTime < validDuration
    )
    if (Date.now() - startTime > validDuration) {
      throw Error('ValidDuration Over')
    }

    // Createリクエスト
    const createResponse = await axios.post(solveChallengeUri, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Challenge-Nonce': challengeNonce,
        'Answer-Nonce': answerNonce,
      },
    })
    if (createResponse.status !== 200) {
      throw Error(createResponse.statusText)
    }
    console.debug('createResponse: %o', createResponse.data)
    return createResponse.data as DidDocument
  }

  private randomHexString() {
    const size = Math.floor(Math.random() * Math.floor(500))
    const randomString = [...Array(size)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('')
    return Buffer.from(randomString).toString('hex')
  }
}

/**
 * DID生成(ION Challengeなし版)
 */
export class IonDidCreaterNoChallenge implements IDidCreater {
  get key() {
    return 'ion-no-challenge'
  }

  async create({
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
    console.debug(
      'IonDidCreater.create: %s, %s, %s',
      endpointUrl,
      signingKeyId,
      key
    )

    // 鍵生成
    const recoveryKeyPair = await IonKey.generateEs256kOperationKeyPair()
    const updateKeyPair = await IonKey.generateEs256kOperationKeyPair()
    const signingDocKeyPair = await IonKey.generateEs256kDidDocumentKeyPair({
      id: signingKeyId,
      purposes: [
        IonPublicKeyPurpose.Authentication,
        IonPublicKeyPurpose.AssertionMethod,
      ],
    })

    // DID作成リクエスト
    const input = {
      document: {
        publicKeys: [signingDocKeyPair[0]],
      },
      updateKey: updateKeyPair[0],
      recoveryKey: recoveryKeyPair[0],
    }
    const createRequest = IonRequest.createCreateRequest(input)
    const longFormDid = IonDid.createLongFormDid(input)
    const longFormSuffixData = longFormDid.substring(
      longFormDid.lastIndexOf(':') + 1
    )
    console.debug('createRequest: %o', createRequest)

    // エンドポイントへリクエスト
    const createResponse = await this.submitIonRequest(
      urljoin(endpointUrl, ACTION_PATH.OPERATIONS),
      JSON.stringify(createRequest)
    )

    // DidObjectにして返却
    return DidObject.createByDidString(
      createResponse.didDocument.id,
      longFormSuffixData,
      signingKeyId,
      createResponse.didDocumentMetadata.method.published,
      {
        signing: {
          public: signingDocKeyPair[0].publicKeyJwk as JwkEs256k,
          private: signingDocKeyPair[1],
        },
        update: { public: updateKeyPair[0], private: updateKeyPair[1] },
        recovery: { public: recoveryKeyPair[0], private: recoveryKeyPair[1] },
      }
    )
  }

  private async submitIonRequest(
    solveChallengeUri: string,
    requestBody: string
  ) {
    // Createリクエスト
    const createResponse = await axios.post(solveChallengeUri, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (createResponse.status !== 200) {
      throw Error(createResponse.statusText)
    }
    console.debug('createResponse: %o', createResponse.data)
    return createResponse.data as DidDocument
  }
}
