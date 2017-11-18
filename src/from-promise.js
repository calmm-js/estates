import * as I from 'infestines'

import { failure } from './failure'
import { Property, isDetermined, setLast } from './core'

class FromPromise extends Property {
  constructor(promise) {
    super()
    const then = value => {
      setLast(this, value)
    }
    promise.then(then, I.pipe2U(failure, then))
  }
  isConstant() {
    return isDetermined(this)
  }
}

export const fromPromise = promise => new FromPromise(promise)
