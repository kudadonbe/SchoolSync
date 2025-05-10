<script setup lang="ts">
// src/components/hr/StaffList.vue

import { onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import AdminLayout from '@/layouts/AdminLayout.vue'

const dataStore = useDataStore()
const { staffList } = storeToRefs(dataStore)
const router = useRouter()

onMounted(() => {
  dataStore.loadStaffList()
})

// Sort by staff.user_id ascending
const sortedStaffList = computed(() =>
  [...staffList.value].sort((a, b) => a.user_id.localeCompare(b.user_id))
)

const goToEdit = (id: string) => {
  router.push(`/hr/staff/${id}/edit`)
}
</script>

<template>
  <AdminLayout>
    <h1 class="text-2xl font-bold mb-4">Staff Management</h1>

    <div class="bg-white p-4 rounded shadow">
      <table class="w-full border-collapse border border-gray-300 text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="border border-gray-300 p-2">#</th>
            <th class="border border-gray-300 p-2">Att Code</th>
            <th class="border border-gray-300 p-2">Name</th>
            <th class="border border-gray-300 p-2">Position</th>
            <th class="border border-gray-300 p-2">Staff Type</th>
            <th class="border border-gray-300 p-2">Join Date</th>
            <th class="border border-gray-300 p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(staff, index) in sortedStaffList" :key="staff.user_id" class="text-center">
            <td class="border border-gray-300 p-2">{{ index + 1 }}</td>
            <td class="border border-gray-300 p-2">{{ staff.user_id }}</td>
            <td class="border border-gray-300 p-2 text-left">{{ staff.name }}</td>
            <td class="border border-gray-300 p-2 text-left">{{ staff.position || '-' }}</td>
            <td class="border border-gray-300 p-2">{{ staff.staff_type }}</td>
            <td class="border border-gray-300 p-2">{{ staff.join_date || '-' }}</td>
            <td class="border border-gray-300 p-2">
              <button
                @click="goToEdit(staff.user_id)"
                class="bg-blue-500 text-white px-2 py-1 rounded text-xs"
              >
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminLayout>
</template>
