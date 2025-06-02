<script setup lang="ts">
import { ref } from 'vue'
import { uploadToFirestore, type FirestoreUploadOptions, type UploadableRecord } from '@/dev/upload/uploadCollection'

const collectionName = ref('')
const idField = ref('')
const jsonInput = ref('')
const dryRun = ref(false)
const status = ref('')
const fileName = ref('')

/**
 * Load and parse JSON from file.
 */
function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const jsonText = e.target?.result as string
      const parsed = JSON.parse(jsonText)

      if (typeof parsed !== 'object' || parsed === null) {
        status.value = '❌ JSON must be an object or an array of objects'
        return
      }

      jsonInput.value = JSON.stringify(parsed, null, 2)
      fileName.value = file.name.replace(/\.json$/i, '')
      collectionName.value = fileName.value
    } catch (err) {
      status.value = `❌ Error parsing file: ${(err as Error).message}`
    }
  }

  reader.readAsText(file)
}

/**
 * Upload to Firestore.
 */
async function handleUpload() {
  try {
    const parsed = JSON.parse(jsonInput.value)

    if (typeof parsed !== 'object' || parsed === null) {
      status.value = '❌ JSON must be an object or array of objects'
      return
    }

    const options: FirestoreUploadOptions<UploadableRecord> = {
      collection: collectionName.value.trim(),
      data: parsed,
      dryRun: dryRun.value,
      ...(idField.value.trim() && { idField: idField.value.trim() }),
    }

    const result = await uploadToFirestore(options)

    status.value = `✅ Upload Summary: ${result.successCount} success, ${result.autoIdCount ?? 0} auto-ID, ${result.failCount} failed, ${result.skippedCount} skipped.`

    if (!dryRun.value) {
      jsonInput.value = ''
      collectionName.value = ''
      idField.value = ''
      fileName.value = ''
    }
  } catch (err) {
    status.value = `❌ Upload error: ${(err as Error).message}`
  }
}
</script>

<template>
  <div class="space-y-4 p-4 border rounded-md">
    <h2 class="text-lg font-bold">Upload Collection to Firestore</h2>

    <input type="file" accept=".json" @change="handleFileUpload" class="border px-3 py-2 w-full rounded-md text-sm" />

    <input v-model="collectionName" placeholder="Collection name" class="border px-3 py-2 w-full rounded-md" />

    <input v-model="idField" placeholder="(Optional) Field name for document ID"
      class="border px-3 py-2 w-full rounded-md" />

    <textarea v-model="jsonInput" placeholder="Paste JSON object or array here" rows="10"
      class="border px-3 py-2 w-full rounded-md font-mono text-sm"></textarea>

    <label class="flex items-center space-x-2 text-sm">
      <input type="checkbox" v-model="dryRun" />
      <span>Dry run (no writes)</span>
    </label>

    <button @click="handleUpload" class="bg-blue-600 text-white px-4 py-2 rounded-md">
      Upload
    </button>

    <div class="text-sm text-gray-600 whitespace-pre-line">{{ status }}</div>
  </div>
</template>
