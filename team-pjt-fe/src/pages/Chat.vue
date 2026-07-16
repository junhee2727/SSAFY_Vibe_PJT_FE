<template>
  <HeaderNav />
  <section class="chat-page">
    <h2>챗봇</h2>

    <div class="chat-container">
      <div class="messages" ref="msgsContainer">
        <div v-for="m in messages" :key="m.messageId || m.tempId" :class="['message', m.role]">
          <div class="meta"><strong>{{ m.role === 'assistant' ? 'LocalHub' : '나' }}</strong> · <small>{{ formatTime(m.createdAt) }}</small></div>
          <div class="bubble" v-html="renderMarkdown(m.content)"></div>
          <pre v-if="DEBUG" class="debug-pre">{{ typeof m.content === 'string' ? m.content : JSON.stringify(m.content, null, 2) }}</pre>
        </div>
      </div>
      <div v-if="isTyping" class="typing">응답 생성중…</div>
    </div>

    <form class="composer" @submit.prevent="send">
      <input v-model="input" placeholder="질문을 입력하세요" />
      <button class="btn primary" :disabled="sending">전송</button>
      <button type="button" class="btn" @click="clearSession">새 세션</button>
    </form>
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import HeaderNav from '../components/HeaderNav.vue'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import { postMessage, getHistory, deleteSession } from '../services/chatApi'

const DEBUG = true

const input = ref('')
const messages = ref([])
const sending = ref(false)
const isTyping = ref(false)
const sessionId = ref(localStorage.getItem('chat_session_id') || '')
const latestResponseId = ref(null)
const msgsContainer = ref(null)

const mdParser = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: true })

function normalizeContentForMarkdown(src) {
  if (src == null) return ''
  if (typeof src === 'string') return src
  if (Array.isArray(src)) return src.join('')
  if (typeof src === 'object') {
    if (typeof src.content === 'string') return src.content
    if (typeof src.text === 'string') return src.text
    if (typeof src.message === 'string') return src.message
    if (Array.isArray(src.assistantChunks)) {
      return src.assistantChunks.map(c => (typeof c === 'string' ? c : (c.text || ''))).join('')
    }
    try { return JSON.stringify(src) } catch(e) { return String(src) }
  }
  return String(src)
}

function renderMarkdown(src){
  try {
    if (DEBUG) console.debug('renderMarkdown input type:', typeof src, src && (typeof src === 'string' ? src.slice(0,300) : JSON.stringify(src).slice(0,200)))
  } catch(e){ /* ignore */ }

  if (!src) return ''
  try {
    let text = normalizeContentForMarkdown(src)

    // unescape common double-escaped newlines
    if (text.indexOf('\\n') !== -1) text = text.replace(/\\n/g, '\n')
    // unescape escaped markdown markers like "\*"
    text = text.replace(/\\([_*~`>+\-])/g, '$1')

    // decode HTML entities
    const ta = document.createElement('textarea')
    ta.innerHTML = text
    text = ta.value

    if (DEBUG) console.debug('renderMarkdown normalized text preview:', text.slice(0,500))

    const raw = mdParser.render(text)
    return DOMPurify.sanitize(raw)
  } catch (err) {
    console.error('renderMarkdown error', err, src)
    return DOMPurify.sanitize(String(src || ''))
  }
}

function formatTime(v){ return v ? new Date(v).toLocaleString() : '' }
async function scrollToBottom(){ await nextTick(); if(msgsContainer.value) msgsContainer.value.scrollTop = msgsContainer.value.scrollHeight }

async function loadHistory(){
  if(!sessionId.value) return
  try{
    const res = await getHistory(sessionId.value)
    if (DEBUG) console.debug('loadHistory response:', res)
    messages.value = res.messages || []
    latestResponseId.value = res.latestResponseId || null
    await scrollToBottom()
  }catch(e){ console.error(e) }
}

async function send(){
  const text = (input.value || '').trim()
  if(!text) return
  const tempId = 'u' + Date.now()
  messages.value.push({ tempId, role:'user', content:text, createdAt:new Date().toISOString() })
  input.value = ''
  await scrollToBottom()

  sending.value = true
  isTyping.value = true
  try{
    const res = await postMessage({ sessionId: sessionId.value || null, message: text, previousResponseId: latestResponseId.value || null })
    if (DEBUG) console.debug('postMessage response:', res)

    // backend ChatMessageResponse shape expected
    sessionId.value = res.sessionId
    if(sessionId.value) localStorage.setItem('chat_session_id', sessionId.value)
    latestResponseId.value = res.responseId || null

    // normalize content field from possible shapes
    let content = res.content ?? ''
    if (!content && Array.isArray(res.assistantChunks)) content = res.assistantChunks.join('')
    if (!content && res.message) content = res.message

    if (DEBUG) console.debug('assistant content preview:', typeof content, (content && content.slice) ? content.slice(0,500) : content)
    messages.value.push({ messageId: res.messageId, role: res.role || 'assistant', content, createdAt: res.createdAt })
    await scrollToBottom()
  }catch(err){
    console.error(err)
    messages.value.push({ tempId:'err'+Date.now(), role:'system', content:'전송 실패: ' + (err.message || ''), createdAt: new Date().toISOString() })
  }finally{
    isTyping.value = false
    sending.value = false
  }
}

async function clearSession(){
  if(sessionId.value){
    try{ await deleteSession(sessionId.value) }catch(_){}
    localStorage.removeItem('chat_session_id')
  }
  sessionId.value = ''
  messages.value = []
  latestResponseId.value = null
}

onMounted(()=>{ if(sessionId.value) loadHistory() })
</script>

<style scoped>
.chat-page{ max-width:900px; margin:1rem auto; padding:1rem }
.chat-container{ border:1px solid #eee; padding:12px; background:#fff; min-height:280px }
.messages{ max-height:520px; overflow:auto; display:flex; flex-direction:column; gap:10px; padding-bottom:6px }
.message.user .bubble{ align-self:flex-end; background:#0a58ca; color:#fff }
.message.assistant .bubble{ align-self:flex-start; background:#f1f3f5; color:#222 }
.bubble{ padding:10px 12px; border-radius:8px; max-width:80% }
.composer{ display:flex; gap:8px; margin-top:8px }
.composer input{ flex:1; padding:8px }
.btn.primary{ background:#0a58ca; color:#fff }
.typing{ color:#666; margin-top:8px }
.meta{ font-size:0.85rem; color:#666; margin-bottom:6px }

.bubble pre {
  background:#f6f8fa;
  padding:10px;
  border-radius:6px;
  overflow:auto;
}
.bubble code {
  background:rgba(0,0,0,0.04);
  padding:2px 6px;
  border-radius:4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Helvetica Neue", monospace;
  font-size:0.95em;
}
.bubble a {
  color:#0a58ca;
  text-decoration:underline;
}
.bubble ul { padding-left:1.2rem; margin:6px 0; }
.bubble img { max-width:100%; height:auto; border-radius:6px; display:block; margin:8px 0; }

/* debug raw content */
.debug-pre{
  background:#fff9db;
  border:1px solid #f0e7b6;
  padding:8px;
  margin-top:8px;
  font-size:12px;
  white-space:pre-wrap;
  color:#333;
  border-radius:6px;
}
</style>