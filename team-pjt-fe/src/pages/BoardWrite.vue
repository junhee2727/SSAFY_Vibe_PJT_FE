<template>
  <HeaderNav />
  <section class="board-write">
    <h2 class="page-title">게시글 작성</h2>

    <form @submit.prevent="submit">    
      <div class="row">
        <label>작성자</label>
        <input v-model="form.BRD_USERNAME" class="control" />
        <label>비밀번호</label>
        <input type="password" v-model="form.BRD_PASSWORD" class="control" />
      </div>
      <div class="row">
        <label>제목</label>
        <input v-model="form.BRD_TITLE" class="control" />
        <div v-if="errors.BRD_TITLE" class="error">{{ errors.BRD_TITLE }}</div>
      </div>


      <div class="row">
        <label>본문</label>
        <div ref="editor" class="editor" contenteditable @input="onEditorInput"></div>
        <div v-if="errors.BRD_CONTENT" class="error">{{ errors.BRD_CONTENT }}</div>
      </div>

      <div class="row">
        <label>이미지 업로드 (임시)</label>
        <input type="file" @change="onImage" accept="image/*" />
        <div v-if="uploadedImage">업로드 미리보기: <img :src="uploadedImage" alt="preview" style="max-width:120px"/></div>
      </div>

      <!-- content link selector -->
      <div class="row content-link">
        <label>관련 지역/컨텐츠 연결</label>
        <div class="content-controls">
                <button type="button" class="btn" @click="openSearchPopup">검색창 열기</button>
        </div>

        <div v-if="form.BRD_CONTENTTYPEID && form.BRD_CONTENTID" class="selected">
          선택: <strong>{{ displayTypeLabel(form.BRD_CONTENTTYPEID) }}</strong> — {{ form.BRD_CONTENTID }}
          <button type="button" class="btn" @click="clearSelection">지우기</button>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn" @click="cancel">취소</button>
        <button type="submit" class="btn primary" :disabled="isLoading">등록</button>
      </div>
    </form>

    <div v-if="isLoading" class="loading">등록 중...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderNav from '../components/HeaderNav.vue'
import { createPost, fetchPostDetail, updatePost } from '../services/boardApi'

const route = useRoute()
const router = useRouter()

const form = ref({
  STS_CODE: 'SCRT',
  BRD_TITLE: '',
  BRD_CONTENT: '',
  BRD_PASSWORD: '',
  BRD_USERNAME: '익명',
  BRD_CONTENTTYPEID: '',
  BRD_CONTENTID: ''
})

const isEdit = ref(false)
const editId = ref(null)

const errors = ref({})
const isLoading = ref(false)
const error = ref(null)
const editor = ref(null)
const uploadedImage = ref(null)

// known content files under static/json
const contentFiles = [
  { label:'관광지', value:'서울_관광지.json' },
  { label:'레포츠', value:'서울_레포츠.json' },
  { label:'문화시설', value:'서울_문화시설.json' },
  { label:'쇼핑', value:'서울_쇼핑.json' },
  { label:'숙박', value:'서울_숙박.json' },
  { label:'여행코스', value:'서울_여행코스.json' },
  { label:'축제/공연/행사', value:'서울_축제공연행사.json' }
]
const contentIds = ref([])
const selectedType = ref('')
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)

async function loadContentIds(){
  contentIds.value = []
  if(!form.value.BRD_CONTENTTYPEID) return
  try{
    const res = await fetch(`/static/json/${form.value.BRD_CONTENTTYPEID}`)
    if(!res.ok) return
    const data = await res.json()
    // try to extract title fields
    const ids = data.map(d=> d.title || d.name || d.주소 || d.명칭).filter(Boolean)
    contentIds.value = ids
  }catch(e){
    // ignore
  }
}

async function searchContent(){
  searchResults.value = []
  if(!selectedType.value || !searchQuery.value) return
  searching.value = true
  try{
    const res = await fetch(`/static/json/${selectedType.value}`)
    if(!res.ok) return
    const data = await res.json()
    // match on title/name fields
    const ql = String(searchQuery.value).toLowerCase()
    const items = data.map((d, idx)=>({ _idx: idx, title: d.title || d.name || d.주소 || d.명칭, raw: d })).filter(x=> x.title && x.title.toLowerCase().includes(ql))
    searchResults.value = items
  }catch(e){
    // ignore
  }finally{ searching.value = false }
}

function selectContent(item){
  if(!item) return
  form.value.BRD_CONTENTTYPEID = selectedType.value
  form.value.BRD_CONTENTID = item.title
  // clear results
  searchResults.value = []
  searchQuery.value = ''
}

