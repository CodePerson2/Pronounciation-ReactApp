const fs = require('fs');

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');

function quickstart(file, res){
  // Creates a client
  const client = new speech.SpeechClient();

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  const encoding = 'LINEAR16';
  const sampleRateHertz = 16000;
  const languageCode = 'en-US';

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
    .on('error', console.error)
    .on('data', data => {
      res(data.results[0].alternatives[0].transcript);
      return;
    });

  // Stream an audio file from disk to the Speech API, e.g. "./resources/audio.raw"
  fs.createReadStream(file).pipe(recognizeStream);
}
module.exports = {
    speech: (res, file) => { quickstart(file, res);}
}