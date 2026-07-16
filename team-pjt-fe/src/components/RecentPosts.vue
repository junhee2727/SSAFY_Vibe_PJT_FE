<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { fetchPosts } from '../services/boardApi'
import PostItemBrief from './PostItemBrief.vue'

const props = defineProps({
  param: { type: [Number, String], default: 0 }
})

const posts = ref([])
const isLoading = ref(false)
const error = ref(null)

const categoryToFile = {
  '관광지': '서울_관광지.json',
  '레포츠': '서울_레포츠.json',
  '문화시설': '서울_문화시설.json',
  '쇼핑': '서울_쇼핑.json',
  '숙박': '서울_숙박.json',
  '여행코스': '서울_여행코스.json',
  '축제공연행사': '서울_축제공연행사.json'
}

const paramToLabel = {
  0: null, // 전체(최근)
  1: '레포츠',
  2: '문화시설',
  3: '쇼핑',
  4: '숙박',
  5: '여행코스',
  6: '축제공연행사'
}

// section title map (display labels)
const titleMap = {
  0: '최근 게시글',
  1: '레포츠',
  2: '문화시설',
  3: '쇼핑',
  4: '숙박',
  5: '여행 코스',
  6: '축제/공연/행사'
}
const sectionTitle = computed(() => {
  const p = Number(props.param ?? 0)
  return titleMap[p] ?? '최근 게시글'
})

const categoryIndex = ref({})
const indexBuilt = ref(false)

async function ensureCategoryIndex() {
  if (indexBuilt.value) return
  for (const [label, file] of Object.entries(categoryToFile)) {
    const candidates = [`/json/${file}`, `/static/json/${file}`, `/${file}`]
    for (const path of candidates) {
      try {
        const resp = await fetch(path)
        if (!resp.ok) continue
        const js = await resp.json()
        const typeId = js.contentTypeId !== undefined ? String(js.contentTypeId) : (js.contentType ? String(js.contentType) : null)
        const ids = new Set((js.items || []).map(i => String(i.contentid ?? i.contentId ?? i.contentID)))
        categoryIndex.value[label] = { file, typeId, ids }
        break
      } catch (e) { /* next candidate */ }
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

async function loadRecent() {
  isLoading.value = true
  error.value = null
  try {
    const res = await fetchPosts({ page: 1, perPage: 100 })
    const items = res.data || []
    await ensureCategoryIndex()
    const mapped = items.map(p => ({
      id: p.id,
      title: p.title,
      date: p.date,
      categoryLabel: classifyPost(p)
    }))

    const paramNum = Number(props.param ?? 0)
    const wantedLabel = paramToLabel[paramNum] ?? null

    let filtered = mapped
    if (paramNum !== 0 && wantedLabel) {
      filtered = mapped.filter(m => m.categoryLabel === wantedLabel)
    }

    posts.value = filtered.slice(0, 5)
  } catch (e) {
    error.value = e?.message || '최근 게시글을 불러오는 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadRecent)
watch(() => props.param, () => loadRecent())
</script>

<template>
  <section>
    <h3 class="section-title">{{ sectionTitle }}</h3>

    <div v-if="isLoading">불러오는 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <ul v-else class="posts">
      <li v-for="p in posts" :key="p.id" class="post-row">
        <router-link :to="{ name: 'BoardPost', params: { post_number: p.id } }" class="post-link">
          <span class="badge">{{ p.categoryLabel }}</span>
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
.post-row { display:flex; align-items:center; gap:12px; padding:8px 4px; border:1px solid #f0f0f0; overflow:hidden; margin-bottom: 8px; border-radius: 15px; box-shadow: 0 1px 4px rgba(0,0,0,0.1);}
.badge { background:#eef6ff; color:#036; padding:2px 8px; border-radius:12px; font-size:0.85rem; white-space:nowrap; }
.post-link { display:flex; align-items:center; gap:12px; color:inherit; text-decoration:none; width:100%; min-width: 0;}
.empty { color:#666; padding:8px 0 }
.error { color:#b00 }
</style>