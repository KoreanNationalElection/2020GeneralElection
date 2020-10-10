import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import axios from 'axios'
import UAParser from 'ua-parser-js'
import L from 'leaflet'
import 'leaflet-draw/dist/leaflet.draw-src'
import './leaflet-control-geolocation'
import Search from './search'
import './leaflet-control-stn'

/**
 * 정당 & 레이어 색상
 */
const PARTY_COLOR = [
	{ party: '가자!평화인권당', color: '#65A132' },
	{ party: '공화당', color: '#D2232A' },
	{ party: '국가혁명배당금당', color: '#E7141A' },
	{ party: '국민새정당', color: '#1F6DDC' },
	{ party: '기독자유통일당', color: '#0075C2' },
	{ party: '기본소득당', color: '#FE8871' },
	{ party: '노동당', color: '#FF0000' },
	{ party: '더불어민주당', color: '#004EA2' },
	{ party: '무소속', color: '#555555' },
	{ party: '미래당', color: '#2E3192' },
	{ party: '미래통합당', color: '#EF426F' },
	{ party: '민생당', color: '#0BA95F' },
	{ party: '민중당', color: '#F16522' },
	{ party: '민중민주당', color: '#8D2650' },
	{ party: '새누리당', color: '#C9252B' },
	{ party: '우리공화당', color: '#14A83B' },
	{ party: '정의당', color: '#FFCC00' },
	{ party: '충청의미래당', color: '#AD469F' },
	{ party: '친박신당', color: '#E20010' },
	{ party: '통일민주당', color: '#48A695' },
	{ party: '한국복지당', color: '#014898' },
	{ party: '한나라당', color: '#D61921' },
	{ party: '국민의당', color: '#006241' },
	{ party: '자유한국당', color: '#C9151E' },
	{ party: '미래한국당', color: '#C9151E' },
	{ party: '바른미래당', color: '#00B4B4' },
	{ party: '대안신당', color: '#236736' },
	{ party: '새로운보수당', color: '#00A7E5' },
	{ party: '민주평화당', color: '#43B02A' },
	{ party: '기독당', color: '#755191' },
	{ party: '대한당', color: '#4B3293' },
	{ party: '자유통일당', color: '#DF0913' },
	{ party: '자유공화당', color: '#009944' },
	{ party: '직능자영업당', color: '#762C87' },
	{ party: '충청의미래당', color: '#AD469F' },
	{ party: '공화당', color: '#D2232A' },
	{ party: '미래당', color: '#2E3192' },
	{ party: '친박신당', color: '#E20010' },
	{ party: '', color: '#cccccc' }, // 파주
]

const tmp = {}

/**
 * VoteMap 정의
 *
 * @param {String} mapId
 */
function VoteMap(mapId) {
	this.mapId = mapId

	this.map = null
	this.layers = {}
	// this.markers = []
	this.controls = {}
	this.floats = {
		elect20: {
			party: document.getElementById('v-last-party'),
		},
		electReg: {
			pre: document.getElementById('v-pre'),
		},
	}
	this.data = null
	this.stnMode = null

	this.init()
}

/**
 * init VoteMap
 */
VoteMap.prototype.init = async function init() {
	const { data } = await axios.get('/api/data')
	this.data = data
	console.log(this.data)
	const zoom = 6 // init zoom
	const center = L.latLng(36.1358642, 128.0785804) // init center

	// tile map
	const tileMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">osm</a>',
	})

	// leaflet map 생성
	this.map = L.map(this.mapId, {
		center,
		zoom,
		minZoom: 6,
		layers: tileMap,
		maxBounds: [
			[31.947632, 123.764743],
			[38.814133, 132.180872],
		],
	})

	// 기본 이벤트 걸기
	this._addDefaultEvents()

	// 내위치찾기 버튼 생성
	this._createGeolocButton()

	// 21대 총선 선거구 그리기
	this._drawElectRegLayer()
	this.layers.electReg.addTo(this.map) // default

	// 20대 총선 결과 & 선거구 그리기
	this._drawElect20Layer()

	// search box 만들기
	this._setSearch()

	// 투표소 표출 버튼 생성
	this._createStnButton()

	// 길찾기 버튼 생성
	const parser = new UAParser()
	const browser = parser.getBrowser().name.toLowerCase()
	if (!browser.includes('safari')) {
		this._createFindRoadButton()
	}

	return this.map
}

// 메뉴 별 layer Change
VoteMap.prototype.changeLayer = function(layer) {
	// 선택한 레이어 올리기 (없을 경우만)
	if (!this.map.hasLayer(layer)) {
		layer.addTo(this.map)
	}

	// 그 외 레이어 지우기 (있을 경우만)
	Object.values(this.layers)
		.filter(l => l !== layer)
		.forEach(l => {
			if (this.map.hasLayer(l)) {
				l.removeFrom(this.map)
			}
		})
}

