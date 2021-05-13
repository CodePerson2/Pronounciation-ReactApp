// Google API File
// Made By: Mattias Stroman, using portions from Googles API Docs
// handler takes mp3 file data and returns its transcript to the socket

const fs = require("fs");
// linear16 file 
const linear16 = require("linear16");
var path = require("path");

// Imports the Google Cloud client library
const speech = require("@google-cloud/speech");

function speechToText(file, res) {
  // Creates a client
  const client = new speech.SpeechClient();

  // File type and audio Frequency, and language
  const encoding = "LINEAR16";
  const sampleRateHertz = 16000;
  const languageCode = "en-US";

  // create object
  const request = {
    config: {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: languageCode,
    },
    interimResults: false, // If you want interim results, set this to true
  };

  // Stream the audio to the Google Cloud Speech API
  // Unlink linear16 file after stream
  const recognizeStream = client
    .streamingRecognize(request)
    .on("error", (c) => {
      c.error;
      console.log(c);
      fs.unlink(path.resolve(file), () => {});
    })
    .on("end", () => {
      res({ success: 0 });
      fs.unlink(path.resolve(file), () => {});
    })
    .on("data", (data) => {
      // return promise to be sent back to client
      res({
        success: 1,
        transcript: data.results[0].alternatives[0].transcript,
      });
      fs.unlink(path.resolve(file), () => {});
    });

  // Stream an audio file from disk to the Speech API, e.g. "./resources/audio.raw"
  fs.createReadStream(file).pipe(recognizeStream);
}

//Writes random file name
function makefile(length) {
  var result = [];
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result.push(
      characters.charAt(Math.floor(Math.random() * charactersLength))
    );
  }
  return result.join("");
}

module.exports = {
  // used in index.js as handler of
  handler: function (socket, data) {
    //make file name with 5 characters
    var name = makefile(5);
    try {
      // write mp3 file
      fs.writeFile(
        path.join(__dirname, "audio", name + ".mp3"),
        data.file,
        (err) => {
          if (err) console.log(err);
          try {
            // write linear16 file, file type used with Googles speech to text API
            const outPath = linear16(
              path.join(__dirname, "audio", name + ".mp3"),
              path.join(__dirname, "audio", name + ".wav")
            );
            outPath.then(() => {
              // remove mp3 file
              fs.unlink(
                path.resolve(__dirname, "audio", name + ".mp3"),
                () => {}
              );
              var resp = new Promise((res, rej) => {
                // pass linear16 file to speech to text, send file to googles speech api
                speechToText(
                  path.resolve(__dirname, "audio", name + ".wav"),
                  res
                );
              });
              resp.then((data) => {
                // return data to client
                socket.emit("audioText", { file: data });
              });
            });
            outPath.catch((err) => {
              console.log(err);
            });
          } catch {
            console.log("Linear16 error");
          }
        }
      );
    } catch {
      console.log("error");
    }
  },
};
