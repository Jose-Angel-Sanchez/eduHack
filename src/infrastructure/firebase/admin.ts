// Firebase Admin (server only)
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function init() {
  if (getApps().length) return getApps()[0]
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  if (!clientEmail || !privateKey || !projectId) {
    // Fallback to applicationDefault (e.g. local emulators) if service account missing
    return initializeApp({ credential: applicationDefault(), projectId })
  }
  return initializeApp({
    credential: cert({ clientEmail, privateKey, projectId }),
  })
}

export const adminApp = init()
export const adminAuth = getAuth(adminApp)
