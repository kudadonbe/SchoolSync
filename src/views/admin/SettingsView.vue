<script setup lang="ts">
import AdminLayout from '@/layouts/AdminLayout.vue';
import { ref } from 'vue';

const schoolName = ref('Makunudhoo School');
const themeColor = ref('#4CAF50'); // Default green color

const saveSettings = () => {
  alert(`Settings saved!\nSchool Name: ${schoolName.value}\nTheme Color: ${themeColor.value}`);
};
</script>

<template>
  <AdminLayout>
    <h1 class="text-2xl font-bold mb-4">Admin Settings</h1>

    <div class="bg-white p-6 rounded shadow">
      <label class="block mb-2">School Name</label>
      <input v-model="schoolName" type="text" class="w-full border p-2 rounded mb-4" />

      <label class="block mb-2">Theme Color</label>
      <input v-model="themeColor" type="color" class="w-full border p-2 rounded mb-4" />

      <button @click="saveSettings" class="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
        Save Settings
      </button>
    </div>
  </AdminLayout>
</template>
