import { prisma } from '../config/prisma.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { HttpError } from '../middleware/errorHandler.js'
import { Profession } from '@prisma/client'

function slugUsername(base: string) {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20) || `user${Date.now().toString().slice(-6)}`
}

export async function registerUser(input: {
  fullName: string
  profession: Profession
  identificationNumber: string
  email: string
  password: string
}) {
  const email = input.email.trim().toLowerCase()
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }] }
  })
  if (existing) {
    throw new HttpError(409, 'User already exists')
  }
  const passwordHash = await hashPassword(input.password)
  const username = `${slugUsername(input.fullName)}${Date.now().toString().slice(-4)}`
  const user = await prisma.user.create({
    data: {
      email,
      username,
      displayName: input.fullName.trim(),
      fullName: input.fullName.trim(),
      profession: input.profession,
      identificationNumber: input.identificationNumber.trim(),
      passwordHash
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      fullName: true,
      profession: true,
      identificationNumber: true,
      createdAt: true
    }
  })
  return user
}

export async function loginUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new HttpError(401, 'Invalid credentials')
  }
  const valid = await comparePassword(input.password, user.passwordHash)
  if (!valid) {
    throw new HttpError(401, 'Invalid credentials')
  }
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    fullName: user.fullName,
    profession: user.profession,
    identificationNumber: user.identificationNumber
  }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      fullName: true,
      profession: true,
      identificationNumber: true,
      createdAt: true
    }
  })
  if (!user) {
    throw new HttpError(404, 'User not found')
  }
  return user
}
