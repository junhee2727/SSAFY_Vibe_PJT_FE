// src/services/chatApi.js
import api from './api'

export async function postMessage({ sessionId = null, message, previousResponseId = null } = {}) {
  const body = { sessionId, message, previousResponseId }
  const res = await api.post('/chat/messages', body)
  return res.data
}

export async function getHistory(sessionId) {
  const res = await api.get(`/chat/messages/${sessionId}`)
  return res.data
}

export async function deleteSession(sessionId) {
  const res = await api.delete(`/chat/messages/${sessionId}`)
  return res.data
}