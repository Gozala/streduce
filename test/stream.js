"use strict";

var stream = require("../stream")

var WriteStream = require("write-stream")

exports["test stream"] = function (assert, done) {
  var list = []
  stream([1, 2, 3]).pipe(WriteStream(function (data) {
    list.push(data)
  }, function () {
    assert.deepEqual(list, [1, 2, 3], "reducible stream is correct")
    done()
  }))
}

if (require.main === module)
  require("test").run(exports)
