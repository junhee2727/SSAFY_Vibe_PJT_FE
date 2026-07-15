<template>
  <header class="topbar">
    <router-link to="/" class="brand"><span class="brand">로컬 허브</span> Local Hub</router-link>
    <nav class="site-nav">
      <router-link :to="{ name: 'Board' }">전체</router-link>
      <router-link :to="{ name: 'Board', query: { category: '관광지' } }">관광지</router-link>
      <router-link :to="{ name: 'Board', query: { category: '레포츠' } }">레포츠</router-link>
      <router-link :to="{ name: 'Board', query: { category: '문화시설' } }">문화시설</router-link>
      <router-link :to="{ name: 'Board', query: { category: '쇼핑' } }">쇼핑</router-link>
      <router-link :to="{ name: 'Board', query: { category: '숙박' } }">숙박</router-link>
      <router-link :to="{ name: 'Board', query: { category: '여행코스' } }">여행코스</router-link>
      <router-link :to="{ name: 'Board', query: { category: '축제공연행사' } }">축제/공연/행사</router-link>
      <router-link :to="{ name: 'Board', query: { category: '일반' } }">일반</router-link>
      <router-link :to="{ name: 'Chat' }">챗봇</router-link>
    </nav>
  </header>
</template>

<script setup>
</script>

<style scoped>
.topbar {
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:12px 16px;
  border-bottom:3px solid #cfe8ff;
}
.brand { font-weight:700; font-size:1.25rem; color:#0a3;}
.site-nav a { margin-left:18px; color:#222; text-decoration:none; }
.site-nav a.router-link-active { font-weight:600; }
</style>