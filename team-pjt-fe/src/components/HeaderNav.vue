<script setup>
</script>

<template>
  <header class="topbar">
    <router-link to="/" class="brand"><span class = "brand">로컬 허브</span> Local Hub</router-link>
    <nav class="site-nav">
      <router-link to="/board">관광지</router-link>
      <router-link to="/board">맛집</router-link>
      <router-link to="/board">축제/행사</router-link>
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