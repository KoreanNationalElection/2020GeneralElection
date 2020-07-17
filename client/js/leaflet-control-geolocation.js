import L from 'leaflet'

L.Control.Geolocation = L.Control.extend({
	options: {
		position: 'topleft',
	},
	initialize(options) {
		this._map = null
		this._button = this._makeButton() // 버튼 정의
		this._marker = null
		this._markerIcon = this._makeMarkerIcon() // 버튼 클릭시 생성될 마커 아이콘 정의

		L.setOptions(this, options)
	},
	onAdd(map) {
		this._map = map

		// 버튼 이벤트 추가
		L.DomEvent.on(this._button, 'click', this._clickEvent, this)

		// 클릭 이벤트 트리거
		this._button.click()

		return this._button
	},
	onRemove() {
		this._map = null
		L.DomEvent.off(this._button, 'click', this._clickEvent, this)
	},
	_makeButton() {
		const button = L.DomUtil.create('button', 'v-now-loc')
		button.setAttribute('title', '현재위치')
		L.DomUtil.create('i', 'fas fa-map-marker-alt', button)
		return button
	},
	_makeMarkerIcon() {
		return L.divIcon({
			html: '<i class="fas fa-map-marker-alt fa-3x"></i>',
			iconSize: [27, 36],
			iconAnchor: L.point(13.5, 36),
			className: '',
		})
	},
	_clickEvent() {
		if (this._marker) {
			this._map.removeLayer(this._marker)
			this._marker = null
			this._button.classList.remove('is-active')
			return
		}

		if (!navigator.geolocation) {
			alert('위치 기반 서비스를 지원하지 않는 브라우저 입니다.')
			return
		}

		// Geolocation 객체를 사용
		navigator.geolocation.getCurrentPosition(
			position => {
				const { latitude, longitude } = position.coords
				this._marker = L.marker([latitude, longitude], {
					icon: this._markerIcon,
				})
				this._marker.addTo(this._map)

				// Zoomlvl 12이상 時 그대로 표출
				if (this._map.getZoom() < 12) {
					this._map.setView([latitude, longitude], 12)
				} else {
					this._map.setView([latitude, longitude])
				}
				this._button.classList.add('is-active')
			},
			error => {
				// 위치를 가져오는데 실패한 경우
				console.warn(error.message)
			},
			{
				enableHighAccuracy: true, // 정확한 값 : true, 대략적인 값 : false
				timeout: 10000, // 10 초이상 기다리지 않음.
			}
		)
	},
})

L.control.geolocation = function(opts) {
	return new L.Control.Geolocation(opts)
}
