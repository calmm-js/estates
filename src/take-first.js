import * as I from 'infestines'

import { Property, enqueueComplete, isVarying, propagateNext } from './core'

class TakeFirst extends Property {
  constructor(n, sources) {
    super(sources)
    this.n = n
  }
  next(value) {
    propagateNext(value, this)
    const n = this.n
    if (0 === n || 0 === (this.n = n - 1)) enqueueComplete(this)
  }
}

export const takeFirst = I.curry(
  (n, sources) =>
    isVarying(sources) ? new TakeFirst(Math.max(0, n), sources) : sources
)
