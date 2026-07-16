<script setup>
defineProps({ title: String, date: String })
</script>

<template>
  <div class="post-item-row">
    <div class="post-item-title">{{ title }}</div>
    <div class="post-item-date">{{ date }}</div>
  </div>
</template>

<style scoped>
.post-item-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  width: 100%;
}

/* 제목이 줄어들면 말줄임표 처리 */
.post-item-title {
  color: #222;
  flex: 1 1 auto;
  min-width: 0; /* 중요: flex item이 축소되도록 허용 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 날짜는 고정 너비로 유지 (줄 바꿈 방지) */
.post-item-date {
  color: #888;
  flex: 0 0 auto;
  margin-left: 1rem;
  white-space: nowrap;
  padding-right: 5px;
}
</style>