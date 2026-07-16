<template>
  <HeaderNav />
  <section class="board-list">
    <h2 class="page-title">{{ pageTitle }}</h2>

    <div class="table-header" aria-hidden="true" :class="{ 'with-category': isAllCategory }">
      <div class="col-num">번호</div>
      <div v-if="isAllCategory" class="col-category">카테고리</div>
      <div class="col-title">제목</div>
      <div class="col-author">작성자</div>
      <div class="col-date">작성일</div>
      <div class="col-views">조회수</div>
    </div>

    <ul class="posts" role="list">
      <li v-for="p in posts" :key="p.id" class="post-row-wrapper">
        <router-link :to="{ name: 'BoardPost', params: { post_number: p.id } }" class="post-link">
          <template v-if="isAllCategory">
            <div class="post-row all">
              <div class="col-num">{{ p.id }}</div>
              <div class="col-category">{{ p.categoryLabel }}</div>
              <div class="col-title" :title="p.title">{{ p.title }}</div>
              <div class="col-author">{{ p.author }}</div>
              <div class="col-date">{{ p.date }}</div>
              <div class="col-views">{{ p.views }}</div>
            </div>
          </template>
          <template v-else>
            <PostItem
              :id="p.id"
              :title="p.title"
              :author="p.author"
              :date="p.date"
              :views="p.views"
            />
          </template>
        </router-link>
      </li>
    </ul>

    <nav class="pagination" aria-label="페이지 네비게이션">
      <button class="page-btn" :disabled="currentPage === 1" @click="prevPage">&lt;</button>
      <button
        v-for="n in totalPages"
        :key="n"
        :class="['page-num', { active: n === currentPage }]"
        @click="goto(n)"
      >{{ n }}</button>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="nextPage">&gt;</button>
    </nav>

    <form class="board-controls" @submit.prevent>
      <div class="controls-left">
        <select v-model="filterPeriod" class="control">
          <option value="">전체 기간</option>
          <option value="7">최근 7일</option>
          <option value="30">최근 30일</option>
        </select>

        <select v-model="filterType" class="control">
          <option value="">전체</option>
          <option value="post">글</option>
          <option value="post+comment">글 + 댓글</option>
        </select>

        <input v-model="q" type="search" placeholder="검색어를 입력해주세요" class="search control" />
        <button class="btn" @click="applyFilters">검색</button>
      </div>

      <div class="controls-right">
        <button type="button" class="btn primary" @click="goWrite">글쓰기</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchPosts } from '../services/boardApi'
import PostItem from '../components/PostItem.vue'
import HeaderNav from '../components/HeaderNav.vue'

const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => {
  const cat = route.query.category
  if (!cat || String(cat) === '전체') return '전체 글보기'
  return `${String(cat)} 글보기`
})

const isAllCategory = computed(() => {
  const cat = route.query.category
  return !cat || String(cat) === '전체'
})

const perPage = 10
const posts = ref([])
const totalCount = ref(0)
const totalPages = ref(1)
const currentPage = ref(Number(route.query.page || 1))
const isLoading = ref(false)
const error = ref(null)

const filterPeriod = ref(route.query.period || '')
const filterType = ref(route.query.type || '')
const q = ref(route.query.q || '')

// 카테고리 -> static json 파일 매핑
const categoryToFile = {
  '관광지': '서울_관광지.json',
  '레포츠': '서울_레포츠.json',
  '문화시설': '서울_문화시설.json',
  '쇼핑': '서울_쇼핑.json',
  '숙박': '서울_숙박.json',
  '여행코스': '서울_여행코스.json',
  '축제공연행사': '서울_축제공연행사.json'
}

// 캐시된 인덱스 (label -> {file,typeId,ids})
const categoryIndex = ref({})
const indexBuilt = ref(false)

async function ensureCategoryIndex() {
  if (indexBuilt.value) return
  for (const [label, file] of Object.entries(categoryToFile)) {
    const candidates = [
      `/json/${file}`,
      `/static/json/${file}`,
      `/${file}`
    ]
    for (const path of candidates) {
      try {
        const resp = await fetch(path)
        if (!resp.ok) continue
        const js = await resp.json()
        const typeId = js.contentTypeId !== undefined ? String(js.contentTypeId) : (js.contentType ? String(js.contentType) : null)
        const ids = new Set((js.items || []).map(i => String(i.contentid ?? i.contentId ?? i.contentID)))
        categoryIndex.value[label] = { file, typeId, ids }
        break
      } catch (e) {
        // try next candidate
      }
    }
  }
  indexBuilt.value = true
}

function classifyPost(p) {
  if (!p.content_type && !p.content_id) return '일반'
  for (const [label, info] of Object.entries(categoryIndex.value)) {
    if (!info) continue
    if (info.typeId && p.content_type && String(p.content_type) === info.typeId) return label
    if (info.ids && p.content_id && info.ids.has(String(p.content_id))) return label
    if (p.content_type && String(p.content_type) === info.file) return label
  }
  return '기타'
}

