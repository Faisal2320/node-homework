# Node.js Fundamentals

## What is Node.js?

Node is a javaScript enviornment, that can be run outside of browser, like on server or local computer. it can access files and create/write and read files. create server. create http response and more.

## How does Node.js differ from running JavaScript in the browser?

javaScript in the browser have access to DOM, document, but Node.js can access files on server or compter, Node can access system files like path, and eviornment variables but javaScript on browser can not.

## What is the V8 engine, and how does Node use it?

V8 is a javaScript engine made by google. Node passes code to V8 engine then the V8 engine compiles it to machine code and run the code on computer.

## What are some key use cases for Node.js?

Node.js is usage is for backend severs, working with APIs and application that use streaming and live notifications and more.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**

```js
the commonJS we use
const myModule = require('./myModule');
and
module.exports = myModule;
```

**ES Modules (supported in modern Node.js):**

```js
import myModule from "./myModule";
and;
export default myModule;
```
