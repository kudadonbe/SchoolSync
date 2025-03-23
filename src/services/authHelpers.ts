import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import type { User } from '@/types'
import type { User as FirebaseUser } from 'firebase/auth'

export async function syncUserToFirestore(firebaseUser: FirebaseUser): Promise<User> {
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

async function logLogin(uid: string) {
  const loginLogsRef = collection(db, `user/${uid}/logins`)
  await addDoc(loginLogsRef, {
    timestamp: serverTimestamp(),
    method: 'google', // You can change this later for other methods (email, etc.)
  })
}
