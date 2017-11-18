'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var I = require('infestines');
var L = require('partial.lenses');

var header = 'estates: ';

function error(message) {
  throw Error(header + message);
}

//

var addU = function addU(x, y) {
  return x + y;
};

var not = function not(x) {
  return !x;
};

var ignore = function ignore(_) {};

//

var isInstanceOf = function isInstanceOf(Class) {
  return function (x) {
    return x instanceof Class;
  };
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};



















var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

//

var undetermined = /*#__PURE__*/I.freeze([]);

//

var g_transaction = false;
var g_nexts = [];
var g_completes = [];
var g_effects = [];

//

var enqueue = function enqueue(pq) {
  return function (sink) {
    if (sink.link === null) {
      var level = levelOf(sink);
      if (pq.length < level) while (pq.push(undefined) < level) {}
      var _next = pq[level];
      if (null === _next) error('Bug.');
      sink.link = _next;
      pq[level] = sink;
    }
  };
};

var enqueueNext = /*#__PURE__*/enqueue(g_nexts);
var enqueueComplete = /*#__PURE__*/enqueue(g_completes);
var enqueueEffect = function enqueueEffect(effect) {
  return g_effects.push(effect);
};

function drain(effect, pq) {
  for (var level = 0; level < pq.length; ++level) {
    var sinks = pq[level];
    pq[level] = null;
    if (undefined !== sinks) {
      do {
        var sink = sinks;
        sinks = sink.link;
        sink.link = null;
        effect(sink);
      } while (undefined !== sinks);
    }
  }
  pq.length = 0;
}

//

function reduceUntilU(done, fn, bop, sum, sources) {
  if (isProperty(sources)) {
    if (done(sum = bop(sum, fn(sources)))) return sum;
  } else if (I.isArray(sources)) {
    for (var i = 0, n = sources.length; i < n; ++i) {
      if (done(sum = reduceUntilU(done, fn, bop, sum, sources[i]))) return sum;
    }
  } else if (I.isObject(sources)) {
    for (var k in sources) {
      if (done(sum = reduceUntilU(done, fn, bop, sum, sources[k]))) return sum;
    }
  }
  return sum;
}

var reduceUntil = /*#__PURE__*/I.curry(function (done, fn, bop, sum) {
  return function (sources) {
    return reduceUntilU(done, fn, bop, sum, sources);
  };
});

var reduce = /*#__PURE__*/reduceUntil( /*#__PURE__*/I.always(false));

var everyU = function everyU(predicate, sources) {
  return reduceUntilU(not, predicate, I.sndU, true, sources);
};

var every = function every(predicate) {
  return function (sources) {
    return everyU(predicate, sources);
  };
};

var forEachU = function forEachU(effect, sources) {
  return reduceUntilU(ignore, effect, I.sndU, undefined, sources);
};

//

function map(fn, sources) {
  if (isProperty(sources)) {
    return fn(sources);
  } else if (I.isArray(sources)) {
    var n = sources.length;
    var result = sources;
    for (var i = 0; i < n; ++i) {
      var v = map(fn, sources[i]);
      if (!I.identicalU(result[i], v)) {
        if (result === sources) result = sources.slice(0);
        result[i] = v;
      }
    }
    return result;
  } else if (I.isObject(sources)) {
    var _result = sources;
    for (var k in sources) {
      var _v = map(fn, sources[k]);
      if (!I.identicalU(_result[k], _v)) {
        if (_result === sources) _result = I.assign({}, _result);
        _result[k] = _v;
      }
    }
    return _result;
  } else {
    return sources;
  }
}

//

function collectAssignments(sources, value, assignments) {
  if (isMutable(sources)) {
    sources.collectAssignments(value, assignments);
  } else if (I.isArray(sources) && I.isArray(value)) {
    for (var i = 0, n = sources.length; i < n; ++i) {
      collectAssignments(sources[i], value[i], assignments);
    }
  } else if (I.isObject(sources) && I.isObject(value)) {
    for (var k in sources) {
      collectAssignments(sources[k], value[k], assignments);
    }
  } else if (!I.identicalU(isProperty(sources) ? valueOf(sources) : sources, value)) {
    error('Mismatch between sources and written value.');
  }
}

//

