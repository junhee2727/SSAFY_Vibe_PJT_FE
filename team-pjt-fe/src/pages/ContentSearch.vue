<template>
  <section class="content-search">
    <div class="container">
      <h2 class="page-title">컨텐츠 검색</h2>

      <div class="controls">
        <select v-model="selectedType" class="control small">
          <option value="">--타입 선택--</option>
          <option v-for="f in contentFiles" :key="f.value" :value="f.value">{{ f.label }}</option>
        </select>

        <input v-model="searchQuery" placeholder="이름을 입력하세요" class="control input-search" />

        <button class="btn primary" @click="searchContent">검색</button>
      </div>

      <hr class="divider" />

      <div v-if="searching" class="status">검색중...</div>

      <div v-else>
        <div v-if="searchResults.length" class="results" role="list">
          <ul>
            <li v-for="item in searchResults" :key="item._idx" class="result-row" role="listitem">
              <button class="result-item" @click="selectAndSend(item)">
                <span class="dot" aria-hidden="true"></span>
                <span class="title">{{ item.title }}</span>
                <!-- 오른쪽 chevron -->
                <svg class="chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
              </button>
            </li>
          </ul>
        </div>

        <div v-else class="empty-state" aria-live="polite">
          <svg class="empty-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="27" cy="27" r="16" stroke="#cfd8e3" stroke-width="3" fill="#f7f9fc"/>
            <path d="M41 41 L56 56" stroke="#cfd8e3" stroke-width="3" stroke-linecap="round"/>
          </svg>

          <div class="empty-title">결과가 없습니다.</div>
          <div class="empty-sub">검색 조건을 변경해 다시 검색해 주세요.</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const contentFiles = [
  { label:'관광지', value:'서울_관광지.json' },
  { label:'레포츠', value:'서울_레포츠.json' },
  { label:'문화시설', value:'서울_문화시설.json' },
  { label:'쇼핑', value:'서울_쇼핑.json' },
  { label:'숙박', value:'서울_숙박.json' },
  { label:'여행코스', value:'서울_여행코스.json' },
  { label:'축제/공연/행사', value:'서울_축제공연행사.json' }
]

const selectedType = ref(route.query.type || '')
const searchQuery = ref(route.query.q || '')
const searchResults = ref([])
const searching = ref(false)

// 캐시: type -> 원본 배열
const typeCache = {}

async function fetchTypeArray(type) {
  if (!type) return []
  if (typeCache[type]) return typeCache[type] // 캐시 사용

  try {
    const res = await fetch(`../../json/${type}`)
    if (!res || !res.ok) { typeCache[type] = []; return typeCache[type] }
    const data = await res.json()
    const arr = Array.isArray(data) ? data : (data.items || [])
    typeCache[type] = arr
    return arr
  } catch {
    typeCache[type] = []
    return []
  }
}

async function buildListFromArray(arr) {
  return arr
    .map((d, idx) => ({ _idx: idx, title: d.title || d.name || d.주소 || d.명칭 || d.contentid, raw: d }))
    .filter(x => x.title)
}

async function searchContent(){
  searchResults.value = []
  if (!selectedType.value) return
  searching.value = true
  try {
    const arr = await fetchTypeArray(selectedType.value) // 캐시 활용
    const ql = String(searchQuery.value || '').toLowerCase().trim()
    let items = await buildListFromArray(arr)
    if (ql) items = items.filter(x => x.title.toLowerCase().includes(ql))
    searchResults.value = items
  } catch (e) {
    // UX 유지: 에러 시 빈 배열
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

let debounceTimer = null
const DEBOUNCE_MS = 300

// 타입 변경 시: 캐시가 있으면 즉시 로컬에서 결과 생성, 없으면 fetch
watch(selectedType, async (v) => {
  if (!v) { searchResults.value = []; return }
  if (typeCache[v]) {
    const arr = typeCache[v]
    const ql = String(searchQuery.value || '').toLowerCase().trim()
    let items = await buildListFromArray(arr)
    if (ql) items = items.filter(x => x.title.toLowerCase().includes(ql))
    searchResults.value = items
  } else {
    await searchContent()
  }
}, { immediate: !!selectedType.value })

// 검색어 입력 시 디바운스하여 캐시 내 필터링(캐시 없으면 fetch)
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    if (!selectedType.value) { searchResults.value = []; return }
    if (typeCache[selectedType.value]) {
      const arr = typeCache[selectedType.value]
      const ql = String(searchQuery.value || '').toLowerCase().trim()
      let items = await buildListFromArray(arr)
      if (ql) items = items.filter(x => x.title.toLowerCase().includes(ql))
      searchResults.value = items
    } else {
      await searchContent()
    }
  }, DEBOUNCE_MS)
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

