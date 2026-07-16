<template>
  <div class="chatbot-root">
    <transition name="chat-fade">
      <div
        v-if="open"
        class="chat-window"
        @click.stop
        :style="{ width: width + 'px', height: height + 'px' }"
      >
        <div class="resizer" @pointerdown.prevent.stop="onResizeStart" title="크기 조절"></div>

        <header class="chat-header">
          <div class="title">챗봇</div>
          <div class="controls">
            <button class="new" @click.prevent="clearSession">새 채팅</button>
            <button class="close" title="닫기" @click="toggle">✕</button>
          </div>
        </header>

        <div class="chat-body" ref="msgsContainer">
          <div v-for="(m, i) in messages" :key="m.messageId || m.tempId || i" :class="['message', m.role]">
            <div class="bubble" v-html="renderMarkdown(m.content)"></div>
          </div>
          <div v-if="isTyping" class="typing">응답 생성중…</div>
        </div>

        <form class="chat-input" @submit.prevent="send">
          <input v-model="input" placeholder="메시지를 입력하세요..." />
          <button type="submit" class="send" :disabled="sending">전송</button>
        </form>
      </div>
    </transition>

    <button
      class="chat-toggle"
      :aria-pressed="open"
      @click="toggle"
      :title="open ? '닫기' : '챗봇 열기'"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import { postMessage, getHistory, deleteSession } from '../services/chatApi'

const STORAGE_KEY = 'chat_session_id'
const MIN_WIDTH = 500
const MIN_HEIGHT = 620

const open = ref(false)
const messages = ref([])
const input = ref('')
const sending = ref(false)
const isTyping = ref(false)
const sessionId = ref(localStorage.getItem(STORAGE_KEY) || '')
const latestResponseId = ref(null)
const msgsContainer = ref(null)

const width = ref(MIN_WIDTH)
const height = ref(MIN_HEIGHT)

