import { createRouter, createWebHistory } from 'vue-router'
import Board from '../pages/Board.vue'
import Main from '../pages/Main.vue'
import BoardList from '../pages/BoardList.vue'
import BoardPost from '../pages/BoardPost.vue'

const routes = [
  { path: '/', name: 'Main', component: Main },
  { path: '/board', name: 'Board', component: BoardList },
  { path: '/board/:post_number', name: 'BoardPost', component: BoardPost, props:true}
]

export default createRouter({
  history: createWebHistory(),
  routes
})