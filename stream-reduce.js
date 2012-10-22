/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false globalstrict: true*/

"use strict";

var Stream = require("stream")
var accumulate = require("reducers/accumulate")
var emit = require("reducers/emit")
var close = require("reducers/close")
var end = require("reducers/end")
var accumulated = require("reducers/accumulated")
var error = require("reducers/error")

var accumulator = "accumulator@" + module.id
var state = "state@" + module.id

emit.define(Stream, function(stream, value) {
  if (stream.writable === false) throw Error("Can't emit on nonwritable stream")
  stream.emit("data", value)
  return stream
})

close.define(Stream, function(stream, value) {
  if (value) stream.emit("data", value)
  if (stream.close) stream.close()
  stream.emit("end")
  stream.emit("close")
  return stream
})

// Define implementation of `accumulate` for node streams
// so that they can be reduced as any other data structures
// representing collections.
accumulate.define(Stream, function(stream, next, initial) {
  if (stream.readable === false) throw Error("Can reduce unreadable stream")
  var result = initial
  var ended = false

  function onerror(exception) {
    // If stream errors, then it's broken and there is not much we can
    // do other then propagate it through. But node streams are not guaranteed
    // to stop after errors, they are like broken robots that may decide to
    // take over the world :) To make sure this does not takes over reducers
    // error recovery system we remove our listeners and try to kill it.
    stream.removeListener("data")
    stream.removeListener("end")
    stream.removeListener("error")
    // Reducers box values to indicate their intent, this also allows writing
    // transformation functions that don't propagate values with a certain
    // intents they don't deal with. `error` boxing function is used to wrap
    // exception to indicate the error in the source being reduced.
    next(error(exception), result)
  }

  function ondata(data) {
    // Whenever there is a new chunk of data written into the stream,
    // accumulator function `next` is invoked with it and a accumulated
    // `result`.
    result = next(data, result)
    // If accumulator is done accumulating and no longer wishes to be called,
    // it returns value boxed as `accumulated`. In reducers that intent
    // propagates all the way through to the actual data source which is
    // supposed to stop and clean up, for example close a file description
    // it's being reading data from. In case of node, some streams may have
    // `close` method to do that. Some streams may have `pause` but not the
    // `close` method. There for we try first pausing stream and then closing.
    // If all the above attempts don't end up calling an "end" event we give
    // up and pretend that this happened by cleaning up listeners and by
    // cheating accumulator stream is ended.
    if (result && result.is === accumulated) {
      if (stream.pause) stream.pause()
      if (stream.close) stream.close()
    }
  }

  function onend() {
    // Once stream is ended we cleanup all the listeners so they don't leak
    // and notify accumulator that stream is ended.
    stream.removeListener("data", ondata)
    stream.removeListener("error", onerror)
    next(end(result), result)
  }

  // Finally hook up all the listeners to start reading.
  stream.on("error", onerror)
  stream.on("data", ondata)
  stream.once("end", onend)
  return stream
})

module.exports = accumulate