let resizing = false
let startX = 0
let startY = 0
let startW = 0
let startH = 0

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
  if (!src) return ''
  try {
    let text = normalizeContentForMarkdown(src)
    if (text.indexOf('\\n') !== -1) text = text.replace(/\\n/g, '\n')
    text = text.replace(/\\([_*~`>+\-])/g, '$1')
    const ta = document.createElement('textarea'); ta.innerHTML = text; text = ta.value
    const raw = mdParser.render(text)
    return DOMPurify.sanitize(raw)
  } catch {
    return DOMPurify.sanitize(String(src || ''))
  }
}

function sanitize(html){ return DOMPurify.sanitize(html || '') }

async function scrollToBottom(){ await nextTick(); if (msgsContainer.value) msgsContainer.value.scrollTop = msgsContainer.value.scrollHeight }

async function loadHistory(){
  if(!sessionId.value) return
  try{
    const res = await getHistory(sessionId.value)
    messages.value = res.messages || []
    latestResponseId.value = res.latestResponseId || null
    await scrollToBottom()
  }catch(_){ /* ignore load errors silently */ }
}

async function send(){
  const text = (input.value||'').trim()
  if(!text) return
  const tempId = 'u' + Date.now()
  messages.value.push({ tempId, role:'user', content:text, createdAt:new Date().toISOString() })
  input.value = ''
  await scrollToBottom()
  sending.value = true
  isTyping.value = true
  try{
    const res = await postMessage({ sessionId: sessionId.value || null, message: text, previousResponseId: latestResponseId.value || null })

    sessionId.value = res.sessionId
    if(sessionId.value) localStorage.setItem(STORAGE_KEY, sessionId.value)
    latestResponseId.value = res.responseId || null

    let content = res.content ?? ''
    if (!content && Array.isArray(res.assistantChunks)) content = res.assistantChunks.join('')
    if (!content && res.message) content = res.message

    messages.value.push({ messageId: res.messageId, role: res.role || 'assistant', content, createdAt: res.createdAt })
    await scrollToBottom()
  }catch(_){
    messages.value.push({ tempId:'err'+Date.now(), role:'system', content:'전송 실패', createdAt: new Date().toISOString() })
  }finally{
    isTyping.value = false
    sending.value = false
  }
}

async function clearSession(){
  if(sessionId.value){
    try{ await deleteSession(sessionId.value) }catch(_){}
    localStorage.removeItem(STORAGE_KEY)
  }
  sessionId.value = ''
  messages.value = []
  latestResponseId.value = null
  messages.value.push({ role:'assistant', content: '안녕하세요! 무엇을 도와드릴까요?', createdAt: new Date().toISOString() })
  await nextTick(scrollToBottom)
}

function toggle(){ open.value = !open.value }

function onResizeStart(e){
  resizing = true
  startX = e.clientX
  startY = e.clientY
  startW = width.value
  startH = height.value
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', onResizing)
  window.addEventListener('pointerup', onResizeEnd)
}

function onResizing(e){
  if(!resizing) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  const newW = Math.max(MIN_WIDTH, Math.round(startW - dx))
  const newH = Math.max(MIN_HEIGHT, Math.round(startH - dy))
  width.value = newW
  height.value = newH
}

function onResizeEnd(){
  if(!resizing) return
  resizing = false
  document.body.style.userSelect = ''
  window.removeEventListener('pointermove', onResizing)
  window.removeEventListener('pointerup', onResizeEnd)
}

onUnmounted(() => {
  window.removeEventListener('pointermove', onResizing)
  window.removeEventListener('pointerup', onResizeEnd)
})

onMounted(()=>{
  if(sessionId.value) loadHistory()
  else messages.value.push({ role:'assistant', content: '안녕하세요! 무엇을 도와드릴까요?', createdAt: new Date().toISOString() })
})

watch(open, async (v) => { if(v){ if(sessionId.value) await loadHistory(); await nextTick(scrollToBottom) } })
</script>

<style scoped>
.chatbot-root { position: fixed; right: 20px; bottom: 20px; z-index: 9999; }
.chat-toggle { width: 64px; height: 64px; border-radius: 50%; border: none; background: linear-gradient(180deg,#0a58ca,#0747a6); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(10,88,202,0.25); cursor: pointer; }
.chat-window { position: fixed; right: 20px; bottom: calc(20px + 64px + 12px); max-width: calc(100vw - 40px); max-height: calc(100vh - 40px); display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 14px 40px rgba(0,0,0,0.2); }
.resizer { position: absolute; left: -5px; top: -5px; width: 18px; height: 18px; border-radius: 4px; background: rgba(255,255,255,0); border: 1px solid rgba(0,0,0,0); cursor: nw-resize; z-index: 20; }
.chat-header { height: 48px; padding: 8px 12px; background: #0a58ca; color: #fff; display:flex; align-items:center; justify-content:space-between; position: relative; }
.chat-header .title { font-weight:600; }
.chat-header .controls { display:flex; gap:8px; align-items:center }
.chat-header .new { background: rgba(255,255,255,0.12); color:#fff; border:1px solid rgba(255,255,255,0.14); padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.95rem; }
.chat-header .close { background:transparent; color:#fff; border:none; font-size:16px; cursor:pointer; }
.chat-body { flex: 1; padding: 12px; overflow:auto; background: #f7f9fc; display:flex; flex-direction:column; gap:10px; }
.message .bubble { padding:8px 12px; border-radius:12px; max-width:80%; }
.message.user { align-items:flex-end; }
.message.user .bubble { background:#0a58ca; color:#fff; margin-left:auto; }
.message.assistant { align-items:flex-start; }
.message.assistant .bubble { background:#f1f3f5; color:#222; margin-right:auto; }
.chat-input { display:flex; gap:8px; padding:10px; border-top:1px solid #eee; background:#fff; }
.chat-input input { flex:1; padding:8px 10px; border-radius:8px; border:1px solid #ddd; }
.chat-input .send { background:#0a58ca; color:#fff; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; }
.chat-fade-enter-active, .chat-fade-leave-active { transition: all .16s ease }
.chat-fade-enter-from, .chat-fade-leave-to { opacity:0; transform: translateY(8px) scale(.99) }
.typing{ color:#666; font-size:0.9rem; margin-top:6px }

/* markdown styles */
.message .bubble pre { background:#f6f8fa; padding:8px; border-radius:6px; overflow:auto; }
.message .bubble code { background:rgba(0,0,0,0.04); padding:2px 6px; border-radius:4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", monospace; font-size:0.95em; }
.message .bubble a { color:#0a58ca; text-decoration:underline; }
.message .bubble ul { padding-left:1.2rem; margin:6px 0; }
.message .bubble img { max-width:100%; height:auto; border-radius:6px; display:block; margin:8px 0; }
</style>