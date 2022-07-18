# DID SDK

- [DID SDK](#did-sdk)
- [構成](#構成)
- [プロトコル](#プロトコル)
    - [OpenID Connect for Verifiable Credential Issuance](#openid-connect-for-verifiable-credential-issuance)
        - [Endpoints](#endpoints)
            - [Server Metadata](#server-metadata)
            - [Credential Manifest](#credential-manifest)
            - [Credential Status](#credential-status)

# 構成

* DidManager
* DidOidc

# プロトコル

## OpenID Connect for Verifiable Credential Issuance

https://openid.net/specs/openid-connect-4-verifiable-credential-issuance-1_0-05.html

### Endpoints

#### Server Metadata

https://www.rfc-editor.org/rfc/rfc8414.html#section-3.1

`Server Metadata` の参照先。

```
/.well-known/openid-configuration
```

Issuerの識別子が `https://example.com/issuer1` のようなパスが含まれる場合、  
一つのIssuerで複数のVCを扱う場合もこのパス指定で分ける想定。

```
GET /.well-known/openid-configuration/issuer1 HTTP/1.1
Host: example.com
```

* credential_manifests
* credential_manifest_uris

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "issuer":"https://server.example.com",
  "authorization_endpoint":"https://server.example.com/connect/authorize",
  "token_endpoint":"https://server.example.com/connect/token",
  ...
  "credential_manifests":[
    {
        "id":"WA-DL-CLASS-A",
        "version":"0.1.0",
        "issuer":{
           "id":"did:example:123?linked-domains=3",
           "name":"Washington State Government"
         },
        "output_descriptors":[
           {
              "schema":"http://washington-state-schemas.org/1.0.0/driver-license.json",
              "id": "output descriptor 1"
           }
        ],
        "presentation_definition":{}
    }
  ]
}
```

#### Credential Manifest

`Credential Manifest` の仕様。

https://identity.foundation/credential-manifest/

#### Credential Status

https://www.w3.org/TR/vc-data-model/#status

```
"credentialStatus": {
  "id": "https://example.edu/status/24",
  "type": "CredentialStatusList2017"
}
```

https://w3c-ccg.github.io/vc-csl2017/

```
{
  "id": "https://dmv.example.gov/status/24,
  "description": "Status of example Department of Motor Vehicles credentials."
  "verifiableCredential": [{
    "claim": {
      "id": "http://dmv.example.gov/credentials/3732",
      "currentStatus": "Revoked",
      "statusReason": "Disciplinary action"
    },
    "issuer": "http://dmv.example.gov/",
    "issued": "2017-12-05T14:27:42Z",
    "proof": { ... }
  }, {
    "claim": {
      "id": "http://dmv.example.gov/credentials/2363",
      "currentStatus": "Suspended",
      "statusReason": "Investigation"
    },
    "issuer": "http://dmv.example.gov/",
    "issued": "2017-12-04T14:27:42Z",
    "proof": { ... }
  },
    // ... more status info here ...
  }],
  "proof": { ... }
}
```