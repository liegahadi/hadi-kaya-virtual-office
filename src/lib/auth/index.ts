// ============================================================
// AUTH UTILITIES - Simple JWT-based auth (no next-auth needed)
// ============================================================
// Strategy:
// - Owner login with email + password
// - Password hashed with bcrypt
// - JWT token issued (7 days expiry)
// - Token stored in httpOnly cookie
// - Middleware checks cookie on protected routes
// ============================================================

import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const SESSION_DURATION_DAYS = 7
const COOKIE_NAME = 'hadi-kaya-session'

// Simple JWT-like token (base64 encoded JSON, NOT for production crypto)
// For production, replace with proper JWT library (jose/jsonwebtoken)
function createToken(payload: Record<string, unknown>): string {
  const data = {
    ...payload,
    exp: Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  }
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    if (decoded.exp && Date.now() > decoded.exp) {
      return null // expired
    }
    return decoded
  } catch {
    return null
  }
}

export async function login(email: string, password: string) {
  const user = await db.appUser.findUnique({
    where: { email },
  })

  if (!user || !user.isActive) {
    return { success: false, error: 'User tidak ditemukan atau tidak aktif' }
  }

  // For now, compare with stored hash. If hash is placeholder, allow first-login setup.
  const isPlaceholder = user.passwordHash === '$2a$10$placeholder_hash_replace_on_first_login'

  if (isPlaceholder) {
    // First login: set new password hash from input
    const newHash = await bcrypt.hash(password, 10)
    await db.appUser.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        lastLoginAt: new Date(),
      },
    })
  } else {
    // Compare with stored hash
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return { success: false, error: 'Password salah' }
    }
    await db.appUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
  }

  const token = createToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}

export function getSessionFromToken(token: string | undefined) {
  if (!token) return null
  return verifyToken(token)
}

export function getCookieName() {
  return COOKIE_NAME
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  }
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const user = await db.appUser.findUnique({ where: { id: userId } })
  if (!user) return { success: false, error: 'User tidak ditemukan' }

  const isPlaceholder = user.passwordHash === '$2a$10$placeholder_hash_replace_on_first_login'
  if (!isPlaceholder) {
    const valid = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!valid) return { success: false, error: 'Password lama salah' }
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  await db.appUser.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  })

  return { success: true }
}