function selectAndSend(item){
  if(!window.opener) return
  const message = { type: 'content-selected', contentType: selectedType.value, contentId: item.title }
  try{ window.opener.postMessage(message, window.location.origin) }catch(e){ window.opener.postMessage(message, '*') }
  window.close()
}
</script>

<style scoped>
/* 추정 색상/타입:
   - primary: #0a58ca (프로젝트 기본 유지)
   - border: #eef2f6 (연한 회색)
   - muted: #6b7280
   설명은 주석으로 표기했습니다.
*/

:root{
  --primary: #0a58ca;
  --muted: #6b7280;
  --border: #eef2f6;
}

/* 외부 레이아웃 */
.content-search{ padding: 20px 18px; font-family: inherit; }
.container{ max-width:1100px; margin: 0 auto; }

/* 제목 */
.page-title{ font-size:24px; font-weight:700; color:#111; margin: 6px 0 18px; }

/* 컨트롤 행 */
.controls{
  display:flex;
  gap:10px;
  align-items:center;
  margin-bottom:14px;
  flex-wrap:wrap;
}

/* inputs */
.control{
  padding:10px 12px;
  border-radius:4px;
  border:1px solid #e6e6e6;
  background: #fff;
  font-size:14px;
  color:#222;
  box-sizing:border-box;
}
.control.small{ min-width:200px; max-width:240px; }
.input-search{ min-width:360px; flex:1 1 420px; }

/* 버튼 */
.btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  padding:8px 14px;
  border-radius:8px;
  border:1px solid rgba(10,10,10,0.05);
  background:#fff;
  color:#222;
  cursor:pointer;
  font-size:14px;
}
.btn.primary{
  background:#0a58ca;
  color:#fff;
  border:none;
  box-shadow: 0 2px 8px rgba(10,90,200,0.08);
}

/* 구분선 */
.divider{ border:0; height:1px; background: linear-gradient(90deg, rgba(0,0,0,0.02), rgba(0,0,0,0.02)); margin: 8px 0 24px; }

/* 검색 상태 */
.status{ color:var(--muted); font-size:14px; margin-bottom:12px; }

/* 결과 카드: 고정 최대 높이 + 스크롤 */
.results{
  border-radius:8px;
  overflow:auto;
  border:1px solid #f3f6fa;
  background:#fff;
  max-height:420px; /* 이미지 비율과 유사하게 높이 확보 */
  box-shadow: 0 2px 8px rgba(20,30,40,0.03);
}

/* reset list */
.results ul{ list-style:none; margin:0; padding:0; }

/* 각 행 */
.result-row{ margin:0; }
.result-item{
  display:flex;
  align-items:center;
  gap:12px;
  width:100%;
  padding:12px 16px;
  text-align:left;
  background:transparent;
  border-bottom:1px solid #f2f5f9;
  cursor:pointer;
  color:#222;
  font-size:14px;
  box-sizing:border-box;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
}

/* 작은 왼쪽 도트 */
.result-item .dot{
  width:8px;
  height:8px;
  border-radius:50%;
  background:#c6cbd6; /* 추정: 연한 회색 */
  flex:0 0 auto;
}

/* 제목: 줄임표 처리 */
.result-item .title{
  flex:1 1 auto;
  min-width:0; /* 중요: flex 항목이 줄어들도록 허용 */
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

/* 오른쪽 화살표 */
.result-item .chev{ width:18px; height:18px; flex:0 0 auto; color:#9aa5b1; }

/* hover/active */
.result-item:hover{ background:#fbfdff; }

/* 스크롤바 (간단 스타일) */
.results::-webkit-scrollbar{ width:10px; height:10px; }
.results::-webkit-scrollbar-thumb{ background: rgba(0,0,0,0.06); border-radius:6px; }
.results::-webkit-scrollbar-track{ background: transparent; }

/* 빈 상태 */
.empty-state{
  min-height:320px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:10px;
  color:var(--muted);
  text-align:center;
  padding: 36px 12px;
}
.empty-icon{ width:72px; height:72px; opacity:0.95; }
.empty-title{ font-size:18px; color:#222; font-weight:600; margin-top:6px; }
.empty-sub{ font-size:13px; color:#8b94a0; margin-top:4px; }

/* 반응형 */
@media (max-width:720px){
  .controls{ gap:8px; }
  .input-search{ min-width:120px; flex: 1 1 100%; }
  .control.small{ min-width:100px; max-width:100%; }
  .results{ max-height:360px; }
}
</style>