var isVarying = function isVarying(sources) {
  return undefined !== someProperty(sources);
};
var isSettable = function isSettable(sources) {
  return undefined !== someMutable(sources);
};

//

var render = function render(sources) {
  return map(valueOf, sources);
};

//

var levelOf = function levelOf(sink) {
  return sink.info >> 2;
};
var hasSingleSource = function hasSingleSource(sink) {
  return sink.info & 2;
};
var hasSources = function hasSources(sink) {
  return sink.info & 1;
};

var markSourceless = function markSourceless(sink) {
  return sink.info &= ~3;
};

var maxLevelFromSources = /*#__PURE__*/reduce(levelOf, Math.max, -1);
var twoFromSources = /*#__PURE__*/reduceUntil(function (n) {
  return n === 2;
}, /*#__PURE__*/I.always(1), addU, 0);

function infoFromSources(sources) {
  var l = maxLevelFromSources(sources) + 1;
  var n = twoFromSources(sources);
  return l << 2 | (n === 1) << 1 | n !== 0;
}

//

var Sink = /*#__PURE__*/function () {
  function Sink(sources) {
    classCallCheck(this, Sink);

    this.sources = sources;
    this.info = infoFromSources(sources);
    this.link = null;
  }

  createClass(Sink, [{
    key: 'next',
    value: function next(_input) {}
  }, {
    key: 'complete',
    value: function complete() {
      propagateComplete(this);
    }
  }, {
    key: 'isConstant',
    value: function isConstant() {
      return everyU(_isConstant, this.sources);
    }
  }]);
  return Sink;
}();

var isSink = /*#__PURE__*/isInstanceOf(Sink);

var _isConstant = function _isConstant(property) {
  return property.isConstant();
};

function sinksForEach(effect, sinks) {
  if (isSink(sinks)) effect(sinks);else if (I.isArray(sinks)) sinks.forEach(effect);
}

function sinksPush(into, sink) {
  var sinks = into.sinks;
  if (undefined === sinks) {
    into.sinks = sink;
    return 1;
  } else if (isSink(sinks)) {
    into.sinks = [sinks, sink];
    return 2;
  } else {
    return sinks.push(sink);
  }
}

//

var Property = /*#__PURE__*/function (_Sink) {
  inherits(Property, _Sink);

  function Property(sources) {
    classCallCheck(this, Property);

    var _this = possibleConstructorReturn(this, (Property.__proto__ || Object.getPrototypeOf(Property)).call(this, sources));

    _this.sinks = undefined;
    _this.value = undetermined;
    return _this;
  }

  return Property;
}(Sink);

var hasSubscribers = /*#__PURE__*/every(function (property) {
  return property.sinks;
});

function withSubscriber(fn, property) {
  if (hasSubscribers(property)) {
    return fn(property);
  } else {
    var sink = new Sink(property);
    subscribeOne(sink);
    var result = fn(property);
    unsubscribeOne(sink);
    return result;
  }
}

var get$1 = function get$$1(property) {
  return withSubscriber(render, property);
};

var isDetermined = /*#__PURE__*/every(function (property) {
  return property.value !== undetermined;
});

var isProperty = /*#__PURE__*/isInstanceOf(Property);

function valueOf(property) {
  var value = property.value;
  return value !== undetermined ? value : undefined;
}

//

var Mutable = /*#__PURE__*/function (_Property) {
  inherits(Mutable, _Property);

  function Mutable() {
    classCallCheck(this, Mutable);
    return possibleConstructorReturn(this, (Mutable.__proto__ || Object.getPrototypeOf(Mutable)).apply(this, arguments));
  }

  createClass(Mutable, [{
    key: 'collectAssignments',
    value: function collectAssignments(_value, _assignments) {
      error('This method should never be called.');
    }
  }]);
  return Mutable;
}(Property);

var isMutable = /*#__PURE__*/isInstanceOf(Mutable);

function setU(settable, value) {
  var assignments = new Map();
  collectAssignments(settable, value, assignments);
  setAll(assignments);
}

var set$1 = /*#__PURE__*/I.curry(function (settable, value) {
  return withSubscriber(function (settable) {
    setU(settable, value);
  }, settable);
});

