<template>
  <HeaderNav />
  <section class="chat-page">
    <h2>챗봇</h2>

    <div class="chat-container">
      <div class="messages" ref="msgsContainer">
        <div v-for="m in messages" :key="m.messageId || m.tempId" :class="['message', m.role]">
          <div class="meta"><strong>{{ m.role === 'assistant' ? 'LocalHub' : '나' }}</strong> · <small>{{ formatTime(m.createdAt) }}</small></div>
          <div class="bubble" v-html="sanitize(m.content)"></div>
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
import { postMessage, getHistory, deleteSession } from '../services/chatApi'

const input = ref('')
const messages = ref([])
const sending = ref(false)
const isTyping = ref(false)
const sessionId = ref(localStorage.getItem('chat_session_id') || '')
const latestResponseId = ref(null)
const msgsContainer = ref(null)

function sanitize(html){ return DOMPurify.sanitize(html || '') }
function formatTime(v){ return v ? new Date(v).toLocaleString() : '' }
async function scrollToBottom(){ await nextTick(); if(msgsContainer.value) msgsContainer.value.scrollTop = msgsContainer.value.scrollHeight }

async function loadHistory(){
  if(!sessionId.value) return
  try{
    const res = await getHistory(sessionId.value)
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
    sessionId.value = res.sessionId
    if(sessionId.value) localStorage.setItem('chat_session_id', sessionId.value)
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
</style>