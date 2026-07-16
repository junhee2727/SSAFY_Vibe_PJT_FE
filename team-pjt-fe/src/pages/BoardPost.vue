<template>
  <HeaderNav />
  <section class="board-post">
    <main class="main-col">
      <div class="post-card">
        <div class="breadcrumbs">홈 · 문화시설 · 게시글</div>

        <div class="badge-row">
          <span v-if="relatedInfo" class="badge green">{{ displayTypeLabel(relatedInfo._source) }}</span>
          <span v-if="relatedInfo && relatedInfo.sgg_nm" class="badge">{{ relatedInfo.sgg_nm }}</span>
        </div>

        <div class="title-block">
          <h1 class="title-main">{{ mainTitle }}</h1>
          <div v-if="subTitle" class="title-sub">- {{ subTitle }}</div>
        </div>

        <div class="meta-row">
          <div class="meta-left">
            <span class="muted">작성자</span> {{ post.author }} ·
            <span class="muted">작성일</span> {{ post.date }} ·
            <span class="muted">조회수</span> {{ post.views }}
          </div>
        </div>

        <div v-if="isLoading" class="loading">불러오는 중...</div>
        <div v-if="error" class="error">{{ error }}</div>

        <article v-if="!isLoading && !error" class="post-content" v-html="sanitizedContent"></article>

        <div class="card-footer">
          <button class="btn" @click="backToList">← 목록으로</button>
          <div class="footer-actions">
            <button class="btn" @click="goEdit">수정</button>
            <button class="btn danger" @click="doDeletePost">삭제</button>
          </div>
        </div>
      </div>

      <!-- 댓글 카드 -->
      <section class="comment-card">
        <h3 class="comment-title">댓글 {{ comments.length }}</h3>

        <div v-if="comments.length" class="existing-comments">
          <ul class="comment-list">
            <li v-for="c in comments" :key="c.id" class="comment-item">
              <div>
                <div class="c-meta"><strong>{{ c.author }}</strong> · {{ c.date }}</div>
                <div class="c-body">{{ c.content }}</div>
              </div>
              <div><button class="btn small" @click="onDeleteComment(c.id)">삭제</button></div>
            </li>
          </ul>
        </div>

        <div class="comment-form">
          <div class="comment-row">
            <input v-model="newComment.author" placeholder="닉네임 (기본 익명)" class="control small" />
            <input v-model="newComment.password" placeholder="비밀번호" type="password" class="control small pw" />
          </div>
          <div class="comment-input-row">
            <textarea v-model="newComment.content" placeholder="이 장소에 대한 경험이나 정보를 자유롭게 공유해 주세요." class="control textarea" rows="4"></textarea>
            <div class="submit-wrap">
              <button class="btn primary" @click="postComment" :disabled="posting">댓글 등록</button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <aside class="side-col">
      <!-- 관련 장소가 있을 때 -->
      <div class="sidebar-card" v-if="relatedInfo">
        <div class="sidebar-head">
          <span class="pin">📍</span>
          <div class="sidebar-head-text">이 글과 연결된 장소</div>
        </div>

        <img v-if="relatedInfo.firstimage || coverImage" :src="relatedInfo.firstimage || coverImage" alt="thumb" class="sidebar-img" />
        <div class="sidebar-body">
          <div class="r-title">{{ relatedInfo.title }}</div>
          <div class="r-addr">{{ relatedInfo.addr1 || relatedInfo.주소 || '' }}</div>

          <div class="tag-row">
            <span class="chip">{{ displayTypeLabel(relatedInfo._source) }}</span>
            <span class="chip" v-if="relatedInfo.sgg_nm">{{ relatedInfo.sgg_nm }}</span>
          </div>

          <button class="btn primary full" @click="showMap = true">지도에서 위치 보기</button>
        </div>
      </div>

      <!-- 관련 장소가 없을 때 (placeholder) -->
      <div class="sidebar-card placeholder" v-else>
        <div class="sidebar-head">
          <span class="pin">📍</span>
          <div class="sidebar-head-text">이 글과 연결된 장소</div>
        </div>

        <img :src="noPlaceImg" alt="no place" class="placeholder-img" />

        <h4 class="placeholder-title">아직 연결된 장소가 없어요</h4>
        <p class="placeholder-text">현재 이 게시글에는 장소 정보가 연결되어 있지 않습니다.<br/>장소가 연결되면 위치, 주소, 지도 정보로 함께 확인할 수 있어요.</p>

        <div class="placeholder-list">
          <div class="placeholder-item"><span class="dot">📍</span> 장소명</div>
          <div class="placeholder-item"><span class="dot">📌</span> 주소/지역</div>
          <div class="placeholder-item"><span class="dot">🗺️</span> 지도 바로가기</div>
        </div>
      </div>
    </aside>

    <RelatedMapModal
      :visible="showMap"
      :lat="relatedInfo ? relatedInfo.mapy : null"
      :lng="relatedInfo ? relatedInfo.mapx : null"
      :address="relatedInfo ? relatedInfo.addr1 : ''"
      @close="showMap=false"
    />
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderNav from '../components/HeaderNav.vue'
import DOMPurify from 'dompurify'
import { fetchPostDetail, fetchComments, createComment, deleteComment, deletePost } from '../services/boardApi'
import RelatedMapModal from '../components/RelatedMapModal.vue'

