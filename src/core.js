import * as I from 'infestines'

import * as U from './util'

//

const undetermined = I.freeze([])

//

let g_transaction = false
const g_nexts = []
const g_completes = []
const g_effects = []

//

const enqueue = pq => sink => {
  if (sink.link === null) {
    const level = levelOf(sink)
    if (pq.length < level) while (pq.push(undefined) < level);
    const next = pq[level]
    if (null === next) U.error('Bug.')
    sink.link = next
    pq[level] = sink
  }
}

const enqueueNext = enqueue(g_nexts)
export const enqueueComplete = enqueue(g_completes)
export const enqueueEffect = effect => g_effects.push(effect)

function drain(effect, pq) {
  for (let level = 0; level < pq.length; ++level) {
    let sinks = pq[level]
    pq[level] = null
    if (undefined !== sinks) {
      do {
        const sink = sinks
        sinks = sink.link
        sink.link = null
        effect(sink)
      } while (undefined !== sinks)
    }
  }
  pq.length = 0
}

//

function reduceUntilU(done, fn, bop, sum, sources) {
  if (isProperty(sources)) {
    if (done((sum = bop(sum, fn(sources))))) return sum
  } else if (I.isArray(sources)) {
    for (let i = 0, n = sources.length; i < n; ++i)
      if (done((sum = reduceUntilU(done, fn, bop, sum, sources[i])))) return sum
  } else if (I.isObject(sources)) {
    for (const k in sources)
      if (done((sum = reduceUntilU(done, fn, bop, sum, sources[k])))) return sum
  }
  return sum
}

const reduceUntil = I.curry((done, fn, bop, sum) => sources =>
  reduceUntilU(done, fn, bop, sum, sources)
)

const reduce = reduceUntil(I.always(false))

const everyU = (predicate, sources) =>
  reduceUntilU(U.not, predicate, I.sndU, true, sources)

const every = predicate => sources => everyU(predicate, sources)

const forEachU = (effect, sources) =>
  reduceUntilU(U.ignore, effect, I.sndU, undefined, sources)

//

export function map(fn, sources) {
  if (isProperty(sources)) {
    return fn(sources)
  } else if (I.isArray(sources)) {
    const n = sources.length
    let result = sources
    for (let i = 0; i < n; ++i) {
      const v = map(fn, sources[i])
      if (!I.identicalU(result[i], v)) {
        if (result === sources) result = sources.slice(0)
        result[i] = v
      }
    }
    return result
  } else if (I.isObject(sources)) {
    let result = sources
    for (const k in sources) {
      const v = map(fn, sources[k])
      if (!I.identicalU(result[k], v)) {
        if (result === sources) result = I.assign({}, result)
        result[k] = v
      }
    }
    return result
  } else {
    return sources
  }
}

//

export function collectAssignments(sources, value, assignments) {
  if (isMutable(sources)) {
    sources.collectAssignments(value, assignments)
  } else if (I.isArray(sources) && I.isArray(value)) {
    for (let i = 0, n = sources.length; i < n; ++i)
      collectAssignments(sources[i], value[i], assignments)
  } else if (I.isObject(sources) && I.isObject(value)) {
    for (const k in sources)
      collectAssignments(sources[k], value[k], assignments)
  } else if (
    !I.identicalU(isProperty(sources) ? valueOf(sources) : sources, value)
  ) {
    U.error('Mismatch between sources and written value.')
  }
}

//

export const isVarying = sources => undefined !== someProperty(sources)
export const isSettable = sources => undefined !== someMutable(sources)

//

export const render = sources => map(valueOf, sources)

//

const levelOf = sink => sink.info >> 2
const hasSingleSource = sink => sink.info & 2
const hasSources = sink => sink.info & 1

const markSourceless = sink => (sink.info &= ~3)

const maxLevelFromSources = reduce(levelOf, Math.max, -1)
const twoFromSources = reduceUntil(n => n === 2, I.always(1), U.addU, 0)

function infoFromSources(sources) {
  const l = maxLevelFromSources(sources) + 1
  const n = twoFromSources(sources)
  return (l << 2) | ((n === 1) << 1) | (n !== 0)
}

//

export class Sink {
  constructor(sources) {
    this.sources = sources
    this.info = infoFromSources(sources)
    this.link = null
  }
  next(_input) {}
  complete() {
    propagateComplete(this)
  }
  isConstant() {
    return everyU(isConstant, this.sources)
  }
}

export const isSink = U.isInstanceOf(Sink)

export const isConstant = property => property.isConstant()

//

