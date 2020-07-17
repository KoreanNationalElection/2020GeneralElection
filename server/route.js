const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')

const router = express.Router()

/**
 * /api/data
 * 기본 데이터
 */
router.get('/data', async (req, res) => {
	const { db } = req.app.locals
	// 20대 선거구별 행정동 geojson
	const hjd20 = await db
		.collection('hjd')
		.find({ 'properties.electionCode': '20160413' }, { projection: { _id: 0 } })
		.toArray()
	// 21대 선거구별 행정동 geojson
	const hjd21 = await db
		.collection('hjd')
		.find({ 'properties.electionCode': '20200415' }, { projection: { _id: 0 } })
		.toArray()
	// 20대 당선인
	const elected20 = await db
		.collection('elected')
		.find({ electionCode: '20160413' }, { projection: { _id: 0 } })
		.toArray()
	const elected21 = await db
		.collection('elected')
		.find({ electionCode: '20200415' }, { projection: { _id: 0 } })
		.toArray()
	// 출력
	res.json({
		geoJson20: { type: 'FeatureCollection', features: hjd20 },
		geoJson21: { type: 'FeatureCollection', features: hjd21 },
		elected20,
		elected21,
	})
})

/**
 * /api/candidate
 * 21대 (예비)후보자 정보
 * @param {sggCode} String 선거구코드
 */
router.get('/candidate', async (req, res) => {
	const { db } = req.app.locals
	const { sggCode } = req.query

	// 21대 선거구코드, 데이터생성시간(버전고유코드) 별 (예비)후보자 목록
	const candidates = await db
		.collection('candidate')
		// .find({ sggCode, created: '202003271930' })
		.find({ sggCode })
		.sort('_id', 1) // sort 방식 변경
		.project({
			_id: 0,
			name: 1,
			party: 1,
			huboId: 1,
			gender: 1,
			age: 1,
			sign: 1,
			image: 1,
		})
		.toArray()

	const response = await axios.get(
		'http://info.nec.go.kr/electioninfo/electionInfo_report.xhtml',
		{
			params: {
				electionId: '0020200415',
				requestURI: '/WEB-INF/jsp/electioninfo/0020200415/vc/vccp09.jsp',
				topMenuId: 'VC',
				secondMenuId: 'VCCP09',
				menuId: 'VCCP09',
				statementId: 'VCCP09_#2',
				electionCode: 2,
				cityCode: `${sggCode.substring(1, 3)}00`,
				sggCityCode: sggCode,
				townCode: -1,
				sggTownCode: 0,
				x: 25,
				y: 14,
			},
		}
	)

	const $ = cheerio.load(response.data)
	const tr = $('#table01 > tbody > tr')[1].children.filter((v, i) => i % 2 === 1)

	for (let i = 0; i < candidates.length; i += 1) {
		candidates[i].voteRate = tr[i + 4].children[2].data.replace(/\(|\)/g, '')
		candidates[i].openVoteRate = tr[tr.length - 1].children[0].data
	}

	// 출력
	res.json({
		candidates,
	})
})

/**
 * /api/criminalPdf
 * 선관위 pdf stream을 반환
 *
 * @param {String} huboId
 */
router.get('/criminalPdf', async (req, res) => {
	const { huboId, stream } = req.query

	// pdf 주소 가져오기
	const response = await axios.get(
		'http://info.nec.go.kr/electioninfo/candidate_detail_scanSearchJson.json',
		{
			params: {
				gubun: '5',
				electionId: '0020200415',
				huboId,
				statementId: 'CPRI03_candidate_scanSearch',
			},
		}
	)
	let pdfPath = 'http://info.nec.go.kr/unielec_pdf_file/'
	pdfPath += response.data.jsonResult.body[0].FILEPATH.replace('tif', 'PDF')

	// 스트림이 아니라면 pdf 주소 전달
	if (!stream) {
		res.json({
			url: pdfPath,
		})
	} else {
		// pdf stream 가져오기
		const { data } = await axios.get(pdfPath, {
			responseType: 'stream',
			headers: {
				Accept: 'application/pdf',
			},
		})
		res.header('Content-Type', 'application/pdf')
		data.pipe(res)
	}
})

/**
 * /api/candidateImg
 * 선관위 이미지 stream을 반환
 *
 * @param {String} url
 */
router.get('/candidateImg', async (req, res) => {
	const { url } = req.query
	if (!url.startsWith('http://info.nec.go.kr/photo')) {
		throw new Error('정상적인 요청이 아닙니다.')
	}

	// 이미지 스트림 가져오기
	const response = await axios.get(url, {
		responseType: 'stream',
	})
	res.header('Content-Type', response.headers['content-type'])
	response.data.pipe(res)
})

/**
 * /api/allCandidate
 * 후보자 전체 데이터
 */
