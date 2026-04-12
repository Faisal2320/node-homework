const fs = require("fs");
const path = require("path");

// Write a sample file for demonstration
const filePath = path.join(__dirname, "sample-files", "sample.txt");
const data = "Hello, async world!";
console.log("File path:", filePath);

fs.writeFileSync(filePath, data);

// 1. Callback style
//-------------------------------------------
fs.readFile(filePath, "utf8", (err, content) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  console.log("Callback read:", content);
});

// Callback hell example (test and leave it in comments):
// ___________________________________
// i have not read call back hell yet.
// -------------------------------
/*
fs.readFile(a.txt, 'utf8', (err, contentA) =>{
  fs.readFile(b.txt, 'utf8', (err, contentB) =>{
    
    fs.readFile(c.txt, 'utf8', (err, contentC) =>{
      console.log(contentA, contentB, contentC);
})})})


*/

// 2. Promise style
function readFilePromise(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, content) => {
      if (err) reject(err);
      else resolve(content);
    });
  });
}

readFilePromise(filePath)
  .then((content) => {
    console.log("Promise read:", content);
  })
  .catch((err) => {
    console.log("Promise error:", err);
  });

// 3. Async/Await style
async function readAsync() {
  try {
    const content = await readFilePromise(filePath);
    console.log("Async/Await read:", content);
  } catch (err) {
    console.log("Async/Await error:", err);
  }
}
readAsync();
