// emails sents to
const sentEmails = [];
const video = document.getElementById('video');
const imageUpload = document.getElementById('imageUpload');
const _start = document.getElementById('start');
const descriptors = [];
let start = false;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(initApp);

function initApp() {
  if (start) {
    navigator.getUserMedia(
      { video: {}, },
      stream => video.srcObject = stream,
      err => console.error(err),
    )
  }
}

// adding images
imageUpload.addEventListener('change', async () => {
  // recognize my image
  const descriptions = [];
  console.log('Your Image ->', imageUpload.files);
  Array.from(imageUpload.files).forEach(async (image) => {
    let img = await faceapi.bufferToImage(image);
    let detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    if (detections) descriptions.push(detections.descriptor);
  });

  let name = document.querySelector('#name').value;
  console.log('Your  name ->', name);
  const descriptor = new faceapi.LabeledFaceDescriptors(name, descriptions);
  console.log('Your Image Descriptor ->', descriptor);
  if (descriptor) {
    descriptors.push(descriptor);
    new Noty({
      theme: 'nest',
      text: 'Image Descriptor created successful!',
      timeout: 500,
      modal: true
    }).show();
  }
});

video.addEventListener('play', async () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  if (descriptors) {
    const faceMatcher = new faceapi.FaceMatcher(descriptors, 0.4);
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
      // console.log(detections);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
      results.forEach((result, i) => {
        // console.log('see result =>', result);
        const box = resizedDetections[i].detection.box
        const similarity = `${parseFloat(100 - (result.distance * 100)).toFixed(2)}`;
        const drawBox = new faceapi.draw.DrawBox(box, { label: `${result.label}(${similarity})` });
        drawBox.draw(canvas)
        // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        // send emails notifications if person of interest is found
        if (result.distance < 0.4) {
          // check if email already sent
          if (!sentEmails.includes(result.label)) {
            const message = `
            We found Person : ${result.label} \n
            Similarity:  ${similarity}
            `;
            console.log('sending notification ');
            //omitted notification sending part you can implement yours they way you want!
            new Noty({
              theme: 'nest',
              text: 'notification sent successful!',
              timeout: 500,
            }).show();
            sentEmails.push(result.label);
          }
        }
      });
    }, 100);
  }
});

const startVideo = () => {
  start = true;
  return initApp();
};
