// /types/User.ts

import type { FieldValue } from 'firebase/firestore'

export type UserRole =
  | 'public'
  | 'parent'
  | 'student'
  | 'labor'
  | 'teacher'
  | 'leading_teacher'
  | 'administrator'
  | 'admin_staff'
  | 'principal'

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL: string
  role: UserRole
  createdAt: Date | FieldValue
  lastLoginAt: Date | FieldValue
  isActive: boolean
}
