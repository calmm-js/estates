import * as I from 'infestines'
import * as L from 'partial.lenses'
import * as R from 'ramda'

import * as E from '../dist/estates.cjs'

function capture(property) {
  const events = []
  E.on((v, k) => events.push([v, k]), property)
  return events
}

function show(x) {
  switch (typeof x) {
    case 'string':
    case 'object':
      return JSON.stringify(x)
    default:
      return `${x}`
  }
}

function testEq(exprIn, expect) {
  const expr = exprIn.replace(/[ \n]+/g, ' ')
  it(`${expr} => ${show(expect)}`, () => {
    let n = 0
    let done = 0
    new Promise((fulfill, reject) => {
      function fail(msg) {
        if (!done++) {
          reject(Error(msg))
        } else {
          console.log(`\n*** ${msg}\n`)
        }
      }
      function success() {
        if (!done++) {
          fulfill()
        } else {
          console.log('\n*** Double success?\n')
        }
      }
      return I.seq(
        eval(`() => ${expr}`)(E, I, L, R, capture),
        E.takeFirst(1),
        E.on((actual, kind) => {
          n += 1
          switch (kind) {
            case 'next':
              if (n !== 1) {
                fail(`next triggered more than once`)
              } else if (!I.acyclicEqualsU(actual, expect) && !done++) {
                fail(`Expected: ${show(expect)}, actual: ${show(actual)}`)
              }
              break
            case 'complete':
              if (n !== 2) {
                fail(`complete not triggered second`)
              } else {
                success()
              }
              break
            default:
              fail(`Invalid event '${kind}'`)
          }
        })
      )
    })
  })
}

