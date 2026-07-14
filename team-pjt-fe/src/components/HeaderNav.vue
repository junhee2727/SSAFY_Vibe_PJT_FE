<script setup>
</script>

<template>
  <header class="topbar">
    <router-link to="/" class="brand">Local Hub</router-link>
    <nav class="site-nav">
      <router-link to="/">관광지</router-link>
      <router-link to="/">맛집</router-link>
      <router-link to="/">축제/행사</router-link>
      <router-link to="/board">커뮤니티</router-link>
    </nav>
  </header>
</template>

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