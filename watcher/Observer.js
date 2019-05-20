import EventEmitter from 'events'
import { get as getAttributes } from '../utils/attributes'

export default class extends EventEmitter {
  constructor (element, settings) {
    super()
    this.element = element
    this.settings = settings

    this.observer = new MutationObserver(this.handleMutationsList.bind(this))
    this.observer.observe(this.element, {
      childList: true,
      subtree: true
    })
  }

  search (node, callback) {
    if (!node || node.nodeType !== 1) {
      return
    }

    var attrs = getAttributes(node, this.settings)
    if (attrs.length) {
      callback(node, attrs)
    }

    var child = node.firstElementChild

    while (child) {
      this.search(child, callback)
      child = child.nextElementSibling
    }

    if (attrs.length) {
      this.emit('searched', node)
    }
  }

  addNode (node) {
    this.search(node, (foundNode, attrs) => {
      this.emit('added', foundNode, attrs)
    })
  }

  removeNode (node) {
    this.search(node, (foundNode, attrs) => {
      this.emit('removed', foundNode, attrs)
    })
  }

  handleMutationsList (list) {
    list.forEach(mutation => {
      if (mutation.removedNodes.length) {
        for (var mutatedNode of mutation.removedNodes) {
          this.removeNode(mutatedNode)
        }
      }

      if (mutation.addedNodes.length) {
        for (var mutatedNode of mutation.addedNodes) {
          this.addNode(mutatedNode)
        }
      }
    })
  }
}
