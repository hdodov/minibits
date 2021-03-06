import { Observer } from '..'

interface DirectionOptions {
	direction: string
}

export default class Direction implements Observer {
	options: DirectionOptions
	lastPosition: number

	constructor (effect, options) {
		this.options = Object.assign({
			direction: 'up'
		}, options)

		this.lastPosition = null
	}

	$check () {
		var previous = this.lastPosition
		this.lastPosition = document.documentElement.scrollTop

		return this.options.direction === 'up'
			? (this.lastPosition < previous)
			: (this.lastPosition > previous)
	}
}
