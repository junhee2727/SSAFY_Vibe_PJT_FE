<template>
  <HeaderNav />
  <section class="board-list">
    <h2 class="page-title">북마크한 글</h2>

    <div v-if="loading" class="loading">불러오는 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else>
      <div v-if="posts.length === 0" class="empty-state">
        <div class="empty-text">북마크한 글이 없습니다.</div>
      </div>

      <ul v-else class="posts">
        <li v-for="p in posts" :key="p.id" class="post-row-wrapper">
          <router-link :to="{ name: 'BoardPost', params: { post_number: p.id } }" class="post-link">
            <PostItem :id="p.id" :title="p.title" :author="p.author" :date="p.date" :views="p.views" />
          </router-link>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import HeaderNav from '../components/HeaderNav.vue'
import PostItem from '../components/PostItem.vue'
import { fetchClientIp, fetchBookmarkedBoards } from '../services/boardApi'

const posts = ref([])
const loading = ref(false)
const error = ref(null)

onMounted(async () => {
  loading.value = true
  try {
    const ip = await fetchClientIp()
    if (!ip) {
      error.value = '클라이언트 IP를 가져올 수 없습니다. (개발환경 또는 백엔드 설정 확인)'
      return
    }
    posts.value = await fetchBookmarkedBoards(ip)
  } catch (e) {
    error.value = e.message || '불러오기 실패'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.board-list { max-width: 1100px; margin: 0 auto; padding: 1rem; }
.page-title { font-size: 1.25rem; margin: 0 0 1rem 0; border-bottom: 1px solid #ddd; padding-bottom: 0.75rem; }
.posts { list-style:none; padding:0; margin:0; }
.post-row-wrapper { border-bottom:1px solid #eee; }
.post-link { display:block; color:inherit; text-decoration:none; padding:10px 8px; }
.post-link:hover { background: #fbfdff; }
.loading, .error { padding:12px; color:#666 }

/* empty state center */
.empty-state {
  display:flex;
  align-items:center;
  justify-content:center;
  min-height:220px;
  padding:24px;
}
.empty-text {
  color:#666;
  font-size:1.05rem;
  text-align:center;
}
</style>