// src/services/boardApi.js
import api from './api'

function formatDate(src){
  if(!src) return ''
  const d = new Date(src)
  if (Number.isNaN(d.getTime())) return String(src)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const dd = String(d.getDate()).padStart(2,'0')
  return `${yyyy}.${mm}.${dd}`
}

function normalizePost(item){
  return {
    id: item.id ?? item.BRD_SEQ ?? '',
    title: item.title ?? item.BRD_TITLE ?? '',
    author: item.username ?? item.author ?? item.BRD_USERNAME ?? '익명',
    date: item.created_at ? formatDate(item.created_at) : item.date ?? item.BRD_CREATE ?? '',
    views: item.views ?? 0,
    content: item.content ?? item.BRD_CONTENT ?? '',
    BRD_SEQ: item.BRD_SEQ ?? String(item.id ?? '')
  }
}

export async function fetchPosts({ page = 1, perPage = 10, period = null, type = null, q = '' } = {}) {
  const res = await api.get('/boards')
  const payload = res.data || {}
  const raw = payload.posts || payload || []
  let items = Array.isArray(raw) ? raw.slice() : []

  // normalize server items to FE shape
  items = items.map(normalizePost)

  // client-side filtering (imitate previous mock behavior)
  if (q && String(q).trim()) {
    const ql = String(q).toLowerCase()
    items = items.filter(p => (p.title && p.title.toLowerCase().includes(ql)) || (p.author && p.author.toLowerCase().includes(ql)))
  }
  if (period) {
    const days = Number(period)
    if (!Number.isNaN(days) && days > 0) {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
      items = items.filter(p => {
        try { const dt = new Date(String(p.date).replace(/\./g,'-')); return dt.getTime() >= cutoff } catch { return true }
      })
    }
  }

  const totalCount = items.length
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))
  const pageNum = Math.max(1, Number(page || 1))
  const start = (pageNum - 1) * perPage
  const data = items.slice(start, start + perPage)

  return { data, totalCount, totalPages }
}

export async function createPost(payload = {}) {
  const body = {
    title: payload.BRD_TITLE || payload.title,
    content: payload.BRD_CONTENT || payload.content,
    password: payload.BRD_PASSWORD || payload.password || '',
    username: payload.BRD_USERNAME || payload.username || undefined,
    content_type: payload.BRD_CONTENTTYPEID || payload.content_type || undefined,
    content_id: payload.BRD_CONTENTID || payload.content_id || undefined
  }
  const res = await api.post('/boards', body)
  const item = normalizePost(res.data)
  return { data: item }
}

export async function fetchPostDetail(postId) {
  const res = await api.get(`/boards/${postId}`)
  const item = normalizePost(res.data)
  return item
}

export async function updatePost(postId, payload = {}, password = '') {
  const body = {
    title: payload.BRD_TITLE || payload.title,
    content: payload.BRD_CONTENT || payload.content,
    password: password || payload.BRD_PASSWORD || payload.password || ''
  }
  const res = await api.put(`/boards/${postId}`, body)
  const item = normalizePost(res.data)
  return { data: item }
}

export async function deletePost(postId, password = '') {
  const res = await api.delete(`/boards/${postId}`, { data: { password } })
  return res.data
}

/* Comments: backend uses /comments POST (body includes board_id) and GET /comments/{board_id} */
function normalizeComment(item){
  return {
    id: item.id,
    postId: item.board_id,
    author: item.author || '익명', // backend doesn't store author; keep FE compatibility
    content: item.content,
    date: item.created_at ? formatDate(item.created_at) : ''
  }
}

export async function fetchComments(postId) {
  const res = await api.get(`/comments/${postId}`)
  const arr = res.data && res.data.comments ? res.data.comments : []
  return arr.map(normalizeComment)
}

export async function createComment(postId, payload = {}) {
  const body = {
    board_id: Number(postId),
    content: payload.content,
    password: payload.password || ''
  }
  const res = await api.post('/comments', body)
  const mapped = normalizeComment(res.data)
  // return mock-like shape used by existing components
  return { data: mapped }
}

export async function deleteComment(commentId, password = '') {
  const res = await api.delete(`/comments/${commentId}`, { data: { password } })
  return res.data
}