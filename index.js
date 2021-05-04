//NodeJs main file for SIMBI Dev Assignment
//Uses google cloud speech to text

require("dotenv").config();
var multer = require("multer");

const http = require("http");
const fs = require("fs");
const express = require("express");
const app = express();
const speech = require("./serverFiles/googlespeech");
const linear16 = require("linear16");

var upload = multer({ dest: __dirname + "/public/uploads/" });
var type = upload.single("upl");

var port = process.env.PORT;

var path = require("path");

var bodyParser = require("body-parser");
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

app.use(express.static(path.join(__dirname, "my-app/build")));
app.use(bodyParser.urlencoded({ extended: true }));

//serves index page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "my-app", "build", "index.html"));
});

//Used connection for https requests and socket communtication
var server = http.createServer(app).listen(port);
var io = require("socket.io")(server);

io.on("connection", function (socket) {
  socket.on("audio", function (data) {
    fs.appendFile("audio.mp3", data.file, (err) => {
      if (err) console.log(err);
      const outPath = linear16("audio.mp3", "audio.wav");
      outPath.then(() => {
        var resp = new Promise((res, rej) => {
          speech.speech(res, path.resolve(__dirname, "audio.wav"));
        });
        resp.then((text) => {
          console.log(text);
          socket.emit("audioText", { file: text });
        });
      });
    });
  });
});
