import { createRouter, createWebHistory } from 'vue-router'
import Main from '../pages/Main.vue'
import BoardList from '../pages/BoardList.vue'
import BoardPost from '../pages/BoardPost.vue'
import BoardWrite from '../pages/BoardWrite.vue'
import ContentSearch from '../pages/ContentSearch.vue'
import Chat from '../pages/Chat.vue'

const routes = [
  { path: '/', name: 'Main', component: Main },
  { path: '/board', name: 'Board', component: BoardList },
  { path: '/board/:post_number', name: 'BoardPost', component: BoardPost, props:true},
  { path: '/board/write', name: 'BoardWrite', component: BoardWrite, props:true},
  { path: '/content-search', name: 'ContentSearch', component: ContentSearch },
  { path: '/chat', name: 'Chat', component: Chat },
  { path: '/festival-calendar', name: 'FestivalCalendar', component: () => import('../pages/FestivalCalendar.vue') },

  // 새로 추가된 라우트
  { path: '/my-likes', name: 'MyLikes', component: () => import('../pages/MyLikes.vue') },
  { path: '/my-bookmarks', name: 'MyBookmarks', component: () => import('../pages/MyBookmarks.vue') }
]

export default createRouter({
  history: createWebHistory(),
  routes
})