<template>
  <section class="content-search">
    <h2>컨텐츠 검색</h2>
    <div class="controls">
      <select v-model="selectedType" class="control small">
        <option value="">--타입 선택--</option>
        <option v-for="f in contentFiles" :key="f.value" :value="f.value">{{ f.label }}</option>
      </select>
      <input v-model="searchQuery" placeholder="이름을 입력하세요" class="control" />
      <button class="btn" @click="searchContent">검색</button>
    </div>

    <div v-if="searching" class="small">검색중...</div>
    <div v-if="searchResults.length" class="results">
      <ul>
        <li v-for="item in searchResults" :key="item._idx">
          <button class="result-item" @click="selectAndSend(item)">{{ item.title }}</button>
        </li>
      </ul>
    </div>
    <div v-if="!searchResults.length && !searching" class="small">결과가 없습니다.</div>
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
  // send to opener (parent)
  try{ window.opener.postMessage(message, window.location.origin) }catch(e){ window.opener.postMessage(message, '*') }
  // close popup
  window.close()
}
</script>

<style scoped>
.content-search{ padding:16px; font-family:inherit }
.controls{ display:flex; gap:8px; align-items:center; margin-bottom:12px }
.results{ max-height:300px; overflow:auto; border:1px solid #eee; background:#fff }
.result-item{ display:block; width:100%; text-align:left; padding:8px; border-bottom:1px solid #f5f5f5 }
.result-item:hover{ background:#f7f9fc }
</style>
