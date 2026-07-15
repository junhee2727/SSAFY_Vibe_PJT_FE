// src/services/api.js
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://ssafyvibepjt.netlify.app/' || 'http://localhost:8000'

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, err => Promise.reject(err))

api.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
)

export default api