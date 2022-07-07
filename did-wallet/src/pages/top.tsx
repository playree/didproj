import * as React from 'react'
import { Typography, Container } from '@mui/material'

export const PageTop = () => {
  return (
    <Container maxWidth="sm" sx={{ paddingX: '8px' }}>
      <Typography variant="h5" sx={{ marginBottom: '16px' }}>
        DID
      </Typography>
    </Container>
  )
}
