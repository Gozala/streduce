# stream-reduce

[![Build Status](https://secure.travis-ci.org/Gozala/stream-reduce.png)](http://travis-ci.org/Gozala/stream-reduce)

This library provides provides implementation of **reduce** abstraction defined
by [reducers][] for streams. Which basically means that importing this library
will make all node streams **reducibles**, in other words all of the functions
that work with [reducers][] will work with node streams too.

### Example


```js
var fs = require("fs")

var reduce = require("reducers/reduce")
var expand = require("reducers/expand")
var map = require("reducers/map")
var take = require("reducers/take")
var drop = require("reducers/drop")

// You need to import this, otherwise streams are treated as single
// value sequences of that value.
require("stream-reduce")


var stream = fs.createReadStream("./package.json")
// Map buffer stream to strings
var stringStream = map(stream, String)
// Expands text content to a lines. Expand is just like map with
// a differenc that mapped values are sequences too, that includes
// arrays, streams, arguments, etc...
// Some other languages call this operation mapcat
var linesStream = expand(stringStream, function(text) {
  return text.split("\n")
})
var linesFrom4 = drop(linesStream, 3)
// Take takes `n` number from items from the sequence, there
// for we end up with two lines from the package.json
var lines56 = take(linesFrom4, 2)

// Finally read print lines we're interested in:
reduce(lines56, function(count, line) {
  console.log("line #" + (++count) + " " + line)
  return count
}, 0)
// => info: line #1   "version": "0.0.1",
// => info: line #2   "description": "Adapter for making node streams reducible",
```

Please note that unlike typical data structures provided by [reducers][]
that ary lazy and do work only after calling `reduce` on them, node streams
are not. Things like `fs.createReadStream` start reading, that is also how
transformations are applied by reducers library.

## Install

    npm install stream-reduce

[reducers]:https://github.com/Gozala/reducers