function displayTypeLabel(val){
  const f = contentFiles.find(x=> x.value === val)
  return f ? f.label : val
}

function clearSelection(){
  form.value.BRD_CONTENTTYPEID = ''
  form.value.BRD_CONTENTID = ''
}

function openSearchPopup(){
  const url = new URL(window.location.href)
  url.pathname = '/content-search'
  if(selectedType.value) url.searchParams.set('type', selectedType.value)
  if(searchQuery.value) url.searchParams.set('q', searchQuery.value)
  // open small popup
  const win = window.open(url.toString(), 'contentSearch', 'width=800,height=600')
  // listen for message
  function onMessage(e){
    try{
      if(e.origin !== window.location.origin) return
    }catch(_){ }
    const msg = e.data || {}
    if(msg && msg.type === 'content-selected'){
      form.value.BRD_CONTENTTYPEID = msg.contentType
      form.value.BRD_CONTENTID = msg.contentId
      // cleanup
      window.removeEventListener('message', onMessage)
      if(win) win.close()
    }
  }
  window.addEventListener('message', onMessage)
}

function onEditorInput(){
  form.value.BRD_CONTENT = editor.value.innerHTML
}

function exec(cmd){
  document.execCommand(cmd)
}

function onImage(e){
  const f = e.target.files && e.target.files[0]
  if(!f) return
  // create temporary URL for preview; in a real app, upload to server
  uploadedImage.value = URL.createObjectURL(f)
  // save a mock path
  form.value._imagePath = `/static/staticImg/${f.name}`
}

function validate(){
  errors.value = {}
  if(!form.value.STS_CODE) errors.value.STS_CODE = '상태를 선택하세요.'
  if(!form.value.BRD_TITLE || !form.value.BRD_TITLE.trim()) errors.value.BRD_TITLE = '제목을 입력하세요.'
  if(!form.value.BRD_CONTENT || !form.value.BRD_CONTENT.trim()) errors.value.BRD_CONTENT = '본문을 입력하세요.'
  return Object.keys(errors.value).length === 0
}

async function submit(){
  if(!validate()) return
  isLoading.value = true
  error.value = null
  try{
    const payload = { ...form.value }
    if(isEdit.value && editId.value){
      await updatePost(editId.value, { BRD_TITLE: payload.BRD_TITLE, BRD_CONTENT: payload.BRD_CONTENT }, payload.BRD_PASSWORD)
      // after update, navigate to post detail
      router.push({ name: 'BoardPost', params: { post_number: editId.value } })
    } else {
      const res = await createPost(payload)
      // on success, go to board list
      router.push({ name: 'Board' })
    }
  }catch(err){
    error.value = err.message || '등록 실패'
  }finally{
    isLoading.value = false
  }
}

function cancel(){
  router.back()
}

onMounted(()=>{
  if(editor.value){
    // initialize editor content once to avoid re-render replacing caret
    editor.value.innerHTML = form.value.BRD_CONTENT || ''
  }
  // detect edit mode
  if(route.query && route.query.edit){
    editId.value = route.query.edit
    isEdit.value = true
    // load post detail and populate form
    fetchPostDetail(editId.value).then(res=>{
      form.value.BRD_TITLE = res.title || res.BRD_TITLE || ''
      form.value.BRD_CONTENT = res.content || res.BRD_CONTENT || ''
      form.value.BRD_USERNAME = res.author || res.BRD_USERNAME || form.value.BRD_USERNAME
      // leave BRD_PASSWORD empty for user to enter
      if(editor.value) editor.value.innerHTML = form.value.BRD_CONTENT || ''
    }).catch(()=>{
      // ignore load error here
    })
  }
})
</script>

<style scoped>
.board-write{ max-width:1100px; margin:0 auto; padding:1rem }
.row{ margin-bottom:12px }
.control{ padding:8px 10px; border:1px solid #ccc; }
.editor{ min-height:240px; border:1px solid #ddd; padding:12px; background:#fff }
.content-link .content-controls{ display:flex; gap:8px; align-items:center }
.results{ max-height:160px; overflow:auto; border:1px solid #eee; margin-top:8px; background:#fff }
.result-item{ display:block; width:100%; text-align:left; padding:6px 8px; border-bottom:1px solid #f5f5f5; background:transparent }
.result-item:hover{ background:#f7f9fc }
.selected{ margin-top:8px }
.actions{ display:flex; justify-content:flex-end; gap:12px; margin-top:12px }
.btn{ padding:8px 12px; border:1px solid #333; background:#fff }
.btn.primary{ background:#0a58ca; color:#fff }
.error{ color:#b00; margin-top:6px }
.loading{ color:#666; margin-top:6px }
</style>
