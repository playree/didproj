import express from 'express'
import cors from 'cors'
import { DidTool } from 'did-sdk'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/test', async (req: express.Request, res: express.Response) => {
  const result = await DidTool.resolve('https://www.google.com/')
  console.log(result)
  res.send('OK')
})

app.listen(PORT, () => {
  console.log(`Start on http://localhost:${PORT}`)
})
