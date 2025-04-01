import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  getDocs,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { User } from '@/types'
import type { User as FirebaseUser } from 'firebase/auth'
// import { logUserActivity } from '@/stores/activityLogger'

export async function syncUserToFirestore(firebaseUser: FirebaseUser): Promise<User> {
  console.log('[syncUserToFirestore] Called')
  const userRef = doc(db, 'user', firebaseUser.uid)
  const userSnap = await getDoc(userRef)

  const timestamp = serverTimestamp() // ✅ Use for Firestore write

  if (!userSnap.exists()) {
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      role: 'public',
      createdAt: timestamp,
      lastLoginAt: timestamp,
      isActive: true,
    }

    await setDoc(userRef, newUser)
    // ✅ Log first login
    await logLogin(firebaseUser.uid)
    return newUser
  } else {
    const updatedFields = { lastLoginAt: timestamp, isActive: true }
    await setDoc(userRef, updatedFields, { merge: true })

    // ✅ Log returning login
    await logLogin(firebaseUser.uid)

    const updatedSnap = await getDoc(userRef)
    return updatedSnap.data() as User
  }
}

export async function logLogin(uid: string) {
  const loginLogsRef = collection(db, `user/${uid}/logins`)

  // ✅ Skip if a login is already recorded within the last 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60_000)
  const recentLogQuery = query(
    loginLogsRef,
    where('timestamp', '>=', Timestamp.fromDate(oneMinuteAgo)),
  )

  const recentLogs = await getDocs(recentLogQuery)
  if (!recentLogs.empty) {
    console.warn(`[logLogin] Duplicate login prevented for ${uid}`)
    return
  }

  // ✅ Add login log
  await addDoc(loginLogsRef, {
    timestamp: Timestamp.now(),
    method: 'google',
  })

  console.log(`[logLogin] Login log added for ${uid} at ${new Date().toISOString()}`)
}
