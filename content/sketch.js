
let faceRecognizer = undefined;
let detections = [];
let runFunnyFace = false;

let eyebrowGif, eyeGif, noseGif, mouthGif;

function preload() {
  eyebrowGif = loadImage(chrome.runtime.getURL("assets/eyebrow.gif"));
  eyeGif = loadImage(chrome.runtime.getURL("assets/eye.gif"));
  noseGif = loadImage(chrome.runtime.getURL("assets/nose.gif"));
  mouthGif = loadImage(chrome.runtime.getURL("assets/mouth.gif"));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function setup() {
  let body = document.body;
  let html = document.documentElement;
  let canvasHeight = Math.max(body.scrollHeight, body.offsetHeight,
                        html.clientHeight, html.scrollHeight, html.offsetHeight);
  const canvas = createCanvas(windowWidth, canvasHeight);
  canvas.position(0, 0);
  canvas.style("z-index", "1000");
  canvas.style("pointer-events", "none");

  chrome.runtime.onMessage.addListener(() => {
    runFunnyFace = !runFunnyFace;
    console.log(runFunnyFace ? "start funny face" : "stop funny face");
    if (runFunnyFace) {
      faceRecognizer = ml5.faceApi({
        withLandmarks: true,
        withDescriptors: false,
      }, faceRecognizerLoaded);
    }
  });
}

function faceRecognizerLoaded() {
  console.log("faceRecognizer loaded");
  takeshot();
}

function draw() {
  clear();
  imageMode(CENTER);
  // console.log("---> runFunnyFace " + runFunnyFace + " " + detections);
  if (runFunnyFace && detections.length > 0) {
    for (detection of detections) {
      // drawPartsWithPoints(detection);
      drawPartsWithGif(detection);
    }
  }
}

function drawPartsWithPoints(detection) {
  drawPartWithPoints(detection.parts.leftEyeBrow);
  drawPartWithPoints(detection.parts.leftEye);
  drawPartWithPoints(detection.parts.rightEyeBrow);
  drawPartWithPoints(detection.parts.rightEye);
  drawPartWithPoints(detection.parts.nose);
  drawPartWithPoints(detection.parts.mouth);
}

function drawPartWithPoints(points) {
  for (let i = 0; i < points.length; i++) {
    stroke(161, 95, 251);
    strokeWeight(8);
    point(points[i]._x, points[i]._y);
  }
}

function drawPartsWithGif(detection) {
  drawPartWithGif(detection.parts.leftEyeBrow, eyebrowGif);
  drawPartWithGif(detection.parts.leftEye, eyeGif);
  drawPartWithGif(detection.parts.rightEyeBrow, eyebrowGif);
  drawPartWithGif(detection.parts.rightEye, eyeGif);
  drawPartWithGif(detection.parts.nose, noseGif, stretchX = false, stretchY = true);
  drawPartWithGif(detection.parts.mouth, mouthGif, stretchX = true, stretchY = false);
}

function drawPartWithGif(points, gif, stretchX = false, stretchY = false) {
  const averageX = points.reduce((acc, curr) => acc + curr._x, 0) / points.length;
  const averageY = points.reduce((acc, curr) => acc + curr._y, 0) / points.length;
  const minX = Math.min.apply(Math, points.map(p => p._x));
  const maxX = Math.max.apply(Math, points.map(p => p._x));
  const minY = Math.min.apply(Math, points.map(p => p._x));
  const maxY = Math.max.apply(Math, points.map(p => p._x));

  stretchXFactor = stretchX ? 1.5 : 1.2;
  stretchYFactor = stretchY ? 1.5 : 1.2;
  // stroke(192, 28, 183);
  // strokeWeight(8);
  // point(averageX, averageY);
  image(gif, averageX, averageY, (maxX - minX) * stretchXFactor, (maxY - minY) * stretchYFactor);
}

function takeshot(message, sender, sendResponse) {
  // Use the html2canvas  to take a screenshot of the body.

  // Scale and offset issues of the taken screenshot were solved using
  // https://dev.to/protium/javascript-rendering-videos-with-html2canvas-3bk
  let body = document.querySelector("body");

  // Capture videos hack by https://dev.to/protium/javascript-rendering-videos-with-html2canvas-3bk
  let videos = document.querySelectorAll('video');
  for (v of videos) {
    try {
      let w = v.offsetWidth
      let h = v.offsetHeight

      let tmpCanvas = createCanvas(w, h); // declare a canvas element in your html
      drawingContext.fillRect(0, 0, w, h);
      drawingContext.drawImage(v, 0, 0, w, h);
      v.height = v.getBoundingClientRect().top;
      v.style.backgroundImage = `url(${tmpCanvas.toDataURL()})` // here is the magic
      v.style.backgroundSize = 'cover'
      drawingContext.clearRect(0, 0, w, h); // clean the canvas
    } catch (e) {
      continue;
    }
  }

  html2canvas(body, {
      Logging: false, // log switch to view the internal execution process of html2canvas
      width:  body.clientWidth , // DOM original width
      height: body.clientHeight, // DOM original height
      scrollY: 0,
      scrollX: 0,
      Usecors: true // [important] enable cross domain configuration
  }).then((canvas) => {
    const canvasImageUrl = canvas.toDataURL();
    // Load image from url
    loadImage(canvasImageUrl, (canvasImage) => {
      canvasImage.resize(body.clientWidth, body.clientHeight);
      // image(canvasImage, 0, 0); // For debugging
      faceRecognizer.detect(canvasImage, (err, results) => {
        detections = results;

        // Continue running and classifying faces
        if (runFunnyFace) {
          setTimeout(takeshot, 100);
        }
      });
    });
  });
}
