<script setup>
import { RouterLink, RouterView } from 'vue-router'
import ChatBotWidget from './components/ChatBotWidget.vue'
</script>

<template>
  <main>
    <RouterView />
  </main>
  <ChatBotWidget />
</template>