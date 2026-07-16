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

      <div class="detail-grid">
        <div class="detail-left">
          <article class="post-content">
            <h4>프로그램</h4>
            <div class="program-text" v-html="sanitizedProgramHtml"></div>

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

        <div class="detail-right" v-if="imageUrl">
          <img :src="imageUrl" alt="event image" class="detail-img" @error="handleImageError" />
        </div>
      </div>
    </div>
  </aside>

  <aside v-else class="detail-empty post-card">
    <p style="margin:0">일정을 선택하면 상세 정보가 여기에 표시됩니다.</p>
  </aside>
</template>

<script setup>
import { watch, ref, computed } from 'vue'
import dayjs from 'dayjs'
import DOMPurify from 'dompurify'
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

// 이미지 fallback & error 처리
const fallbackImage = (import.meta.env.BASE_URL || '/') + 'no_place.png'
const imageFailed = ref(false)

const imageUrl = computed(() => {
  const e = props.event || {}
  if (imageFailed.value) return fallbackImage
  // use only firstimage per your instruction
  return e.firstimage || null
})

function handleImageError(e){
  imageFailed.value = true
  e.target.src = fallbackImage
}

// reset when event changes
watch(() => props.event, () => { imageFailed.value = false })

// Convert program text -> simple markdown-like HTML, sanitized
const sanitizedProgramHtml = computed(() => {
  const raw = (props.event && props.event.program) ? String(props.event.program).trim() : ''
  if (!raw) return '<div class="no-program">상세 정보가 없습니다.</div>'

  // escape HTML
  let s = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // bold **bold**
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // italic *italic*
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Split into paragraph blocks by blank line
  const blocks = s.split(/\r\n\r\n|\n\n/)
  const out = blocks.map(block => {
    const lines = block.split(/\r\n|\n/)
    // unordered list if every line starts with "- "
    if (lines.every(l => /^\s*-\s+/.test(l))) {
      const items = lines.map(l => '<li>' + l.replace(/^\s*-\s+/, '') + '</li>').join('')
      return `<ul>${items}</ul>`
    }
    // ordered list if every line is "1. "
    if (lines.every(l => /^\s*\d+\.\s+/.test(l))) {
      const items = lines.map(l => '<li>' + l.replace(/^\s*\d+\.\s+/, '') + '</li>').join('')
      return `<ol>${items}</ol>`
    }
    // otherwise keep line breaks inside a paragraph
    const paragraph = lines.map(l => l || '<br/>').join('<br/>')
    return `<p>${paragraph}</p>`
  }).join('')

  return DOMPurify.sanitize(out, { ALLOWED_TAGS: ['br','b','i','strong','em','p','ul','li','ol'] })
})

// show program as plain text with preserved newlines
const programPlain = computed(() => {
  const raw = (props.event && props.event.program) ? String(props.event.program) : ''
  if (!raw) return '상세 정보가 없습니다.'
  return raw.trim() // v-text + CSS will preserve line breaks
})

// debug: show event payload when it changes (remove later)
watch(() => props.event, (v) => {
  console.log('Event selected (detail):', v)
})

</script>

<style scoped>
.post-card{ background:#fff; border-radius:12px; padding:14px; box-shadow:0 6px 18px rgba(22,42,31,0.04); border:1px solid rgba(0,0,0,0.04) }
.title-main{ font-size:18px; font-weight:800; margin:0 0 6px 0; color:#0b2f22 }
.meta-row{ color:#6b7972; margin-bottom:10px }
.muted{ color:#9aa8a0; margin-right:6px }

/* layout: left content + right image column (fixed to image intrinsic width, top-aligned) */
.detail-grid {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

/* left content fills remaining width */
.detail-left {
  flex: 1 1 0;
  min-width: 0;
}

/* right column follows image intrinsic width and stays top-aligned */
.detail-right {
  flex: none;
  align-self: flex-start;
  display: block;
  overflow: visible;
}

/* image: height limited, width determined by aspect ratio; align to top */
.detail-img {
  display: block;
  width: auto;                       /* width follows image aspect ratio */
  height: var(--detail-img-height, 240px); /* control height */
  max-width: 100%;                   /* don't exceed container on small screens */
  object-fit: cover;                 /* fills box; change to contain if you want no crop */
  border-radius: 8px;
  vertical-align: top;
  align-self: flex-start;
}

/* responsive: stack on small screens */
@media (max-width:900px) {
  .detail-grid { flex-direction: column; }
  .detail-right { align-self: stretch; }
  .detail-img { width:100%; height:auto; object-fit:contain; }
}
/* If you prefer the image to fill the box and crop overflow, use this instead:
.detail-img { width:100%; height:100%; object-fit:cover; }
*/

/* program */
.post-content{ border-top:1px solid #f1f1f1; padding-top:12px }
.program-text { color:#333; line-height:1.7; }
.program-text p { margin: 0 0 0.8em 0; }
/* keep simple paragraphs readable */
.program-text br { display:block; margin:6px 0; }

/* meta list & nearby */
.meta-list{ list-style:none; padding:0; margin:8px 0 }
.meta-list li{ margin-bottom:6px }
.nearby-list{ list-style:none; padding:0; margin:6px 0 0 0; display:flex; flex-direction:column; gap:8px }
.nearby-item{ display:flex; gap:10px; align-items:flex-start; padding:8px; border-radius:8px; border:1px solid #f3f6f3; background:#fff }
.expanded-dot{ width:12px; height:12px; border-radius:50% }
.r-title{ font-weight:700; color:#122a22 }
.r-addr{ color:#6b7972; font-size:0.92rem }


</style>