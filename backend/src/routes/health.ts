import { Router } from 'express'
import { ok } from '../utils/http.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json(ok({ status: 'ok', uptime: process.uptime() }, 'Health check'))
})

export default router
