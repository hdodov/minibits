import * as factory from './factory'
import Observer from './observer'

const _components = {}

function findComponentDefinition (componentFullName) {
  var obj = _components
  var path = componentFullName.split('-')

  for (var part of path) {
    if (obj) {
      obj = obj[part]
    }
  }

  if (typeof obj === 'function') {
    return obj
  } else if (obj && typeof obj.$base === 'function') {
    return obj.$base
  }

  return null
}

function createComponents (node, attributes) {
  if (!node.minibits) {
    node.minibits = {}
  }

  attributes.forEach((data) => {
    if (!node.minibits[data.componentFullName]) {
      var definition = findComponentDefinition(data.componentFullName)
      if (!definition && !data.parentAttribute) {
        // If a component has no definition and it's not a child component, ignore it.
        console.warn(`Definition of component ${ data.componentFullName } not found.`)
        return
      }

      var instance = factory.create(node, definition, data)
      if (instance) {
        node.minibits[data.componentFullName] = instance
      }
    }
  })
}

function initComponents (node) {
  for (var k in node.minibits) {
    if (typeof node.minibits[k].$init === 'function') {
      node.minibits[k].$init()
    }
  }
}

function destroyComponents (node, attributes) {
  attributes.forEach((data) => {
    var instance = node.minibits && node.minibits[data.componentFullName]
    if (instance) {
      factory.destroy(node, instance, data)
    }
  })

  delete node.minibits
}

export function register (components) {
  Object.assign(_components, components)
}

export function init (element = document.body) {
  var observer = new Observer(element, {
    prefix: 'mb',
    separator: '-'
  })

  observer.on('added', createComponents)
  observer.on('searched', initComponents)
  observer.on('removed', destroyComponents)

  observer.addNode(observer.element)
}

export default {
  register,
  init
}
