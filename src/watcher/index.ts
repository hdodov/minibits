import { Observer } from '../utils'
import * as factory from './factory'
import getAttributes from './attributes'

interface ComponentSchema {
  // @ts-ignore
  $base: Function,
  [key: string]: Component
}

type Component = ComponentSchema | object

interface ComponentRegistry {
  [key: string]: Component
}

const _components: ComponentRegistry = {}

function findComponentDefinition (componentFullName: string) {
  var value = _components
  var path = componentFullName.split('-')

  for (var part of path) {
    if (value) {
      // @ts-ignore
      value = value[part]
    }
  }

  if (typeof value === 'function') {
    return value
  } else if (value && "$base" in value) {
    return value.$base
  }

  return null
}

function createComponents (node) {
  let attributes = getAttributes(node, {
    prefix: 'ob',
    separator: '-'
  })

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

function destroyComponents (node) {
  let attributes = getAttributes(node, {
    prefix: 'ob',
    separator: '-'
  })

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
  var observer = new Observer(element, element => {
    if (element instanceof HTMLElement) {
      // @ts-ignore
      for (let attribute of element.attributes) {
        if (attribute.name.match(/^ob\-/)) {
          return true
        }
      }
    }
  })

  observer.on('added', createComponents)
  observer.on('searched', initComponents)
  observer.on('removed', destroyComponents)

  observer.add(element)
}

export default {
  register,
  init
}
