import crypto from "crypto"

// Generated files live under users/<userId>/ in S3. Messages store a stable
// gateway URL instead of a signed S3 URL (those expire); GET /file/... signs
// a fresh one on every click, only for the owner.

export const newFileName = (prefix, ext) =>
    `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`

export const userFileKey = (userId, name) => `users/${userId}/${name}`

export const fileUrl = (userId, name) => `/api/agent/file/${userId}/${name}`