function sinksForEach(effect, sinks) {
  if (isSink(sinks)) effect(sinks)
  else if (I.isArray(sinks)) sinks.forEach(effect)
}

export function sinksPush(into, sink) {
  const sinks = into.sinks
  if (undefined === sinks) {
    into.sinks = sink
    return 1
  } else if (isSink(sinks)) {
    into.sinks = [sinks, sink]
    return 2
  } else {
    return sinks.push(sink)
  }
}

//

export class Property extends Sink {
  constructor(sources) {
    super(sources)
    this.sinks = undefined
    this.value = undetermined
  }
}

const hasSubscribers = every(property => property.sinks)

function withSubscriber(fn, property) {
  if (hasSubscribers(property)) {
    return fn(property)
  } else {
    const sink = new Sink(property)
    subscribeOne(sink)
    const result = fn(property)
    unsubscribeOne(sink)
    return result
  }
}

export const get = property => withSubscriber(render, property)

export const isDetermined = every(property => property.value !== undetermined)

const isProperty = U.isInstanceOf(Property)

function valueOf(property) {
  const value = property.value
  return value !== undetermined ? value : undefined
}

//

export class Mutable extends Property {
  collectAssignments(_value, _assignments) {
    U.error('This method should never be called.')
  }
}

const isMutable = U.isInstanceOf(Mutable)

function setU(settable, value) {
  const assignments = new Map()
  collectAssignments(settable, value, assignments)
  setAll(assignments)
}

export const set = I.curry((settable, value) =>
  withSubscriber(settable => {
    setU(settable, value)
  }, settable)
)

export const modify = I.curry((settable, fn) =>
  withSubscriber(settable => {
    const value = render(settable)
    setU(settable, fn(value))
  }, settable)
)

//

const someProperty = reduceUntil(I.id, I.id, I.sndU, undefined)

const someMutable = reduceUntil(isMutable, I.id, I.sndU, undefined)

//

function next(sink) {
  const sources = sink.sources
  if (isDetermined(sources)) sink.next(render(sources))
}

function completeConstant(sink) {
  if (everyU(isConstant, sink.sources)) enqueueComplete(sink)
}

export function propagateComplete(sink) {
  const sinks = sink.sinks
  if (undefined !== sinks) {
    sink.sinks = undefined
    sinksForEach(completeConstant, sinks)
  }
}

function complete(sink) {
  unsubscribeOne(sink)
  sink.sources = undefined
  markSourceless(sink)
  sink.complete()
}

function executeEffects() {
  const effects = g_effects.slice(0).reverse()
  g_effects.length = 0

  while (effects.length) effects.pop()()
}

function transaction(effect) {
  if (g_transaction) {
    U.error('Side-effects are only allowed in `tap` and `on*` callbacks.')
  } else {
    g_transaction = true

    effect()

    drain(next, g_nexts)
    drain(complete, g_completes)

    g_transaction = false

    executeEffects()
  }
}

//

function propagateToSink(sink) {
  if (hasSingleSource(sink)) {
    if (sink.link === null) sink.next(render(sink.sources))
  } else {
    enqueueNext(sink)
  }
}

export function propagateNext(value, property) {
  if (!I.identicalU(property.value, value)) {
    property.value = value
    sinksForEach(propagateToSink, property.sinks)
  }
}

export function setAll(assignments) {
  transaction(() => {
    if (assignments instanceof Map) assignments.forEach(propagateNext)
    else propagateNext(assignments[1], assignments[0])
  })
}

export function setOne(property, value) {
  transaction(() => propagateNext(value, property))
}

export function setLast(property, value) {
  transaction(() => {
    enqueueComplete(property)
    propagateNext(value, property)
  })
}

//

function attachAll(sink) {
  forEachU(property => {
    const n = sinksPush(property, sink)
    if (property.isConstant()) {
      enqueueComplete(property)
    } else if (1 === n && hasSources(property)) {
      attachAll(property)
    }
  }, sink.sources)
  enqueueNext(sink)
}

export function subscribeOne(sink) {
  transaction(() => attachAll(sink))
}

//

export function unsubscribeOne(sink, depth = 0) {
  forEachU(source => {
    const sinks = source.sinks
    if (sinks === sink) {
      source.sinks = undefined
      unsubscribeOne(source, depth + 1)
    } else if (undefined !== sinks) {
      const i = sinks.lastIndexOf(sink)
      if (i !== -1) {
        const n = sinks.length - 1
        sinks[i] = sinks[n]
        if (n !== 1) sinks.length = n
        else source.sinks = sinks[0]
      }
    }
  }, sink.sources)
}
