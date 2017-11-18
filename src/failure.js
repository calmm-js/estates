import { isInstanceOf } from './util'

export class Failure {
  constructor(reason) {
    this.reason = reason
  }
}

export const failure = reason => new Failure(reason)
export const isFailure = isInstanceOf(Failure)
export const reasonOf = failure => failure.reason