/**
 * 기본 이벤트 걸기
 */
VoteMap.prototype._addDefaultEvents = function() {
	// float box에 toggle 이벤트 추가
	document.querySelectorAll('.v-float-toggle').forEach(btn => {
		btn.addEventListener('click', function() {
			this.classList.toggle('hide')
			this.previousElementSibling.classList.toggle('hide')
		})
	})
}

/**
 * 내위치찾기 버튼 생성
 */
VoteMap.prototype._createGeolocButton = function() {
	this.controls.geolocation = L.control.geolocation({ position: 'topleft' }).addTo(this.map)
}

/**
 * 투표소 버튼 생성
 */
VoteMap.prototype._createStnButton = function() {
	this.controls.stn = L.control.stn({ position: 'topleft' }).addTo(this.map)
}

/**
 * Safari  팝업
 *
 */
function popup() {
	const windowReference = window.open()
	try {
		// eslint-disable-next-line no-param-reassign
		windowReference.location = `https://www.google.co.kr/maps/dir/${tmp.start.lat},${tmp.start.lng}/${tmp.end.lat},${tmp.nd.lng}/data=!3m1!4b1`
	} catch (e) {
		windowReference.close()
		alert('Safari 브라우저는 길찾기 기능이 제공되지 않습니다.')
	}
}

/**
 * 길찾기 버튼 생성
 */
VoteMap.prototype._createFindRoadButton = function() {
	const parser = new UAParser()
	const browser = parser.getBrowser().name.toLowerCase()

	// Set the title to show on the polygon button
	L.drawLocal.draw.toolbar.buttons.polyline = '길찾기'
	L.drawLocal.draw.handlers.polyline.tooltip.start = '출발'
	L.drawLocal.draw.handlers.polyline.tooltip.cont = '도착'
	L.drawLocal.draw.handlers.polyline.tooltip.end = '도착'

	const drawControl = new L.Control.Draw({
		position: 'topleft',
		draw: {
			polyline: true,
			polygon: false,
			circle: false,
			marker: false,
			rectangle: false,
			circlemarker: false,
		},
	})
	this.controls.drawControl = drawControl.addTo(this.map)
	// this.map.addControl(drawControl)

	this.map.on(L.Draw.Event.CREATED, function(event) {
		const { layer } = event
		const start = layer._latlngs[0]
		const end = layer._latlngs[1]
		document.querySelector('.leaflet-draw-draw-polyline').classList.remove('on')

		if (browser !== 'safari') {
			window.open(
				`https://www.google.co.kr/maps/dir/${start.lat},${start.lng}/${end.lat},${end.lng}/data=!3m1!4b1`,
				'_blank'
			)
		} else {
			alert('Safari 브라우저는 길찾기 기능이 제공되지 않습니다.')

			// tmp.start = start
			// tmp.end = end
			// window.addEventListener('click', popup)
		}
	})
	this.map.on(L.Draw.Event.TOOLBAROPENED, function(event) {
		document.querySelector('.leaflet-draw-actions').setAttribute('style', 'display:none;')
	})

	this.map.on(L.Draw.Event.DRAWVERTEX, function(event) {
		const markerCnt = Object.keys(event.layers._layers).length
		const layerIds = Object.keys(event.layers._layers)
		if (markerCnt > 1) {
			const secondVertex = event.layers._layers[layerIds[1]]._icon

			requestAnimationFrame(() => secondVertex.click())
		} else {
			document.querySelector('.leaflet-draw-draw-polyline').classList.add('on')
		}
	})
}
/**
 * 21대 총선 후보자 전과 기록 상세 조회
 *
 * @param {String} huboId
 */
async function getPreCandCriminalRecord(huboId, windowReference) {
	const parser = new UAParser()
	const browser = parser.getBrowser().name
	try {
		if (browser === 'IE') {
			const { data } = await axios.get(`/api/criminalPdf?huboId=${huboId}`)
			// eslint-disable-next-line no-param-reassign
			windowReference.location = data.url
		} else {
			// eslint-disable-next-line no-param-reassign
			windowReference.location = `/api/criminalPdf?huboId=${huboId}&stream=true`
		}
	} catch (e) {
		windowReference.close()
		alert('전과 기록을 불러올 수 없습니다')
	}
}

/**
 * 21대 총선 후보자 공약 팝업
 *
 * @param {String} huboId
 */
async function popupPrePolicy(huboId, windowReference) {
	try {
		const { data } = await axios.get(`/api/policy?huboId=${huboId}`)
		const url = `http://policy.nec.go.kr/plc/common/initUCoCommonPdf.do?url=${data.url}&filename=${data.filename}`
		// eslint-disable-next-line no-param-reassign
		windowReference.location = url
	} catch (e) {
		windowReference.close()
		alert('공약을 불러올 수 없습니다')
	}
}

