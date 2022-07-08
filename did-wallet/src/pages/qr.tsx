import * as React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  TextField,
} from '@mui/material'
import { QrReader } from 'react-qr-reader'
import { useDidContext, useSettingsContext } from '../layout/sideMenuLayout'
import base64url from 'base64url'

const STATUS = {
  QR_READ: 0,
  QR_READED: 1,
}

export const PageQr = () => {
  const [status, setStatus] = React.useState(STATUS.QR_READ)
  const [qrText, setQrText] = React.useState('')
  const [inputText, setInputText] = React.useState('')

  const didContext = useDidContext()
  const settingsContext = useSettingsContext()
  const navigate = useNavigate()

  if (!didContext.didModel) {
    return <Navigate to="/" replace />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    switch (e.target.id) {
      case 'input-text':
        setInputText(() => e.target.value)
        break
    }
  }

  const manualInput = async () => {
    startOpenid(inputText)
  }

  const startOpenid = async (requestUrl: string) => {
    if (!settingsContext.settings) {
      return
    }
    if (!didContext.didModel) {
      return
    }

    if (requestUrl.indexOf('openid://') !== 0) {
      alert('openid:// 形式のみ有効です')
      return
    }

    navigate('/openid/' + base64url.encode(requestUrl))
  }

  const qr = (
    <QrReader
      constraints={{ facingMode: 'environment' }}
      onResult={(result) => {
        if (result) {
          console.log(result)
          setQrText(result.getText())
          setStatus(STATUS.QR_READED)

          if (result.getText().indexOf('openid://vc') === 0) {
            startOpenid(result.getText())
          }
        }
      }}
    />
  )

  const qrResult = (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">QR読み取り結果</Typography>
        <Typography sx={{ wordWrap: 'break-word', marginTop: '16px' }}>
          {qrText}
        </Typography>
      </CardContent>
    </Card>
  )

  return (
    <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
      <Typography variant="h5" sx={{ marginBottom: '16px' }}>
        QR読み取り
      </Typography>
      <Container maxWidth="sm">
        {status === STATUS.QR_READED ? qrResult : qr}
      </Container>
      <Container maxWidth="sm" sx={{ marginTop: '16px' }}>
        <TextField
          id="input-text"
          label="URL(openid://)"
          fullWidth
          multiline
          maxRows={6}
          size="small"
          value={inputText}
          onChange={handleChange}
        />
        <Button
          variant="contained"
          sx={{ marginTop: '8px' }}
          onClick={manualInput}
        >
          手入力
        </Button>
      </Container>
    </Container>
  )
}
