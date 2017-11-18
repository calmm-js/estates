import * as I from 'infestines'
import * as L from 'partial.lenses'

import { Lift, Lift1 } from './lift'
import {
  Mutable,
  collectAssignments,
  isSettable,
  isVarying,
  propagateComplete,
  propagateNext,
  render
} from './core'

class StaticView extends Mutable {
  constructor(lens, data) {
    super(data)
    this.lens = lens
  }
  collectAssignments(value, assignments) {
    collectAssignments(
      this.sources,
      L.set(this.lens, value, render(this.sources)),
      assignments
    )
  }
  next(data) {
    propagateNext(L.get(this.lens, data), this)
  }
  complete() {
    this.lens = undefined
    propagateComplete(this)
  }
}

class DynamicView extends Mutable {
  constructor(lens, data) {
    super([lens, data])
  }
  collectAssignments(value, assignments) {
    collectAssignments(
      this.sources[1],
      L.set(render(this.sources[0]), value, render(this.sources[1])),
      assignments
    )
  }
  next(input) {
    propagateNext(L.get(input[0], input[1]), this)
  }
}

export const view = I.curry(
  (lens, data) =>
    isVarying(lens)
      ? isSettable(data)
        ? new DynamicView(lens, data)
        : new Lift(L.get, [lens, data])
      : isSettable(data)
        ? new StaticView(lens, data)
        : isVarying(data) ? new Lift1(L.get(lens), data) : L.get(lens, data)
)
