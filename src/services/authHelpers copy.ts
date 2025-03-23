import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import type { User } from '@/types'
import type { User as FirebaseUser } from 'firebase/auth'

export async function syncUserToFirestore(firebaseUser: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'user', firebaseUser.uid)
  const userSnap = await getDoc(userRef)

  const now = new Date()

  if (!userSnap.exists()) {
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      role: 'public',
      createdAt: now,
      lastLoginAt: now,
      isActive: true,
    }

    await setDoc(userRef, newUser)
    return newUser
  } else {
    const updatedFields = { lastLoginAt: now, isActive: true }
    await setDoc(userRef, updatedFields, { merge: true })
    const updatedSnap = await getDoc(userRef)
    return updatedSnap.data() as User
  }
}
