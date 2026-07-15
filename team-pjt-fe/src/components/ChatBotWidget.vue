<template>
  <div class="chatbot-root">
    <transition name="chat-fade">
      <div v-if="open" class="chat-window" @click.stop>
        <header class="chat-header">
          <div class="title">챗봇</div>
          <div class="controls">
            <button class="clear" title="새 세션" @click="clearSession">⎌</button>
            <button class="close" title="닫기" @click="toggle">✕</button>
          </div>
        </header>

        <div class="chat-body" ref="msgsContainer">
          <div v-for="(m, i) in messages" :key="m.messageId || m.tempId || i" :class="['message', m.role]">
            <div class="bubble" v-html="sanitize(m.content)"></div>
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
      :title="open ? '닫기' : '챗봇 열기'">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import DOMPurify from 'dompurify'
import { postMessage, getHistory, deleteSession } from '../services/chatApi'

const STORAGE_KEY = 'chat_session_id'

const open = ref(false)
const messages = ref([])
const input = ref('')
const sending = ref(false)
const isTyping = ref(false)
const sessionId = ref(localStorage.getItem(STORAGE_KEY) || '')
const latestResponseId = ref(null)
const msgsContainer = ref(null)

function sanitize(html){ return DOMPurify.sanitize(html || '') }

async function scrollToBottom(){ await nextTick(); if (msgsContainer.value) msgsContainer.value.scrollTop = msgsContainer.value.scrollHeight }

async function loadHistory(){
  if(!sessionId.value) return
  try{
    const res = await getHistory(sessionId.value)
    messages.value = res.messages || []
    latestResponseId.value = res.latestResponseId || null
    await scrollToBottom()
  }catch(err){ console.error('loadHistory', err) }
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
    messages.value.push({ messageId: res.messageId, role: res.role, content: res.content, createdAt: res.createdAt })
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
    localStorage.removeItem(STORAGE_KEY)
  }
  sessionId.value = ''
  messages.value = []
  latestResponseId.value = null
  messages.value.push({ role:'assistant', content: '안녕하세요! 무엇을 도와드릴까요?', createdAt: new Date().toISOString() })
  await nextTick(scrollToBottom)
}

function toggle(){
  open.value = !open.value
}

onMounted(()=>{
  if(sessionId.value){
    loadHistory()
  } else {
    messages.value.push({ role:'assistant', content: '안녕하세요! 무엇을 도와드릴까요?', createdAt: new Date().toISOString() })
  }
})

watch(open, async (v) => {
  if(v){
    if(sessionId.value) await loadHistory()
    await nextTick(scrollToBottom)
  }
})
</script>

<style scoped>
.chatbot-root { position: fixed; right: 20px; bottom: 20px; z-index: 9999; }

/* 토글 버튼 (동그란 UI) */
.chat-toggle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(180deg,#0a58ca,#0747a6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(10,88,202,0.25);
  cursor: pointer;
}

/* 채팅창 (토글 버튼 위에 뜸) */
.chat-window {
  position: fixed;
  right: 20px;
  bottom: calc(20px + 64px + 12px);
  width: 350px;
  height: 500px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 14px 40px rgba(0,0,0,0.2);
}

/* 헤더/본문/입력 */
.chat-header {
  height: 48px;
  padding: 8px 12px;
  background: #0a58ca;
  color: #fff;
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.chat-header .title { font-weight:600; }
.chat-header .controls { display:flex; gap:8px; align-items:center }
.chat-header .clear,
.chat-header .close { background:transparent; color:#fff; border:none; font-size:14px; cursor:pointer; }

/* 메시지 영역 */
.chat-body {
  flex: 1;
  padding: 12px;
  overflow:auto;
  background: #f7f9fc;
  display:flex;
  flex-direction:column;
  gap:10px;
}
.message .bubble { padding:8px 12px; border-radius:12px; max-width:80%; }
.message.user { align-items:flex-end; }
.message.user .bubble { background:#0a58ca; color:#fff; margin-left:auto; }
.message.assistant { align-items:flex-start; }
.message.assistant .bubble { background:#f1f3f5; color:#222; margin-right:auto; }

.chat-input {
  display:flex;
  gap:8px;
  padding:10px;
  border-top:1px solid #eee;
  background:#fff;
}
.chat-input input {
  flex:1;
  padding:8px 10px;
  border-radius:8px;
  border:1px solid #ddd;
}
.chat-input .send {
  background:#0a58ca;
  color:#fff;
  border:none;
  padding:8px 12px;
  border-radius:8px;
  cursor:pointer;
}

/* 작은 애니메이션 */
.chat-fade-enter-active, .chat-fade-leave-active { transition: all .16s ease }
.chat-fade-enter-from, .chat-fade-leave-to { opacity:0; transform: translateY(8px) scale(.99) }

.typing{ color:#666; font-size:0.9rem; margin-top:6px }
</style>