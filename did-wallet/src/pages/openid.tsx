import * as React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Typography,
  Container,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Avatar,
  Grid,
} from '@mui/material'
import * as QueryString from 'query-string'
import {
  VerifiableTool,
  DidTool,
  PrivateKeyTool,
  VcTool,
  JWTObject,
  VcModel,
} from '../helpers/didTools'
import {
  useDidContext,
  useSettingsContext,
  useNowLoadingContext,
} from '../layout/sideMenuLayout'
import * as uuid from 'uuid'
import { useParams } from 'react-router'
import base64url from 'base64url'
import { Settings } from '../helpers/settings'

// @todo
const STATUS = {
  INIT: 0,
  START: 1,
  SIOP_VC_CONFIRM: 11,
  SIOP_VC_RECEIVED: 12,
  SIOP_VP_CONFIRM: 21,
  SIOP_VP_VERIFIED: 22,
  SIOP_VP2_CONFIRM: 31,
  SIOP_VP2_VERIFIED: 32,
}

type Params = {
  param: string
}

export const PageOpenid = () => {
  const search = useLocation().search
  const { param } = useParams<Params>()
  const [status, setStatus] = React.useState(STATUS.INIT)
  const [inputPin, setInputPin] = React.useState('')
  const [vcProcess, setVcProcess] = React.useState({
    credentialOffer: {} as JWTObject,
    vcExpert: {} as JWTObject,
  })
  const [vpProcess, setVpProcess] = React.useState({
    credentialOffer: {} as JWTObject,
    vcList: [] as VcModel[],
  })

  const didContext = useDidContext()
  const settingsContext = useSettingsContext()
  const nowLoadingContext = useNowLoadingContext()
  const navigate = useNavigate()

  React.useEffect(() => {
    console.log(status)
    switch (status) {
      case STATUS.INIT:
        nowLoadingContext.setNowLoading(true)
        init()
        break
      case STATUS.START:
        handleProc()
        break
    }
  }, [status])

  const init = async () => {
    if (status === STATUS.INIT) {
      // 設定の読み込み
      settingsContext.setSettings(await Settings.load())

      // DIDの読み込み
      const didModel = await DidTool.load()
      if (didModel) {
        didContext.setDidModel(didModel)
      }
      setStatus(STATUS.START)
    }
  }

  const handleProc = async () => {
    // setStatus(STATUS.START);
    if (param) {
      // 設定の読み込み
      settingsContext.setSettings(await Settings.load())

      // DIDの読み込み
      const didModel = await DidTool.load()
      if (didModel) {
        didContext.setDidModel(didModel)
      }

      const requestUrl = base64url.decode(param)
      if (requestUrl.indexOf('openid://vc/') === 0) {
        procVc(requestUrl)
        return
      }
      if (requestUrl.indexOf('openid://vc2/') === 0) {
        issueVc2(requestUrl)
        return
      }
      if (requestUrl.indexOf('openid://vc3/') === 0) {
        verifyVc2(requestUrl)
        return
      }
      if (requestUrl.indexOf('openidres://vc2/') === 0) {
        resVc2(requestUrl)
        return
      }
    }

    navigate('/')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    switch (e.target.id) {
      case 'input-pin':
        setInputPin(() => e.target.value)
        break
    }
  }

  const issueVc2 = async (requestUrl: string) => {
    const parsed = QueryString.parseUrl(requestUrl)
    const url = new URL(parsed.query.request_uri as string)
    url.searchParams.append('response_type', 'code')
    url.searchParams.append('client_id', 'xxx')
    url.searchParams.append('scope', 'idToken')
    url.searchParams.append('nonce', 'xxx')
    url.searchParams.append(
      'redirect_uri',
      `${window.location.origin}/openid/` +
        base64url.encode('openidres://vc2/#' + url.origin)
    )
    url.searchParams.append(
      'authorization_details',
      JSON.stringify({
        type: 'openid_credential',
        credential_type: 'https://ssird-issuer.com/nameCard',
        format: 'jwt_vc',
      })
    )
    window.location.href = url.toString()
  }

  const resVc2 = async (requestUrl: string) => {
    if (!settingsContext.settings) {
      return
    }
    if (!didContext.didModel) {
      return
    }

    try {
      const issuerOrigin = requestUrl.split('#')[1]

      const query = new URLSearchParams(search)

      const resToken = await fetch(`${issuerOrigin}/token`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'suthorization_code',
          client_id: 'xxx',
          client_secret: 'yyy',
          code: query.get('code'),
        }),
      })
      const tokenObj = await resToken.json()
      console.log(tokenObj)

      // 自身の公開鍵を取得
      // const didInfo = await DidTool.resolve(settingsContext.settings.urlResolve, didContext.didModel.did);
      const now = Math.floor(Date.now() / 1000)

      const reqVc = {
        header: {
          alg: 'ES256K',
          typ: 'JWT',
          kid: didContext.didModel.kid,
        },
        payload: {
          iss: 'xxx',
          aud: 'https://ssird-issuer.com',
          iat: now,
          exp: now + 600,
          nonce: tokenObj.nonce,
        },
      }

      console.log(reqVc)

      // 秘密鍵で署名
      const privateKeyModel = await PrivateKeyTool.load(
        didContext.didModel.signingKeyId
      )
      const reqVcJws = await VerifiableTool.signJws(
        reqVc.header,
        reqVc.payload,
        privateKeyModel?.privateKey
      )

      const resVc = await fetch(`${issuerOrigin}/vc`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenObj.access_token}`,
        },
        body: JSON.stringify({
          proof_type: 'jwt',
          jwt: reqVcJws,
        }),
      })
      const vcObj = await resVc.json()
      console.log(vcObj)

      const jwt = VerifiableTool.decodeJws(vcObj.credential)
      console.log(jwt)

      // 署名検証
      if (
        !(await VerifiableTool.verifyJwsByDid(
          jwt,
          settingsContext.settings.urlResolve
        ))
      ) {
        throw new Error('verifyJwsByDid NG: CredentialOffer')
      }
      console.log('verifyJwsByDid OK')

      // VCの保存
      await VcTool.save(jwt)

      setStatus(STATUS.SIOP_VC_RECEIVED)
    } catch (e: unknown) {
      console.error(e)
      alert(e)
    }

    setTimeout(() => {
      nowLoadingContext.setNowLoading(false)
    }, 300)
  }

  const verifyVc2 = async (requestUrl: string) => {
    try {
      nowLoadingContext.setNowLoading(true)

      if (!settingsContext.settings) {
        throw new Error('Not initialized')
      }

      const parsed = QueryString.parseUrl(requestUrl)
      const jwt = VerifiableTool.decodeJws(parsed.query.request as string)
      console.log(jwt)

      // 署名検証
      if (
        !(await VerifiableTool.verifyJwsByDid(
          jwt,
          settingsContext.settings.urlResolve
        ))
      ) {
        // throw new Error('verifyJwsByDid NG: CredentialOffer');
        alert('verifyJwsByDid NG')
      }
      console.log('verifyJwsByDid OK')

      // 2. 対象のVCを抽出
      const vcList = await VcTool.all()
      if (!vcList.length) {
        throw Error('VC not found.')
      }

      // 情報を一時保存
      setVpProcess({
        credentialOffer: jwt,
        vcList,
      })
      setStatus(STATUS.SIOP_VP2_CONFIRM)
    } catch (e: unknown) {
      console.error(e)
      alert(e)
    }

    // ここで内容をユーザーに提示し、確認を行う
    setTimeout(() => {
      nowLoadingContext.setNowLoading(false)
    }, 300)
  }

  const getCredentialOffer = async (url: string) => {
    if (!settingsContext.settings) {
      throw new Error('Not initialized')
    }

    // 取得
    const parsed = QueryString.parseUrl(url)
    const response = await fetch(parsed.query.request_uri as string)
    const body = await response.text()
    const jwt = VerifiableTool.decodeJws(body)
    console.log(jwt)

    // 署名検証
    if (
      !(await VerifiableTool.verifyJwsByDid(
        jwt,
        settingsContext.settings.urlResolve
      ))
    ) {
      throw new Error('verifyJwsByDid NG: CredentialOffer')
    }
    console.log('verifyJwsByDid OK')

    return jwt
  }

  const getVCExpert = async (url: string) => {
    if (!settingsContext.settings) {
      throw new Error('Not initialized')
    }

    const response = await fetch(url)
    const resJson = await response.json()
    const jwt = VerifiableTool.decodeJws(resJson.token)
    console.log(jwt)

    // 署名検証
    if (
      !(await VerifiableTool.verifyJwsByDid(
        jwt,
        settingsContext.settings.urlResolve
      ))
    ) {
      throw new Error('verifyJwsByDid NG: CredentialOffer')
    }
    console.log('verifyJwsByDid OK')

    return jwt
  }

  const procVc = async (requestUrl: string) => {
    if (requestUrl.indexOf('openid://vc/') !== 0) {
      alert('openid://vc/ 形式のみ有効です')
      return
    }

    try {
      nowLoadingContext.setNowLoading(true)

      // 1. オファーリクエストを取得(Issure/Verifier→HolderへのSIOP Request)
      const credentialOffer = await getCredentialOffer(requestUrl)

      if (
        credentialOffer.payload.prompt &&
        credentialOffer.payload.prompt === 'create'
      ) {
        issueVc(credentialOffer)
      } else {
        verifyVc(credentialOffer)
      }
    } catch (e: unknown) {
      console.error(e)
      alert(e)
      nowLoadingContext.setNowLoading(false)
    }
  }

  const verifyVc = async (credentialOffer: JWTObject) => {
    try {
      // 2. 対象のVCを抽出
      const vcList = await VcTool.all()
      if (!vcList.length) {
        throw Error('VC not found.')
      }

      // 情報を一時保存
      setVpProcess({
        credentialOffer,
        vcList,
      })
      setStatus(STATUS.SIOP_VP_CONFIRM)
    } catch (e: unknown) {
      console.error(e)
      alert(e)
    }

    // ここで内容をユーザーに提示し、確認を行う
    setTimeout(() => {
      nowLoadingContext.setNowLoading(false)
    }, 300)
  }

  const issueVc = async (credentialOffer: JWTObject) => {
    try {
      // 2. オファーリクエストの検証
      const manifestUrl =
        credentialOffer.payload.claims.vp_token.presentation_definition
          .input_descriptors[0].issuance[0].manifest2
      const vcExpert = await getVCExpert(manifestUrl)

      // 情報を一時保存
      setVcProcess({
        credentialOffer,
        vcExpert,
      })
      setStatus(STATUS.SIOP_VC_CONFIRM)
    } catch (e: unknown) {
      console.error(e)
      alert(e)
    }

    // ここで内容をユーザーに提示し、確認を行う
    setTimeout(() => {
      nowLoadingContext.setNowLoading(false)
    }, 300)
  }

  const addVC = async () => {
    if (!settingsContext.settings) {
      return
    }
    if (!didContext.didModel) {
      return
    }

    // 3. レスポンス(Holder→IssureへのSIOP Response)

    try {
      nowLoadingContext.setNowLoading(true)

      // 自身の公開鍵を取得
      const didInfo = await DidTool.resolve(
        settingsContext.settings.urlResolve,
        didContext.didModel.did
      )
      const now = Math.floor(Date.now() / 1000)

      const credentialRequest = {
        header: {
          alg: 'ES256K',
          typ: 'JWT',
          kid: didContext.didModel.kid,
        },
        payload: {
          iss: 'https://self-issued.me',
          aud: vcProcess.vcExpert.payload.input.credentialIssuer,
          contract: vcProcess.vcExpert.payload.display.contract,
          iat: now,
          exp: now + 600,
          sub_jwk: JSON.parse(
            JSON.stringify(
              didInfo.didDocument.verificationMethod[0].publicKeyJwk
            )
          ),
          sub: VerifiableTool.generateSub(
            didInfo.didDocument.verificationMethod[0].publicKeyJwk
          ),
          jti: uuid.v4(),
          did: didContext.didModel.did,
          pin: VerifiableTool.generateHash(inputPin),
          attestations: {
            idTokens: {
              'https://self-issued.me':
                vcProcess.credentialOffer.payload.id_token_hint,
            },
          },
        },
      }

      // To Micfosoft向けの置換
      if (credentialRequest.payload.aud.indexOf('/api/issuer/card') > -1) {
        credentialRequest.payload.aud =
          'https://beta.did.msidentity.com/v1.0/f55d947c-0f8e-48d7-b1ea-b7f5c99291ce/verifiableCredential/card/issue'
      }

      console.log(credentialRequest)

      // 秘密鍵で署名
      const privateKeyModel = await PrivateKeyTool.load(
        didContext.didModel.signingKeyId
      )
      const credentialRequestJws = await VerifiableTool.signJws(
        credentialRequest.header,
        credentialRequest.payload,
        privateKeyModel?.privateKey
      )
      // console.log(credentialRequestJws);

      const response = await fetch(
        vcProcess.vcExpert.payload.input.credentialIssuer,
        {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          body: credentialRequestJws,
        }
      )

      if (response.status !== 200) {
        throw Error(await response.text())
      }

      const resJson = await response.json()
      const jwt = VerifiableTool.decodeJws(resJson.vc)
      console.log(jwt)

      // 署名検証
      if (
        !(await VerifiableTool.verifyJwsByDid(
          jwt,
          settingsContext.settings.urlResolve
        ))
      ) {
        throw new Error('verifyJwsByDid NG: CredentialOffer')
      }
      console.log('verifyJwsByDid OK')

      // VCの保存
      await VcTool.save(jwt)

      setStatus(STATUS.SIOP_VC_RECEIVED)
    } catch (e: unknown) {
      console.error(e)
      alert(e)
    }

    setTimeout(() => {
      nowLoadingContext.setNowLoading(false)
    }, 300)
  }

  const sendVP = async () => {
    if (!settingsContext.settings) {
      return
    }
    if (!didContext.didModel) {
      return
    }

    // 3. レスポンス(Holder→VerifierへのSIOP Response)

    try {
      nowLoadingContext.setNowLoading(true)

      const now = Math.floor(Date.now() / 1000)

      const idToken = {
        header: {
          alg: 'ES256K',
          typ: 'JWT',
          kid: didContext.didModel.kid,
        },
        payload: {
          iss: 'https://self-issued.me/v2/openid-vc',
          aud: vpProcess.credentialOffer.payload.client_id,
          sub: didContext.didModel.did,
          iat: now,
          exp: now + 600,
          nonce: vpProcess.credentialOffer.payload.nonce,
          _vp_token: {
            presentation_submission: {
              id: uuid.v4(),
              definition_id: uuid.v4(),
              descriptor_map: [
                {
                  id: 'VerifiedCredentialExpert',
                  format: 'jwt_vp',
                  path: '$',
                  path_nested: {
                    id: 'VerifiedCredentialExpert',
                    format: 'jwt_vc',
                    path: '$.verifiableCredential[0]',
                  },
                },
              ],
            },
          },
        },
      }

      console.log(idToken)

      // 秘密鍵で署名
      const privateKeyModel = await PrivateKeyTool.load(
        didContext.didModel.signingKeyId
      )
      const idTokenJws = await VerifiableTool.signJws(
        idToken.header,
        idToken.payload,
        privateKeyModel?.privateKey
      )

      const vpToken = {
        header: {
          alg: 'ES256K',
          typ: 'JWT',
          kid: didContext.didModel.kid,
        },
        payload: {
          iss: didContext.didModel.did,
          aud: vpProcess.credentialOffer.payload.client_id,
          iat: now,
          nbf: now,
          exp: now + 600,
          nonce: vpProcess.credentialOffer.payload.nonce,
          vp: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            verifiableCredential: [vpProcess.vcList[0].vc.jws],
          },
        },
      }

      console.log(vpToken)

      // 秘密鍵で署名
      // const privateKeyModel = await PrivateKeyTool.load(didContext.didModel.signingKeyId);
      const vpTokenJws = await VerifiableTool.signJws(
        vpToken.header,
        vpToken.payload,
        privateKeyModel?.privateKey
      )

      const params = new URLSearchParams()
      params.append('id_token', idTokenJws)
      params.append('vp_token', vpTokenJws)
      params.append('state', vpProcess.credentialOffer.payload.state)

      const response = await fetch(
        vpProcess.credentialOffer.payload.redirect_uri,
        {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          body: params,
        }
      )

      if (response.status !== 200) {
        throw Error(await response.text())
      }

      setStatus(STATUS.SIOP_VP_VERIFIED)
    } catch (e: unknown) {
      console.error(e)
      alert(e)
    }

    setTimeout(() => {
      nowLoadingContext.setNowLoading(false)
    }, 300)
  }

  const sendVP2 = async () => {
    if (!settingsContext.settings) {
      return
    }
    if (!didContext.didModel) {
      return
    }

    // 3. レスポンス(Holder→VerifierへのSIOP Response)

    try {
      nowLoadingContext.setNowLoading(true)

      // 自身の公開鍵を取得
      const didInfo = await DidTool.resolve(
        settingsContext.settings.urlResolve,
        didContext.didModel.did
      )
      const now = Math.floor(Date.now() / 1000)

      const idToken = {
        header: {
          alg: 'ES256K',
          typ: 'JWT',
          kid: didContext.didModel.kid,
        },
        payload: {
          iss: 'https://self-issued.me/v2',
          aud: vpProcess.credentialOffer.payload.client_id,
          sub: VerifiableTool.generateSub(
            didInfo.didDocument.verificationMethod[0].publicKeyJwk
          ),
          sub_jwk: JSON.parse(
            JSON.stringify(
              didInfo.didDocument.verificationMethod[0].publicKeyJwk
            )
          ),
          iat: now,
          exp: now + 600,
          auth_time: now,
          nonce: vpProcess.credentialOffer.payload.nonce,
          _vp_token: {
            presentation_submission: {
              id: uuid.v4(),
              definition_id: uuid.v4(),
              descriptor_map: [
                {
                  id: 'VerifiedCredentialExpert',
                  format: 'ldp_vp',
                  path: '$',
                  path_nested: {
                    format: 'ldp_vc',
                    path: '$.verifiableCredential[0]',
                  },
                },
              ],
            },
          },
        },
      }

      console.log(idToken)

      // 秘密鍵で署名
      const privateKeyModel = await PrivateKeyTool.load(
        didContext.didModel.signingKeyId
      )
      const idTokenJws = await VerifiableTool.signJws(
        idToken.header,
        idToken.payload,
        privateKeyModel?.privateKey
      )

      const vpToken = {
        header: {
          alg: 'ES256K',
          typ: 'JWT',
          kid: didContext.didModel.kid,
        },
        payload: {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiablePresentation'],
          verifiableCredential: [vpProcess.vcList[0].vc.payload],
          id: 'ebc6f1c2',
          holder: didContext.didModel.did,
          proof: {
            type: 'Ed25519Signature2018',
            created: new Date().toISOString(),
            challenge: vpProcess.credentialOffer.payload.nonce,
            domain: vpProcess.credentialOffer.payload.client_id,
            jws: vpProcess.vcList[0].vc.jws,
            proofPurpose: 'authentication',
            verificationMethod: didContext.didModel.kid,
          },
        },
      }

      console.log(vpToken)

      // 秘密鍵で署名
      // const privateKeyModel = await PrivateKeyTool.load(didContext.didModel.signingKeyId);
      const vpTokenJws = await VerifiableTool.signJws(
        vpToken.header,
        vpToken.payload,
        privateKeyModel?.privateKey
      )

      const params = new URLSearchParams()
      params.append('id_token', idTokenJws)
      params.append('vp_token', vpTokenJws)
      params.append('state', vpProcess.credentialOffer.payload.state)

      const response = await fetch(
        vpProcess.credentialOffer.payload.client_id,
        {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          body: params,
        }
      )

      if (response.status !== 200) {
        throw Error(await response.text())
      }

      setStatus(STATUS.SIOP_VP2_VERIFIED)
    } catch (e: unknown) {
      console.error(e)
      alert(e)
    }

    setTimeout(() => {
      nowLoadingContext.setNowLoading(false)
    }, 300)
  }

  if (status === STATUS.SIOP_VC_RECEIVED) {
    return (
      <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
        <Typography variant="h5" sx={{ marginBottom: '16px' }}>
          VC受け取り完了
        </Typography>
        <Typography>VCをウォレットに登録しました。</Typography>
      </Container>
    )
  }

  if (status === STATUS.SIOP_VC_CONFIRM) {
    return (
      <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
        <Typography variant="h5" sx={{ marginBottom: '16px' }}>
          VC発行確認
        </Typography>
        <Card
          sx={{
            bgcolor: vcProcess.vcExpert.payload.display.card.backgroundColor,
            maxWidth: '360px',
            marginX: 'auto',
          }}
        >
          <CardHeader
            avatar={
              <Avatar src={vcProcess.vcExpert.payload.display.card.logo.uri} />
            }
            title={vcProcess.vcExpert.payload.display.card.title}
            sx={{ color: vcProcess.vcExpert.payload.display.card.textColor }}
          />
          <CardContent>
            <Typography
              sx={{ color: vcProcess.vcExpert.payload.display.card.textColor }}
            >
              <br />
              Microsoft
            </Typography>
          </CardContent>
        </Card>
        <Typography sx={{ marginTop: '16px' }}>
          {vcProcess.vcExpert.payload.display.consent.title}
        </Typography>
        <TextField
          id="input-pin"
          label="PIN"
          fullWidth
          sx={{ marginTop: '16px' }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          value={inputPin}
          onChange={handleChange}
        />
        <Grid container spacing={2} sx={{ marginTop: '16px' }}>
          <Grid item xs={6}>
            <Button variant="outlined" fullWidth onClick={() => navigate('/')}>
              キャンセル
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="contained" fullWidth onClick={addVC}>
              追加
            </Button>
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (status === STATUS.SIOP_VP_CONFIRM) {
    return (
      <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
        <Typography variant="h5" sx={{ marginBottom: '16px' }}>
          VC提示確認
        </Typography>
        <Card variant="outlined">
          <CardContent>
            <Typography sx={{ marginBottom: '16px' }}>提示条件</Typography>
            <TextField
              label="input_descriptors"
              fullWidth
              multiline
              maxRows={8}
              value={JSON.stringify(
                vpProcess.credentialOffer.payload.claims.vp_token
                  .presentation_definition.input_descriptors,
                null,
                2
              )}
              InputProps={{
                readOnly: true,
                sx: { fontSize: '12px' },
              }}
            />
          </CardContent>
        </Card>
        <Typography sx={{ marginTop: '16px' }}></Typography>
        <Grid container spacing={2} sx={{ marginTop: '16px' }}>
          <Grid item xs={6}>
            <Button variant="outlined" fullWidth onClick={() => navigate('/')}>
              キャンセル
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="contained" fullWidth onClick={sendVP}>
              提示
            </Button>
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (status === STATUS.SIOP_VP2_CONFIRM) {
    return (
      <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
        <Typography variant="h5" sx={{ marginBottom: '16px' }}>
          VC提示確認
        </Typography>
        <Card variant="outlined">
          <CardContent>
            <Typography sx={{ marginBottom: '16px' }}>提示条件</Typography>
            <TextField
              label="input_descriptors"
              fullWidth
              multiline
              maxRows={8}
              value={JSON.stringify(
                vpProcess.credentialOffer.payload.presentation_definition
                  .input_descriptors,
                null,
                2
              )}
              InputProps={{
                readOnly: true,
                sx: { fontSize: '12px' },
              }}
            />
          </CardContent>
        </Card>
        <Typography sx={{ marginTop: '16px' }}></Typography>
        <Grid container spacing={2} sx={{ marginTop: '16px' }}>
          <Grid item xs={6}>
            <Button variant="outlined" fullWidth onClick={() => navigate('/')}>
              キャンセル
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="contained" fullWidth onClick={sendVP2}>
              提示
            </Button>
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (
    status === STATUS.SIOP_VP_VERIFIED ||
    status === STATUS.SIOP_VP2_VERIFIED
  ) {
    return (
      <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
        <Typography variant="h5" sx={{ marginBottom: '16px' }}>
          VC提示完了
        </Typography>
        <Typography>VCの提示が完了しました。</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
      <Typography variant="h5" sx={{ marginBottom: '16px' }}>
        Loading . . .
      </Typography>
    </Container>
  )
}
