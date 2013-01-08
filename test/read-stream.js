"use strict";

var Stream = require("..")

var fold = require("reducers/fold")
var expand = require("reducers/expand")
var map = require("reducers/map")
var take = require("reducers/take")
var fs = require("fs")
var path = require("path")

var fixtures = path.join(path.dirname(module.filename), "fixtures")

exports["test reduce on read-stream"] = function(assert, done) {
  var oops = path.join(fixtures, "oops.md")
  var stream = fs.createReadStream(oops)
  fold(stream, function(data) {
    assert.equal(data.toString(),
                 fs.readFileSync(oops).toString(),
                 "Assert that buffer read is the same")
    done()
  })
}

exports["test transformations no read-stream"] = function(assert, done) {
  var oops = path.join(fixtures, "oops.md")
  var stream = fs.createReadStream(oops)

  var stringStream = map(stream, String)
  var linesStream = expand(stringStream, function($) { return $.split("\n") })
  var lines1_5 = take(linesStream, 5)

  var actual = fs.readFileSync(oops).
      toString().
      split("\n").
      slice(0, 5)

  fold(lines1_5, function(line, lines) {
    assert.equal(line, lines.shift(), "assert line #" + (5 - lines.length))
    if (!lines.length) done()
    return lines
  }, actual)
}

if (require.main === module)
  require("test").run(exports)
