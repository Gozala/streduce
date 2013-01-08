"use strict";

var from = require("read-stream/from")

var reduce = require("reducible/reduce")
var end = require("reducible/end")
var isError = require("reducible/is-error")

module.exports = stream

function stream(reducible) {
  var foo = "bar"

  var stream = from(function (push, finish) {
    reduce(reducible, function (value) {
      if (value === end) {
        return finish()
      }
      else if (isError(value)) {
        return stream.emit("error", value)
      }

      return push(value)
    }, {})
  })

  return stream
}
