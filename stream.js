"use strict";

var Stream = require("stream")

var reduce = require("reducible/reduce")
var end = require("reducible/end")
var isReduced = require("reducible/is-reduced")
var WriteStream = require("write-stream")

var accumulator = "accumulator@" + module.id
var state = "state@" + module.id

// Define implementation of `accumulate` for node streams
// so that they can be reduced as any other data structures
// representing collections.
reduce.define(Stream, function(stream, next, initial) {
  console.log("reducing")
  var result = initial
  var ended = false

  function onerror(error) {
    ended = true
    // If stream errors (or ends) pass it to a consumer along with an
    // accumulated result. If node streams error they are not guaranteed
    // to stop, they are like broken robots that may decide to take over the
    // world :D To make sure this does not takes over reducers error recovery
    // system we remove our listeners and try to kill it.
    stream.removeListener("end", onend)
    stream.removeListener("error", onerror)

    next(error, result)
  }

  // On end behaves exactly like on error with a difference that `end` of
  // collection is passed instead of an error.
  function onend() {
    onerror(end)
  }

  function write(data) {
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
  stream.once("end", onend)

  stream.pipe(WriteStream(write))
})

module.exports = Stream
