// /types/User.ts

import type { FieldValue } from 'firebase/firestore'

export type UserRole =
  | 'public'
  | 'parent'
  | 'student'
  | 'labor'
  | 'teacher'
  | 'administrative_officer'
  | 'hr'
  | 'leading_teacher'
  | 'administrator'
  | 'principal'
  | 'developer'

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL: string
  role: UserRole
  createdAt: Date | FieldValue
  lastLoginAt: Date | FieldValue
  isActive: boolean
  staffId?: string
  studentId?: string
  parentId?: string
}
