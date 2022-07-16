import cors from 'cors'
import { DidManager, IonDidCreaterWithChallenge, IonDidResolver } from 'did-sdk'
import express from 'express'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const didMgr = new DidManager(
  [new IonDidCreaterWithChallenge()],
  [new IonDidResolver()]
)

app.get('/test', async (req: express.Request, res: express.Response) => {
  const result = await didMgr.resolveDid(
    'did:ion:EiDVUQ5t0urJOLPEcRTPMdKhRFDUlZucLSIC4VMkxZQ0eg'
  )
  console.log(result)
  res.send('OK')
})

app.listen(PORT, () => {
  console.log(`Start on http://localhost:${PORT}`)
})
