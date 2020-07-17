import './css/index.scss'

// eslint-disable-next-line import/no-unresolved
import Kakao from 'Kakao'

import VoteMap from './js/votemap'
import counter from './js/counter'
import menu from './js/menu'
import makeChart from './js/vote-rate'

function main() {
	const global = {}

	// 투표율
	makeChart()

	// 카운터 실행
	counter('d-day')

	// 맵 정의
	global.mapObj = new VoteMap('v-map')

	// 메뉴
	menu(global)

	// 카카오톡 공유하기
	Kakao.init('deee0c00a32f9b2322eaab3f30c26b12')
	const kakaoShareBtn = document.getElementById('kakao-share-btn')
	kakaoShareBtn.addEventListener('click', () => {
		Kakao.Link.sendCustom({
			templateId: 21975,
		})
	})
}

main()
