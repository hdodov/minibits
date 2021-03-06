import Component from '../../component'
import Slide from './slide'
import { Drag } from '../../../utils/drag'
import { getTag } from '../../../utils/dom'
import { ticker } from '../../../utils/ticker'
import { FuzzyBoolean } from '../../../utils/fuzzy-boolean'
import { assignIn } from 'lodash'

interface Point {
  x: number
  y: number
}

type WritableDOMRect = {
  -readonly [T in keyof DOMRect]?: DOMRect[T]
}

function getWritableRect(input: ReturnType<Element['getBoundingClientRect']>): WritableDOMRect {
  if (typeof DOMRect === 'function') {
    if (input instanceof DOMRect) {
      return input.toJSON()
    }
  } else if (input instanceof ClientRect) {
    // IE11 does not have a DOMRect class

    let result = assignIn({}, input) as Partial<DOMRect>
    result.x = input.left
    result.y = input.top

    return result
  }
}

function getOffsetRect (element: HTMLElement) {
  let rect = getWritableRect(element.getBoundingClientRect())
  let offsetX = window.scrollX || window.pageXOffset
  let offsetY = window.scrollY || window.pageYOffset

  rect.left += offsetX
  rect.right += offsetX
  rect.x += offsetX

  rect.top += offsetY
  rect.bottom += offsetY
  rect.y += offsetY

  return rect
}

interface Screen {
  slides: Slide[]
  left: number
  right: number
  center: number
}

class Rail extends Component<HTMLElement> {}

export default class Slider extends Component<HTMLElement> {
  static components = {
    slide: Slide,
    rail: Rail
  }

  $slide: Slide[] = []
  $rail: Rail
  screens: Screen[]
  rect: ClientRect
  currentScreen: Screen
  origin: Point
  dragOrigin: Point
  deltas: Point[]
  totalDelta: Point
  center: number
  clickThreshold = 40
  isDraggingLink: boolean
  isDrag: boolean
  isDragging: FuzzyBoolean
  renderHandler: Slider['renderItems']
  drag: Drag

  create () {
    this.clickThreshold = 40
    this.isDraggingLink = null
    this.isDrag = null
    this.currentScreen = null
    this.origin = {
      x: 0, y: 0
    }
    
    this.drag = new Drag(this.$element)
    this.drag.on('start', this.pointerDown.bind(this))
    this.drag.on('change', this.pointerUpdate.bind(this))
    this.drag.on('move', this.pointerMove.bind(this))
    this.drag.on('end', this.pointerUp.bind(this))
    this.drag.on('retouch', this.newDelta.bind(this))

    this.$element.addEventListener('click', (event) => {
      if (this.isDraggingLink && this.isDrag) {
        // The user tried to drag, prevent redirection.
        event.preventDefault()
      }
    })

    this.renderHandler = this.renderItems.bind(this)
    ticker.on('tick', this.renderHandler)
  }

  init () {
    this.screens = this.updateScreens()
    this.setSlide(0)
  }

  setSlide (screen: number | Screen) {
    var target = (typeof screen === 'number')
      ? this.screens[screen]
      : screen

    if (target && this.currentScreen !== target) {
      this.currentScreen = target
      this.origin = {
        x: -target.left,
        y: 0
      }
      return true
    }

    return false
  }

  updateScreens () {
    let sps = 2
    let crr = 0
    let groups = [[]]

    this.$slide.forEach(slide => {
      if (crr >= sps) {
        groups.push([])
        crr = 0
      }

      groups[groups.length - 1].push(slide)
      crr++
    })

    return groups.map(group => {
      let first = group[0].$element
      let last = group[group.length - 1].$element
      let left = first.offsetLeft
      let right = last.offsetLeft + last.offsetWidth

      return {
        slides: group,
        left,
        right,
        center: (left + right) / 2
      }
    })
  }

