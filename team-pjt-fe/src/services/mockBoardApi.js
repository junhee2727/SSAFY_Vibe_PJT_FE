// src/services/mockBoardApi.js
export async function fetchPosts({ page = 1, perPage = 10, period = null, type = null, q = '' } = {}) {
  const delay = 200 + Math.floor(Math.random() * 300) // 200~500ms
  const all = [
    { id:15, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:14, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:13, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:12, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:11, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:10, title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:9,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:8,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:7,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:6,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:5,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:4,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:3,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:2,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 },
    { id:1,  title:'Lorem ipsum dolor sit ametLorem ipsum ...', author:'이준희', date:'2026.08.13', views:31, category:1 }
  ]

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 강제 실패 테스트: 검색어가 'error'이면 에러 리턴
      if (String(q).toLowerCase() === 'error') {
        reject(new Error('mock error: forced failure for testing'))
        return
      }

      // 간단 필터: q(제목/작성자 포함), period(최근 N일), type(여기서는 무시하거나 간단 처리)
      let filtered = all.slice()

      // q 필터 (타이틀 또는 author 포함)
      if (q && String(q).trim().length) {
        const ql = String(q).toLowerCase()
        filtered = filtered.filter(p => (p.title && p.title.toLowerCase().includes(ql)) || (p.author && p.author.toLowerCase().includes(ql)))
      }

      // period 필터: period이 숫자(일수)일 때 해당 기간 이내로 제한 (date는 'YYYY.MM.DD' 포맷 가정)
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

      // type 필터: 예시로 'post'만 남기거나 'post+comment' 무시(데이터에 댓글 없음)
      if (type && type === 'post') {
        // no-op for mock; kept for signature compatibility
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