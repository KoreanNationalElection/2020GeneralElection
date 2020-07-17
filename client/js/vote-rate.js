import Chart from 'chart.js'
import axios from 'axios'

async function makeChart() {
	const canvas = document.getElementById('v-vote-rate-canvas')
	const ctx = canvas.getContext('2d')
	const canvasAll = document.getElementById('v-vote-rate-canvas-all')
	const ctxAll = canvasAll.getContext('2d')

	const { data } = await axios.get('/api/voteRate')

	const totalChartOpt = {
		type: 'horizontalBar',
		// data: {
		// 	labels: ['전국'],
		// 	datasets: [
		// 		{
		// 			// label: '# of Votes',
		// 			data: [0.8],
		// 			backgroundColor: ['rgba(255, 99, 132, 0.2)'],
		// 			borderColor: ['rgba(255, 99, 132, 1)'],
		// 			borderWidth: 1,
		// 		},
		// 	],
		// },
		data: data.total,
		options: {
			// Elements options apply to all of the options unless overridden in a dataset
			// In this case, we are setting the border of each horizontal bar to be 2px wide
			maintainAspectRatio: false,
			elements: {
				rectangle: {
					borderWidth: 2,
				},
			},
			responsive: true,
			legend: {
				display: false,
				// position: 'right',
			},
			title: {
				display: false,
			},
			scales: {
				xAxes: [
					{
						ticks: {
							beginAtZero: true,
							max: 100,
						},
					},
				],
			},
			tooltips: {
				yAlign: 'left',
			},
		},
	}

	const allChartOpt = {
		type: 'horizontalBar',
		data: data.all,
		options: {
			// Elements options apply to all of the options unless overridden in a dataset
			// In this case, we are setting the border of each horizontal bar to be 2px wide
			maintainAspectRatio: false,
			elements: {
				rectangle: {
					borderWidth: 2,
				},
			},
			responsive: true,
			legend: {
				display: false,
				// position: 'right',
			},
			title: {
				display: false,
			},
			scales: {
				xAxes: [
					{
						ticks: {
							beginAtZero: true,
							max: 100,
						},
					},
				],
			},
			tooltips: {
				yAlign: 'left',
			},
		},
	}

	const totalChart = new Chart(ctx, totalChartOpt)
	const allChart = new Chart(ctxAll, allChartOpt)
}

export default makeChart