const route = useRoute()
const router = useRouter()

const contentFiles = [
  { label:'관광지', value:'서울_관광지.json' },
  { label:'레포츠', value:'서울_레포츠.json' },
  { label:'문화시설', value:'서울_문화시설.json' },
  { label:'쇼핑', value:'서울_쇼핑.json' },
  { label:'숙박', value:'서울_숙박.json' },
  { label:'여행코스', value:'서울_여행코스.json' },
  { label:'축제/공연/행사', value:'서울_축제공연행사.json' }
]

function displayTypeLabel(val){
  const f = contentFiles.find(x=> x.value === val)
  return f ? f.label : (val || '')
}

const post = ref({ id:'', title:'', author:'', date:'', views:0, content:'' })
const isLoading = ref(true)
const error = ref(null)

const comments = ref([])
const newComment = ref({ author:'익명', content:'', password:'' })
const posting = ref(false)

const sanitizedContent = computed(()=> DOMPurify.sanitize(post.value.content || '') )

const relatedInfo = ref(null)
const showMap = ref(false)

const coverImage = computed(()=>{
  try{
    const d = document.createElement('div')
    d.innerHTML = post.value.content || ''
    const img = d.querySelector('img')
    return img ? img.getAttribute('src') : null
  }catch(e){ return null }
})

// placeholder image served from public/no_place.png
const noPlaceImg = `${import.meta.env.BASE_URL ?? '/'}no_place.png`

// split title into main / subtitle on first dash for nicer layout
const mainTitle = computed(()=>{
  const t = post.value.title || ''
  const parts = t.split(/\s*[-–—:]\s*/, 2)
  return parts[0] || t
})
const subTitle = computed(()=>{
  const t = post.value.title || ''
  const parts = t.split(/\s*[-–—:]\s*/, 2)
  return parts[1] || ''
})

async function fetchJsonFile(typeFile){
  const tries = [`/static/json/${typeFile}`, `/json/${typeFile}`]
  for(const p of tries){
    try{
      const r = await fetch(p)
      if(r.ok) return await r.json()
    }catch(e){ /* ignore */ }
  }
  return null
}

