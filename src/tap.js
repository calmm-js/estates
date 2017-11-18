import * as I from 'infestines'

import {
  Property,
  enqueueEffect,
  isVarying,
  propagateComplete,
  propagateNext
} from './core'

class Tap extends Property {
  constructor(effect, sources) {
    super(sources)
    this.effect = effect
  }
  next(value) {
    const effect = this.effect
    propagateNext(value, this)
    enqueueEffect(() => effect(value))
  }
  complete() {
    this.effect = undefined
    propagateComplete(this)
  }
}

export const tap = I.curry((effect, sources) => {
  if (isVarying(sources)) {
    return new Tap(effect, sources)
  } else {
    effect(sources)
    return sources
  }
})
