const fs = require("fs");
const linear16 = require("linear16");
var path = require("path");

// Imports the Google Cloud client library
const speech = require("@google-cloud/speech");

function speechToText(file, res) {
  // Creates a client
  const client = new speech.SpeechClient();

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  const encoding = "LINEAR16";
  const sampleRateHertz = 16000;
  const languageCode = "en-US";

  const request = {
    config: {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: languageCode,
    },
    interimResults: false, // If you want interim results, set this to true
  };

  // Stream the audio to the Google Cloud Speech API
  const recognizeStream = client
    .streamingRecognize(request)
    .on("error", console.error)
    .on("end", () => {
        fs.unlink(
            path.resolve(file),
            () => {}
          );
    })
    .on("data", (data) => {
      res(data.results[0].alternatives[0].transcript);
      fs.unlink(
        path.resolve(file),
        () => {}
      );
      return;
    });

  // Stream an audio file from disk to the Speech API, e.g. "./resources/audio.raw"
  fs.createReadStream(file).pipe(recognizeStream);
}

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
  handler: function (socket, data) {
    var name = makefile(5);
    try {
      fs.writeFile(
        path.join(__dirname, "audio", name + ".mp3"),
        data.file,
        (err) => {
          if (err) console.log(err);
          try {
            const outPath = linear16(
              path.join(__dirname, "audio", name + ".mp3"),
              path.join(__dirname, "audio", name + ".wav")
            );
            outPath.then(() => {
              fs.unlink(
                path.resolve(__dirname, "audio", name + ".mp3"),
                () => {}
              );
              var resp = new Promise((res, rej) => {
                speechToText(
                  path.resolve(__dirname, "audio", name + ".wav"),
                  res
                );
              });
              resp.then((text) => {
                socket.emit("audioText", { file: text });
              });
            });
            outPath.catch((err) => {
                console.log(err);
            })
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
