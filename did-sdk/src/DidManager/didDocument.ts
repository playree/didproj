/**
 * Jwk(Es256k)
 */
export interface JwkEs256k {
  kty: string
  crv: string
  x: string
  y: string
  d?: string
}

/**
 * DID Document
 */
export interface DidDocument {
  '@context': string | string[]
  didDocument: {
    id: string
    verificationMethod: {
      id: string
      controller: string
      type: string
      publicKeyJwk: JwkEs256k
    }[]
  }
  didDocumentMetadata: {
    method: {
      published: boolean
      recoveryCommitment?: string
      updateCommitment?: string
    }
    equivalentId?: string[]
  }
}
