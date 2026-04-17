const EventEmitter = require("events");
const emitter = new EventEmitter();
//
//
//
emitter.on("time", (message) => {
  console.log("Time received: " + message);
});

const interval = setInterval(() => {
  var time = new Date();
  var result = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
  emitter.emit("time", result);
}, 5000);

interval.unref();
module.exports = emitter;
