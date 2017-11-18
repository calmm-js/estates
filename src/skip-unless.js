import * as I from 'infestines'

import { Property, propagateComplete, propagateNext } from './core'

class SkipUnless extends Property {
  constructor(predicate, sources) {
    super(sources)
    this.predicate = predicate
  }
  next(value) {
    if (this.predicate(value)) propagateNext(value, this)
  }
  complete() {
    this.predicate = undefined
    propagateComplete(this)
  }
}

export const skipUnless = I.curry(
  (predicate, sources) => new SkipUnless(predicate, sources)
)
