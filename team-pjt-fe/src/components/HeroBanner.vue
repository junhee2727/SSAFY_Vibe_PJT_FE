<script setup>
</script>

<template>
  <section class="hero">
    <img class="hero-img" src="../../static/img/hero.jpg" alt="hero" />
    <div class="hero-overlay">
      <h2>지역 정보 공유 커뮤니티 Local Hub</h2>
    </div>
  </section>
</template>

<style scoped>
.hero { position:relative; width:100%; height:260px; overflow:hidden; margin-top:10px; border-radius:0 0 10px 10px;}
.hero-img { width:100%; height:100%; object-fit:cover; display:block; }
.hero-overlay {
  position:absolute; right:2rem; bottom:1.5rem;
  color:#f9f9f9; text-shadow:0 2px 6px rgba(0,0,0,.5);
  font-size:1.4rem;
}
@media(min-width:1024px){ .hero{ height:320px } }
</style>