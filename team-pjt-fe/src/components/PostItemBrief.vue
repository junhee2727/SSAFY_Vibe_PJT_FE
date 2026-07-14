<script setup>
defineProps({ title: String, date: String })
</script>

<template>
  <div class="post-row">
    <div class="post-title">{{ title }}</div>
    <div class="post-date">{{ date }}</div>
  </div>
</template>

<style scoped>
.post-row { display:flex; justify-content:space-between; align-items:center; }
.post-title { color:#222; }
.post-date { color:#888; margin-left:1rem; white-space:nowrap; }
</style>