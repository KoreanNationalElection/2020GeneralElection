const sToggleBtn = document.getElementById('v-sidebar-toggle')
const fToggleBtn = document.getElementById('v-font-toggle')
const hToggleBtn = document.getElementById('v-help-toggle')
const elect21MenuBtn = document.getElementById('get-elect21-btn')
const elect20MenuBtn = document.getElementById('get-elect20-btn')
const searchConBtn = document.getElementsByName('v-search-selector')
const voteToggleBtn = document.getElementById('v-vote-datail-btn')

function toggleVoteRate() {
	const voteRateAll = document.getElementById('v-vote-rate-all-wrapper')
	voteRateAll.classList.toggle('show')
}

export function toggleSidebar() {
	sToggleBtn.classList.toggle('is-active')
	document
		.querySelectorAll('html, #v-sidebar, #v-page-cover')
		.forEach(node => node.classList.toggle('open'))
}

function toggleFont() {
	this.classList.toggle('is-active')
	document.querySelector('html').classList.toggle('large')
	if (localStorage) {
		const isActive = this.classList.contains('is-active')
		localStorage.setItem('v-font', isActive ? 'large' : '')
	}
}

function toggleHelp() {
	this.classList.toggle('is-active')
	document.querySelector('.v-help').classList.toggle('show')
}

function changeSearchCon() {
	const searchCon = document.querySelector('input[name="v-search-selector"]:checked').value

	if (searchCon === 'sgg') {
		document.querySelector('.v-search-sgg-box').classList.add('show')
		document.querySelector('.v-search-cand-box').classList.remove('show')
	} else if (searchCon === 'candidate') {
		document.querySelector('.v-search-cand-box').classList.add('show')
		document.querySelector('.v-search-sgg-box').classList.remove('show')
	}
}

function menu({ mapObj }) {
	// 사이드바 토글 클릭 이벤트
	sToggleBtn.addEventListener('click', toggleSidebar)

	// 투표율 토글 클릭 이벤트
	voteToggleBtn.addEventListener('click', toggleVoteRate)

	// 폰트 토글 클릭 이벤트
	fToggleBtn.addEventListener('click', toggleFont)
	if (localStorage && localStorage.getItem('v-font')) {
		toggleFont.call(fToggleBtn) // 저장된 폰트 설정 불러옴
	}

	// 도움말 클릭 이벤트
	hToggleBtn.addEventListener('click', toggleHelp)

	// cover 클릭시에도 사이드바 닫기
	document.getElementById('v-page-cover').addEventListener('click', toggleSidebar)

	// 폰트 토글 클릭 이벤트
	fToggleBtn.addEventListener('click', toggleFont)
	if (localStorage && localStorage.getItem('v-font')) {
		toggleFont.call(fToggleBtn) // 저장된 폰트 설정 불러옴
	}

	// 도움말 클릭 이벤트
	hToggleBtn.addEventListener('click', toggleHelp)

	// 메뉴1: 21대 총선 정보 선택
	elect21MenuBtn.addEventListener('click', function() {
		toggleSidebar()
		elect20MenuBtn.classList.remove('is-active')
		elect21MenuBtn.classList.add('is-active')
		mapObj.changeLayer(mapObj.layers.electReg)
	})
	elect21MenuBtn.classList.add('is-active') // default: active

	// 메뉴2: 20대 총선 결과 선택
	elect20MenuBtn.addEventListener('click', function() {
		toggleSidebar()
		elect20MenuBtn.classList.add('is-active')
		elect21MenuBtn.classList.remove('is-active')
		mapObj.changeLayer(mapObj.layers.elect20)
	})

	// 선거구, 후보자 검색 시 placeholder 변경
	searchConBtn.forEach(btn => {
		btn.addEventListener('click', function() {
			changeSearchCon()
		})
	})
}

export default menu
