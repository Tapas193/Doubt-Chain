import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { ok } from '../utils/http.js'
import { HttpError } from '../middleware/errorHandler.js'
import { asyncWrap } from '../utils/asyncWrap.js'
import { extractTextFromImage, transcribeAudio } from '../services/ai.service.js'

import { fileURLToPath } from 'url'

const uploadDir = fileURLToPath(new URL('../../uploads', import.meta.url))
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const ALLOWED_IMAGE_MIMES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
}

const ALLOWED_AUDIO_MIMES: Record<string, string> = {
  'audio/webm': '.webm',
  'audio/mp4': '.mp4',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'audio/mpeg': '.mp3',
  'audio/x-m4a': '.m4a'
}

async function verifyMagicBytes(filePath: string, mime: string): Promise<boolean> {
  let fd: fs.promises.FileHandle | null = null
  try {
    fd = await fs.promises.open(filePath, 'r')
    const buffer = Buffer.alloc(16)
    const { bytesRead } = await fd.read(buffer, 0, 16, 0)
    if (bytesRead < 4) return false

    if (mime === 'image/jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    }
    if (mime === 'image/png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
    }
    if (mime === 'image/webp') {
      const riff = buffer.toString('ascii', 0, 4)
      const webp = bytesRead >= 12 ? buffer.toString('ascii', 8, 12) : ''
      return riff === 'RIFF' && webp === 'WEBP'
    }
    if (mime === 'audio/webm') {
      return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3
    }
    if (mime === 'audio/ogg') {
      return buffer.toString('ascii', 0, 4) === 'OggS'
    }
    if (mime === 'audio/wav') {
      const riff = buffer.toString('ascii', 0, 4)
      const wave = bytesRead >= 12 ? buffer.toString('ascii', 8, 12) : ''
      return riff === 'RIFF' && wave === 'WAVE'
    }
    if (mime === 'audio/mp4' || mime === 'audio/x-m4a') {
      return bytesRead >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp'
    }
    if (mime === 'audio/mpeg') {
      const isId3 = buffer.toString('ascii', 0, 3) === 'ID3'
      const isSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0
      return isId3 || isSync
    }
    return true
  } finally {
    if (fd) await fd.close().catch(() => {})
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const rawMime = file.mimetype.toLowerCase()
    let ext = ALLOWED_IMAGE_MIMES[rawMime] || ALLOWED_AUDIO_MIMES[rawMime]
    if (!ext) {
      ext = path.extname(file.originalname).toLowerCase()
    }
    const safeExt = /^\.[a-z0-9]+$/i.test(ext) ? ext : '.bin'
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const mime = file.mimetype.toLowerCase()
    if (ALLOWED_IMAGE_MIMES[mime] || ALLOWED_AUDIO_MIMES[mime]) {
      cb(null, true)
    } else {
      cb(new HttpError(400, `Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, WebM, MP4, OGG, WAV, MP3.`))
    }
  }
})

const router = Router()

function uploadMiddleware(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError(400, 'File size exceeds maximum limit of 10MB'))
      }
      return next(new HttpError(400, err.message))
    }
    if (err) {
      return next(err)
    }
    next()
  })
}

router.post(
  '/',
  requireAuth,
  uploadMiddleware,
  asyncWrap(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new HttpError(400, 'No file uploaded')
    }

    const mime = req.file.mimetype.toLowerCase()
    const isValidSignature = await verifyMagicBytes(req.file.path, mime)
    if (!isValidSignature) {
      await fs.promises.unlink(req.file.path).catch(() => {})
      throw new HttpError(400, 'File content signature does not match declared MIME type')
    }

    const isImage = Boolean(ALLOWED_IMAGE_MIMES[mime])
    const fileType = isImage ? 'IMAGE' : 'AUDIO'

    let extractedText: string | null = null
    let detectedLanguage: string | null = null
    let processingStatus: 'COMPLETED' | 'FAILED' = 'COMPLETED'
    let processingError: string | null = null

    try {
      if (isImage) {
        const ocr = await extractTextFromImage(req.file.path, mime)
        extractedText = typeof ocr === 'string' ? (ocr || null) : (ocr?.extractedText || null)
        detectedLanguage = (ocr as any)?.detectedLanguage || null
      } else {
        const transcript = await transcribeAudio(req.file.path, mime)
        extractedText = typeof transcript === 'string' ? (transcript || null) : (transcript?.extractedText || transcript?.transcript || null)
        detectedLanguage = (transcript as any)?.detectedLanguage || null
      }
    } catch (err: any) {
      processingStatus = 'FAILED'
      processingError = err?.message || 'Media processing error'
    }

    const publicUrl = `/uploads/${req.file.filename}`

    res.status(201).json(
      ok(
        {
          url: publicUrl,
          filename: req.file.originalname || req.file.filename,
          fileType,
          mimeType: req.file.mimetype,
          size: req.file.size,
          extractedText,
          detectedLanguage,
          processingStatus,
          processingError
        },
        'File uploaded successfully'
      )
    )
  })
)

export default router

