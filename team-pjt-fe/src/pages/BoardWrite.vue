<template>
  <HeaderNav />
  <div class="page-wrap">
    <section class="board-write">
      <h2 class="page-title">게시글 작성</h2>

      <form @submit.prevent="submit">
        <!-- 작성자 / 비밀번호 (한 행에 정렬) -->
        <div class="row inline">
          <div class="field-group">
            <label>작성자</label>
            <input v-model="form.BRD_USERNAME" class="control small" placeholder="익명" />
          </div>

          <div class="field-group">
            <label>비밀번호</label>
            <input type="password" v-model="form.BRD_PASSWORD" class="control small" />
          </div>
        </div>

        <!-- 제목 (블록) -->
        <div class="row">
          <label>제목</label>
          <input v-model="form.BRD_TITLE" class="control" placeholder="제목을 입력하세요" />
          <div v-if="errors.BRD_TITLE" class="error">{{ errors.BRD_TITLE }}</div>
        </div>

        <!-- 본문 (에디터) -->
        <div class="row">
          <label>본문</label>
          <div
            ref="editor"
            class="editor"
            contenteditable
            @input="onEditorInput"
            data-placeholder="내용을 입력하세요"
          ></div>
          <div v-if="errors.BRD_CONTENT" class="error">{{ errors.BRD_CONTENT }}</div>
        </div>

        

        <!-- 관련 지역/컨텐츠 연결 -->
        <div class="row content-link">
          <label>관련 지역/컨텐츠 연결</label>
          <div class="content-controls">
            <button type="button" class="btn" @click="openSearchPopup">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>
              검색창 열기
            </button>
          </div>

          <div v-if="form.BRD_CONTENTTYPEID && form.BRD_CONTENTID" class="selected">
            선택: <strong>{{ displayTypeLabel(form.BRD_CONTENTTYPEID) }}</strong> — {{ form.BRD_CONTENTID }}
            <button type="button" class="btn btn-ghost" @click="clearSelection">지우기</button>
          </div>
        </div>

        <!-- actions -->
        <div class="actions">
          <button type="button" class="btn btn-ghost" @click="cancel">취소</button>
          <button type="submit" class="btn primary" :disabled="isLoading">등록</button>
        </div>
      </form>

      <div v-if="isLoading" class="loading">등록 중...</div>
      <div v-if="error" class="error">{{ error }}</div>
    </section>
  </div>
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
      await updatePost(editId.value, payload, payload.BRD_PASSWORD)
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
      form.value.BRD_CONTENTTYPEID = res.BRD_CONTENTTYPEID || res.content_type || ''
      form.value.BRD_CONTENTID = res.BRD_CONTENTID || res.content_id || ''
      selectedType.value = form.value.BRD_CONTENTTYPEID || ''
      if(editor.value) editor.value.innerHTML = form.value.BRD_CONTENT || ''
    }).catch(()=>{
      // ignore load error here
    })
  }
})
</script>

<style scoped>
/* 색상/타이포/간격은 이미지 기준 추정값입니다.
   - primary: #0a58ca (기존 유지 / 추정)
   - border gray: #e6eaef (추정)
   - background gray (페이지): 이미지 전역 백그라운드가 있으면 전역에서 관리됩니다. 여기선 카드 스타일만 적용.
   - 폰트: 시스템 + 한국어 서체 사용 가정 (실제 사용 폰트가 있으면 알려주세요)
*/

:root {
  --primary: #0a58ca; /* 추정 / 기존과 호환 */
  --border: #e6eaef;  /* 추정 연한 테두리 */
  --muted: #8a96a3;
  --card-bg: #ffffff;
}

/* outer spacing (local only) */
.page-wrap { padding: 24px; }

/* card */
.board-write{
  max-width:1100px;
  margin: 28px auto;
  padding: 28px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(20,30,40,0.06);
  border: 1px solid rgba(10,10,10,0.03);
  box-sizing: border-box;
}

/* title */
.page-title{ font-size: 28px; font-weight:700; margin-bottom:18px; color:#111; }

/* rows */
.row{ margin-bottom:16px; }
.row.inline{ display:flex; gap:16px; align-items:flex-end; flex-wrap:wrap; }
.field-group{ display:flex; flex-direction:column; gap:6px; }

/* labels */
label{ font-size:14px; color:#333; }

/* input controls */
.control{
  width:100%;
  padding:10px 12px;
  border-radius:8px;
  border:1px solid #e6e6e6;
  background:#fff;
  font-size:14px;
  color:#222;
  box-sizing:border-box;
}
.control.small{ max-width:260px; }

/* editor */
.editor{
  min-height:220px; /* 이미지와 유사한 높이 */
  border-radius:8px;
  border:1px solid #e6e6e6;
  padding:14px;
  background:#fff;
  font-size:14px;
  color:#222;
  outline:none;
  white-space:pre-wrap;
  overflow:auto;
}
/* contenteditable placeholder (simple) */
.editor:empty::before{
  content: attr(data-placeholder);
  color: #9aa5b1;
  pointer-events: none;
}

/* file input */
.file-row .file-controls{ display:flex; align-items:center; gap:12px; }
.file-btn{
  display:inline-flex; align-items:center; gap:8px;
  padding:8px 12px; border-radius:8px; border:1px solid var(--border);
  background:#fff; font-size:14px; color:#222; cursor:pointer;
}
.file-btn input[type="file"]{ display:none; }
.file-info{ color:var(--muted); font-size:13px; }

/* content link controls */
.content-controls{ display:flex; gap:8px; align-items:center; margin-top:8px; }
.selected{ margin-top:8px; color:#444; }

/* buttons */
.btn{
  display:inline-flex; align-items:center; gap:8px;
  padding:8px 12px; border-radius:8px; border:1px solid #e6e6e6;
  background:#fff; color:#222; cursor:pointer; font-size:14px;
}
.btn svg{ width:16px; height:16px; }
.btn.primary{ background:#0a58ca; color:#fff; border:none; padding:10px 16px; }
.btn.btn-ghost{ background:transparent; border:1px solid #e6e6e6; }

/* actions (오른쪽 정렬) */
.actions{ margin-top:18px; display:flex; justify-content:flex-end; gap:12px; }

/* errors / loading */
.error{ color:#b00; margin-top:6px; }
.loading{ color:#666; margin-top:6px; }

/* 반응형: 좁아지면 작성자/비밀번호 스택으로 변경 */
@media (max-width:720px){
  .row.inline{ flex-direction:column; align-items:stretch; }
  .control.small{ max-width:100%; }
}
</style>