import dayjs from 'dayjs'

const CATEGORY_FILES = [
  { name: '관광지', file: '/json/서울_관광지.json' },
  { name: '레포츠', file: '/json/서울_레포츠.json' },
  { name: '문화시설', file: '/json/서울_문화시설.json' },
  { name: '쇼핑', file: '/json/서울_쇼핑.json' },
  { name: '숙박', file: '/json/서울_숙박.json' },
  { name: '여행코스', file: '/json/서울_여행코스.json' }
]

// load festival events and normalize
export async function loadFestivalEvents() {
  const candidates = ['/json/서울_축제공연행사.json', '/static/json/서울_축제공연행사.json', '/서울_축제공연행사.json']
  let js = null
  for (const p of candidates) {
    try {
      const r = await fetch(p)
      if (!r.ok) continue
      js = await r.json()
      break
    } catch (e) { /* try next */ }
  }
  if (!js) return []

  const items = js.items || js || []
  const events = items.map((it, idx) => {
    const startStr = it.eventstartdate || it.eventStartDate || ''
    const endStr = it.eventenddate || it.eventEndDate || startStr
    const start = parseDate(startStr)
    const end = parseDate(endStr)
    return {
      id: String(it.contentid || it.contentId || idx),
      title: it.title || '',
      program: it.program || '',
      eventplace: it.eventplace || it.placeinfo || '',
      tel: it.tel || '',
      eventhomepage: it.eventhomepage || '',
      agelimit: it.agelimit || '',
      usetimefestival: it.usetimefestival || '',
      mapx: it.mapx || '',
      mapy: it.mapy || '',
      startDate: start,
      endDate: end,
      durationDays: daysBetween(start, end) || 1
    }
  })

  // sort for deterministic coloring: longer duration first, then title
  events.sort((a,b) => {
    if (b.durationDays !== a.durationDays) return b.durationDays - a.durationDays
    return (a.title || '').localeCompare(b.title || '')
  })

  return events
}

function parseDate(yyyymmdd) {
  if (!yyyymmdd) return null
  const s = String(yyyymmdd)
  if (s.length === 8) {
    return dayjs(s, 'YYYYMMDD').toISOString()
  }
  // try fallback
  const parsed = dayjs(s)
  return parsed.isValid() ? parsed.toISOString() : null
}
function daysBetween(startISO, endISO) {
  if (!startISO || !endISO) return 0
  const a = dayjs(startISO)
  const b = dayjs(endISO)
  return b.diff(a, 'day') + 1
}

/* COLOR ASSIGNMENT
   Build interval-overlap graph (events overlapping share an edge)
   Greedy color by sorted order (already sorted by duration+title above)
*/
export function assignColors(events) {
  if (!events || !events.length) return
  // prepare adjacency
  const n = events.length
  const adj = Array.from({length:n}, ()=>new Set())
  for (let i=0;i<n;i++){
    for (let j=i+1;j<n;j++){
      if (intervalOverlap(events[i], events[j])) {
        adj[i].add(j); adj[j].add(i)
      }
    }
  }

  // palette (HSL spaced)
  const palette = generatePalette(16)
  const colorIdx = Array(n).fill(-1)
  for (let i=0;i<n;i++){
    const used = new Set()
    for (const nb of adj[i]) if (colorIdx[nb] !== -1) used.add(colorIdx[nb])
    // pick smallest available index
    let idx = 0
    while (used.has(idx)) idx++
    colorIdx[i] = idx
    events[i].color = palette[idx % palette.length]
  }
}

function intervalOverlap(a,b) {
  if (!a.startDate || !a.endDate || !b.startDate || !b.endDate) return false
  const a1 = dayjs(a.startDate)
  const a2 = dayjs(a.endDate).endOf('day')
  const b1 = dayjs(b.startDate)
  const b2 = dayjs(b.endDate).endOf('day')
  return a1.isBefore(b2) && b1.isBefore(a2) || a1.isSame(b2) || a2.isSame(b1)
}

function generatePalette(n = 12) {
  const arr = []
  for (let i=0;i<n;i++){
    const h = Math.round((360 / n) * i)
    arr.push(`hsl(${h} 70% 55%)`)
  }
  return arr
}

/* Nearby places search: scan category files and compute haversine distance */
export async function findNearbyPlaces({ lat, lon, maxKm = 3, limit = 6 }) {
  if (!lat || !lon) return []
  const results = []
  for (const cat of CATEGORY_FILES) {
    try {
      const r = await fetch(cat.file)
      if (!r.ok) continue
      const js = await r.json()
      const items = js.items || js || []
      for (const it of items) {
        const mx = Number(it.mapx || it.mapX || 0)
        const my = Number(it.mapy || it.mapY || 0)
        if (!mx || !my) continue
        const d = haversineKm(lat, lon, my, mx)
        if (d <= maxKm) results.push({ id: it.contentid || it.contentId || it.title || Math.random(), title: it.title || '이름 없음', category: cat.name, distKm: d })
      }
    } catch (e) { /* ignore */ }
  }
  results.sort((a,b) => a.distKm - b.distKm)
  return results.slice(0, limit)
}

/* haversine in km */
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = v => v * Math.PI / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}