<template>
	<HeaderNav />
	<section class="board-post">
		<div class="meta">
			<h2 class="title">{{ post.title }}</h2>
			<div class="meta-row">
				<div class="col-author">작성자: {{ post.author }}</div>
				<div class="col-date">작성일: {{ post.date }}</div>
				<div class="col-views">조회수: {{ post.views }}</div>
			</div>
		</div>

		<div v-if="isLoading" class="loading">불러오는 중...</div>
		<div v-if="error" class="error">{{ error }}</div>

		<article v-if="!isLoading && !error" class="post-content" v-html="sanitizedContent"></article>

		<section v-if="relatedInfo" class="related-info">
			<h3>관련 정보</h3>
			<div class="related-row">
				<img v-if="relatedInfo.firstimage" :src="relatedInfo.firstimage" alt="thumb" />
				<div class="related-meta">
					<div class="r-title">{{ relatedInfo.title }}</div>
					<div class="r-addr">{{ relatedInfo.addr1 }}</div>
				</div>
			</div>
		</section>

		<div class="post-actions">
			<button class="btn" @click="backToList">목록으로</button>
			<button class="btn" @click="goEdit">수정</button>
			<button class="btn" @click="doDeletePost">삭제</button>
		</div>

		<!-- edit form -->
		<section v-if="isEditing" class="edit-section">
			<h3>게시글 수정</h3>
			<div class="row">
				<input v-model="editForm.BRD_TITLE" class="control" />
			</div>
			<div class="row">
				<textarea v-model="editForm.BRD_CONTENT" rows="8" class="control"></textarea>
			</div>
			<div class="row">
				<input v-model="editForm.password" type="password" placeholder="비밀번호" class="control small" />
				<button class="btn" @click="isEditing=false">취소</button>
				<button class="btn primary" @click="saveEdit">저장</button>
			</div>
		</section>

		<section class="comments">
			<h3>댓글 {{ comments.length }}</h3>
			<ul class="comment-list">
				<li v-for="c in comments" :key="c.id" class="comment-item">
					<div class="c-meta"><strong>{{ c.author }}</strong> · {{ c.date }}</div>
					<div class="c-body">{{ c.content }}</div>
					<button class="btn small" @click="onDeleteComment(c.id)">삭제</button>
				</li>
			</ul>

			<div class="comment-form">
				<div class="comment-row">
					<input v-model="newComment.author" placeholder="닉네임 (기본 익명)" class="control small" />
					<input v-model="newComment.password" placeholder="비밀번호" type="password" class="control small" />
				</div>
				<textarea v-model="newComment.content" placeholder="댓글을 입력하세요" class="control" rows="3"></textarea>
				<button class="btn primary" @click="postComment" :disabled="posting">등록</button>
			</div>
		</section>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderNav from '../components/HeaderNav.vue'
import DOMPurify from 'dompurify'
import { fetchPostDetail, fetchComments, createComment, deleteComment, updatePost, deletePost } from '../services/boardApi'

const route = useRoute()
const router = useRouter()

const post = ref({ id:'', title:'', author:'', date:'', views:0, content:'' })
const isLoading = ref(true)
const error = ref(null)

const comments = ref([])
const newComment = ref({ author:'익명', content:'' })
const posting = ref(false)
// edit flow now handled by BoardWrite page

const sanitizedContent = computed(()=>{
	return DOMPurify.sanitize(post.value.content || '')
})

const relatedInfo = ref(null)

async function load(){
	isLoading.value = true
	error.value = null
	try{
		const id = route.params.post_number
		const res = await fetchPostDetail(id)
		post.value = res
		// load comments
		comments.value = await fetchComments(id)
		// load related content info if present
		relatedInfo.value = null
		const typeFile = post.value.BRD_CONTENTTYPEID
		const contentId = post.value.BRD_CONTENTID
		if(typeFile && contentId){
			try{
				const r = await fetch(`/json/${typeFile}`)
				if(r.ok){
					const data = await r.json()
					const arr = Array.isArray(data) ? data : (data.items || [])
					const found = arr.find(it => (it.title && it.title === contentId) || (it.contentid && String(it.contentid) === String(contentId)))
					if(found) relatedInfo.value = found
				}
			}catch(e){ /* ignore */ }
		}
	}catch(err){
		error.value = err.message || '불러오기 실패'
	}finally{
		isLoading.value = false
	}
}


function goEdit(){
	const id = post.value.BRD_SEQ || post.value.id
	router.push({ name: 'BoardWrite', query: { edit: id } })
}

async function doDeletePost(){
	const pwd = prompt('게시글 삭제를 위해 비밀번호를 입력하세요')
	if(pwd === null) return
	try{
		await deletePost(post.value.id || post.value.BRD_SEQ, pwd)
		// navigate back to list
		router.push({ name: 'Board' })
	}catch(err){ alert(err.message || '삭제 실패') }
}

function backToList(){
	// preserve page query
	const page = route.query.page
	router.push({ name: 'Board', query: page ? { page } : {} })
}

async function postComment(){
	if(!newComment.value.content || !newComment.value.content.trim()) return
	posting.value = true
	const payload = { author: newComment.value.author || '익명', content: newComment.value.content, password: newComment.value.password || null }
	// optimistic update
	const temp = { id: 'tmp' + Date.now(), postId: route.params.post_number, author: payload.author, content: payload.content, date: new Date().toLocaleDateString() }
	comments.value.push(temp)
	try{
		const res = await createComment(route.params.post_number, payload)
		// replace temp with real
		const idx = comments.value.findIndex(c=> c.id===temp.id)
		if(idx!==-1) comments.value.splice(idx,1,res.data)
		else comments.value.push(res.data)
		newComment.value.content = ''
	}catch(err){
		// rollback optimistic
		const idx = comments.value.findIndex(c=> c.id===temp.id)
		if(idx!==-1) comments.value.splice(idx,1)
		alert(err.message || '댓글 등록 실패')
	}finally{ posting.value = false }
}

async function onDeleteComment(id){
	const pwd = prompt('댓글 삭제를 위해 비밀번호를 입력하세요')
	if(pwd === null) return
	try{
		await deleteComment(id, pwd)
		const idx = comments.value.findIndex(c=> c.id===id)
		if(idx!==-1) comments.value.splice(idx,1)
	}catch(err){ alert(err.message || '삭제 실패') }
}

onMounted(load)
</script>

<style scoped>
.board-post{ max-width:1100px; margin:0 auto; padding:1rem }
.title{ font-size:1.25rem; margin-bottom:8px }
.meta-row{ display:flex; gap:12px; color:#666; margin-bottom:12px }
.post-content{ border:1px solid #eee; padding:12px; background:#fff; margin-bottom:12px }
.post-content img{ max-width:100%; height:auto }
.post-actions{ display:flex; gap:8px; margin-bottom:12px }
.comments{ margin-top:16px }
.related-info{ border:1px solid #eee; padding:12px; margin:12px 0 }
.related-row{ display:flex; gap:12px; align-items:flex-start }
.related-row img{ width:160px; height:auto; object-fit:cover }
.related-meta .r-title{ font-weight:600; margin-bottom:6px }
.related-meta .r-addr{ color:#666; font-size:0.95rem }
.comment-list{ list-style:none; padding:0 }
.comment-item{ border-bottom:1px solid #eee; padding:8px 0 }
.comment-form{ display:flex; flex-direction:column; gap:8px; margin-top:8px }
.btn.small{ padding:4px 8px; font-size:0.85rem }
</style>