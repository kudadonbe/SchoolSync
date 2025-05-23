<script setup lang="ts">
import NoticeBoard from '@/components/notice/NoticeBoard.vue';
import PublicHero from '@/components/PublicHero.vue';
import SchEvents from '@/components/events/SchEvents.vue';
import SchStats from '@/components/statistics/SchStats.vue';
import PublicLayout from '@/layouts/PublicLayout.vue';
</script>

<template>
  <PublicLayout>
    <div>
      <PublicHero />
    </div>
    <div>
      <NoticeBoard />
    </div>
    <div>
      <SchEvents />
    </div>
    <div>
      <SchStats />
    </div>
  </PublicLayout>
</template>
