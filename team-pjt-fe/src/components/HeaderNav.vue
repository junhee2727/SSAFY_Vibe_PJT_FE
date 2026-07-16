<template>
  <header class="topbar">
    <div class="brand-area">
      <router-link to="/" class="brand"><span class="brand">로컬 허브</span> Local Hub</router-link>

      <!-- Brand action: 축제 캘린더 버튼 (로고 오른쪽, site-nav 왼쪽) -->
      <div class="brand-actions">
        <router-link
          :to="{ name: 'FestivalCalendar' }"
          class="calendar-btn"
          :class="{ active: $route.name === 'FestivalCalendar' }"
          aria-pressed="$route.name === 'FestivalCalendar'"
        >
          <span class="btn-text">축제 캘린더</span>
          <span class="btn-emoji" aria-hidden>🎆</span>
        </router-link>
      </div>
    </div>

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

/* brand + brand actions */
.brand-area { display:flex; align-items:center; gap:12px; }
.brand { font-weight:700; font-size:1.25rem; color:#0a3; text-decoration:none; }

/* calendar button */
.brand-actions { display:flex; align-items:center; }
.calendar-btn {
  display:inline-flex;
  align-items:center;
  gap:6px;
  margin-left:8px;
  padding:6px 10px;
  border-radius:4px;
  color:#222;
  text-decoration:none;
  transition: 0.18s;
  background: transparent;
  border: none;
  cursor: pointer;
}
.calendar-btn .btn-emoji { display:none; transform:translateY(-2px); }
.calendar-btn .btn-text { display:inline-block; }

/* hover: 텍스트 -> 이모지 전환 */
.calendar-btn:hover {
  background: rgba(10, 50, 90, 0.04);
}
.calendar-btn:hover .btn-text { opacity:0; transform:translateY(-4px); transition:0.15s; }
.calendar-btn:hover .btn-emoji { display:inline-block; opacity:1; transform:translateY(0); transition:0.15s; }

/* active 라우트 시 누른 느낌 */
.calendar-btn.active {
  background:#eaf6ff;
  box-shadow: inset 0 -2px 0 rgba(0,0,0,0.06);
  transform:translateY(0);
  font-weight:700;
}

/* small click feeling */
.calendar-btn:active { transform: translateY(1px); }

/* site nav */
.site-nav a { margin-left:18px; color:#222; text-decoration:none; }
.site-nav a.router-link-active { font-weight:600; }
</style>