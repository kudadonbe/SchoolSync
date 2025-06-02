<template>
  <div class="p-4 rounded-xl border w-fit space-y-2 text-sm">
    <h2 class="font-bold text-base">IndexedDB Test</h2>

    <button @click="save" class="px-3 py-1 rounded bg-green-600 text-white">Save</button>
    <button @click="load" class="px-3 py-1 rounded bg-blue-600 text-white">Load</button>
    <button @click="del" class="px-3 py-1 rounded bg-red-600 text-white">Delete</button>

    <div v-if="result" class="bg-gray-100 p-2 rounded">
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
// file: src/dev/test/IndexedDBTest.vue
import { ref } from 'vue'
import { saveToIndexedDB, loadFromIndexedDB, deleteFromIndexedDB } from '@/services/indexeddb/indexedDBService'
import { STORE_KEYS } from '@/services/indexeddb/indexedDBInit'

const result = ref<string | null>(null)

const key = 'test-key'
const store = STORE_KEYS.users
const testData = {
  message: 'Hello IndexedDB!',
  timestamp: new Date().toISOString(),
}

async function save() {
  await saveToIndexedDB(store, key, testData)
  result.value = '[✔] Saved test data.'
}

async function load() {
  const data = await loadFromIndexedDB<typeof testData>(store, key)
  result.value = data ? JSON.stringify(data, null, 2) : '[✘] Nothing found.'
}

async function del() {
  await deleteFromIndexedDB(store, key)
  result.value = '[✔] Deleted test data.'
}
</script>