async function load(){
  isLoading.value = true
  error.value = null
  try{
    const id = route.params.post_number
    const res = await fetchPostDetail(id)
    post.value = res

    comments.value = await fetchComments(id)

    relatedInfo.value = null
    const typeFile = post.value.BRD_CONTENTTYPEID
    const contentId = post.value.BRD_CONTENTID
    if(typeFile && contentId){
      try{
        const data = await fetchJsonFile(typeFile)
        if(data){
          const arr = Array.isArray(data) ? data : (data.items || [])
          const found = arr.find(it => (it.title && it.title === contentId) || (it.contentid && String(it.contentid) === String(contentId)))
          if(found){ found._source = typeFile; relatedInfo.value = found }
        }
      }catch(e){ /* ignore */ }
    }
  }catch(err){
    error.value = err.message || '불러오기 실패'
  }finally{ isLoading.value = false }
}

function goEdit(){
  const id = post.value.BRD_SEQ || post.value.id
  router.push({ name: 'BoardWrite', query: { edit: id } })
}

async function doDeletePost(){
  const pwd = prompt('게시글 삭제를 위해 비밀번호를 입력하세요')
  if(pwd === null) return
  try{
    await deletePost(post.value.id || post.value.BRD_SEQ, pwd)
    router.push({ name: 'Board' })
  }catch(err){ alert(err.message || '삭제 실패') }
}

function backToList(){
  const page = route.query.page
  router.push({ name: 'Board', query: page ? { page } : {} })
}

async function postComment(){
  if(!newComment.value.content || !newComment.value.content.trim()) return
  posting.value = true
  const payload = { author: newComment.value.author || '익명', content: newComment.value.content, password: newComment.value.password || '' }
  const temp = { id: 'tmp' + Date.now(), postId: route.params.post_number, author: payload.author, content: payload.content, date: new Date().toLocaleDateString() }
  comments.value.push(temp)
  try{
    const res = await createComment(route.params.post_number, payload)
    const idx = comments.value.findIndex(c=> c.id===temp.id)
    if(idx!==-1) comments.value.splice(idx,1,res.data)
    else comments.value.push(res.data)
    newComment.value.content = ''
    newComment.value.password = ''
  }catch(err){
    const idx = comments.value.findIndex(c=> c.id===temp.id)
    if(idx!==-1) comments.value.splice(idx,1)
    alert(err.message || '댓글 등록 실패')
  }finally{ posting.value = false }
}

async function onDeleteComment(id){
  const pwd = prompt('댓글 삭제를 위해 비밀번호를 입력하세요')
  if(pwd === null) return
  try{
    await deleteComment(id, pwd)
    const idx = comments.value.findIndex(c=> c.id===id)
    if(idx!==-1) comments.value.splice(idx,1)
  }catch(err){ alert(err.message || '삭제 실패') }
}

onMounted(load)
</script>

<style scoped>
.board-post{ max-width:1200px; margin:18px auto; padding:20px; display:grid; grid-template-columns: 1fr 360px; gap:28px }
@media (max-width:1000px){ .board-post{ grid-template-columns: 1fr; } .side-col{ order: 2 } .main-col{ order: 1 } }

