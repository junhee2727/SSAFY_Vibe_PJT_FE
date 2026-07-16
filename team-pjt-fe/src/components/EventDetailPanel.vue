<template>
  <aside class="detail-panel" v-if="event">
    <div class="post-card">
      <div class="title-block">
        <h2 class="title-main">{{ event.title }}</h2>
      </div>

      <div class="meta-row">
        <div class="meta-left">
          <span class="muted">장소</span> {{ event.eventplace || '정보 없음' }} ·
          <span class="muted">기간</span> {{ formatDate(event.startDate) }} ~ {{ formatDate(event.endDate) }}
        </div>
      </div>

      <article class="post-content">
        <h4>프로그램</h4>
        <pre class="program-text">{{ event.program || '정보 없음' }}</pre>

        <h4 style="margin-top:12px">세부 정보</h4>
        <ul class="meta-list">
          <li><strong>연령:</strong> {{ event.agelimit || '전체' }}</li>
          <li v-if="event.tel"><strong>연락처:</strong> {{ event.tel }}</li>
          <li v-if="event.eventhomepage"><strong>홈페이지:</strong> <a :href="event.eventhomepage" target="_blank">{{ event.eventhomepage }}</a></li>
        </ul>

        <section v-if="nearby.length" class="nearby">
          <h4>주변 둘러볼 것</h4>
          <ul class="nearby-list">
            <li v-for="p in nearby" :key="p.id" class="nearby-item">
              <span class="expanded-dot" :style="{ background: p.color || '#c3e6a2' }"></span>
              <div class="nearby-info">
                <div class="r-title">{{ p.title }}</div>
                <div class="r-addr">{{ p.category }} · {{ p.distKm?.toFixed(2) }} km</div>
              </div>
            </li>
          </ul>
        </section>
      </article>
    </div>
  </aside>

  <aside v-else class="detail-empty post-card">
    <p style="margin:0">일정을 선택하면 상세 정보가 여기에 표시됩니다.</p>
  </aside>
</template>

<script setup>
import { watch, ref } from 'vue'
import dayjs from 'dayjs'
import { findNearbyPlaces } from '../services/calendarApi'

const props = defineProps({ event: Object })
const nearby = ref([])

watch(() => props.event, async (v) => {
  nearby.value = []
  if (!v) return
  if (v.mapx && v.mapy) {
    nearby.value = await findNearbyPlaces({ lat: Number(v.mapy), lon: Number(v.mapx), maxKm: 3, limit: 6 })
  }
})

function formatDate(s){ return s ? dayjs(s).format('YYYY.MM.DD') : '' }
</script>

<style scoped>
.post-card{ background:#fff; border-radius:12px; padding:14px; box-shadow:0 6px 18px rgba(22,42,31,0.04); border:1px solid rgba(0,0,0,0.04) }
.title-main{ font-size:18px; font-weight:800; margin:0 0 6px 0; color:#0b2f22 }
.meta-row{ color:#6b7972; margin-bottom:10px }
.muted{ color:#9aa8a0; margin-right:6px }
.post-content{ border-top:1px solid #f1f1f1; padding-top:12px }
.program-text{ background:#fbfbfb; padding:10px; border-radius:6px; white-space:pre-wrap }
.meta-list{ list-style:none; padding:0; margin:8px 0 }
.meta-list li{ margin-bottom:6px }
.nearby-list{ list-style:none; padding:0; margin:6px 0 0 0; display:flex; flex-direction:column; gap:8px }
.nearby-item{ display:flex; gap:10px; align-items:flex-start; padding:8px; border-radius:8px; border:1px solid #f3f6f3; background:#fff }
.expanded-dot{ width:12px; height:12px; border-radius:50% }
.r-title{ font-weight:700; color:#122a22 }
.r-addr{ color:#6b7972; font-size:0.92rem }
</style>