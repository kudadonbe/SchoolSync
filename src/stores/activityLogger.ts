// activityLogger.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import type { UserActivityMetadata } from '@/types'

export async function logUserActivity(
  uid: string,
  action: string,
  metadata: UserActivityMetadata = {},
  displayName?: string | null,
  email?: string | null,
) {
  const logRef = collection(db, 'userActivityLogs')
  await addDoc(logRef, {
    uid,
    displayName: displayName ?? null,
    email: email ?? null,
    action,
    metadata,
    timestamp: serverTimestamp(),
  })
}
