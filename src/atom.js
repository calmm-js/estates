import { Variable } from './variable'

class Atom extends Variable {
  constructor(value) {
    super()
    this.value = value
  }
}

export const atom = value => new Atom(value)
