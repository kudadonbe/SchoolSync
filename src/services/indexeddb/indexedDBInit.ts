// src/services/indexeddb/indexedDBInit.ts
import { openDB } from 'idb'

export const DB_NAME = 'SchoolSyncIndexedDB'
export const DB_VERSION = 1

export const STORE_KEYS = {
  attendanceLogs: 'attendanceLogs',
  attendanceCorrections: 'attendanceCorrections',
  attendanceSummaries: 'attendanceSummaries',
  staffList: 'staffList',
  dutyRosters: 'dutyRosters',
  attendancePolicies: 'attendancePolicies',
  users: 'users',
  viewTimestamps: 'viewTimestamps',
}

export function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Logs: each log = 1 document, key = id
      if (!db.objectStoreNames.contains(STORE_KEYS.attendanceLogs)) {
        const store = db.createObjectStore(STORE_KEYS.attendanceLogs, { keyPath: 'id' })
        store.createIndex('user_id', 'user_id')
        store.createIndex('date', 'date')
        store.createIndex('time', 'time')
        store.createIndex('status', 'status')
        store.createIndex('user_date', ['user_id', 'date'])
      }

      // Corrections: key = id
      if (!db.objectStoreNames.contains(STORE_KEYS.attendanceCorrections)) {
        const store = db.createObjectStore(STORE_KEYS.attendanceCorrections, { keyPath: 'id' })
        store.createIndex('staffId', 'staffId')
        store.createIndex('date', 'date')
        store.createIndex('staffId_date', ['staffId', 'date'])
      }

      // Staff: key = user_id (from Firestore doc.id)
      if (!db.objectStoreNames.contains(STORE_KEYS.staffList)) {
        const store = db.createObjectStore(STORE_KEYS.staffList, { keyPath: 'user_id' })
        store.createIndex('user_id', 'user_id')
      }

      // Users: key = uid
      if (!db.objectStoreNames.contains(STORE_KEYS.users)) {
        db.createObjectStore(STORE_KEYS.users, { keyPath: 'uid' })
      }

      // All other flat data stores (e.g. summary blobs, timestamps)
      const flatStores = [
        STORE_KEYS.attendanceSummaries,
        STORE_KEYS.dutyRosters,
        STORE_KEYS.attendancePolicies,
        STORE_KEYS.viewTimestamps,
      ]
      flatStores.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store)
        }
      })
    },
  })
}
