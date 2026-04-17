const os = require("os");
const path = require("path");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}
//
//
//
//
//
// OS module
console.log("Platform:", os.platform());
console.log("CPU:", os.cpus()[0].model);
console.log("Total Memory:", os.totalmem());
//
//
//
//
// Path module
const joinedPath = path.join(sampleFilesDir, "new-folder", "file.txt");
console.log("Joined path:", joinedPath);
//
//
//
//
// fs.promises API
const fsp = require("fs").promises;
async function demoFSPromises() {
  const demofile = path.join(sampleFilesDir, "demo.txt");
  await fsp.writeFile(demofile, "Hello from fs.promises!");
  const content = await fsp.readFile(demofile, "utf8");

  console.log("fs.promises read:", content);
}
demoFSPromises();
//
//
//
//
//
// Streams for large files- log first 40 chars of each chunk
const largeFile = path.join(sampleFilesDir, "largefile.txt");

if (!fs.existsSync(largeFile)) {
  const writeStream = fs.createWriteStream(largeFile);

  for (let i = 1; i <= 100; i++) {
    writeStream.write(`This is line number ${i} in the large file.\n`);
  }
  writeStream.end();
  writeStream.on("finish", () => {
    startReadingStream();
  });
} else {
  startReadingStream();
}

function startReadingStream() {
  const stream = fs.createReadStream(largeFile, {
    encoding: "utf8",
    highWaterMark: 1024,
  });
  stream.on("data", (chunk) => {
    console.log("Read chunk:", chunk.slice(0, 40));
  });
  stream.on("end", () => {
    console.log("Finished reading large file with streams.");
  });
}
