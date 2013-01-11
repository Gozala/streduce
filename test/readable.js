"use strict";

var fromArray = require("read-stream/array")
var fold = require("reducers/fold")

require("../stream")

exports["test folding a stream"] = function (assert, done) {
  var stream = fromArray([1, 2, 3])
  var result = []

  var r = fold(stream, function (data, acc) {
    result.push(data)
    return acc
  }, {})

  fold(r, function () {
    assert.deepEqual(result, [1, 2, 3], "can reduce read-stream")
    done()
  })
}

if (require.main === module)
  require("test").run(exports)
