<template>
  <div class="festival-calendar">
    <FullCalendar ref="fcRef" :options="calendarOptions" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import { loadFestivalEvents, assignColors } from '../services/calendarApi'

const fcRef = ref(null)
const plugins = [ dayGridPlugin, interactionPlugin ]
const rawEvents = ref([])
const emit = defineEmits(['select-event'])

onMounted(async () => {
  rawEvents.value = await loadFestivalEvents()
  assignColors(rawEvents.value)
})

const fcEvents = computed(() => {
  const out = []
  for (const e of rawEvents.value) {
    if (!e.startDate) continue
    const start = dayjs(e.startDate).format('YYYY-MM-DD')
    const end = e.endDate ? dayjs(e.endDate).format('YYYY-MM-DD') : start

    if (start === end) {
      out.push({
        id: `${e.id}-s`,
        origId: e.id,
        title: e.title,
        display: 'list-item',
        start,
        allDay: true,
        extendedProps: { meta: e, markerType: 'single' },
        backgroundColor: e.color,
        borderColor: e.color,
        textColor: '#000'
      })
    } else {
      out.push({
        id: `${e.id}-s`,
        origId: e.id,
        title: e.title + ' (시작)',
        display: 'list-item',
        start,
        allDay: true,
        extendedProps: { meta: e, markerType: 'start' },
        backgroundColor: e.color,
        borderColor: e.color,
        textColor: '#000'
      })
      out.push({
        id: `${e.id}-e`,
        origId: e.id,
        title: e.title + ' (끝)',
        display: 'list-item',
        start: end,
        allDay: true,
        extendedProps: { meta: e, markerType: 'end' },
        backgroundColor: e.color,
        borderColor: e.color,
        textColor: '#000'
      })
    }
  }
  return out
})

function eventDidMount(info) {
  const el = info.el
  const titleWrap = el.querySelector('.evt-title')
  const inner = el.querySelector('.evt-inner')
  if (!titleWrap || !inner) return
  const scrollW = inner.scrollWidth
  const clientW = titleWrap.clientWidth
  if (scrollW > clientW + 2) {
    titleWrap.classList.add('is-overflow')
    const dist = `${scrollW - clientW}px`
    titleWrap.style.setProperty('--scroll-distance', dist)
    titleWrap.style.setProperty('--scroll-duration', `${Math.max(3, (scrollW - clientW) / 18)}s`)
  } else {
    titleWrap.classList.remove('is-overflow')
    titleWrap.style.removeProperty('--scroll-distance')
    titleWrap.style.removeProperty('--scroll-duration')
  }
}

const calendarOptions = computed(() => ({
  plugins,
  initialView: 'dayGridMonth',
  headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth' },
  events: fcEvents.value,
  eventDisplay: 'list-item',
  eventContent: renderEventContent,
  eventClick: handleEventClick,
  eventDidMount,
  dayMaxEvents: 3,
  moreLinkClick: handleMoreClick,
  weekends: true,
  height: 'auto'
}))

function renderEventContent(arg) {
  const meta = arg.event.extendedProps.meta || {}
  const title = String(arg.event.title || meta.title || '')
  const html = `
    <div class="fc-evt" title="${escapeHtml(title)}">
      <span class="evt-dot" style="background:${meta.color || '#cfe8d8'}"></span>
      <span class="evt-title"><span class="evt-inner">${escapeHtml(title)}</span></span>
    </div>
  `
  return { html }
}

function handleEventClick(info) {
  info.jsEvent?.preventDefault()
  const meta = info.event.extendedProps.meta || {}
  emit('select-event', meta)

  const calendar = fcRef.value?.getApi?.()
  if (!calendar) return

  const prev = calendar.getEventById('__selected_bg')
  if (prev) prev.remove()

  const startIso = dayjs(meta.startDate).format('YYYY-MM-DD')
  const endIsoExclusive = dayjs(meta.endDate).add(1, 'day').format('YYYY-MM-DD')
  calendar.addEvent({
    id: '__selected_bg',
    start: startIso,
    end: endIsoExclusive,
    display: 'background',
    backgroundColor: '#eaf9ef'
  })
}

