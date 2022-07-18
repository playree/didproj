import { errorHandler } from './middlewares/errorHandler'
import { setViewRoutings } from './router'
import cors from 'cors'
import express from 'express'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 画面のルーティング
setViewRoutings(app)

// エラーハンドリング
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Start on http://localhost:${PORT}`)
})
