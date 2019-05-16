## Definitions

modules = bits, composites, components

bit = module consiting of one element, providing minimal functionality and no styles
composite = module consisting of an element and submodules (other elements), providing advanced functionality and no styles
component = like a composite, but provides styling and may provide more advanced functionality 

node.minibits = {
  bits: {
    height,
    toggle
  },
  composites: {
    carousel,
    carousel-content
  },
  components: {
    pop,
    pop-content
  }
}