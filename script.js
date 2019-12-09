const video = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {}, },
    stream => video.srcObject = stream,
    err => console.error(err),
  )
}

video.addEventListener('play', async() => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  // recognize my image
  const descriptions = [];
  const img = await faceapi.fetchImage('https://avatars0.githubusercontent.com/u/11447549?s=460&v=4');
  const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
  descriptions.push(detections.descriptor)
  const descriptors = new faceapi.LabeledFaceDescriptors("Mucyo Fred", descriptions);
  const faceMatcher = new faceapi.FaceMatcher(descriptors, 0.6);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
    console.log(detections);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    });
  }, 100);
});