.post-card{ background:#fff; border-radius:12px; padding:22px; box-shadow:0 6px 18px rgba(22,42,31,0.04); border:1px solid rgba(0,0,0,0.04) }
.breadcrumbs{ color:#7aa992; font-size:0.92rem; margin-bottom:10px }
.badge-row{ display:flex; gap:8px; margin-bottom:12px; align-items:center }
.badge{ background:#f1f8f4; color:#2a6f4b; padding:6px 12px; border-radius:12px; font-size:0.85rem; display:inline-block }
.badge.green{ background:#eaf9ef; color:#0a7a3a }

.title-block{ margin-bottom:8px }
.title-main{ font-size:28px; line-height:1.12; margin:6px 0; font-weight:800; color:#0b2f22 }
.title-sub{ font-size:20px; font-weight:700; color:#0b2f22; margin-bottom:8px }

.meta-row{ display:flex; gap:12px; color:#6b7972; margin-bottom:16px; align-items:center }
.meta-left .muted{ color:#9aa8a0; font-size:0.95rem; margin-right:6px }

.post-content{ border-top:1px solid #f1f1f1; padding-top:18px; color:#333; line-height:1.7; margin-top:6px }
.post-content img{ max-width:100%; height:auto; display:block; margin:12px 0; border-radius:6px }

.card-footer{ display:flex; justify-content:space-between; align-items:center; margin-top:18px; padding-top:12px; border-top:1px solid #f4f4f4 }
.footer-actions button{ margin-left:8px }

.side-col{ display:flex; flex-direction:column; gap:14px }
.sidebar-card{ background:#fff; border-radius:12px; padding:14px; box-shadow:0 6px 18px rgba(22,42,31,0.04); border:1px solid rgba(0,0,0,0.04) }
.sidebar-head{ display:flex; gap:8px; align-items:center; margin-bottom:8px }
.pin{ display:inline-block; width:28px; height:28px; border-radius:50%; background:#eef9f1; color:#0a7a3a; display:flex; align-items:center; justify-content:center; font-size:16px }
.sidebar-img{ width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:12px }
.r-title{ font-weight:700; margin-bottom:6px; color:#122a22 }
.r-addr{ color:#6b7972; font-size:0.95rem; margin-bottom:10px }

.tag-row{ display:flex; gap:8px; margin-bottom:12px }
.chip{ background:#eef7f1; color:#0a7a3a; padding:6px 10px; border-radius:10px; font-size:0.85rem }

/* placeholder styles */
.placeholder-img{ width:100%; height:160px; object-fit:contain; border-radius:8px; background:transparent; margin-bottom:12px }
.placeholder-title{ font-size:16px; font-weight:700; text-align:center; margin:8px 0 4px 0; color:#163a31 }
.placeholder-text{ color:#6b7972; font-size:0.94rem; text-align:center; margin:0 0 10px 0; line-height:1.4 }
.placeholder-list{ display:flex; flex-direction:column; gap:8px; padding:6px 4px; margin-top:6px }
.placeholder-item{ display:flex; align-items:center; gap:8px; padding:8px 10px; background:#fbfffb; border-radius:8px; color:#22593f; font-size:0.95rem }

/* comments */
.btn{ padding:8px 12px; border-radius:8px; background:#fff; border:1px solid #d7dfd9; cursor:pointer }
.btn:hover{ filter:brightness(.98) }
.btn.primary{ background:#0a9d4a; color:#fff; border:none }
.btn.danger{ background:#fff; color:#e03a3a; border:1px solid rgba(224,58,58,0.14) }
.btn.full{ width:100%; }

.comment-card{ background:#fff; border-radius:12px; padding:16px; box-shadow:0 6px 18px rgba(22,42,31,0.04); border:1px solid rgba(0,0,0,0.04); margin-top:12px }
.comment-title{ margin:0 0 12px 0; color:#183a32 }
.existing-comments{ margin-bottom:12px }
.comment-list{ list-style:none; padding:0; margin:0 }
.comment-item{ border-bottom:1px dashed #eef4ef; padding:10px 0; display:flex; justify-content:space-between; gap:12px; align-items:flex-start }
.comment-item .c-meta{ color:#6b7972; font-size:0.95rem; margin-bottom:6px }
.comment-item .c-body{ color:#333 }

.comment-form{ display:flex; flex-direction:column; gap:8px; }
.comment-row{ display:flex; gap:10px }
.control.small{ padding:8px 10px; border:1px solid #e6ede7; border-radius:6px; background:#fff }
.control.pw{ width:180px }
.control.textarea{ flex:1; border:1px solid #e6ede7; border-radius:6px; padding:10px; resize:vertical }
.comment-input-row{ display:flex; gap:12px; align-items:flex-end }
.submit-wrap{ min-width:110px; display:flex; justify-content:flex-end }

.small{ font-size:0.9rem }
.loading{ color:#666; margin-top:8px }
.error{ color:#b00; margin-top:8px }
</style>