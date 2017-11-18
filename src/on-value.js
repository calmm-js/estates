import * as I from 'infestines'

import {
  Sink,
  enqueueEffect,
  isVarying,
  subscribeOne,
  unsubscribeOne
} from './core'

class OnValue extends Sink {
  constructor(effect, sources) {
    super(sources)
    this.effect = effect
    subscribeOne(this)
  }
  unsubscribe() {
    this.sources = this.effect = unsubscribeOne(this)
  }
  next(value) {
    const effect = this.effect
    enqueueEffect(() => effect(value))
  }
  complete() {
    this.effect = undefined
  }
}

export const onValue = I.curry((effect, sources) => {
  if (isVarying(sources)) {
    return new OnValue(effect, sources)
  } else {
    effect(sources)
  }
})