  pointerDown (event) {
    this.dragOrigin = {
      x: event.pageX,
      y: event.pageY
    }

    this.isDrag = false
    this.isDragging = new FuzzyBoolean(true)
    this.isDraggingLink = !!getTag(event.target, 'A')
    this.$element.classList.add('is-dragged')

    // Don't prevent default for touchstart because if the slide is a link,
    // you can't follow it. The browser should automatically detect a drag and
    // prevent redirection.
    if (event.type !== 'touchstart') {
      event.preventDefault()
    }

    // Stop propagating so when nesting sliders, parent sliders don't move.
    event.stopPropagation()
    this.totalDelta = {
      x: 0,
      y: 0
    }
  }

  newDelta (event) {
    this.dragOrigin = {
      x: event.pageX,
      y: event.pageY
    }

    this.deltas = this.deltas || []
    this.deltas.unshift({
      x: 0,
      y: 0
    })
  }

  updateDelta (data) {
    if (!data) {
      this.deltas = data
      this.totalDelta = data
      return
    }

    if (!this.deltas) {
      this.deltas = []
    }

    this.deltas[0] = data
    this.totalDelta = this.deltas.reduce((acc, val) => {
      return {
        x: acc.x + val.x,
        y: acc.y + val.y
      }
    }, {
      x: 0,
      y: 0
    })
  }

  pointerMove (event, vector) {
    let sine = Math.abs(Math.sin(vector.direction))
    let wasDragging = this.isDragging.value()

    if (sine < 0.8) {
      event.stopPropagation()

      if (event.cancelable) {
        event.preventDefault() // prevent scroll on mobile
      }

      this.isDragging.true(1 / 5)
    } else {
      this.isDragging.false(1 / 5)
    }
    
    if (this.isDragging.value()) {
      if (!wasDragging) {
        this.newDelta(event)
      }
    } else {
      return
    }
  }

  pointerUpdate (vector) {
    this.updateDelta({
      x: this.drag.position.x - this.dragOrigin.x,
      y: this.drag.position.y - this.dragOrigin.y
    })

    if (!this.isDrag && Math.abs(this.totalDelta.x) >= this.clickThreshold) {
      this.isDrag = true
    }

    this.rect = this.$element.getBoundingClientRect()
    this.center = this.rect.left + (this.rect.width / 2)

    this.$slide.forEach(slide => slide.update())
  }

  pointerUp (event) {
    this.dragOrigin = null
    let x = -this.origin.x - this.totalDelta.x
    let rect = this.$element.getBoundingClientRect()
    let center = x + rect.width / 2

    let tuple: [Screen, number][] = this.screens.map(screen => [screen, Math.abs(center - screen.center)])
    let closest = tuple.reduce((acc, curr) => {
      return curr[1] <= acc[1] ? curr : acc
    })
    let closestScreen = closest[0]

    if (!this.setSlide(closestScreen)) {
      let ind = this.screens.indexOf(this.currentScreen)
      let pps = this.drag.movement.magnitude
      let dir = Math.sign(Math.cos(this.drag.movement.direction))

      if (pps > 500) {
        if (dir > 0) {
          this.setSlide(ind - 1)
        } else {
          this.setSlide(ind + 1)
        }
      }
      console.log(this.drag.movement, dir)
    }
    
    this.updateDelta(null)
    this.$element.classList.remove('is-dragged')
  }

  renderItems () {
    var itemsX = this.origin.x

    if (this.totalDelta) {
      itemsX += this.totalDelta.x
    }

    var leftOffset = this.$slide[0].$element.offsetLeft
    var rightOffset = this.$slide[this.$slide.length - 1].$element.offsetLeft
    var leftDiff = leftOffset - itemsX
    var rightDiff = rightOffset + itemsX

    var overdragSpan = this.$element.offsetWidth
    var overdragWidth = overdragSpan / 3
    var overdrag = null

    if (leftDiff < 0) {
      overdrag = leftDiff
    } else if (rightDiff < 0) {
      overdrag = rightDiff
    }

    if (overdrag) {
      let coef = Math.pow(Math.max(1 + overdrag / overdragSpan, 0), 3)
      let offset = (overdragWidth * (1 - coef))

      if (overdrag === leftDiff) {
        itemsX = leftOffset + offset
      } else {
        itemsX = -(rightOffset + offset)
      }
    }

    this.$rail.$element.style.transform = `translateX(${ itemsX }px)`
  }

  destroy () {
    ticker.off('tick', this.renderHandler)
  }
}