/**
 * 21대 총선 후보자 정보 출력
 * * VoteMap의 prototype으로 지정할 필요 없을 것 같아서 따로 펑션으로 뺌
 *
 * @param {Node} preDiv 후보자 정보가 출력되는 node
 * @param {String} properties 선거구정보
 */
async function makePreCandidateInfo(preDiv, properties) {
	const {
		data: { candidates },
	} = await axios.get('/api/candidate', {
		params: { sggCode: properties.sggCode },
	})

	// 브라우저 체크
	const parser = new UAParser()
	const isSafari = parser.getBrowser().name.endsWith('Safari')
	const isKakao = navigator.userAgent.toLowerCase().includes('kakaotalk')

	const toggleBtn = preDiv.querySelector('.v-float-toggle')
	const toggleBtnDiv = toggleBtn.querySelector('div')
	const tblContent = preDiv.querySelector('.v-pre-tbl-content')

	// 숨겨져 있을 수 있으므로 hide 지운다
	preDiv.children.forEach(node => node.classList.remove('hide'))

	// 토글버튼 내용 설정
	toggleBtnDiv.innerHTML = `<strong>${properties.sggName} (개표율: ${candidates[0].openVoteRate}%)</strong>`

	// content table 작성
	let html = '<table class="v-pre-tbl"><tbody>'
	candidates.forEach(async function(candi) {
		const { name, party, huboId, gender, age, image, sign, voteRate } = candi
		const { color: partyColor } = PARTY_COLOR.find(x => x.party === party)

		html += '<tr>'
		if (isSafari || isKakao) {
			html += `<td><img src="/api/candidateImg?url=${image}" /></td>`
		} else {
			html += `<td><img src="${image}" /></td>`
		}

		html += `<td style="color:${partyColor}">${party}</td>`
		html += `<td>${sign}</td>`
		html += `<td><a href="https://search.naver.com/search.naver?query=${name}" target="_blank" title="네이버로 검색하기">${name}</a><br/>(<a href="#" class="v-pre-policy" data-hubo-id="${huboId}" title="공약보기">공약</a>)</td>`

		html += `<td>${gender}</td>`
		html += `<td>${age}</td>`
		html += `<td>${voteRate}</td>`
		html += '</tr>'
		// html += '<tr class="v-pre-detail-info">'
		// html += '<td colspan="7">'
		// html += '<div>'

		// if (isSafari || isKakao) {
		// 	html += `<img src="/api/candidateImg?url=${image}" />`
		// } else {
		// 	html += `<img src="${image}" />`
		// }

		// html += '<div>'
		// html += '</div>'
		// html += '</div>'
		// html += '</td>'
		// html += '</tr>'
	})
	html += '</tbody></table>'
	tblContent.innerHTML = html

	// 공약 팝업 이벤트
	const policyEl = tblContent.querySelectorAll('.v-pre-policy')
	policyEl.forEach(el => {
		el.addEventListener('click', function() {
			const windowReference = window.open()
			popupPrePolicy(this.dataset.huboId, windowReference)
		})
	})

	// 전과 기록 상세 조회 이벤트
	const criminalEl = tblContent.querySelectorAll('.v-pre-criminal')
	criminalEl.forEach(el => {
		el.addEventListener('click', function() {
			if (this.classList.contains('has-data')) {
				const windowReference = window.open()
				getPreCandCriminalRecord(this.dataset.huboId, windowReference)
			}
		})
	})

	// 접기/펴기 액션 추가
	const foldBtns = tblContent.querySelectorAll('.v-pre-unfold')
	foldBtns.forEach(btn => {
		btn.addEventListener('click', function() {
			this.classList.toggle('show')
			this.parentNode.parentNode.nextElementSibling.classList.toggle('show')
		})
	})

	// pre div 안 보이면 켜기
	preDiv.classList.add('show')
}

/**
 * 21대 총선 선거구 그리기
 */
