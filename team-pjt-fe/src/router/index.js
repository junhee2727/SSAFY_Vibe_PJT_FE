import { createRouter, createWebHistory } from 'vue-router'
import Main from '../pages/Main.vue'
import BoardList from '../pages/BoardList.vue'
import BoardPost from '../pages/BoardPost.vue'
import BoardWrite from '../pages/BoardWrite.vue'
import ContentSearch from '../pages/ContentSearch.vue'

const routes = [
  { path: '/', name: 'Main', component: Main },
  { path: '/board', name: 'Board', component: BoardList },
  { path: '/board/:post_number', name: 'BoardPost', component: BoardPost, props:true},
  { path: '/board/write', name: 'BoardWrite', component: BoardWrite, props:true},
  { path: '/content-search', name: 'ContentSearch', component: ContentSearch }
]

export default createRouter({
  history: createWebHistory(),
  routes
})