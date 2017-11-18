import * as U from './util'

import { Mutable } from './core'

export class Variable extends Mutable {
  collectAssignments(value, assignments) {
    assignments.set(this, value)
  }
  isConstant() {
    return false
  }
  next(_value) {
    U.error('This method should never be called.')
  }
  complete() {
    U.error('This method should never be called.')
  }
}

export const variable = () => new Variable()