VoteMap.prototype._drawElectRegLayer = function() {
	let clicked = null // 직전 클릭된 레이어
	const { geoJson21, elected21 } = this.data

	const preDiv = this.floats.electReg.pre
	this.layers.electReg = L.geoJSON(geoJson21, {
		style(feature) {
			const elected = elected21.find(x => x.sggCode === feature.properties.sggCode)
			const party = elected ? elected.party : ''
			return {
				weight: 1,
				color: PARTY_COLOR.find(x => x.party === party).color,
				fillOpacity: 0.4,
				className: 'data-layer',
			}
		},
		// style: {
		// 	weight: 1,
		// 	color: '#673ab7',
		// 	fillOpacity: 0.1,
		// 	className: 'data-layer',
		// },
		onEachFeature(feature, layer) {
			// bind click
			layer.on('click', () => {
				if (clicked === layer) return // 같은 경우는 냅둔다
				if (clicked) {
					Object.values(layer._eventParents)[0].fire('reset')
				}
				clicked = layer
				layer.setStyle({ fillOpacity: 0.4 })
				makePreCandidateInfo(preDiv, feature.properties)
			})
		},
	})
		.bindTooltip(
			layer => {
				const elected = elected21.find(x => x.sggCode === layer.feature.properties.sggCode)
				if (!elected) return '<strong>선거구 없음</strong>'
				return (
					`<p><strong>선거구 : </strong>${elected.sggName}</p>` +
					`<p><strong>당선인 : </strong>${elected.name}</p>` +
					`<p><strong>당선당 : </strong>${elected.party}</p>` +
					'<p><small>클릭하면 후보자 득표율 조회가 가능합니다</small></p>'
				)
			},
			{ opacity: 1, className: 'v-elect-tooltip v-elect-reg-tooltip' }
		)
		.on('remove', () => {
			// 21대 예비 후보자 정보 안보이게
			this.floats.electReg.pre.classList.remove('show')

			// 선택을 리셋
			this.layers.electReg.fire('reset')
		})
		.on('reset', function() {
			this.resetStyle()
		})
}

/**
 * 20대 선거구 & 결과 그리기
 */
VoteMap.prototype._drawElect20Layer = function() {
	const { geoJson20, elected20 } = this.data

	this.layers.elect20 = L.geoJSON(geoJson20, {
		style(feature) {
			const elected = elected20.find(x => x.sggCode === feature.properties.sggCode)
			const party = elected ? elected.party : ''
			return {
				weight: 1,
				color: PARTY_COLOR.find(x => x.party === party).color,
				fillOpacity: 0.4,
				className: 'data-layer',
			}
		},
	})
		.bindTooltip(
			layer => {
				const elected = elected20.find(x => x.sggCode === layer.feature.properties.sggCode)
				if (!elected) return '<strong>선거구 없음</strong>'
				return (
					`<p><strong>선거구 : </strong>${elected.sggName}</p>` +
					`<p><strong>당선인 : </strong>${elected.name}</p>` +
					`<p><strong>당선당 : </strong>${elected.party}</p>`
				)
			},
			{ opacity: 1, className: 'v-elect-tooltip' }
		)
		.on('add', () => {
			// 20대 총선 결과가 그려질때
			this.floats.elect20.party.classList.add('show')
			this.floats.elect20.party.children.forEach(node => node.classList.remove('hide'))
		})
		.on('remove', () => {
			// 20대 총선 결과 div를 숨김
			this.floats.elect20.party.classList.remove('show')
		})
}

/**
 * 후보자 검색
 */
VoteMap.prototype._setSearch = async function() {
	// TODO: 21대 기준으로 만들었는데, 20대는?

	const allCandidate = await axios.get('/api/allCandidate')
	// 선거구
	const searchSgg = new Search(this.data.geoJson21, 'sgg')
	// 후보자
	// const searchCand = new Search(allCandidate.data.data, 'candidate')
	const searchCand = new Search(allCandidate.data, 'candidate')

	// 검색결과 클릭시 이벤트 콜백으로 전달
	searchSgg.bindEvent('selectGeoJson', geoJson => {
		const { sggCode } = geoJson
		if (this.map.hasLayer(this.layers.electReg)) {
			// 21대 총선 정보 레이어가 on 상태라면
			const layers = this.layers.electReg.getLayers()
			const layer = layers.find(l => l.feature.properties.sggCode === sggCode)
			this.map.fitBounds(layer.getBounds())
			layer.fire('click')
		} else if (this.map.hasLayer(this.layers.elect20)) {
			// 20대 총선 결과 레이어가 on 상태라면
			const layers = this.layers.electReg.getLayers()
			const layer = layers.find(l => l.feature.properties.sggCode === sggCode)
			this.map.fitBounds(layer.getBounds())
			// TODO: 20대 총선 레이어에서 검색하면 어떻게 처리할 것인가?
		}
	})

	// 후보자 검색결과 클릭시 이벤트 콜백으로 전달
	searchCand.bindEvent('selectGeoJson', geoJson => {
		const { sggCode } = geoJson
		if (this.map.hasLayer(this.layers.electReg)) {
			// 21대 총선 정보 레이어가 on 상태라면
			const layers = this.layers.electReg.getLayers()
			const layer = layers.find(l => l.feature.properties.sggCode === sggCode)
			this.map.fitBounds(layer.getBounds())
			layer.fire('click')
		}
	})
}

export default VoteMap
