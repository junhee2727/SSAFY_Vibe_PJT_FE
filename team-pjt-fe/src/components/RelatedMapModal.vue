<template>
  <div v-show="visible" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <header class="modal-header">
        <h3>지도 보기</h3>
        <button class="btn" @click="close">닫기</button>
      </header>

      <div class="modal-body">
        <div v-if="!hasCoords" class="notice">주소 좌표 정보가 없습니다.</div>
        <div v-else>
          <div ref="mapEl" class="map"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  lat: [Number, String],
  lng: [Number, String],
  address: String
})
const emit = defineEmits(['close'])

const mapEl = ref(null)
let mapInstance = null
let marker = null
let initialized = false

const hasCoords = computed(()=> props.lat && props.lng )

function close(){ emit('close') }

async function loadScript(clientId){
  if(window.naver && window.naver.maps) return
  return new Promise((resolve, reject)=>{
    const s = document.createElement('script')
    s.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`
    s.async = true
    s.onload = ()=> resolve()
    s.onerror = ()=> reject(new Error('failed to load naver maps'))
    document.head.appendChild(s)
  })
}

async function initMap(){
  if(!hasCoords.value) return
  if(initialized) return
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID
  try{
    await loadScript(clientId)
  }catch(err){
    console.error('naver maps load failed', err)
    return
  }
  const lat = Number(props.lat)
  const lng = Number(props.lng)
  const center = new window.naver.maps.LatLng(lat, lng)
  mapInstance = new window.naver.maps.Map(mapEl.value, { center, zoom: 20 })
  marker = new window.naver.maps.Marker({ position: center, map: mapInstance })
  const infowindow = new window.naver.maps.InfoWindow({ content: `<div style="padding:8px">${props.address || ''}</div>` })
  window.naver.maps.Event.addListener(marker, 'click', () => infowindow.open(mapInstance, marker))
  initialized = true
}

watch(()=> props.visible, async (v)=>{
  if(v){ await initMap() }
})

onMounted(()=>{ if(props.visible) initMap() })
</script>

<style scoped>
.modal-backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; z-index:1200 }
.modal{ width:800px; max-width:95%; background:#fff; border-radius:6px; overflow:hidden }
.modal-header{ display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid #eee }
.modal-body{ padding:12px }
.map{ width:100%; height:420px }
.notice{ color:#666 }
</style>
