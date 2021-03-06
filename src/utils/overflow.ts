export function getViewportOverflow () {
  var htmlStyle = window.getComputedStyle(document.documentElement)
  var bodyStyle = window.getComputedStyle(document.body)
  var overflow 

  // https://www.w3.org/TR/css-overflow-3/#overflow-propagation
  // UAs must apply the overflow-* values set on the root element to the
  // viewport. However, when the root element is an <html> element whose
  // overflow value is visible (in both axes), and that element has a <body>
  // element as a child, user agents must instead apply the overflow-* values
  // of the first such child element to the viewport.
  if (htmlStyle.overflowX === 'visible' && htmlStyle.overflowY === 'visible') {
    overflow = {
      x: bodyStyle.overflowX,
      y: bodyStyle.overflowY
    }
  } else {
    overflow = {
      x: htmlStyle.overflowX,
      y: htmlStyle.overflowY,
    }
  }

  // If visible is applied to the viewport, it must be interpreted as auto. If
  // clip is applied to the viewport, it must be interpreted as hidden.
  for (var k in overflow) {
    switch (overflow[k]) {
      case 'visible': overflow[k] = 'auto'; break
      case 'clip': overflow[k] = 'hidden'
    }
  }

  return overflow
}

export function getViewportScroller () {
  // https://drafts.csswg.org/cssom-view/#dom-document-scrollingelement
  // For non-conforming user agents that always use the quirks mode behavior
  // for scrollTop and scrollLeft, the scrollingElement attribute is expected
  // to also always return the HTML body element (or null if it does not
  // exist). This API exists so that Web developers can use it to get the
  // right element to use for scrolling APIs, without making assumptions about
  // a particular user agent’s behavior or having to invoke a scroll to see
  // which element scrolls the viewport.
  if (document.scrollingElement) {
    return document.scrollingElement
  }

  if (typeof document.compatMode === 'string') {
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/compatMode
    // "BackCompat" if the document is in quirks mode.
    if (document.compatMode === 'BackCompat') {
      // https://developer.mozilla.org/en-US/docs/Mozilla/Mozilla_quirks_mode_behavior
      // The scrollLeft, scrollTop, scrollWidth, and scrollHeight properties are
      // relative to BODY in quirks mode (instead of HTML).
      return document.body
    } else {
      return document.documentElement
    }
  }

  // If execution reaches here, the browser is exremely old and we assume it
  // uses the non-spec value.
  return document.body
}

/**
 * Checks if the element can be scrolled by a certain amount on the specified
 * axis. If the result is boolean, it can either be scrolled or not. If it's a
 * number, it can only be scrolled by the returned amount.
 */
export function canBeScrolled (element: HTMLElement, delta = 0): number | boolean {
  var current = element.scrollLeft
  var limit = element.scrollWidth - element.offsetWidth
  var value = current + delta

  if (delta >= 0) {
    if (value < limit) {
      return true
    } else {
      delta -= value - limit
    }
  } else {
    if (value > 0) {
      return true
    } else {
      delta -= value
    }
  }

  if (delta !== 0) {
    return delta
  } else {
    return false
  }
}
