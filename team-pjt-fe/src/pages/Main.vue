<script setup>
import HeaderNav from '../components/HeaderNav.vue'
import HeroBanner from '../components/HeroBanner.vue'
import RecentPosts from '../components/RecentPosts.vue'
</script>

<template>
  <HeaderNav />
  <HeroBanner />
  <main class="page-container">
    <div class="recent-grid">
      <RecentPosts :param="0" />
      <RecentPosts :param="1" />
      <RecentPosts :param="2" />
      <RecentPosts :param="3" />
      <RecentPosts :param="4" />
      <RecentPosts :param="5" />
    </div>
  </main>
</template>

<style scoped>
.page-container {
  max-width: 1100px;
  margin: 1.5rem auto;
  padding: 0 1rem;
}

/* 두 칼럼 → 좁아지면 한 칼럼으로 전환 */
.recent-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  align-items: start;
}

/* 각 RecentPosts가 셀 전체 너비를 사용하도록 */
.recent-grid > * {
  width: 100%;
  box-sizing: border-box;
  min-width:0;
}

/* 브레이크포인트: 필요하면 픽셀값(예: 768px) 조정 */
@media (max-width: 868px) {
  .recent-grid {
    grid-template-columns: 1fr;
  }
}
</style>