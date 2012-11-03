"use strict";

var Stream = require("stream")
var accumulate = require("reducers/accumulate")
var emit = require("reducers/emit")
var close = require("reducers/close")
var end = require("reducers/end")
var isReduced = require("reducers/is-reduced")

var accumulator = "accumulator@" + module.id
var state = "state@" + module.id

emit.define(Stream, function(stream, value) {
  /**
  Emits a new `value` on stream. If stream is no longer writable
  return reduced to signal the source no value should be emitted.
  **/
  if (stream.writable === false) return reduced()
  if (value === end) return close(stream)
  stream.emit("data", value)
  return stream
})

close.define(Stream, function(stream, value) {
  /**
  Close a `stream` preventing new values from being emitted.
  Throws an exception if the signal is already closed.
  **/
  if (value) stream.emit("data", value)
  if (stream.close) stream.close()
  // Emit end and close events.
  stream.emit("end")
  stream.emit("close")

  return stream
})

// Define implementation of `accumulate` for node streams
// so that they can be reduced as any other data structures
// representing collections.
accumulate.define(Stream, function(stream, next, initial) {
  if (stream.readable === false) return next(end, initial)
  var result = initial
  var ended = false

  function onerror(error) {
    ended = true
    // If stream errors (or ends) pass it to a consumer along with an
    // accumulated result. If node streams error they are not guaranteed
    // to stop, they are like broken robots that may decide to take over the
    // world :D To make sure this does not takes over reducers error recovery
    // system we remove our listeners and try to kill it.
    stream.removeListener("data", ondata)
    stream.removeListener("end", onend)
    stream.removeListener("error", onerror)

    next(error, result)
  }

  // On end behaves exactly like on error with a difference that `end` of
  // collection is passed instead of an error.
  function onend() { onerror(end) }

  function ondata(data) {
    // Whenever there is a new chunk of data written into the stream,
    // accumulator function `next` is invoked with it and a accumulated
    // `result`.
    result = next(data, result)
    // If accumulator is done accumulating and no longer wishes to be called,
    // it returns value boxed as `reduced`. In reducers that intent
    // propagates all the way through to the actual data source which is
    // supposed to stop and clean up, for example close a file description
    // it's being reading data from. In case of node, some streams may have
    // `close` method to do that. Some streams may have `pause` but not the
    // `close` method. There for we try first pausing stream and then closing.
    // If non of the attempts will emit "end" event we give up and emit it
    // manually to trigger listeners removal pretending that stream was ended.
    if (isReduced(result)) {
      result = result.value
      if (stream.pause) stream.pause()
      if (stream.close) stream.close()
      if (!ended) stream.emit("end")
    }
  }

  // Finally hook up all the listeners to start reading.
  stream.on("error", onerror)
  stream.on("data", ondata)
  stream.once("end", onend)
})

module.exports = accumulate
