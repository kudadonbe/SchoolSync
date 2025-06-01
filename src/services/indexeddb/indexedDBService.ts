// src/services/indexeddb/indexedDBService.ts
import { getDB } from './indexedDBInit'

export async function saveToIndexedDB<T>(store: string, key: string, data: T) {
  const db = await getDB()
  await db.put(store, data, key)
}

export async function loadFromIndexedDB<T>(store: string, key: string): Promise<T | null> {
  const db = await getDB()
  return (await db.get(store, key)) ?? null
}

export async function deleteFromIndexedDB(store: string, key: string) {
  const db = await getDB()
  await db.delete(store, key)
}
