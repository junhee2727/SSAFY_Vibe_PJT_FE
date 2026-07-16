<template>
  <HeaderNav />
  <section class="calendar-page">
    <div class="post-card">
      <h2 class="title-main small">축제 일정 확인해보기</h2>
      <div class="calendar-container">
        <FestivalCalendarView @select-event="onSelectEvent" />
      </div>
    </div>

    <div class="post-card detail-card" v-if="selectedEvent">
      <div class="title-block">
        <h3 class="title-main">{{ selectedEvent.title }}</h3>
      </div>

      <div class="meta-row">
        <div class="meta-left">
          <span class="muted">장소</span> {{ selectedEvent.eventplace || '정보 없음' }} ·
          <span class="muted">기간</span> {{ formatDate(selectedEvent.startDate) }} ~ {{ formatDate(selectedEvent.endDate) }}
        </div>
      </div>

      <article class="post-content">
        <h4>프로그램</h4>
        <pre class="program-text">{{ selectedEvent.program || '상세 정보가 없습니다.' }}</pre>

        <h4 style="margin-top:12px">주변 둘러볼 것</h4>
        <ul class="nearby-list">
          <li v-for="p in nearby" :key="p.id" class="nearby-item">
            <span class="expanded-dot" :style="{ background: p.color || '#ccc' }"></span>
            <div class="nearby-info">
              <div class="r-title">{{ p.title }}</div>
              <div class="r-addr">{{ p.category }} · {{ p.distKm?.toFixed(2) }} km</div>
            </div>
          </li>
          <li v-if="!nearby.length" class="expanded-empty">주변 장소가 없습니다.</li>
        </ul>
      </article>
    </div>

    <div v-else class="post-card placeholder detail-card">
      <div class="title-block">
        <h3 class="title-main">일정을 선택하면 상세 정보가 여기에 표시됩니다</h3>
      </div>
    </div>

  </section>
</template>

<script setup>
import { ref } from 'vue'
import HeaderNav from '../components/HeaderNav.vue'
import FestivalCalendarView from '../components/FestivalCalendarView.vue'
import { findNearbyPlaces } from '../services/calendarApi'
import dayjs from 'dayjs'

const selectedEvent = ref(null)
const nearby = ref([])

function onSelectEvent(ev){
  selectedEvent.value = ev
  if (ev.mapx && ev.mapy){
    findNearbyPlaces({ lat: Number(ev.mapy), lon: Number(ev.mapx), maxKm: 3, limit: 6 }).then(r => {
      // attach color fallback for list (keep palette)
      nearby.value = r.map(item => ({ ...item, color: item.color || '#8BC34A' }))
    })
  } else nearby.value = []
}

function formatDate(s){ return s ? dayjs(s).format('YYYY.MM.DD') : '' }
</script>

<style scoped>
.calendar-page{ max-width:1200px; margin:18px auto; padding:20px; display:grid; grid-template-columns: 1fr; gap:18px }
.post-card{ background:#fff; border-radius:12px; padding:18px; box-shadow:0 6px 18px rgba(22,42,31,0.04); border:1px solid rgba(0,0,0,0.04) }
.small { font-size:1.05rem; margin:0 0 8px 0; font-weight:700; color:#0b2f22 }

/* reuse board post styles for headings/meta/content */
.title-main{ font-size:20px; line-height:1.12; margin:0 0 6px 0; font-weight:800; color:#0b2f22 }
.meta-row{ display:flex; gap:12px; color:#6b7972; margin-bottom:12px; align-items:center }
.muted{ color:#9aa8a0; font-size:0.95rem; margin-right:6px }
.post-content{ border-top:1px solid #f1f1f1; padding-top:12px; color:#333; line-height:1.7; margin-top:8px }
.program-text{ white-space:pre-wrap; background:#fbfbfb; padding:10px; border-radius:6px; }

/* nearby list */
.nearby-list{ list-style:none; padding:0; margin:8px 0 0 0; display:flex; flex-direction:column; gap:8px }
.nearby-item{ display:flex; gap:10px; align-items:flex-start; padding:8px 10px; border-radius:8px; background:#fff; border:1px solid #f3f6f3 }
.expanded-dot{ width:12px; height:12px; border-radius:50%; flex:0 0 auto; margin-top:6px }
.nearby-info .r-title{ font-weight:700; color:#122a22 }
.nearby-info .r-addr{ color:#6b7972; font-size:0.95rem }

/* small responsive tweak */
@media (max-width:1000px){ .calendar-page{ padding:12px } }
</style>