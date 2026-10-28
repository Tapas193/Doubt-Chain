import { env } from './config/env.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import fs from 'fs'
import { fileURLToPath } from 'url'

import healthRouter from './routes/health.js'
import aiRouter from './routes/ai.js'
import authRouter from './routes/auth.js'
import subjectsRouter from './routes/subjects.js'
import doubtsRouter from './routes/doubts.js'
import answersRouter from './routes/answers.js'
import faqRouter from './routes/faq.js'
import uploadRouter from './routes/uploads.js'
import analyticsRouter from './routes/analytics.js'
import communityRouter from './routes/community.js'
import notificationRouter from './routes/notifications.js'

import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
)

const rawAllowedOrigins = [
  env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174'
]

const allowedOrigins = rawAllowedOrigins
  .flatMap((o) => (o ? o.split(',').map((item) => item.trim()) : []))
  .map((o) => o.replace(/\/$/, ''))

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      const normalized = origin.replace(/\/$/, '')
      if (allowedOrigins.includes(normalized)) return callback(null, true)
      return callback(null, false)
    },
    credentials: true
  })
)

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'development' || env.NODE_ENV === 'test' ? 5000 : 100,
    standardHeaders: true,
    skip: (req) =>
      Boolean(
        env.NODE_ENV === 'development' &&
        (
          req.ip === '127.0.0.1' ||
          req.ip === '::1' ||
          req.ip?.includes('127.0.0.1')
        )
      )
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Serve static uploads
const uploadDir = fileURLToPath(new URL('../uploads', import.meta.url))

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

app.use('/uploads', express.static(uploadDir))

app.get('/', (_req, res) => {
  res.json({
    name: 'doubt-chain-backend',
    version: '0.1.0'
  })
})

// API routes
app.use('/api/v1/health', healthRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/subjects', subjectsRouter)
app.use('/api/v1/doubts', doubtsRouter)
app.use('/api/v1/answers', answersRouter)
app.use('/api/v1/faq', faqRouter)
app.use('/api/v1/ai', aiRouter)
app.use('/api/v1/uploads', uploadRouter)
app.use('/api/v1/analytics', analyticsRouter)
app.use('/api/v1/communities', communityRouter)
app.use('/api/v1/notifications', notificationRouter)

// Centralized error handler — keep this last
app.use(errorHandler)

export default app