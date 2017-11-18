* Optimize `isConstant`

* `isVarying` -> `isConstant`

* Should unsubscribes be queued?

* Introduce something like `toReadOnly` / `protect`

* Try adding `flatMapLatest` as explicitly async

* Consider introducing `unsafeSubscribe` for callbacks that are guaranteed not
  to synchronously trigger property changes

* Consider renaming `on` and `onValue` to something that suggests they should be
  avoided.

* Freeze all constant template data in non-production builds

* Add `Error` to each property in non-production builds to allow for source
  location tracking

* Etrac
