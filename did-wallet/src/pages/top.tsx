import { DidModel, DidTool, PrivateKeyTool, VcTool } from '../helpers/didTools'
import { Settings } from '../helpers/settings'
import {
  useNowLoadingContext,
  useSettingsContext,
  useDidContext,
} from '../layout/sideMenuLayout'
import { Create as IconCreate } from '@mui/icons-material'
import {
  Typography,
  Container,
  Grid,
  Button,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardActions,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material'
import { DidManager, IonDidCreaterWithChallenge, IonDidResolver } from 'did-sdk'
import * as React from 'react'

export const PageTop = () => {
  const nowLoadingContext = useNowLoadingContext()
  const settingsContext = useSettingsContext()
  const didContext = useDidContext()

  const [openDidCreated, setOpenDidCreated] = React.useState(false)
  const [openDialog, setOpenDialog] = React.useState(false)
  const [textDialog, setTextDialog] = React.useState({ title: '', text: '' })

  React.useEffect(() => {
    if (!settingsContext.settings) {
      setup()
    }
  })

  const handleCloseDidCreated = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return
    }
    setOpenDidCreated(false)
  }

  /**
   * 各種読み込み
   */
  const setup = async () => {
    nowLoadingContext.setNowLoading(true)

    // 設定の読み込み
    const settings = await Settings.load()
    settingsContext.setSettings(settings)

    // DID Managerのセット
    didContext.didManage.didMgr = new DidManager(
      [new IonDidCreaterWithChallenge()],
      [new IonDidResolver()]
    )
    // DIDの読み込み
    didContext.didManage.didModel = await DidTool.load()

    // DID Manageのセット
    didContext.setDidManage(didContext.didManage)

    setTimeout(() => {
      nowLoadingContext.setNowLoading(false)
    }, 300)
  }

  const registerDid = async () => {
    if (!settingsContext.settings || !didContext.didManage.didMgr) {
      return
    }
    nowLoadingContext.setNowLoading(true)

    // DID発行
    try {
      const didObject = await didContext.didManage.didMgr.createDid({
        signingKeyId: 'sign-primary-key',
      })

      // 発行した各種情報を保存
      await PrivateKeyTool.save(
        didObject.signingKeyId,
        didObject.keys.signing.private
      )
      if (didObject.keys.recovery) {
        await PrivateKeyTool.save(
          PrivateKeyTool.RESERVE_ID.RECOVERY,
          didObject.keys.recovery.private
        )
      }
      if (didObject.keys.update) {
        await PrivateKeyTool.save(
          PrivateKeyTool.RESERVE_ID.UPDATE,
          didObject.keys.update.private
        )
      }

      // DID Modelを保存
      didContext.didManage.didModel = DidModel.createByDidObject(didObject)
      await DidTool.save(didContext.didManage.didModel)

      // コンテキストにも反映
      didContext.setDidManage(didContext.didManage)

      setOpenDidCreated(true)
    } catch (e) {
      console.error(e)
      alert('DIDの発行に失敗しました。')
    }

    setTimeout(() => {
      nowLoadingContext.setNowLoading(false)
    }, 300)
  }

  const resolveDid = async () => {
    if (!didContext.didManage.didModel) {
      return
    }
    return await _resolveDid(didContext.didManage.didModel.didShort)
  }

  const resolveDidLong = async () => {
    if (!didContext.didManage.didModel) {
      return
    }
    return await _resolveDid(didContext.didManage.didModel.didLong)
  }

  const _resolveDid = async (did: string) => {
    if (
      !settingsContext.settings ||
      !didContext.didManage.didMgr ||
      !didContext.didManage.didModel
    ) {
      return
    }

    nowLoadingContext.setNowLoading(true)

    let resolveResponse = ''
    try {
      const resolveDid = await didContext.didManage.didMgr.resolveDid(did)
      resolveResponse = JSON.stringify(resolveDid, null, 2)
      if (!didContext.didManage.didModel.published) {
        if (resolveDid.didDocumentMetadata.method.published) {
          // publishedの更新
          didContext.didManage.didModel.published = true
          didContext.setDidManage(didContext.didManage)
          await DidTool.save(didContext.didManage.didModel)
        }
      }
    } catch {
      resolveResponse = 'DID Not found'
    }

    setTimeout(() => {
      setTextDialog({
        title: 'DID検証レスポンス',
        text: resolveResponse,
      })
      setOpenDialog(true)
      nowLoadingContext.setNowLoading(false)
    }, 500)
  }

  const deleteDid = async () => {
    nowLoadingContext.setNowLoading(true)

    // 発行した各種情報を削除
    await VcTool.clear()
    await PrivateKeyTool.clear()
    await DidTool.clear()

    // コンテキストにも反映
    didContext.didManage.didModel = null
    didContext.setDidManage(didContext.didManage)

    setTimeout(() => {
      nowLoadingContext.setNowLoading(false)
    }, 300)
  }

  const closeDialog = async () => {
    setOpenDialog(false)
  }

  if (!didContext.didManage.didModel) {
    return (
      <>
        <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
          <Typography variant="h5" sx={{ marginBottom: '16px' }}>
            DID
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              DIDが発行されていません。
            </Grid>
            <Grid container item xs={12} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                startIcon={<IconCreate />}
                onClick={registerDid}
              >
                DID発行
              </Button>
            </Grid>
          </Grid>
        </Container>
        <Snackbar
          open={openDidCreated}
          autoHideDuration={6000}
          onClose={handleCloseDidCreated}
        >
          <Alert
            onClose={handleCloseDidCreated}
            severity="success"
            sx={{ width: '100%' }}
          >
            DIDを発行しました。
          </Alert>
        </Snackbar>
      </>
    )
  }

  const published = didContext.didManage.didModel.published ? (
    <Chip label="公開済" color="success" />
  ) : (
    <Chip label="未公開" color="warning" />
  )
  return (
    <>
      <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
        <Typography variant="h5" sx={{ marginBottom: '16px' }}>
          DID
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <TextField
                  label="DID"
                  fullWidth
                  multiline
                  value={didContext.didManage.didModel.didShort}
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <Container fixed sx={{ marginTop: '8px', textAlign: 'right' }}>
                  {published}
                </Container>
              </CardContent>
              <Divider sx={{ marginX: '8px' }} />
              <CardActions>
                <Button size="small" onClick={resolveDid}>
                  DIDを検証
                </Button>
                <Button size="small" onClick={resolveDidLong}>
                  DID(Long)を検証
                </Button>
                <Button size="small" color="error" onClick={deleteDid}>
                  削除
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={openDidCreated}
        autoHideDuration={6000}
        onClose={handleCloseDidCreated}
      >
        <Alert
          onClose={handleCloseDidCreated}
          severity="success"
          sx={{ width: '100%' }}
        >
          DIDを発行しました。
        </Alert>
      </Snackbar>
      <Dialog
        fullWidth={true}
        maxWidth="sm"
        open={openDialog}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          {textDialog.title}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="DID"
            fullWidth
            multiline
            maxRows={16}
            value={textDialog.text}
            InputProps={{
              readOnly: true,
              sx: { fontSize: '11px' },
            }}
            sx={{ marginTop: '8px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
