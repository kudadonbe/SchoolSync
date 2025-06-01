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
      Object.values(STORE_KEYS).forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store)
        }
      })
    },
  })
}
