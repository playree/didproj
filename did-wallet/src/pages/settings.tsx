import * as React from 'react'
import {
  Typography,
  Container,
  Grid,
  Button,
  TextField,
  Snackbar,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { Save as IconSave } from '@mui/icons-material'

import { Settings } from '../helpers/settings'
import { useSettingsContext } from '../layout/sideMenuLayout'

export const PageSettings = () => {
  const settingsContext = useSettingsContext()

  const [open, setOpen] = React.useState(false)
  const [urlOperation, setUrlOperation] = React.useState('')
  const [urlResolve, setUrlResolve] = React.useState('')
  const [needChallenge, setNeedChallenge] = React.useState(true)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    switch (e.target.id) {
      case 'url-operation':
        setUrlOperation(() => e.target.value)
        break
      case 'url-resolve':
        setUrlResolve(() => e.target.value)
        break
      case 'need-challenge':
        setNeedChallenge(() => e.target.checked)
        break
    }
  }

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  const saveSettings = async () => {
    // 設定の保存
    const settings = new Settings()
    settings.urlOperation = urlOperation
    settings.urlResolve = urlResolve
    settings.needChallenge = needChallenge
    await settings.save()
    settingsContext.setSettings(settings)

    handleOpen()
  }

  const resetSettings = async () => {
    await Settings.clear()
    const settings = new Settings()
    settingsContext.setSettings(settings)
    setUrlOperation(settings.urlOperation)
    setUrlResolve(settings.urlResolve)
    setNeedChallenge(settings.needChallenge)
  }

  React.useEffect(() => {
    // 設定の読み込み
    Settings.load().then((settings) => {
      setUrlOperation(settings.urlOperation)
      setUrlResolve(settings.urlResolve)
      setNeedChallenge(settings.needChallenge)
    })
  }, [])

  return (
    <>
      <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
        <Typography variant="h5" sx={{ marginBottom: '16px' }}>
          Settings
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="url-operation"
              fullWidth
              label="Operation URL"
              variant="outlined"
              value={urlOperation}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  id="need-challenge"
                  checked={needChallenge}
                  onChange={handleChange}
                />
              }
              label="Need Challenge"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="url-resolve"
              fullWidth
              label="Resolve URL"
              variant="outlined"
              value={urlResolve}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={8}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<IconSave />}
              onClick={saveSettings}
            >
              保存
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={resetSettings}
            >
              リセット
            </Button>
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          設定を保存しました。
        </Alert>
      </Snackbar>
    </>
  )
}
