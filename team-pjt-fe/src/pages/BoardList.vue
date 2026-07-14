<template>
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
    </form>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import PostItem from '../components/PostItem.vue'

const allPosts = ref([
  { id:15, title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:14, title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:13, title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:12, title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:11, title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:10, title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:9,  title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:8,  title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:7,  title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:6,  title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:5,  title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:4,  title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:3,  title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:2,  title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 },
  { id:1,  title:'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum...', author:'이준희', date:'2026.08.13', views:31 }
])

const currentPage = ref(1)
const perPage = 10
const totalPages = Math.ceil(allPosts.value.length / perPage)

const posts = computed(() => {
  // 간단 페이징(샘플 데이터)
  const start = (currentPage.value - 1) * perPage
  return allPosts.value.slice(start, start + perPage)
})

// controls (UI만 동작)
const filterPeriod = ref('')
const filterType = ref('')
const q = ref('')

function goto(n){ currentPage.value = n }
function prevPage(){ if(currentPage.value>1) currentPage.value-- }
function nextPage(){ if(currentPage.value<totalPages) currentPage.value++ }
function applyFilters(){ /* 실제 데이터 연동시 필터 적용 로직 연결 */ }
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
  justify-content:flex-start;
  align-items:center;
  margin-top:1rem;
}
.control { padding:8px 10px; border:1px solid #ccc; border-radius:2px; background:#fff; }
.search { flex:1 1 320px; }
.btn { padding:8px 14px; border:1px solid #333; background:#fff; cursor:pointer; }
</style>