describe('estates', () => {
  testEq(
    `{ const events = []
     ; E.onValue(v => events.push(v), 42)
     ; return events }`,
    [42]
  )

  testEq(
    `{ const x = E.atom(1)
     ; const events = []
     ; E.onValue(v => events.push(v), E.takeFirst(3, x))
     ; E.modify(x, R.inc)
     ; E.modify(x, R.inc)
     ; E.modify(x, R.inc)
     ; return events }`,
    [1, 2, 3]
  )

  testEq(
    `{ const x = 101
     ; const events = capture(x)
     ; return events }`,
    [[101, 'next'], [undefined, 'complete']]
  )

  testEq(
    `{ const x = E.atom(42)
     ; const events = capture({x, z: 1})
     ; return events }`,
    [[{ x: 42, z: 1 }, 'next']]
  )

  testEq(
    `{ const x = E.atom(1)
     ; const y = E.atom(2)
     ; return {x, y: [y], z: [3]} }`,
    { x: 1, y: [2], z: [3] }
  )

  testEq(
    `{ const x = E.atom(1)
     ; const y = E.atom(2)
     ; const events = capture({x, y})
     ; E.set(x, -1)
     ; E.set(y, -2)
     ; E.set(x, -1)
     ; E.modify({x, y}, L.modify(L.values, R.negate))
     ; return events }`,
    [
      [{ x: 1, y: 2 }, 'next'],
      [{ x: -1, y: 2 }, 'next'],
      [{ x: -1, y: -2 }, 'next'],
      [{ x: 1, y: 2 }, 'next']
    ]
  )

  testEq(
    `{ const x = E.atom(42)
     ; const events = capture({x, z: x})
     ; E.set(x, 101)
     ; return events }`,
    [[{ x: 42, z: 42 }, 'next'], [{ x: 101, z: 101 }, 'next']]
  )

  testEq(
    `{ const x = E.atom(1)
     ; return E.map(R.inc, E.takeFirst(1, x)) }`,
    2
  )

  testEq(
    `{ const x = E.atom(1)
     ; return E.lift(R.inc)(x) }`,
    2
  )

  testEq(`E.lift(() => 42)()`, 42)

  testEq(`E.reasonOf(E.failure('foo'))`, 'foo')

  testEq(
    `{ const o = E.atom({x: 1})
     ; const x = E.view(E.atom('x'), o)
     ; const events = capture(x)
     ; E.set(o, {x: -1})
     ; E.set({x}, {x: 2})
     ; E.modify({x}, L.modify('x', R.inc))
     ; return [E.get(o), E.get(x), events] }`,
    [{ x: 3 }, 3, [[1, 'next'], [-1, 'next'], [2, 'next'], [3, 'next']]]
  )

  testEq(
    `{ const o = E.atom({x: 1})
     ; const x = E.view(E.atom('x'), o)
     ; const events = capture(o)
     ; E.set(o, {x: -1})
     ; E.set({x}, {x: 2})
     ; E.modify({x}, L.modify('x', R.inc))
     ; return E.lift((x, y, z) => [x, y, z])(o, x, events) }`,
    [
      { x: 3 },
      3,
      [
        [{ x: 1 }, 'next'],
        [{ x: -1 }, 'next'],
        [{ x: 2 }, 'next'],
        [{ x: 3 }, 'next']
      ]
    ]
  )

  testEq(
    `{ const o = E.atom({x: 1})
     ; const x = E.view('x', o)
     ; const events = capture(x)
     ; E.set(o, {x: -1})
     ; E.set(x, 2)
     ; E.modify(x, R.inc)
     ; return [E.get(o), E.get(x), events] }`,
    [{ x: 3 }, 3, [[1, 'next'], [-1, 'next'], [2, 'next'], [3, 'next']]]
  )

  testEq(
    `{ const o = E.atom({x: 1})
     ; const x = E.view('x', o)
     ; const events = capture(x)
     ; E.set(o, {x: -1})
     ; E.set(x, 2)
     ; E.modify(x, R.inc)
     ; return [o, x, events] }`,
    [{ x: 3 }, 3, [[1, 'next'], [-1, 'next'], [2, 'next'], [3, 'next']]]
  )

  testEq(
    `{ const x = E.variable()
     ; const events = []
     ; const s = I.seq(
         x,
         E.takeFirst(1),
         E.on((v, k) => events.push([v, k]))
       )
     ; E.modify(x, x => x === undefined)
     ; E.set(x, 3)
     ; E.unsubscribe(s)
     ; return events }`,
    [[true, 'next'], [undefined, 'complete']]
  )

  testEq(
    `{ const x = E.atom(1)
     ; const events = []
     ; const s = I.seq(
         x,
         E.takeFirst(2),
         E.on((v, k) => events.push([v, k]))
       )
     ; E.modify(x, x => x + 1)
     ; E.set(x, 3)
     ; E.unsubscribe(s)
     ; return events }`,
    [[1, 'next'], [2, 'next'], [undefined, 'complete']]
  )

  testEq(
    `{ const x = E.atom(1)
     ; const p = E.skipUnless(R.lt(0), E.takeFirst(3, x))
     ; const events = capture(p)
     ; E.set(x, -2)
     ; E.modify(x, R.negate)
     ; return events }`,
    [[1, 'next'], [2, 'next'], [undefined, 'complete']]
  )

  testEq(
    `{ const x = E.atom(1)
     ; let s = 0
     ; const sub = E.onValue(x => s += x, x)
     ; E.set(x, 2)
     ; E.set(x, 3)
     ; E.unsubscribe(sub)
     ; E.set([x, 42], [4, 42])
     ; E.unsubscribe(sub)
     ; E.set(x, 5)
     ; return [E.get(x), s] }`,
    [5, 6]
  )

  testEq(
    `{ const events = []
     ; const sub = E.on((v, k) => events.push([v, k]), 101)
     ; E.unsubscribe(sub)
     ; E.unsubscribe(sub)
     ; return events }`,
    [[101, 'next'], [undefined, 'complete']]
  )

  testEq(
    `{ const x = E.variable()
     ; const events = capture(x)
     ; return events }`,
    []
  )

  testEq(
    `{ const x = E.variable()
     ; const events = capture(x)
     ; E.set(x, 101)
     ; return events }`,
    [[101, 'next']]
  )

  testEq(
    `{ const answer = E.fromPromise(
         new Promise(resolve =>
           setTimeout(() => resolve(42), 0)))
     ; const events = capture(answer)
     ; const later = E.fromPromise(
         new Promise(resolve =>
           setTimeout(() => resolve(events), 10)))
     ; return {answer, events: later} }`,
    { answer: 42, events: [[42, 'next'], [undefined, 'complete']] }
  )

  testEq(
    `{ const x = E.atom(1)
     ; const y = E.skipFirst(2, x)
     ; const events = capture(y)
     ; const y1 = E.get(y)
     ; E.modify(x, R.inc)
     ; const y2 = E.get(y)
     ; E.modify(x, R.inc)
     ; const y3 = E.get(y)
     ; E.modify(x, R.inc)
     ; return [y1, y2, y3, events] }`,
    [undefined, undefined, 3, [[3, 'next'], [4, 'next']]]
  )

  testEq(
    `{ const x = E.atom(1)
     ; const y = E.debounce(10, E.takeFirst(3, x))
     ; const events = capture(y)
     ; E.modify(x, R.inc)
     ; E.modify(x, R.inc)
     ; E.modify(x, R.inc)
     ; return E.map(v => [v, events], E.debounce(20, 0)) }`,
    [0, [[3, 'next']]]
  )

  testEq(
    `{ const x = E.atom(1)
     ; const events0 = capture(x)
     ; const y = E.map(R.negate, E.takeFirst(2, x))
     ; const events1 = capture(y)
     ; E.modify(x, R.inc)
     ; E.modify(x, R.inc)
     ; const events2 = capture(y)
     ; E.modify(x, R.inc)
     ; return [events0, events1, events2] }`,
    [
      [[1, 'next'], [2, 'next'], [3, 'next'], [4, 'next']],
      [[-1, 'next'], [-2, 'next'], [undefined, 'complete']],
      [[-2, 'next'], [undefined, 'complete']]
    ]
  )

  testEq(
    `{ let x = 1
     ; const y = E.tap(v => x += v, 2)
     ; return [x, y] }`,
    [3, 2]
  )

  testEq(
    `{ const x = E.atom(0)
     ; const y = E.tap(v => { if (v & 1) E.set(x, v+1) }, E.takeFirst(3, x))
     ; const events = capture(y)
     ; E.modify(x, R.inc)
     ; E.modify(x, R.inc)
     ; return events }`,
    [[0, 'next'], [1, 'next'], [2, 'next'], [undefined, 'complete']]
  )

  testEq(
    `{ const x = E.debounce(10, E.atom(76))
     ; return [x, E.debounce(5, x), E.debounce(20, x)] }`,
    [76, 76, 76]
  )
})
