import * as I from 'infestines'

import {
  Sink,
  enqueueEffect,
  isVarying,
  subscribeOne,
  unsubscribeOne
} from './core'

class On extends Sink {
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
    enqueueEffect(() => effect(value, 'next'))
  }
  complete() {
    const effect = this.effect
    this.effect = undefined
    enqueueEffect(() => effect(undefined, 'complete'))
  }
}

export const on = I.curry((effect, sources) => {
  if (isVarying(sources)) {
    return new On(effect, sources)
  } else {
    effect(sources, 'next')
    effect(undefined, 'complete')
  }
})