function handleMoreClick(arg, jsEvent) {
  jsEvent?.preventDefault()
  const moreEl = jsEvent?.currentTarget
  const dayCell = moreEl?.closest('[data-date]')
  if (!dayCell) return
  const weekRow = dayCell.closest('.fc-row')
  if (!weekRow) return

  const existing = weekRow.querySelector('.fc-week-expanded-panel')
  if (existing) { existing.remove(); weekRow.classList.remove('fc-week-expanded'); return }

  document.querySelectorAll('.fc-week-expanded-panel').forEach(p => p.remove())
  document.querySelectorAll('.fc-row.fc-week-expanded').forEach(r => r.classList.remove('fc-week-expanded'))

  const weekDates = Array.from(weekRow.querySelectorAll('[data-date]')).map(el => el.getAttribute('data-date'))
  const panel = document.createElement('div')
  panel.className = 'fc-week-expanded-panel'
  const daysHtml = weekDates.map(d => {
    const eventsForDay = eventsForDate(d)
    const items = eventsForDay.map(ev => {
      const title = ev.title + (ev.startDate === ev.endDate ? '' : (ev.startDate === d ? ' (시작)' : ev.endDate === d ? ' (끝)' : ''))
      return `<li class="expanded-item"><span class="expanded-dot" style="background:${ev.color || '#cfe8d8'}"></span><strong>${escapeHtml(title)}</strong></li>`
    }).join('')
    return `<div class="exp-day"><div class="exp-day-header">${d}</div><ul class="exp-list">${items || '<li class="expanded-empty">일정 없음</li>'}</ul></div>`
  }).join('')
  panel.innerHTML = `<div class="exp-inner">${daysHtml}</div>`
  weekRow.appendChild(panel)
  weekRow.classList.add('fc-week-expanded')
}

function eventsForDate(isoDate) {
  return rawEvents.value.filter(ev => {
    const s = ev.startDate ? dayjs(ev.startDate).format('YYYY-MM-DD') : null
    const e = ev.endDate ? dayjs(ev.endDate).format('YYYY-MM-DD') : null
    if (!s) return false
    if (s === isoDate) return true
    if (e === isoDate) return true
    return false
  }).sort((a,b) => {
    const da = (a.durationDays || 1), db = (b.durationDays || 1)
    if (db !== da) return db - da
    return (a.title || '').localeCompare(b.title || '')
  })
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}
</script>

<style>
/* Strong overrides to prevent vertical overflow/overlap */
a.fc-event.fc-daygrid-event,
a.fc-event.fc-daygrid-dot-event,
.fc-daygrid-event,
.fc-daygrid-dot-event {
  display: block !important;
  box-sizing: border-box !important;
  height: 26px !important;
  max-height: 26px !important;
  line-height: 26px !important;
  overflow: hidden !important;
  white-space: nowrap !important;
  padding: 0 6px !important;
  margin: 0 !important;
  position: relative !important;
  z-index: 1 !important;
}

/* inner wrapper must not expand vertically */
.fc-evt {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  min-width: 0 !important;
  height: 26px !important;
  overflow: hidden !important;
  width: 100%;
}

/* dot */
.evt-dot {
  flex: 0 0 0.85em !important;
  width: 0.85em !important;
  height: 0.85em !important;
  border-radius: 50% !important;
  margin-right: 6px !important;
  transform: translateY(-1px) !important;
}

/* title single-line ellipsis */
.evt-title {
  display: block !important;
  min-width: 0 !important;
  max-width: calc(100% - 1.2em) !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  line-height: 1 !important;
  max-height: 26px !important;
}

/* optional hover-scroll when flagged */
.evt-title .evt-inner { display:block; width: 100%; text-overflow: ellipsis; overflow: hidden; transform:translateX(0); transition: transform 0.3s linear; }
.evt-title.is-overflow:hover .evt-inner { animation: scroll-left var(--scroll-duration,6s) linear forwards; }
@keyframes scroll-left { 0%{transform:translateX(0)} 100%{transform:translateX(calc(-1 * var(--scroll-distance)))} }

/* ensure cell frames hide overflow */
.fc .fc-daygrid-day-frame,
.fc .fc-daygrid-day-events {
  overflow: hidden !important;
  min-height: 85px !important;
}

/* background opacity */
.fc .fc-bg-event { opacity: 0.22 !important; }

/* expanded-week panel */
.fc-week-expanded-panel { width:100%; background:#fff; border-top:1px solid #e6eef8; padding:10px; box-sizing:border-box; z-index:2; }
@media (max-width:900px) { .fc-week-expanded-panel .exp-inner { flex-direction:column } .exp-day { min-width:auto } }
</style>