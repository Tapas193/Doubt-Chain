import { Router } from 'express'
import { list, markRead, markAllRead } from '../controllers/notification.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

router.get('/', requireAuth, asyncWrap(list))
router.post('/read-all', requireAuth, asyncWrap(markAllRead))
router.post('/:id/read', requireAuth, asyncWrap(markRead))

export default router
