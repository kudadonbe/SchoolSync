// src/services/authHelpers.ts

// ========== Firestore User Synchronization ==========

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import type { User } from '@/types'
import type { User as FirebaseUser } from 'firebase/auth'

/**
 * Syncs the Firebase user data to Firestore.
 *
 * This function checks if the user exists in Firestore, and if not, creates a new user document.
 * If the user exists, it updates the last login time and sets the user as active.
 *
 * @param firebaseUser - The authenticated Firebase user object.
 * @returns The user data that was synced or updated in Firestore.
 */

export async function syncUserToFirestore(firebaseUser: FirebaseUser): Promise<User> {
  // console.log(`[syncUserToFirestore] Called for: ${firebaseUser.displayName},
  //   Time: ${new Date().toLocaleString()}`)

  // ========== Firestore Document Reference ==========
  const userRef = doc(db, 'user', firebaseUser.uid) // Reference to the user's document in Firestore

  // ========== Fetch Existing User Data ==========
  const userSnap = await getDoc(userRef) // Retrieve the user document snapshot from Firestore

  // ========== Set Timestamp ==========
  const timestamp = serverTimestamp() // Firebase's server timestamp for Firestore operations

  // ========== Check if User Exists in Firestore ==========
  if (!userSnap.exists()) {
    // ========== Create New User Document ==========
    const newUser: User = {
      uid: firebaseUser.uid, // Firebase user ID
      email: firebaseUser.email || '', // Firebase email
      displayName: firebaseUser.displayName || '', // Firebase display name
      photoURL: firebaseUser.photoURL || '', // Firebase photo URL
      role: 'public', // Default role for new users
      createdAt: timestamp, // Set creation timestamp
      lastLoginAt: timestamp, // Set the first login timestamp
      isActive: true, // Mark user as active
      staffId: '', // Optional staff ID
      studentId: '', // Optional student ID
      parentId: '', // Optional parent ID
    }

    // Set the new user document in Firestore
    await setDoc(userRef, newUser)

    // Return the newly created user object
    return newUser
  } else {
    // ========== Update Existing User Document ==========
    const updatedFields = { lastLoginAt: timestamp, isActive: true } // Update last login timestamp and user activity status

    // Update the existing user document with new fields
    await setDoc(userRef, updatedFields, { merge: true }) // Merge with the existing document

    // Retrieve the updated user data from Firestore
    const updatedSnap = await getDoc(userRef)
    return updatedSnap.data() as User
  }
}
