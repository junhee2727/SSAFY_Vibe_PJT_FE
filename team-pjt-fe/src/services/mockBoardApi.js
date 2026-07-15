// src/services/mockBoardApi.js
const _all = [
  { id:15, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'15' },
  { id:14, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'14' },
  { id:13, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'13' },
  { id:12, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'12' },
  { id:11, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'11' },
  { id:10, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'10' },
  { id:9,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'9' },
  { id:8,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'8' },
  { id:7,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'7' },
  { id:6,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'6' },
  { id:5,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'5' },
  { id:4,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'4' },
  { id:3,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'3' },
  { id:2,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'2' },
  { id:1,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1, BRD_SEQ:'1' }
]

function _formatDate(d = new Date()){ 
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}.${mm}.${dd}`
}

export async function fetchPosts({ page = 1, perPage = 10, period = null, type = null, q = '' } = {}) {
  const delay = 200 + Math.floor(Math.random() * 300) // 200~500ms
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 강제 실패 테스트: 검색어가 'error'이면 에러 리턴
      if (String(q).toLowerCase() === 'error') {
        reject(new Error('mock error: forced failure for testing'))
        return
      }

      let filtered = _all.slice()

      if (q && String(q).trim().length) {
        const ql = String(q).toLowerCase()
        filtered = filtered.filter(p => (p.title && p.title.toLowerCase().includes(ql)) || (p.author && p.author.toLowerCase().includes(ql)))
      }

      if (period) {
        const days = Number(period)
        if (!Number.isNaN(days) && days > 0) {
          const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
          filtered = filtered.filter(p => {
            try {
              const dt = new Date(String(p.date).replace(/\./g,'-'))
              return dt.getTime() >= cutoff
            } catch {
              return true
            }
          })
        }
      }

      // type 필터 자리(compat)
      if (type && type === 'post') {
        // no-op
      }

      const totalCount = filtered.length
      const totalPages = Math.max(1, Math.ceil(totalCount / perPage))
      const pageNum = Math.max(1, Number(page || 1))
      const start = (pageNum - 1) * perPage
      const data = filtered.slice(start, start + perPage)

      resolve({ data, totalCount, totalPages })
    }, delay)
  })
}

// createPost: simulate server-side creation
export async function createPost(payload = {}){
  const delay = 200 + Math.floor(Math.random() * 300)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // minimal validation: require STS_CODE, BRD_TITLE, BRD_CONTENT
        if (!payload.STS_CODE) throw new Error('STS_CODE required')
        if (!payload.BRD_TITLE) throw new Error('BRD_TITLE required')
        if (!payload.BRD_CONTENT) throw new Error('BRD_CONTENT required')

        const maxId = _all.reduce((acc, cur) => Math.max(acc, cur.id || 0), 0)
        const newId = maxId + 1
        const today = _formatDate()
        const brdSeq = String(Date.now())

        const item = {
          id: newId,
          title: payload.BRD_TITLE,
          author: payload.BRD_USERNAME || '익명',
          date: today,
          views: 0,
          category: payload.category || null,
          BRD_SEQ: brdSeq,
          STS_CODE: payload.STS_CODE,
          BRD_TITLE: payload.BRD_TITLE,
          BRD_CONTENT: payload.BRD_CONTENT,
          BRD_PASSWORD: payload.BRD_PASSWORD || null,
          BRD_CREATE: today,
          BRD_MODIFIED: null,
          BRD_CONTENTTYPEID: payload.BRD_CONTENTTYPEID || null,
          BRD_CONTENTID: payload.BRD_CONTENTID || null,
          BRD_USERNAME: payload.BRD_USERNAME || (payload.BRD_USERNAME === '' ? '' : '익명')
        }

        // push to head to simulate newest first
        _all.unshift(item)

        resolve({ data: item })
      } catch (err) {
        reject(err)
      }
    }, delay)
  })
}