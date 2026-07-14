<script setup>
defineProps({
  id: { type: [Number, String], default: '' },
  title: { type: String, default: '' },
  author: { type: String, default: '' },
  date: { type: String, default: '' },
  views: { type: [Number, String], default: '' }
})
</script>

<template>
  <div class="post-row" role="article" aria-label="게시글 항목">
    <div class="col-num">{{ id }}</div>
    <div class="col-title" :title="title">{{ title }}</div>
    <div class="col-author">{{ author }}</div>
    <div class="col-date">{{ date }}</div>
    <div class="col-views">{{ views }}</div>
  </div>
</template>

<style scoped>
.post-row {
  display: grid;
  grid-template-columns: 60px 1fr 140px 120px 80px;
  gap: 12px;
  align-items: center;
  padding: 0;
  font-size: 0.95rem;
  min-width: 0;
}

/* 컬럼 스타일 */
.col-num { color: #999; padding-left: 4px; }
.col-title {
  color: #222;
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
}
.col-author,
.col-date,
.col-views { color: #666; }

/* 작은 화면에서 스택형으로 바뀌게 하려면 미디어쿼리 추가 가능 */
@media (max-width: 640px) {
  .post-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .col-num, .col-author, .col-date, .col-views {
    font-size: 0.85rem;
  }
}
</style>