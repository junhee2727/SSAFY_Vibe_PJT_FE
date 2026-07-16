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
        <div v-if="searchResults.length" class="results">
          <ul>
            <li v-for="item in searchResults" :key="item._idx">
              <button class="result-item" @click="selectAndSend(item)">{{ item.title }}</button>
            </li>
          </ul>
        </div>

        <div v-else class="empty-state" aria-live="polite">
          <!-- magnifier icon (inline SVG) -->
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
import { ref } from 'vue'
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

async function searchContent(){
  searchResults.value = []
  if(!selectedType.value || !searchQuery.value) return
  searching.value = true
  try{
    // 기존 로직과 동일: fetch 경로는 원본 유지 (환경에 따라 /json/ 또는 /static/json/으로 조정 필요)
    const res = await fetch(`../../json/${selectedType.value}`)
    if(!res.ok) return
    const data = await res.json()
    const arr = Array.isArray(data) ? data : (data.items || [])
    const ql = String(searchQuery.value).toLowerCase()
    const items = arr.map((d, idx)=>({ _idx: idx, title: d.title || d.name || d.주소 || d.명칭 || d.contentid, raw: d })).filter(x=> x.title && x.title.toLowerCase().includes(ql))
    searchResults.value = items
  }catch(e){
    // ignore
  }finally{ searching.value = false }
}

function selectAndSend(item){
  if(!window.opener) return
  const message = { type: 'content-selected', contentType: selectedType.value, contentId: item.title }
  try{ window.opener.postMessage(message, window.location.origin) }catch(e){ window.opener.postMessage(message, '*') }
  window.close()
}
</script>

<style scoped>
/* 스타일: 이미지 기준 추정치
   - primary blue: 기존 프로젝트와 일관되게 #0a58ca 사용 (추정)
   - subtle border: #eef2f6 / #e9eef5 추정
   - font: 시스템 계열 사용 (실제 디자인 폰트가 있으면 교체)
*/

:root{
  --primary: #0a58ca; /* 추정 / 기존과 호환 */
  --muted: #6b7280;
  --border: #eef2f6;
  --bg: #ffffff;
}

.content-search{ padding: 20px 18px; font-family: inherit; background: transparent; }

/* 중앙 컨테이너 폭 맞춤 */
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

/* 공통 input/select 스타일 */
.control{
  padding:10px 12px;
  border-radius:8px;
  border:1px solid #e6e6e6;
  background: #fff;
  font-size:14px;
  color:#222;
  box-sizing:border-box;
}
.control.small{ min-width:200px; max-width:240px; }

/* 검색 입력은 넉넉하게 확장 */
.input-search{
  min-width:360px;
  flex:1 1 420px;
}

/* 검색 버튼 */
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
  border: none;
  box-shadow: 0 2px 8px rgba(10,90,200,0.08);
}

/* 구분선 */
.divider{
  border:0;
  height:1px;
  background: linear-gradient(90deg, rgba(0,0,0,0.02), rgba(0,0,0,0.02));
  margin: 8px 0 24px;
}

/* 검색 상태 텍스트 */
.status{ color:var(--muted); font-size:14px; margin-bottom:12px; }

/* 결과 리스트 */
.results{ border-radius:8px; overflow:hidden; border:1px solid #f3f6fa; background:#fff; }
.result-item{
  display:block;
  width:100%;
  text-align:left;
  padding:12px 14px;
  border-bottom:1px solid #f5f7fb;
  background:transparent;
  font-size:14px;
  color:#222;
}
.result-item:hover{ background:#fbfdff; }

/* 빈 상태 스타일 (이미지 중앙 정렬) */
.empty-state{
  min-height:320px; /* 이미지처럼 여유있는 높이 */
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:10px;
  color:var(--muted);
  text-align:center;
  background: transparent;
  padding: 36px 12px;
}
.empty-icon{ width:72px; height:72px; opacity:0.95; }
.empty-title{ font-size:18px; color:#222; font-weight:600; margin-top:6px; }
.empty-sub{ font-size:13px; color:#8b94a0; margin-top:4px; }

/* 반응형: 좁은 화면에서는 입력이 줄바꿈 */
@media (max-width:720px){
  .controls{ gap:8px; }
  .input-search{ min-width:120px; flex: 1 1 100%; }
  .control.small{ min-width:100px; max-width:100%; }
}
</style>