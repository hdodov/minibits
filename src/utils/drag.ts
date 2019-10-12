import { Emitter } from '.'

function isTouchEvent (event: Event): event is TouchEvent {
  return (event.type && event.type.indexOf('touch') === 0)
}

interface Point {
  x: number
  y: number
}

export class Drag extends Emitter {
  element: HTMLElement
  activeTouch: Touch
  angles: number[]
  direction: number
  startHandler: Drag['start']
  moveHandler: Drag['move']
  endHandler: Drag['end']
  lastClientPosition: Point
  
  constructor (element) {
    super()
    this.element = element
    this.activeTouch = null

    this.angles = null
    this.direction = null
    this.lastClientPosition = null

    this.startHandler = this.start.bind(this)
    this.moveHandler = this.move.bind(this)
    this.endHandler = this.end.bind(this)

    this.element.addEventListener('mousedown', this.startHandler)
    this.element.addEventListener('touchstart', this.startHandler)
  }

  assignTouch (event) {
    var assigned = false

    if (this.activeTouch && event.changedTouches) {
      for (var touch of event.changedTouches) {
        if (touch.identifier === this.activeTouch.identifier) {
          for (var k in touch) {
            if (typeof event[k] === 'undefined') {
              event[k] = touch[k]
            }
          }

          assigned = true
        }
      }
    }

    return assigned
  }

  start (event: MouseEvent | TouchEvent) {
    if (isTouchEvent(event)) {
      var previousTouch = this.activeTouch

      this.activeTouch = event.changedTouches[0]
      this.assignTouch(event)

      if (previousTouch) {
        this.emit('retouch', event)
        return
      }
    }

    /**
     * Touch properties are assigned to the TouchEvent so clientX and clientY
     * are available, like a MouseEvent.
     * @todo let's not do that.
     */
    event = event as MouseEvent

    this.angles = []
    this.direction = null
    this.lastClientPosition = {
      x: event.clientX,
      y: event.clientY
    }

    this.element.addEventListener('mousemove', this.moveHandler)
    this.element.addEventListener('touchmove', this.moveHandler)

    this.element.addEventListener('mouseup', this.endHandler)
    this.element.addEventListener('mouseleave', this.endHandler)
    this.element.addEventListener('touchend', this.endHandler)
    this.element.addEventListener('touchcancel', this.endHandler)

    this.emit('start', event)
  }

  move (event) {
    if (event.type.indexOf('touch') === 0) {
      if (!this.assignTouch(event)) {
        return
      }
    }

    var clientPosition = {
      x: event.clientX,
      y: event.clientY
    }

    this.angles.push(Math.atan2(
      clientPosition.y - this.lastClientPosition.y,
      clientPosition.x - this.lastClientPosition.x
    ))

    if (this.angles.length > 5) {
      this.angles.shift()
    }

    if (this.angles.length) {
      this.direction = this.angles.reduce((acc, value) => acc + value) / this.angles.length
    }

    this.lastClientPosition = clientPosition
    this.emit('move', event, this.direction)
  }

  end (event) {
    if (event.type.indexOf('touch') === 0) {
      if (this.assignTouch(event)) {
        this.activeTouch = null
      } else {
        return
      }
    }

    this.element.removeEventListener('mouseup', this.endHandler)
    this.element.removeEventListener('mouseleave', this.endHandler)
    this.element.removeEventListener('touchend', this.endHandler)
    this.element.removeEventListener('touchcancel', this.endHandler)

    this.element.removeEventListener('mousemove', this.moveHandler)
    this.element.removeEventListener('touchmove', this.moveHandler)

    this.emit('end', event)
  }
}