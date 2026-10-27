import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import subjectsRouter from './routes/subjects.js'
import doubtsRouter from './routes/doubts.js'
import answersRouter from './routes/answers.js'
import faqRouter from './routes/faq.js'
import { errorHandler } from './middleware/errorHandler.js'
import { env } from './config/env.js'

const app = express()

app.use(helmet())
const allowedOrigins = [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://localhost:5174']
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      return callback(null, false)
    },
    credentials: true
  })
)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())

app.get('/', (_req, res) => {
  res.json({ name: 'doubt-chain-backend', version: '0.1.0' })
})

app.use('/api/v1/health', healthRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/subjects', subjectsRouter)
app.use('/api/v1/doubts', doubtsRouter)
app.use('/api/v1/answers', answersRouter)
app.use('/api/v1/faq', faqRouter)

app.use(errorHandler)

export default app