async function filterByCategory(items, category){
  if(!category || category === '전체') return items
  if(category === '일반'){
    return items.filter(p => !p.content_type && !p.content_id)
  }
  const file = categoryToFile[category]
  if(!file) return []

  const candidates = [
    `/json/${file}`,
    `/static/json/${file}`,
    `/${file}`
  ]

  for (const path of candidates) {
    try {
      const resp = await fetch(path)
      if(!resp.ok) continue
      const js = await resp.json()
      const typeId = js.contentTypeId !== undefined ? String(js.contentTypeId) : (js.contentType ? String(js.contentType) : null)
      const ids = new Set((js.items || []).map(i => String(i.contentid || i.contentId || i.contentID)))
      return items.filter(p => {
        const pt = p.content_type ? String(p.content_type) : null
        const pid = p.content_id ? String(p.content_id) : null
        if (typeId && pt && pt === typeId) return true
        if (pt && pt === file) return true
        if (pid && ids.has(pid)) return true
        return false
      })
    } catch (e) {
      // try next candidate
    }
  }

  console.warn('category JSON not found for', category, 'tried paths:', candidates)
  return []
}

async function load() {
  isLoading.value = true
  error.value = null

  const page = Number(route.query.page || currentPage.value || 1)
  const period = route.query.period || filterPeriod.value
  const type = route.query.type || filterType.value
  const query = route.query.q || q.value
  try {
    const resAll = await fetchPosts({ page: 1, perPage: 10000, period, type, q: query })
    let allItems = resAll.data || []

    if (isAllCategory.value) {
      await ensureCategoryIndex()
      allItems = allItems.map(p => ({ ...p, categoryLabel: classifyPost(p) }))
    } else if (route.query.category) {
      allItems = await filterByCategory(allItems, String(route.query.category))
    }

    totalCount.value = allItems.length
    totalPages.value = Math.max(1, Math.ceil(totalCount.value / perPage))
    const next = Math.max(1, Math.min(Number(page || 1), totalPages.value))
    currentPage.value = next
    const start = (next - 1) * perPage
    posts.value = allItems.slice(start, start + perPage)
  } catch (err) {
    error.value = err.message || '데이터를 불러오는 중 오류가 발생했습니다.'
    posts.value = []
    totalCount.value = 0
    totalPages.value = 1
  } finally {
    isLoading.value = false
  }
}

function goto(n) {
  const next = Math.max(1, Math.min(Number(n) || 1, totalPages.value))
  router.push({ query: { ...route.query, page: next } })
}
function prevPage() { if (currentPage.value > 1) goto(currentPage.value - 1) }
function nextPage() { if (currentPage.value < totalPages.value) goto(currentPage.value + 1) }

function applyFilters() {
  const newQuery = { ...route.query, page: 1 }
  if (filterPeriod.value) newQuery.period = filterPeriod.value; else delete newQuery.period
  if (filterType.value) newQuery.type = filterType.value; else delete newQuery.type
  if (q.value) newQuery.q = q.value; else delete newQuery.q
  router.push({ query: newQuery })
}

function goWrite(){
  router.push({ name: 'BoardWrite' })
}

onMounted(load)

// when route.query changes, if category changed and previous page was >1,
// replace the route to set page=1 first (avoids loading the old page),
// otherwise just load.
watch(
  () => route.query,
  (newQ, oldQ) => {
    const newCat = newQ && newQ.category
    const oldCat = oldQ && oldQ.category

    if (newCat !== oldCat) {
      const oldPage = oldQ && oldQ.page
      if (oldPage && Number(oldPage) !== 1) {
        // replace to set page=1 for the new category, then return.
        const merged = { ...newQ, page: 1 }
        router.replace({ query: merged })
        return
      }
    }

    // otherwise load normally for current query
    load()
  },
  { deep: true }
)
</script>

<style scoped>
.board-list { max-width: 1100px; margin: 0 auto; padding: 1rem; }

.page-title {
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.75rem;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 140px 120px 80px;
  gap: 12px;
  font-weight: 600;
  color: #666;
  padding: 12px 8px;
  border-bottom: 1px solid #e6e6e6;
  background: #fafafa;
  align-items: center;
}

/* when showing category column, shift grid */
.table-header.with-category {
  grid-template-columns: 60px 140px 1fr 140px 120px 80px;
}

.posts { list-style:none; padding:0; margin:0; }
.post-row-wrapper { border-bottom:1px solid #eee; }
.post-link { display:block; color:inherit; text-decoration:none; padding:10px 8px; }
.post-link:hover { background: #fbfdff; }

/* inline "전체" row layout */
.post-row.all {
  display: grid;
  grid-template-columns: 60px 140px 1fr 140px 120px 80px;
  gap: 12px;
  align-items: center;
}
.post-row.all .col-title { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

.pagination {
  text-align:center;
  margin:1.25rem 0;
}
.page-num, .page-btn {
  margin:0 6px;
  border:none;
  background:transparent;
  color:#333;
  cursor:pointer;
}
.page-num.active { font-weight:700; text-decoration:underline; }

.board-controls {
  display:flex;
  gap:12px;
  justify-content:space-between;
  align-items:center;
  margin-top:1rem;
}
.controls-left{ display:flex; gap:12px; align-items:center; width:80%; flex-wrap:wrap; }
.controls-right{ display:flex; align-items:center; }
.control { padding:8px 10px; border:1px solid #ccc; border-radius:2px; background:#fff; }
.search { flex:1 1 320px; }
.btn { display:inline-flex; align-items:center; gap:8px;
  padding:8px 12px; border-radius:8px; border:1px solid #e6e6e6;
  background:#fff; color:#222; cursor:pointer; font-size:14px; }
.btn.primary { background:#0a58ca; color:#fff; border:none; padding:10px 16px;}
</style>