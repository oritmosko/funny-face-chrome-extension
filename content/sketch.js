
let faceRecognizer = undefined;
let detections = [];
let runFunnyFace = false;

let canvasWidth, canvasHeight;
let canvas;

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

  canvasWidth = windowWidth;
  canvasHeight = Math.max(body.scrollHeight, body.offsetHeight,
                        html.clientHeight, html.scrollHeight, html.offsetHeight);
  canvas = createCanvas(canvasWidth, canvasHeight);
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
  imageMode(CENTER);
  // console.log("---> runFunnyFace " + runFunnyFace + " " + detections);
  if (runFunnyFace && detections.length > 0) {
    clear();
    canvas.style("z-index", "1000");
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
  let body = document.querySelector("body");

  let videos = document.querySelectorAll('video');
  canvas.style("z-index", "-1");
  for (video of videos) {
    let w = video.offsetWidth;
    let h = video.offsetHeight;
    let x = video.getBoundingClientRect().left;
    let y = video.getBoundingClientRect().top;

    drawingContext.fillRect(x, y, w, h);
    drawingContext.drawImage(video, x, y, w, h);
  }
  let bgImage = get();
  clear();
  faceRecognizer.detect(bgImage, (err, results) => {
    detections = results;

    // Continue running and classifying faces
    if (runFunnyFace) {
     setTimeout(takeshot, 100);
    }
  });
}
