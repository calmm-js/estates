import * as I from 'infestines'

import { Property, propagateNext } from './core'

class SkipFirst extends Property {
  constructor(n, sources) {
    super(sources)
    this.n = n
  }
  next(value) {
    const n = this.n
    if (0 < n) {
      this.n = n - 1
    } else {
      propagateNext(value, this)
    }
  }
}

// XXX n > 0, sources = constant   =>   Never
export const skipFirst = I.curry(
  (n, sources) => (n <= 0 ? sources : new SkipFirst(n, sources))
)
