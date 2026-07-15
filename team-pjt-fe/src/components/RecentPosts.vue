<script setup>
import { ref, onMounted } from 'vue'
import PostItemBrief from './PostItemBrief.vue'
import { fetchPosts } from '@/services/boardApi'

const posts = ref([])
const isLoading = ref(false)
const error = ref(null)

async function loadRecent() {
  isLoading.value = true
  error.value = null
  try {
    const res = await fetchPosts({ page: 1, perPage: 5 })
    posts.value = (res.data || []).map(p => ({ id: p.id, title: p.title, date: p.date }))
  } catch (e) {
    error.value = e?.message || '최근 게시글을 불러오는 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadRecent)
</script>

<template>
  <section>
    <h3 class="section-title">최근 게시글</h3>

    <div v-if="isLoading">불러오는 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <ul v-else class="posts">
      <li v-for="p in posts" :key="p.id">
        <router-link :to="{ name: 'BoardPost', params: { post_number: p.id } }" class="post-link">
          <PostItemBrief :title="p.title" :date="p.date" />
        </router-link>
      </li>
      <li v-if="!posts.length" class="empty">등록된 게시글이 없습니다.</li>
    </ul>
  </section>
</template>

<style scoped>
.section-title { margin:0 0 1rem 0; font-size:1.25rem; }
.posts { list-style:none; padding:0; margin:0; }
.posts li { border-bottom:1px solid #f0f0f0; padding:10px 0; }
.post-link { display:block; color:inherit; text-decoration:none; }
.empty { color:#666; padding:8px 0 }
.error { color:#b00; }
</style>