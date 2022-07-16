import { PrivateKeyTool } from '../helpers/didTools'
import { useDidContext } from '../layout/sideMenuLayout'
import { ExpandMore as IconExpandMore } from '@mui/icons-material'
import {
  Typography,
  Container,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import * as React from 'react'
import { Navigate } from 'react-router-dom'

export const PageDid = () => {
  const didContext = useDidContext()
  const [privateKeys, setPrivateKeys] = React.useState({
    signing: '',
    recovery: '',
    update: '',
  })

  React.useEffect(() => {
    if (!privateKeys.signing) {
      setup()
    }
  })

  const setup = async () => {
    if (didContext.didManage.didModel) {
      setPrivateKeys({
        signing: JSON.stringify(
          (
            await PrivateKeyTool.load(
              didContext.didManage.didModel.signingKeyId
            )
          )?.privateKey,
          null,
          2
        ),
        recovery: JSON.stringify(
          (await PrivateKeyTool.load(PrivateKeyTool.RESERVE_ID.RECOVERY))
            ?.privateKey,
          null,
          2
        ),
        update: JSON.stringify(
          (await PrivateKeyTool.load(PrivateKeyTool.RESERVE_ID.UPDATE))
            ?.privateKey,
          null,
          2
        ),
      })
    }
  }

  if (!didContext.didManage.didModel) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
        <Typography variant="h5" sx={{ marginBottom: '16px' }}>
          DID詳細
        </Typography>
        <Accordion>
          <AccordionSummary expandIcon={<IconExpandMore />}>
            <Typography>DID(Long)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              label="DID(Long)"
              fullWidth
              multiline
              maxRows={8}
              value={didContext.didManage.didModel.didLong}
              InputProps={{
                readOnly: true,
                sx: { fontSize: '12px' },
              }}
            />
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<IconExpandMore />}>
            <Typography>SigningPrivateKey</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              label="SigningPrivateKey"
              fullWidth
              multiline
              maxRows={8}
              value={privateKeys.signing}
              InputProps={{
                readOnly: true,
                sx: { fontSize: '12px' },
              }}
            />
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<IconExpandMore />}>
            <Typography>RecoveryPrivateKey</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              label="RecoveryPrivateKey"
              fullWidth
              multiline
              maxRows={8}
              value={privateKeys.recovery}
              InputProps={{
                readOnly: true,
                sx: { fontSize: '12px' },
              }}
            />
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<IconExpandMore />}>
            <Typography>UpdatePrivateKey</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              label="UpdatePrivateKey"
              fullWidth
              multiline
              maxRows={8}
              value={privateKeys.update}
              InputProps={{
                readOnly: true,
                sx: { fontSize: '12px' },
              }}
            />
          </AccordionDetails>
        </Accordion>
      </Container>
    </>
  )
}
