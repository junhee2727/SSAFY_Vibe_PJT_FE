import { createRouter, createWebHistory } from 'vue-router'
import Board from '../pages/Board.vue'
import Main from '../pages/Main.vue'

const routes = [
  { path: '/', name: 'Main', component: Main },
  { path: '/board', name: 'Board', component: Board }
]

export default createRouter({
  history: createWebHistory(),
  routes
})