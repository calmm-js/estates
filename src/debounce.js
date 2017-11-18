import * as I from 'infestines'

import { Property, propagateComplete, setLast, setOne } from './core'

class Debounce extends Property {
  constructor(ms, sources) {
    super(sources)
    this.ms = ms
    this.timeout = 0
  }
  next(value) {
    const timeout = this.timeout
    if (0 !== timeout) clearTimeout(timeout)
    this.timeout = setTimeout(() => {
      if (-1 === this.timeout) {
        setLast(this, value)
      } else {
        this.timeout = 0
        setOne(this, value)
      }
    })
  }
  complete() {
    const timeout = this.timeout
    this.timeout = -1
    if (0 === timeout) {
      propagateComplete(this)
    }
  }
}

// XXX debounce of constant
export const debounce = I.curry((ms, sources) => new Debounce(ms, sources))
