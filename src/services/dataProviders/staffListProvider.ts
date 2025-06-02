import { loadFromIndexedDB, saveToIndexedDB } from '@/services/indexeddb/indexedDBService'
import { STORE_KEYS } from '@/services/indexeddb/indexedDBInit'
import { fetchStaffList } from '@/services/firebaseServices'
import type { Staff } from '@/types'

export async function getStaffList(forceRefresh = false): Promise<Staff[]> {
  const key = 'current'

  if (!forceRefresh) {
    const cached = await loadFromIndexedDB<Staff[]>(STORE_KEYS.staffList, key)
    if (cached) return cached
  }

  const fresh = await fetchStaffList()
  await saveToIndexedDB(STORE_KEYS.staffList, key, fresh)
  return fresh
}
