<template>
  <HeaderNav />
  <section class="board-list">
    <h2 class="page-title">전체 글보기</h2>

    <div class="table-header" aria-hidden="true">
      <div class="col-num">번호</div>
      <div class="col-title">제목</div>
      <div class="col-author">작성자</div>
      <div class="col-date">작성일</div>
      <div class="col-views">조회수</div>
    </div>

    <ul class="posts" role="list">
      <li v-for="p in posts" :key="p.id" class="post-row-wrapper">
        <router-link :to="{ name: 'BoardPost', params: { post_number: p.id } }" class="post-link">
          <PostItem
            :id="p.id"
            :title="p.title"
            :author="p.author"
            :date="p.date"
            :views="p.views"
          />
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchPosts } from '../services/BoardApi' // 새로 만든 mock API
import PostItem from '../components/PostItem.vue'
import HeaderNav from '../components/HeaderNav.vue'

const route = useRoute()
const router = useRouter()

const perPage = 10

// 상태
const posts = ref([])
const totalCount = ref(0)
const totalPages = ref(1)
const currentPage = ref(Number(route.query.page || 1))
const isLoading = ref(false)
const error = ref(null)

// 필터 바인딩 (UI에서 사용 중인 것들)
const filterPeriod = ref(route.query.period || '')
const filterType = ref(route.query.type || '')
const q = ref(route.query.q || '')

// 로드 함수: 쿼리/필터에 따라 fetchPosts 호출
async function load() {
  isLoading.value = true
  error.value = null

  // 현재 페이지와 필터값을 route.query에서 우선 가져오도록 한다
  const page = Number(route.query.page || currentPage.value || 1)
  const period = route.query.period || filterPeriod.value
  const type = route.query.type || filterType.value
  const query = route.query.q || q.value

  try {
    const res = await fetchPosts({ page, perPage, period, type, q: query })
    posts.value = res.data
    totalCount.value = res.totalCount
    totalPages.value = res.totalPages
    currentPage.value = page
  } catch (err) {
    error.value = err.message || '데이터를 불러오는 중 오류가 발생했습니다.'
    posts.value = []
    totalCount.value = 0
    totalPages.value = 1
  } finally {
    isLoading.value = false
  }
}

// 페이지 이동 함수들 — router.push로 쿼리 동기화
function goto(n) {
  const next = Math.max(1, Math.min(Number(n) || 1, totalPages.value))
  router.push({ query: { ...route.query, page: next } })
}
function prevPage() { if (currentPage.value > 1) goto(currentPage.value - 1) }
function nextPage() { if (currentPage.value < totalPages.value) goto(currentPage.value + 1) }

// 필터 적용: 페이지 리셋 + 쿼리 갱신 + 재조회
function applyFilters() {
  const newQuery = { ...route.query, page: 1 }
  if (filterPeriod.value) newQuery.period = filterPeriod.value; else delete newQuery.period
  if (filterType.value) newQuery.type = filterType.value; else delete newQuery.type
  if (q.value) newQuery.q = q.value; else delete newQuery.q
  router.push({ query: newQuery })
}

// navigate to write page
function goWrite(){
  router.push({ name: 'BoardWrite' })
}

// 쿼리 변경을 감지해서 로드
onMounted(load)
watch(() => route.query, () => { load() }, { deep: true })
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
}

.posts { list-style:none; padding:0; margin:0; }
.post-row-wrapper { border-bottom:1px solid #eee; }
.post-link { display:block; color:inherit; text-decoration:none; padding:10px 8px; }
.post-link:hover { background: #fbfdff; }

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
.btn { padding:8px 14px; border:1px solid #333; background:#fff; cursor:pointer; }
</style>