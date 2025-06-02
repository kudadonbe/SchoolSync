// file: src/dev/test/testIndexedDB.ts
// Description: Test script for IndexedDB operations
import { saveToIndexedDB, loadFromIndexedDB } from '@/services/indexeddb/indexedDBService'
import { STORE_KEYS } from '@/services/indexeddb/indexedDBInit'

export async function runIndexedDBTest() {
  const testData = { message: 'Hello IndexedDB!', timestamp: Date.now() }

  // Save test data
  await saveToIndexedDB(STORE_KEYS.users, 'test-key', testData)
  console.log('[IndexedDB Test] Data saved.')

  // Load test data
  const loaded = await loadFromIndexedDB<typeof testData>(STORE_KEYS.users, 'test-key')
  console.log('[IndexedDB Test] Data loaded:', loaded)
}
