// file: src/dev/upload/uploadCollection.ts
import { doc, setDoc, collection as firestoreCollection, addDoc } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * A single object that can be uploaded, with string keys and any values.
 */
export interface UploadableRecord {
  [key: string]: unknown
}

/**
 * Options required to upload structured data to Firestore.
 */
export interface FirestoreUploadOptions<RecordType extends UploadableRecord> {
  collection: string
  data: RecordType | RecordType[]
  idField?: keyof RecordType // optional to allow addDoc() fallback
  dryRun?: boolean
}

/**
 * Result summary of the upload process.
 */
export interface UploadResult {
  successCount: number
  failCount: number
  autoIdCount: number
}

/**
 * Uploads one or more documents to Firestore.
 * Uses provided `idField` as document ID if valid, else generates one via `addDoc()`.
 */
export async function uploadToFirestore<RecordType extends UploadableRecord>(
  options: FirestoreUploadOptions<RecordType>,
): Promise<UploadResult> {
  const { collection: collectionName, data, idField, dryRun = false } = options

  const records: RecordType[] = Array.isArray(data) ? data : [data]
  let successCount = 0
  let failCount = 0
  let autoIdCount = 0

  for (const [index, record] of records.entries()) {
    const docId = idField ? record[idField] : undefined
    const useAutoId = typeof docId !== 'string' || docId.trim() === ''

    try {
      if (!dryRun) {
        if (useAutoId) {
          await addDoc(firestoreCollection(db, collectionName), record)
          autoIdCount++
        } else {
          await setDoc(doc(db, collectionName, docId), record)
        }
      }

      const info = useAutoId ? '[auto-ID]' : `/${docId}`
      console.log(`✅ [${index + 1}] Uploaded → ${collectionName}${info}`)
      successCount++
    } catch (error) {
      console.error(`❌ [${index + 1}] Failed → ${collectionName}/${docId}`, error)
      failCount++
    }
  }

  console.log(`\n📋 Upload Summary for "${collectionName}"`)
  console.log(`✔️ Success: ${successCount}`)
  console.log(`➕ Auto-ID: ${autoIdCount}`)
  console.log(`❌ Failed: ${failCount}`)
  if (dryRun) console.log(`🧪 Dry run mode — no writes performed`)

  return { successCount, failCount, autoIdCount }
}
