// Import the functions you need from the SDKs you need

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: 'AIzaSyC-tMXohOBrLVPgW_9MC03SI4nfNdEOOOE',
  authDomain: 'schoolsync-4277c.firebaseapp.com',
  projectId: 'schoolsync-4277c',
  storageBucket: 'schoolsync-4277c.firebasestorage.app',
  messagingSenderId: '433332532268',
  appId: '1:433332532268:web:38ad5c74fca768968a0d89',
  measurementId: 'G-TYTZ5M7C2C',
}

const app = initializeApp(firebaseConfig)

// Optional: only initialize analytics if supported
let analytics: ReturnType<typeof getAnalytics> | null = null
isSupported().then((yes) => {
  if (yes) {
    analytics = getAnalytics(app)
  }
})

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export { analytics }
