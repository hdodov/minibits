import { linear } from './easings'

export default class {
  constructor (callback, duration, easing) {
    this.callback = callback
    this.duration = duration
    this.easing = easing

    if (typeof this.duration !== 'number') {
      throw new Error('Duration must be a number')
    }

    if (typeof this.easing !== 'function') {
      this.easing = linear
    }

    this.elapsed = 0
    this.progress = 0
    this.value = 0

    this.stamp = Date.now()
    this.delta = 0

    this.isComplete = false
  }

  update () {
    this.callback.call(this, this.value)
  }

  step () {
    var newStamp = Date.now()
    this.delta = newStamp - this.stamp
    this.elapsed += this.delta

    if (this.elapsed > this.duration) {
      this.elapsed = this.duration
    }

    if (this.duration > 0) {
      this.progress = this.elapsed / this.duration
    } else {
      this.progress = 1
    }

    this.value = this.easing(this.progress)
    this.update()

    this.isComplete = this.elapsed >= this.duration
    this.stamp = newStamp
  }
}