var modify = /*#__PURE__*/I.curry(function (settable, fn) {
  return withSubscriber(function (settable) {
    var value = render(settable);
    setU(settable, fn(value));
  }, settable);
});

//

var someProperty = /*#__PURE__*/reduceUntil(I.id, I.id, I.sndU, undefined);

var someMutable = /*#__PURE__*/reduceUntil(isMutable, I.id, I.sndU, undefined);

//

function next(sink) {
  var sources = sink.sources;
  if (isDetermined(sources)) sink.next(render(sources));
}

function completeConstant(sink) {
  if (everyU(_isConstant, sink.sources)) enqueueComplete(sink);
}

function propagateComplete(sink) {
  var sinks = sink.sinks;
  if (undefined !== sinks) {
    sink.sinks = undefined;
    sinksForEach(completeConstant, sinks);
  }
}

function complete(sink) {
  unsubscribeOne(sink);
  sink.sources = undefined;
  markSourceless(sink);
  sink.complete();
}

function executeEffects() {
  var effects = g_effects.slice(0).reverse();
  g_effects.length = 0;

  while (effects.length) {
    effects.pop()();
  }
}

function transaction(effect) {
  if (g_transaction) {
    error('Side-effects are only allowed in `tap` and `on*` callbacks.');
  } else {
    g_transaction = true;

    effect();

    drain(next, g_nexts);
    drain(complete, g_completes);

    g_transaction = false;

    executeEffects();
  }
}

//

function propagateToSink(sink) {
  if (hasSingleSource(sink)) {
    if (sink.link === null) sink.next(render(sink.sources));
  } else {
    enqueueNext(sink);
  }
}

function propagateNext(value, property) {
  if (!I.identicalU(property.value, value)) {
    property.value = value;
    sinksForEach(propagateToSink, property.sinks);
  }
}

function setAll(assignments) {
  transaction(function () {
    if (assignments instanceof Map) assignments.forEach(propagateNext);else propagateNext(assignments[1], assignments[0]);
  });
}

function setOne(property, value) {
  transaction(function () {
    return propagateNext(value, property);
  });
}

function setLast(property, value) {
  transaction(function () {
    enqueueComplete(property);
    propagateNext(value, property);
  });
}

//

function attachAll(sink) {
  forEachU(function (property) {
    var n = sinksPush(property, sink);
    if (property.isConstant()) {
      enqueueComplete(property);
    } else if (1 === n && hasSources(property)) {
      attachAll(property);
    }
  }, sink.sources);
  enqueueNext(sink);
}

function subscribeOne(sink) {
  transaction(function () {
    return attachAll(sink);
  });
}

//

function unsubscribeOne(sink) {
  var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  forEachU(function (source) {
    var sinks = source.sinks;
    if (sinks === sink) {
      source.sinks = undefined;
      unsubscribeOne(source, depth + 1);
    } else if (undefined !== sinks) {
      var i = sinks.lastIndexOf(sink);
      if (i !== -1) {
        var n = sinks.length - 1;
        sinks[i] = sinks[n];
        if (n !== 1) sinks.length = n;else source.sinks = sinks[0];
      }
    }
  }, sink.sources);
}

var Variable = /*#__PURE__*/function (_Mutable) {
  inherits(Variable, _Mutable);

  function Variable() {
    classCallCheck(this, Variable);
    return possibleConstructorReturn(this, (Variable.__proto__ || Object.getPrototypeOf(Variable)).apply(this, arguments));
  }

  createClass(Variable, [{
    key: 'collectAssignments',
    value: function collectAssignments$$1(value, assignments) {
      assignments.set(this, value);
    }
  }, {
    key: 'isConstant',
    value: function isConstant() {
      return false;
    }
  }, {
    key: 'next',
    value: function next(_value) {
      error('This method should never be called.');
    }
  }, {
    key: 'complete',
    value: function complete() {
      error('This method should never be called.');
    }
  }]);
  return Variable;
}(Mutable);

var variable = function variable() {
  return new Variable();
};

var Atom = /*#__PURE__*/function (_Variable) {
  inherits(Atom, _Variable);

  function Atom(value) {
    classCallCheck(this, Atom);

    var _this = possibleConstructorReturn(this, (Atom.__proto__ || Object.getPrototypeOf(Atom)).call(this));

    _this.value = value;
    return _this;
  }

  return Atom;
}(Variable);

