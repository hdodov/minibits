/**
 * @todo when clicking on a link, the document fragment is not added to the
 * address bar (due to preventDefault)
 * @todo the cliecked element should be focused as per default behavior
 */

import { Animation } from '../../utils/animation'
import { offsetGlobal, getTag } from '../../utils/dom'
import { linear } from '../../utils/easings'
import { Component } from '../..'

export function scroll (options) {
	if (!options.target) {
		throw new Error('No scroll target')
	}

	var scroller = document.scrollingElement
	let offset = options.offset || 0

	options = Object.assign({
		interruptible: true,
		duration: 650,
		values: {
			scroll: {
				start: scroller.scrollTop,
				end: offsetGlobal(options.target).top + offset
			}
		},
		onUpdate: function () {
			scroller.scrollTop = this.computed.scroll
		}
	}, options)

	var scrollAnimation = new Animation(options)

	if (options.interruptible) {
		var interruptHandler = function (event) {
			scrollAnimation.stop()
			window.removeEventListener('wheel', interruptHandler)
			window.removeEventListener('touchstart', interruptHandler)
		}

		window.addEventListener('wheel', interruptHandler)
		window.addEventListener('touchstart', interruptHandler)
	}

	scrollAnimation.run()
}

export function monitorLinks (options) {
	options = Object.assign({
		duration: 650
	}, options)

	window.addEventListener('click', (event) => {
		var link = getTag(event.target, 'A')

		if (link) {
			var href = link.getAttribute('href')

			if (typeof href === 'string' && href[0] === '#') {
				var target = document.querySelector(href)

				if (target) {
					scroll({
						...options,
						target
					})

					event.preventDefault()
				}
			}
		}
	})
}

interface Options {
	event: keyof GlobalEventHandlersEventMap
	target: HTMLElement
	duration: number
	easing: string
	offset: string
}

interface Easings {
	[key: string]: (pos: number) => number
}

export class ScrollTo extends Component<Element, Options> {
	static easings: Easings = {
		linear
	}

	static defaults = {
		event: 'click',
		duration: 650,
		easing: 'linear',
		offset: 0
	}

	target: HTMLElement
	handler: any

	create () {
		if (!this.$options.target) {
			throw new Error('No scroll target specified')
		}

		this.target = this.$options.target

		let offset: number
		if (typeof this.$options.offset === 'number') {
			offset = this.$options.offset
		} else if (typeof this.$options.offset === 'string') {
			offset = parseInt(this.$options.offset)
		}

		this.handler = (event) => {
			scroll({
				duration: this.$options.duration,
				easing: ScrollTo.easings[this.$options.easing],
				target: this.target,
				offset
			})
		}

		this.$element.addEventListener(this.$options.event, this.handler)
	}

	destroy () {
		this.$element.removeEventListener(this.$options.event, this.handler)
	}
}

export default ScrollTo
