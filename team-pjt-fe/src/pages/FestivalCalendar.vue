<template>
  <HeaderNav />
  <section class="calendar-page">
    <div class="post-card">
      <h2 class="title-main small">축제 일정 확인해보기</h2>
      <div class="calendar-container">
        <FestivalCalendarView @select-event="onSelectEvent" />
      </div>
    </div>

    <EventDetailPanel :event="selectedEvent" />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import HeaderNav from '../components/HeaderNav.vue'
import FestivalCalendarView from '../components/FestivalCalendarView.vue'
import EventDetailPanel from '../components/EventDetailPanel.vue'

const selectedEvent = ref(null)
function onSelectEvent(ev){ selectedEvent.value = ev }
</script>

<style scoped>
.calendar-page{ max-width:1200px; margin:18px auto; padding:20px; display:grid; gap:18px }
.post-card{ background:#fff; border-radius:12px; padding:18px; box-shadow:0 6px 18px rgba(22,42,31,0.04); border:1px solid rgba(0,0,0,0.04) }
.small{ font-size:1.05rem; font-weight:700; color:#0b2f22; margin:0 0 8px 0 }
.calendar-container{ margin-bottom:12px }
</style>