import * as I from 'infestines'

import { Property, isVarying, propagateComplete, propagateNext } from './core'

export class Lift extends Property {
  constructor(fn, args) {
    super(args)
    this.fn = fn
  }
  next(args) {
    propagateNext(this.fn(...args), this)
  }
  complete() {
    this.fn = undefined
    propagateComplete(this)
  }
}

export class Lift1 extends Lift {
  next(arg) {
    propagateNext(this.fn(arg), this)
  }
}

export const lift = fn => {
  const n = fn.length
  switch (n) {
    case 0:
      return fn
    case 1:
      return arg => (isVarying(arg) ? new Lift1(fn, arg) : fn(arg))
    default:
      return I.arityN(
        n,
        (...args) => (isVarying(args) ? new Lift(fn, args) : fn(...args))
      )
  }
}

export const map = I.curry(
  (fn, arg) => (isVarying(arg) ? new Lift1(fn, arg) : fn(arg))
)
