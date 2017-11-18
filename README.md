# <a id="estates"></a> [≡](#contents) Estates &middot; [![Gitter](https://img.shields.io/gitter/room/calmm-js/chat.js.svg)](https://gitter.im/calmm-js/chat) [![GitHub stars](https://img.shields.io/github/stars/calmm-js/estates.svg?style=social)](https://github.com/calmm-js/estates) [![npm](https://img.shields.io/npm/dm/estates.svg)](https://www.npmjs.com/package/estates)

WIP

[![npm version](https://badge.fury.io/js/estates.svg)](http://badge.fury.io/js/estates)
[![Build Status](https://travis-ci.org/calmm-js/estates.svg?branch=master)](https://travis-ci.org/calmm-js/estates)
[![Code Coverage](https://img.shields.io/codecov/c/github/calmm-js/estates/master.svg)](https://codecov.io/github/calmm-js/estates?branch=master)
[![](https://david-dm.org/calmm-js/estates.svg)](https://david-dm.org/calmm-js/estates)
[![](https://david-dm.org/calmm-js/estates/dev-status.svg)](https://david-dm.org/calmm-js/estates?type=dev)

## <a id="contents"></a> [≡](#contents) Contents

* [Tutorial](#tutorial)
* [Reference](#reference)
* [Algorithm](#algorithm)
* [Related work](#related-work)

## <a id="tutorial"></a> [≡](#contents) Tutorial

WIP

## <a id="reference"></a> [≡](#contents) Reference

WIP

## <a id="related-work"></a> [≡](#contents) Related Work

WIP

## <a id="algorithm"> [≡](#contents) Algorithm

The algorithm in Estates is basically:

```
transaction {
  perform subscriptions towards roots
    queue updates, completions, and side-effects
  perform updates towards leafs
    queue updates, completions, and side-effects
  perform completions towards leafs
    queue completions and side-effects
}
execute side-effects
```

All the phases within a transaction, namely *subscribe*, *update*, and
*complete*, are performed completely before going to the next phase.  Some
operations can be performed without queuing, such as updating a property that
only has a single source, but otherwise operations, specifically updates and
completions, are queued so that they are performed at most once during a phase.

Transactions cannot be nested.  An attempt to e.g. change the value of a
property, triggering an update phase, during a transaction raises a fatal error.
Potentially property changing side-effects, including user subscription
callbacks and taps, are executed after the transaction so that they can trigger
new transactions.

A disadvantage of having phases like this is that it will likely slow down
processing.  However, the main advantage of this approach is that the phases
have simple semantics and the update phase guarantees glitch-free updates to
applicative combinations of properties.

## <a id="motivation"></a> [≡](#contents) Motivation

Why do we need yet another library for observables?

### Properties over event streams

When observables were popularized by Rx, the primary mode of use of observables
was as streams of discrete events.  Here is a characteristic example:

```js
const count$ = plusOne$.merge(minusOne$).scan((x, y) => x + y, 0).startWith(0)
```

What is wrong with the above?

No, it is not that the `count$` stream is "cold", although that is usually a
mistake, too.

The root of the deeper problems, although not widely understood, is that the
`scan` operation introduces state.  Typically such state is local state and
highly problematic for reasons discussed by David Barbour in [Local State is
Poison](https://awelonblue.wordpress.com/2012/10/21/local-state-is-poison/).

Discrete event streams, by their very nature, require you to deal with time.  If
the above `count$` would be to track whether something has been selected, for
example, it would be necessary to make sure that `minusOne$` events are always
preceded by `plusOne$` events or the `count$` could go negative.

On the whole, as discussed by David Barbour in [Why Not
Events](https://awelonblue.wordpress.com/2012/07/01/why-not-events/), discrete
event streams introduce a lot of accidental complexity in the form of having to
meticulously handle timing considerations and having to laboriously gather all
the pieces of local state introduced by streams to form views of the current
state of a system.

A better approach is to avoid the use of event streams and state accumulators
and replace them with applicative stateless combinations of properties derived
from external state.  Unfortunately most observable libraries are primarily
designed to support programming with monadic event streams.  Estates, however,
is primarily designed to support programming with stateless applicative
properties:

* All combinators produce properties that recall their last emitted value.
* All operations implicitly skip successive identical values.
* Propagation algorithm provides simple
  [glitch](https://stackoverflow.com/questions/25139257/terminology-what-is-a-glitch-in-functional-reactive-programming-rx)
  freedom guarantees.
* Support for first-class decomposable and composable state is provided out of
  the box.

### Dead code elimination

Most JavaScript observable libraries, with the notable exception of
[Most](https://github.com/mostjs/core), today are not amenable to automatic dead
code elimination performed by minification tools such as UglifyJS and bundling
tools such as Rollup.  The problem is that most observable libraries put all of
their operations into the prototype chains of a few object constructors.  To
perform effective dead code elimination it would be necessary to perform whole
program analysis to determine which methods cannot possibly be invoked.  This is
difficult enough that none of the contemporary tools perform such an analysis.

OTOH, when a library uses only free-standing functions and ES modules, it is
possible to perform fairly effective dead code elimination simply by noting
which functions are directly referenced.  That is exactly what Estates does.
All operations on properties are free-standing functions and unused operations
can be dead code eliminated.

### Performance

Many of the early observable implementations paid little or no attention to
performance considerations.  They use significantly more memory and CPU time
than what is necessary.  Then
[Most](https://github.com/cujojs/most/tree/master/test/perf) came out and showed
that techniques such as stream
[fusion](http://mlton.org/pipermail/mlton-user/2007-April/001091.html) could
also work in JavaScript.  A goal for Estates is to minimize memory usage and
enable partial fusion.  Full fusion is likely to be more difficult to achieve in
Estates, because glitch freedom requires delaying recomputations at join points
in the dependency graph.  Nevertheless, it should be possible to achieve
significant performance advantages over previous implementations of observable
properties in JavaScript.

One of the advantages of using only free-standing functions is that it is
possible to avoid constructing new objects when dealing with constants.  In
Estates, constant values and nested objects and arrays possibly containing
properties are also considered properties.  In other words, there is no need for
a `constant` combinator nor for a `combineTemplate` combinator.  Also,
combinators are optimized so that when given constants as inputs, they produce
constants as outputs, if possible.  This optimization can reduce memory usage
significantly.

**Note** that at the moment this library is still very much in a drafting stage
and does not implement all planned optimizations.  Optimizations related to
space usage are actually mostly there, but CPU time optimizations, notably
allowing fusion of single source properties, has not yet been implemented.
