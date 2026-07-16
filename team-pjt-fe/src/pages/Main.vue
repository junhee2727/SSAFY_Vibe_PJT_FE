<script setup>
import HeaderNav from '../components/HeaderNav.vue'
import HeroBanner from '../components/HeroBanner.vue'
import RecentPosts from '../components/RecentPosts.vue'
import { ref, onMounted } from 'vue'
import { fetchPosts } from '../services/boardApi'

const posts = ref([])
const isLoadingPosts = ref(false)
const postsError = ref(null)

const categoryToFile = {
  '관광지': '서울_관광지.json',
  '레포츠': '서울_레포츠.json',
  '문화시설': '서울_문화시설.json',
  '쇼핑': '서울_쇼핑.json',
  '숙박': '서울_숙박.json',
  '여행코스': '서울_여행코스.json',
  '축제공연행사': '서울_축제공연행사.json'
}

// 정적 매핑: contentTypeId -> 라벨 (public/json 파일들의 contentTypeId를 미리 추출하여 고정)
const typeIdToLabel = {
  '12': '관광지',
  '28': '레포츠',
  '14': '문화시설',
  '38': '쇼핑',
  '32': '숙박',
  '25': '여행코스',
  '15': '축제공연행사'
}
// 파일명 -> 라벨 (fallback)
const fileToLabel = Object.fromEntries(Object.entries(categoryToFile).map(([label, file]) => [file, label]))

function classifyPost(p) {
  if (!p || (!p.content_type && !p.content_id)) return '일반'
  const pType = p.content_type ? String(p.content_type).trim() : null
  const pId = p.content_id ? String(p.content_id).trim() : null

  // numeric content_type (예: "14")
  if (pType && /^\d+$/.test(pType)) {
    const lbl = typeIdToLabel[pType]
    if (lbl) return lbl
  }

  // content_type already a label (예: "문화시설")
  if (pType && Object.values(typeIdToLabel).includes(pType)) return pType

  // content_type is file name (예: "서울_문화시설.json")
  if (pType && fileToLabel[pType]) return fileToLabel[pType]

  // 여전히 분류 불가면 '기타' (또는 '일반' 여부는 데이터에 따라 조정)
  return '기타'
}

async function loadAllPosts() {
  isLoadingPosts.value = true
  postsError.value = null
  try {
    const res = await fetchPosts({ page: 1, perPage: 100 })
    const items = res.data || []

    posts.value = items.map(p => ({
      id: p.id,
      title: p.title,
      date: p.date,
      content_type: p.content_type,
      content_id: p.content_id,
      categoryLabel: classifyPost(p)
    }))
  } catch (e) {
    postsError.value = e?.message || '최근 게시글 로드 실패'
  } finally {
    isLoadingPosts.value = false
  }
}

onMounted(loadAllPosts)
</script>

<template>
  <HeaderNav />
  <HeroBanner />
  <main class="page-container">
    <div class="recent-grid">
      <RecentPosts :param="0" :items="posts" />
      <RecentPosts :param="1" :items="posts" />
      <RecentPosts :param="2" :items="posts" />
      <RecentPosts :param="3" :items="posts" />
      <RecentPosts :param="4" :items="posts" />
      <RecentPosts :param="5" :items="posts" />
    </div>
  </main>
</template>

<style scoped>
.page-container {
  max-width: 1100px;
  margin: 1.5rem auto;
  padding: 0 1rem;
}
.recent-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  align-items: start;
}
.recent-grid > * { width:100%; box-sizing:border-box; min-width:0; }
@media (max-width: 868px) { .recent-grid { grid-template-columns: 1fr } }
</style>