var atom = function atom(value) {
  return new Atom(value);
};

var Debounce = /*#__PURE__*/function (_Property) {
  inherits(Debounce, _Property);

  function Debounce(ms, sources) {
    classCallCheck(this, Debounce);

    var _this = possibleConstructorReturn(this, (Debounce.__proto__ || Object.getPrototypeOf(Debounce)).call(this, sources));

    _this.ms = ms;
    _this.timeout = 0;
    return _this;
  }

  createClass(Debounce, [{
    key: 'next',
    value: function next(value) {
      var _this2 = this;

      var timeout = this.timeout;
      if (0 !== timeout) clearTimeout(timeout);
      this.timeout = setTimeout(function () {
        if (-1 === _this2.timeout) {
          setLast(_this2, value);
        } else {
          _this2.timeout = 0;
          setOne(_this2, value);
        }
      });
    }
  }, {
    key: 'complete',
    value: function complete() {
      var timeout = this.timeout;
      this.timeout = -1;
      if (0 === timeout) {
        propagateComplete(this);
      }
    }
  }]);
  return Debounce;
}(Property);

// XXX debounce of constant


var debounce = /*#__PURE__*/I.curry(function (ms, sources) {
  return new Debounce(ms, sources);
});

var Failure = function Failure(reason) {
  classCallCheck(this, Failure);

  this.reason = reason;
};

var failure = function failure(reason) {
  return new Failure(reason);
};
var isFailure = /*#__PURE__*/isInstanceOf(Failure);
var reasonOf = function reasonOf(failure) {
  return failure.reason;
};

var FromPromise = /*#__PURE__*/function (_Property) {
  inherits(FromPromise, _Property);

  function FromPromise(promise) {
    classCallCheck(this, FromPromise);

    var _this = possibleConstructorReturn(this, (FromPromise.__proto__ || Object.getPrototypeOf(FromPromise)).call(this));

    var then = function then(value) {
      setLast(_this, value);
    };
    promise.then(then, I.pipe2U(failure, then));
    return _this;
  }

  createClass(FromPromise, [{
    key: 'isConstant',
    value: function isConstant() {
      return isDetermined(this);
    }
  }]);
  return FromPromise;
}(Property);

var fromPromise = function fromPromise(promise) {
  return new FromPromise(promise);
};

var Lift = /*#__PURE__*/function (_Property) {
  inherits(Lift, _Property);

  function Lift(fn, args) {
    classCallCheck(this, Lift);

    var _this = possibleConstructorReturn(this, (Lift.__proto__ || Object.getPrototypeOf(Lift)).call(this, args));

    _this.fn = fn;
    return _this;
  }

  createClass(Lift, [{
    key: 'next',
    value: function next(args) {
      propagateNext(this.fn.apply(this, toConsumableArray(args)), this);
    }
  }, {
    key: 'complete',
    value: function complete() {
      this.fn = undefined;
      propagateComplete(this);
    }
  }]);
  return Lift;
}(Property);

var Lift1 = /*#__PURE__*/function (_Lift) {
  inherits(Lift1, _Lift);

  function Lift1() {
    classCallCheck(this, Lift1);
    return possibleConstructorReturn(this, (Lift1.__proto__ || Object.getPrototypeOf(Lift1)).apply(this, arguments));
  }

  createClass(Lift1, [{
    key: 'next',
    value: function next(arg) {
      propagateNext(this.fn(arg), this);
    }
  }]);
  return Lift1;
}(Lift);

var lift = function lift(fn) {
  var n = fn.length;
  switch (n) {
    case 0:
      return fn;
    case 1:
      return function (arg) {
        return isVarying(arg) ? new Lift1(fn, arg) : fn(arg);
      };
    default:
      return I.arityN(n, function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return isVarying(args) ? new Lift(fn, args) : fn.apply(undefined, args);
      });
  }
};

var map$1 = /*#__PURE__*/I.curry(function (fn, arg) {
  return isVarying(arg) ? new Lift1(fn, arg) : fn(arg);
});

