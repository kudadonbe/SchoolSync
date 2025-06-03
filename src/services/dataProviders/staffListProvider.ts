// file: src/services/dataProviders/staffListProvider.ts
import { getDB, STORE_KEYS } from '@/services/indexeddb/indexedDBInit'
import { fetchStaffList } from '@/services/firebaseServices'
import type { Staff } from '@/types'

/**
 * Loads all staff from IndexedDB, or fetches from Firestore if not cached or forceRefresh is true.
 */
export async function getStaffList(forceRefresh = false): Promise<Staff[]> {
  const db = await getDB()

  if (!forceRefresh) {
    const cached = await db.getAll(STORE_KEYS.staffList)
    if (cached.length > 0) return cached
  }

  const fresh = await fetchStaffList()

  const tx = db.transaction(STORE_KEYS.staffList, 'readwrite')
  const store = tx.objectStore(STORE_KEYS.staffList)

  for (const staff of fresh) {
    if (!staff.user_id) {
      console.warn('Skipped staff without user_id:', staff)
      continue
    }
    await store.put(staff) // user_id is keyPath
  }

  await tx.done
  return fresh
}

/**
 * Gets a single staff member by user_id.
 */
export async function getStaffById(userId: string): Promise<Staff | undefined> {
  const db = await getDB()
  return await db.get(STORE_KEYS.staffList, userId)
}

/**
 * Updates or inserts a single staff record in IndexedDB.
 */
export async function updateStaff(staff: Staff): Promise<void> {
  const db = await getDB()
  await db.put(STORE_KEYS.staffList, staff)
}
