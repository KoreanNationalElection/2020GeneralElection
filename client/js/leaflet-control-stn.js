import L from 'leaflet'
import axios from 'axios'
import stnImg from '../img/stn_bold.png'

L.Control.Stn = L.Control.extend({
	options: {
		position: 'topleft',
	},
	initialize(options) {
		this._map = null
		this._button = this._makeButton() // 버튼 정의

		this._selected = null
		this._preStnBtn = document.querySelector('.v-pre-stn')
		this._ddayStnBtn = document.querySelector('.v-dday-stn')

		this._layerGroup = null

		L.setOptions(this, options)
	},
	onAdd(map) {
		this._map = map

		// 컨트롤 버튼 이벤트 추가
		L.DomEvent.on(this._button, 'click', this._clickEvent, this)

		// 소메뉴별 클릭 이벤트 활성화
		L.DomEvent.on(this._preStnBtn, 'click', this._preBtnclickEvent, this)
		L.DomEvent.on(this._ddayStnBtn, 'click', this._ddayBtnclickEvent, this)

		// 지도 드래그 이벤트 활성화
		this._dragEventBind = L.bind(this._dragEvent, this)
		this._map.on('dragend', this._dragEventBind)

		// 지도 줌 이벤트 활성화
		this._zoomEventBind = L.bind(this._zoomEvent, this)
		this._map.on('zoomend', this._zoomEventBind)

		// this._map.setView([37.566536, 126.977966], 13) // 임시

		return this._button
	},
	onRemove() {
		L.DomEvent.off(this._button, 'click', this._clickEvent, this)
		L.DomEvent.off(this._preStnBtn, 'click', this._preBtnclickEvent, this)
		L.DomEvent.off(this._ddayStnBtn, 'click', this._ddayBtnclickEvent, this)
		this._map.off('dragend', this._dragEventBind)
		this._map.off('zoomend', this._zoomEventBind)

		this._map = null
	},
	_makeButton() {
		const button = L.DomUtil.create('button', 'v-stn-btn')
		button.setAttribute('title', '투표소')
		L.DomUtil.create('div', 'v-stn-img', button)
		return button
	},
	_makeMarkerIcon() {
		return L.icon({
			iconUrl: stnImg,
			iconSize: [20, 20],
			iconAnchor: [10, 10],
		})
	},
	_unselect() {
		// 선택취소
		this._selected = null
		this._preStnBtn.classList.remove('selected')
		this._ddayStnBtn.classList.remove('selected')
		this._button.classList.remove('is-active')

		// 레이어그룹 삭제
		this._map.removeLayer(this._layerGroup)
		this._layerGroup = null
	},
	_clickEvent() {
		// 투표소 선택 버튼 ul 토글
		const stnMenu = document.querySelectorAll('.v-stn')
		stnMenu.forEach(el => {
			el.classList.toggle('show')
		})

		// this._button.classList.toggle('is-active')
		if (!this._button.classList.contains('is-active')) {
			this._unselect()
		}
	},
	_zoomEvent() {
		if (this._selected && this._map.getZoom() < 13 && this._layerGroup) {
			this._unselect()
		}
	},
	_dragEvent(e) {
		if (!this._selected || this._map.getZoom() < 13 || e.distance < 20) {
			// 1. 버튼이 선택되지 않았거나
			// 2. 줌이 13 미만이거나
			// 3. 20 이하로 움직였거나
			return
		}
		if (this._selected === this._preStnBtn) {
			this._displayStn(true)
		} else {
			this._displayStn(false)
		}
	},
	_preBtnclickEvent() {
		if (this._selected === this._preStnBtn) {
			this._unselect()
			return
		}

		const zoomCnt = 13 - this._map.getZoom()
		if (zoomCnt > 0) {
			alert(`지도를 ${zoomCnt}번 확대해야 투표소 조회가 가능합니다.`)
			return
		}

		this._button.classList.add('is-active')
		this._selected = this._preStnBtn
		this._preStnBtn.classList.add('selected')
		this._ddayStnBtn.classList.remove('selected')

		this._displayStn(true)
	},
	_ddayBtnclickEvent() {
		if (this._selected === this._ddayStnBtn) {
			this._unselect()
			return
		}

		const zoomCnt = 13 - this._map.getZoom()
		if (zoomCnt > 0) {
			alert(`지도를 ${zoomCnt}번 확대해야 투표소 조회가 가능합니다.`)
			return
		}

		this._button.classList.add('is-active')
		this._selected = this._ddayStnBtn
		this._preStnBtn.classList.remove('selected')
		this._ddayStnBtn.classList.add('selected')

		this._displayStn(false)
	},
	// 투표소 표출
	async _displayStn(isPre) {
		if (this._layerGroup) {
			this._map.removeLayer(this._layerGroup)
			this._layerGroup = null
		}

		const layerGroup = L.layerGroup()
		const bound = this._map.getBounds()

		// 데이터 가져오기
		const {
			data: { data },
		} = await axios.get('/api/stns', {
			params: {
				pre: isPre,
				west: bound.getWest(),
				east: bound.getEast(),
				south: bound.getSouth(),
				north: bound.getNorth(),
			},
		})

		// 레이어 그룹에 마커레이어 추가
		data.forEach(stn => {
			let tooltipHtml = `<div class="v-stn-popup">`
			tooltipHtml += `<strong>${stn.stnName}</strong>`
			tooltipHtml += `<ul><li>${stn.votePlace.substring(0, stn.votePlace.indexOf('('))}`
			tooltipHtml += `<br/>${stn.votePlace.substring(stn.votePlace.indexOf('('))}</li>`
			if (stn.facility.length > 3) {
				const fa1 = stn.facility.slice(0, 3)
				const fa2 = stn.facility.slice(3)
				tooltipHtml += `<li>${fa1}<br/>${fa2}</li>`
			} else if (stn.facility.length > 0) {
				tooltipHtml += `<li>${stn.facility}</li>`
			}
			tooltipHtml += '</div>'

			const marker = L.marker(stn.location.coordinates.reverse(), {
				icon: this._makeMarkerIcon(),
			}).bindTooltip(tooltipHtml, { direction: 'top' })

			layerGroup.addLayer(marker)
		})

		// 레이어 그룹을 지도에 추가
		layerGroup.addTo(this._map)
		this._layerGroup = layerGroup
	},
})

L.control.stn = function(opts) {
	return new L.Control.Stn(opts)
}
