//NodeJs main file for Google Speech-to-Text API

require("dotenv").config();
var multer = require("multer");

const http = require("http");
const fs = require("fs");
const express = require("express");
const app = express();
const speech = require("./serverFiles/googlespeech");

var upload = multer({ dest: __dirname + "/public/uploads/" });

var port = process.env.PORT;

var path = require("path");

app.use(express.static(path.join(__dirname, "my-app/build")));

//serves index page of react app
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "my-app", "build", "index.html"));
});

//Used connection for https requests and socket communtication
var server = http.createServer(app).listen(port);
var io = require("socket.io")(server);

// Socket.io connection to client, recieves mp3 file data and pipes it to speech.handler
io.on("connection", function (socket) {
  socket.on("audio", function (data) {
    speech.handler(socket, data);
  });
});