var On = /*#__PURE__*/function (_Sink) {
  inherits(On, _Sink);

  function On(effect, sources) {
    classCallCheck(this, On);

    var _this = possibleConstructorReturn(this, (On.__proto__ || Object.getPrototypeOf(On)).call(this, sources));

    _this.effect = effect;
    subscribeOne(_this);
    return _this;
  }

  createClass(On, [{
    key: 'unsubscribe',
    value: function unsubscribe() {
      this.sources = this.effect = unsubscribeOne(this);
    }
  }, {
    key: 'next',
    value: function next(value) {
      var effect = this.effect;
      enqueueEffect(function () {
        return effect(value, 'next');
      });
    }
  }, {
    key: 'complete',
    value: function complete() {
      var effect = this.effect;
      this.effect = undefined;
      enqueueEffect(function () {
        return effect(undefined, 'complete');
      });
    }
  }]);
  return On;
}(Sink);

var on = /*#__PURE__*/I.curry(function (effect, sources) {
  if (isVarying(sources)) {
    return new On(effect, sources);
  } else {
    effect(sources, 'next');
    effect(undefined, 'complete');
  }
});

var OnValue = /*#__PURE__*/function (_Sink) {
  inherits(OnValue, _Sink);

  function OnValue(effect, sources) {
    classCallCheck(this, OnValue);

    var _this = possibleConstructorReturn(this, (OnValue.__proto__ || Object.getPrototypeOf(OnValue)).call(this, sources));

    _this.effect = effect;
    subscribeOne(_this);
    return _this;
  }

  createClass(OnValue, [{
    key: 'unsubscribe',
    value: function unsubscribe() {
      this.sources = this.effect = unsubscribeOne(this);
    }
  }, {
    key: 'next',
    value: function next(value) {
      var effect = this.effect;
      enqueueEffect(function () {
        return effect(value);
      });
    }
  }, {
    key: 'complete',
    value: function complete() {
      this.effect = undefined;
    }
  }]);
  return OnValue;
}(Sink);

var onValue = /*#__PURE__*/I.curry(function (effect, sources) {
  if (isVarying(sources)) {
    return new OnValue(effect, sources);
  } else {
    effect(sources);
  }
});

var SkipFirst = /*#__PURE__*/function (_Property) {
  inherits(SkipFirst, _Property);

  function SkipFirst(n, sources) {
    classCallCheck(this, SkipFirst);

    var _this = possibleConstructorReturn(this, (SkipFirst.__proto__ || Object.getPrototypeOf(SkipFirst)).call(this, sources));

    _this.n = n;
    return _this;
  }

  createClass(SkipFirst, [{
    key: 'next',
    value: function next(value) {
      var n = this.n;
      if (0 < n) {
        this.n = n - 1;
      } else {
        propagateNext(value, this);
      }
    }
  }]);
  return SkipFirst;
}(Property);

// XXX n > 0, sources = constant   =>   Never


var skipFirst = /*#__PURE__*/I.curry(function (n, sources) {
  return n <= 0 ? sources : new SkipFirst(n, sources);
});

var SkipUnless = /*#__PURE__*/function (_Property) {
  inherits(SkipUnless, _Property);

  function SkipUnless(predicate, sources) {
    classCallCheck(this, SkipUnless);

    var _this = possibleConstructorReturn(this, (SkipUnless.__proto__ || Object.getPrototypeOf(SkipUnless)).call(this, sources));

    _this.predicate = predicate;
    return _this;
  }

  createClass(SkipUnless, [{
    key: 'next',
    value: function next(value) {
      if (this.predicate(value)) propagateNext(value, this);
    }
  }, {
    key: 'complete',
    value: function complete() {
      this.predicate = undefined;
      propagateComplete(this);
    }
  }]);
  return SkipUnless;
}(Property);

var skipUnless = /*#__PURE__*/I.curry(function (predicate, sources) {
  return new SkipUnless(predicate, sources);
});

var TakeFirst = /*#__PURE__*/function (_Property) {
  inherits(TakeFirst, _Property);

  function TakeFirst(n, sources) {
    classCallCheck(this, TakeFirst);

    var _this = possibleConstructorReturn(this, (TakeFirst.__proto__ || Object.getPrototypeOf(TakeFirst)).call(this, sources));

    _this.n = n;
    return _this;
  }

  createClass(TakeFirst, [{
    key: 'next',
    value: function next(value) {
      propagateNext(value, this);
      var n = this.n;
      if (0 === n || 0 === (this.n = n - 1)) enqueueComplete(this);
    }
  }]);
  return TakeFirst;
}(Property);