router.get('/allCandidate', async (req, res) => {
	const { db } = req.app.locals
	// 21대 후보자
	const data = await db
		.collection('candidate')
		.find({})
		.project({ sido: 1, name: 1, sggCode: 1, sggName: 1 })
		.toArray()

	// 출력
	res.json({
		data,
	})
})

/**
 * /api/stns
 * 투표소 목록 반환
 */
router.get('/stns', async (req, res) => {
	const { db } = req.app.locals

	const isPre = req.query.pre === 'true'
	const south = Number(req.query.south)
	const north = Number(req.query.north)
	const west = Number(req.query.west)
	const east = Number(req.query.east)

	const data = await db
		.collection(isPre ? 'preStn' : 'stn')
		.find({
			location: {
				$geoWithin: {
					$box: [
						[west, north],
						[east, south],
					],
				},
			},
		})
		.project({ _id: 0, location: 1, stnName: 1, votePlace: 1, facility: 1 })
		.toArray()

	// 출력
	res.json({ data })
})

/**
 * /api/voteRate
 * 투표율
 */
router.get('/voteRate', async (req, res) => {
	const res1 = await axios.get('http://info.nec.go.kr/electioninfo/electionInfo_report.xhtml', {
		params: {
			electionId: '0020200415',
			requestURI: '/WEB-INF/jsp/electioninfo/0020200415/vc/vcvp01.jsp',
			topMenuId: 'VC',
			secondMenuId: 'VCVP01',
			menuId: 'VCVP01',
			statementId: 'VCVP01_#2_SUM',
			sggTime: '20시',
			cityCode: 0,
			timeCode: 20,
			x: 33,
			y: 7,
		},
	})
	const $ = cheerio.load(res1.data)

	// 표 데이터
	const rows = $('.table01 > tbody > tr')
	const data = {}

	// 전부
	data.all = {
		labels: [],
		datasets: [
			{
				data: [],
				backgroundColor: ['rgba(255, 99, 132, 0.2)'],
				borderColor: ['rgba(255, 99, 132, 1)'],
				borderWidth: 1,
			},
		],
	}

	// 전국
	data.total = {
		labels: [],
		datasets: [
			{
				data: [],
				backgroundColor: ['rgba(255, 99, 132, 0.2)'],
				borderColor: ['rgba(255, 99, 132, 1)'],
				borderWidth: 1,
			},
		],
	}

	for (let i = 0; i < rows.length; i += 1) {
		// 합계
		if (i === 0) {
			data.total.labels.push(rows[i].children[1].children[0].data.replace(/^\s*/, ''))
			data.total.datasets[0].data.push(
				rows[i].children[15].children[0].children[0].children[0].data.replace('%', '')
			)
		}
		let sido = rows[i].children[1].children[0].data.replace(/^\s*/, '')
		if (sido.length === 4) {
			sido = sido.substring(0, 1) + sido.substring(2, 3)
		} else {
			sido = sido.substring(0, 2)
		}
		data.all.labels.push(sido)
		data.all.datasets[0].data.push(
			rows[i].children[15].children[0].children[0].children[0].data.replace('%', '')
		)
	}

	// // 시도명
	// $('.table01 > tbody > tr')[0].children[1].children[0].data
	// // 선거인수
	// $('.table01 > tbody > tr')[0].children[3].children[0].data
	// // 사전투표자수
	// $('.table01 > tbody > tr')[0].children[5].children[0].data
	// // 사전투표율(%)
	// $('.table01 > tbody > tr')[0].children[7].children[0].data

	// 출력
	res.json(data)
})

/**
 * /api/policy
 * 정책 pdf viewer 링크를 반환
 *
 * @param {String} url
 */
router.get('/policy', async (req, res) => {
	const { huboId } = req.query
	if (!huboId) {
		throw new Error('정상적인 요청이 아닙니다.')
	}

	// pdf 주소 가져오기
	const formData = new URLSearchParams()
	formData.append('sgId', '20200415')
	formData.append('subSgId', '220200415')
	formData.append('huboid', huboId)
	formData.append('sgBireYn', 'N')
	formData.append('sgTypecode', 2)
	const { data } = await axios.post(
		'http://policy.nec.go.kr/plc/popup/initUMAPopupData.do',
		formData
	)

	if (data.list.length <= 0) {
		throw new Error('pdf 데이터가 없습니다.')
	}

	try {
		const list = data.list[0]
		const arr = list.fileinfo.split('||')
		const url = `http://image.nec.go.kr/policy_pdf/${arr[1]}`
		const filename = `${list.sgId}_${list.sggname}_${list.hbjname}_${arr[0]}.pdf`
		res.json({ url, filename })
	} catch (e) {
		throw new Error('pdf 데이터가 없습니다.')
	}
})

module.exports = router
