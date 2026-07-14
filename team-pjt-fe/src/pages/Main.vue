<script setup>
import HeaderNav from '../components/HeaderNav.vue'
import HeroBanner from '../components/HeroBanner.vue'
import RecentPosts from '../components/RecentPosts.vue'
</script>

<template>
  <HeaderNav />
  <HeroBanner />
  <main class="page-container">
    <RecentPosts />
  </main>
</template>

<style scoped>
.page-container {
  max-width: 1100px;
  margin: 1.5rem auto;
  padding: 0 1rem;
}
</style>