var takeFirst = /*#__PURE__*/I.curry(function (n, sources) {
  return isVarying(sources) ? new TakeFirst(Math.max(0, n), sources) : sources;
});

var Tap = /*#__PURE__*/function (_Property) {
  inherits(Tap, _Property);

  function Tap(effect, sources) {
    classCallCheck(this, Tap);

    var _this = possibleConstructorReturn(this, (Tap.__proto__ || Object.getPrototypeOf(Tap)).call(this, sources));

    _this.effect = effect;
    return _this;
  }

  createClass(Tap, [{
    key: 'next',
    value: function next(value) {
      var effect = this.effect;
      propagateNext(value, this);
      enqueueEffect(function () {
        return effect(value);
      });
    }
  }, {
    key: 'complete',
    value: function complete() {
      this.effect = undefined;
      propagateComplete(this);
    }
  }]);
  return Tap;
}(Property);

var tap = /*#__PURE__*/I.curry(function (effect, sources) {
  if (isVarying(sources)) {
    return new Tap(effect, sources);
  } else {
    effect(sources);
    return sources;
  }
});

var unsubscribe = function unsubscribe(x) {
  if (undefined !== x) x.unsubscribe();
};

var StaticView = /*#__PURE__*/function (_Mutable) {
  inherits(StaticView, _Mutable);

  function StaticView(lens, data) {
    classCallCheck(this, StaticView);

    var _this = possibleConstructorReturn(this, (StaticView.__proto__ || Object.getPrototypeOf(StaticView)).call(this, data));

    _this.lens = lens;
    return _this;
  }

  createClass(StaticView, [{
    key: 'collectAssignments',
    value: function collectAssignments$$1(value, assignments) {
      collectAssignments(this.sources, L.set(this.lens, value, render(this.sources)), assignments);
    }
  }, {
    key: 'next',
    value: function next(data) {
      propagateNext(L.get(this.lens, data), this);
    }
  }, {
    key: 'complete',
    value: function complete() {
      this.lens = undefined;
      propagateComplete(this);
    }
  }]);
  return StaticView;
}(Mutable);

var DynamicView = /*#__PURE__*/function (_Mutable2) {
  inherits(DynamicView, _Mutable2);

  function DynamicView(lens, data) {
    classCallCheck(this, DynamicView);
    return possibleConstructorReturn(this, (DynamicView.__proto__ || Object.getPrototypeOf(DynamicView)).call(this, [lens, data]));
  }

  createClass(DynamicView, [{
    key: 'collectAssignments',
    value: function collectAssignments$$1(value, assignments) {
      collectAssignments(this.sources[1], L.set(render(this.sources[0]), value, render(this.sources[1])), assignments);
    }
  }, {
    key: 'next',
    value: function next(input) {
      propagateNext(L.get(input[0], input[1]), this);
    }
  }]);
  return DynamicView;
}(Mutable);

var view = /*#__PURE__*/I.curry(function (lens, data) {
  return isVarying(lens) ? isSettable(data) ? new DynamicView(lens, data) : new Lift(L.get, [lens, data]) : isSettable(data) ? new StaticView(lens, data) : isVarying(data) ? new Lift1(L.get(lens), data) : L.get(lens, data);
});

exports.atom = atom;
exports.debounce = debounce;
exports.failure = failure;
exports.fromPromise = fromPromise;
exports.get = get$1;
exports.isDetermined = isDetermined;
exports.isFailure = isFailure;
exports.isSettable = isSettable;
exports.isVarying = isVarying;
exports.lift = lift;
exports.map = map$1;
exports.modify = modify;
exports.on = on;
exports.onValue = onValue;
exports.reasonOf = reasonOf;
exports.set = set$1;
exports.skipFirst = skipFirst;
exports.skipUnless = skipUnless;
exports.takeFirst = takeFirst;
exports.tap = tap;
exports.unsubscribe = unsubscribe;
exports.variable = variable;
exports.view = view;
