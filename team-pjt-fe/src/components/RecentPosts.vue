<script setup>
import { ref } from 'vue'
import PostItem from './PostItem.vue'

const posts = ref([
  { id:1, title:'Lorem ipsum dolor sit amet', date:'07.01' },
  { id:2, title:'Lorem ipsum dolor sit amet', date:'07.01' },
  { id:3, title:'Lorem ipsum dolor sit amet', date:'07.01' },
  { id:4, title:'Lorem ipsum dolor sit amet', date:'07.01' },
  { id:5, title:'Lorem ipsum dolor sit amet', date:'07.01' }
])
</script>

<template>
  <section>
    <h3 class="section-title">최근 게시글</h3>
    <ul class="posts">
      <li v-for="p in posts" :key="p.id">
        <PostItem :title="p.title" :date="p.date" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.section-title { margin:0 0 1rem 0; font-size:1.25rem; }
.posts { list-style:none; padding:0; margin:0; }
.posts li { border-bottom:1px solid #f0f0f0; padding:10px 0; }
</style>