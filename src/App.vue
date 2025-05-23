<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from '@/components/header/NavBar.vue';
import AppFooter from '@/components/footer/AppFooter.vue';
</script>

<template>
  <NavBar />
  <RouterView />
  <AppFooter />
</template>
