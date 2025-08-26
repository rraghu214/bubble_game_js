const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height;
const videoElement = document.getElementById('input_video');

function resize() {
  const rect = canvas.getBoundingClientRect();
  console.log('resize rect', rect.width, rect.height);
  width = canvas.width = rect.width * devicePixelRatio;
  height = canvas.height = rect.height * devicePixelRatio;
  // use setTransform to avoid cumulative scaling when resize is called multiple times
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  // size the video preview to match the canvas so bubbles appear over the live feed
  if(videoElement){
    videoElement.style.width = `${rect.width}px`;
    videoElement.style.height = `${rect.height}px`;
    // position video to align with canvas inside the #game container
    const parentRect = canvas.parentElement.getBoundingClientRect();
    videoElement.style.left = `${rect.left - parentRect.left}px`;
    videoElement.style.top = `${rect.top - parentRect.top}px`;
  }
}

// initialization is appended at the end of this file

window.addEventListener('resize', () => { resize(); draw(); });

// Game state
let bubbles = [];
let lastSpawn = 0;
let spawnInterval = 2000; // ms
let spawnShrink = 0.97;
let score = 0;
let screenFill = 0.8;
let gameOver = false;
let mute = false;

const popSound = document.getElementById('popSound');
const gameOverSound = document.getElementById('gameOverSound');

function spawnBubble() {
  // larger bubbles: radius between 50 and 90
  const r = Math.random() * 40 + 50;
  const x = Math.random() * (canvas.clientWidth - 2 * r) + r;
  const y = Math.random() * (canvas.clientHeight * 0.7 - 2 * r) + r;
  const color = `rgb(${randomRange(100,255)},${randomRange(100,255)},${randomRange(100,255)})`;
  bubbles.push({x,y,r,color});
  console.log('spawnBubble -> bubbles length', bubbles.length, 'pos', x, y, 'r', r);
}

function randomRange(a,b){return Math.floor(Math.random()*(b-a+1))+a}

function drawBubble(b){
  // gradient fill for 3D look
  const grd = ctx.createRadialGradient(b.x - b.r*0.3, b.y - b.r*0.3, b.r*0.1, b.x, b.y, b.r);
  grd.addColorStop(0,'rgba(255,255,255,0.9)');
  grd.addColorStop(0.2,b.color);
  grd.addColorStop(1,'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.fillStyle = grd;
  ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
  ctx.fill();
  // highlight
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.arc(b.x - b.r*0.3, b.y - b.r*0.3, b.r*0.18,0,Math.PI*2);
  ctx.fill();
}

// initialization: wait for window load then start
window.addEventListener('load', ()=>{
  try{
    resize();
    lastSpawn = performance.now();
    console.log('Game loop starting');
    loop();
  }catch(e){
    console.error('Failed to start game loop', e);
  }
});

function update(dt){
  if(!gameOver){
    // spawn
    if(performance.now() - lastSpawn > spawnInterval){
      spawnBubble();
      lastSpawn = performance.now();
      spawnInterval *= spawnShrink;
    }

    // check area
    let totalArea = 0;
    for(let i=bubbles.length-1;i>=0;i--){
      const b = bubbles[i];
      totalArea += Math.PI * b.r * b.r;
    }
    if(totalArea > screenFill * (canvas.clientWidth * canvas.clientHeight)){
  gameOver = true;
  // stop further scoring and show overlay once
  if(!mute) gameOverSound.play();
  document.getElementById('overlay').classList.remove('hidden');
  document.getElementById('finalScore').innerText = `Final Score: ${score}`;
    }
  }
}

function draw(){
  // clear
  ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
  // draw bubbles
  for(const b of bubbles) drawBubble(b);
  // draw pointer (mouse)
  if(pointer.x !== undefined){
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,200,0,0.9)';
    ctx.arc(pointer.x,pointer.y,8,0,Math.PI*2);
    ctx.fill();
  }
  // draw hand landmarks (if any) on top of bubbles and below HUD
  drawHand();
  // score
  ctx.fillStyle='#000';
  ctx.font='18px Arial';
  ctx.fillText(`Score: ${score}`, 12, 28);
}

let last = performance.now();
function loop(){
  const now = performance.now();
  const dt = now - last;
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Pointer handling
const pointer = {};
canvas.addEventListener('mousemove', (e)=>{
  const rect = canvas.getBoundingClientRect();
  pointer.x = (e.clientX - rect.left);
  pointer.y = (e.clientY - rect.top);
});
canvas.addEventListener('click', (e)=>{
  // detect bubble under pointer and pop (mouse fallback)
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  for(let i=bubbles.length-1;i>=0;i--){
    const b = bubbles[i];
    const dist = Math.hypot(b.x - x, b.y - y);
    if(dist < b.r){
  if(gameOver) break;
  bubbles.splice(i,1);
  score += 1;
  document.getElementById('score').innerText = `Score: ${score}`;
  if(!mute) popSound.play();
  break;
    }
  }
});

// Touch support
canvas.addEventListener('touchstart', (ev)=>{
  ev.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const t = ev.touches[0];
  const x = t.clientX - rect.left;
  const y = t.clientY - rect.top;
  for(let i=bubbles.length-1;i>=0;i--){
    const b = bubbles[i];
    const dist = Math.hypot(b.x - x, b.y - y);
    if(dist < b.r){
  if(gameOver) break;
  bubbles.splice(i,1);
  score += 1;
  document.getElementById('score').innerText = `Score: ${score}`;
  if(!mute) popSound.play();
  break;
    }
  }
}, {passive:false});

// Buttons
document.getElementById('muteBtn').addEventListener('click', ()=>{mute = !mute; document.getElementById('muteBtn').innerText = mute? 'Unmute':'Mute';});
document.getElementById('restartBtn').addEventListener('click', ()=>{restart();});
document.getElementById('overlayRestart').addEventListener('click', ()=>{restart(); document.getElementById('overlay').classList.add('hidden');});

function restart(){
  bubbles = []; lastSpawn = performance.now(); spawnInterval = 2000; score = 0; gameOver = false; document.getElementById('score').innerText = `Score: ${score}`;}

// Init will be called after all handlers and variables (like handLandmarks) are declared below.

// Optional: if you want hand tracking in browser (future), you can integrate MediaPipe Hands via CDN and map landmarks to pointer.x/y.

// --- MediaPipe Hands integration (index finger maps to pointer) ---
const cameraBtn = document.getElementById('cameraBtn');
let cameraRunner = null; // mediapipe camera instance
// mirror toggle removed from UI; enable mirrored view by default
let mirrored = true;
let handLandmarks = null; // latest landmarks array (normalized coords)

function onResults(results){
  // results.multiHandLandmarks is an array of landmarks in normalized coords
  if(results.multiHandLandmarks && results.multiHandLandmarks.length){
    // save landmarks; drawing will be done in the main draw loop so it aligns with canvas scaling
    handLandmarks = results.multiHandLandmarks[0];
    const lm = handLandmarks[8]; // index finger tip
    // map normalized coordinates to canvas client coordinates
    const rect = canvas.getBoundingClientRect();
    const xNorm = mirrored ? (1 - lm.x) : lm.x;
    pointer.x = xNorm * rect.width;
    pointer.y = lm.y * rect.height;

    // If index finger is over a bubble, pop it
    for(let i=bubbles.length-1;i>=0;i--){
      const b = bubbles[i];
      const dist = Math.hypot(b.x - pointer.x, b.y - pointer.y);
      if(dist < b.r){
        bubbles.splice(i,1);
        score += 1;
        document.getElementById('score').innerText = `Score: ${score}`;
        if(!mute) popSound.play();
        break;
      }
    }
  } else {
    handLandmarks = null;
  }
}

// create MediaPipe Hands and camera when user toggles camera
let hands = null;
async function startCamera(){
  if(!window.Hands) return; // mediapipe not loaded
  console.log('Starting MediaPipe Hands...');
  hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6
  });
  hands.onResults(onResults);

  // show debug preview
  videoElement.style.display = '';
  if(mirrored){ videoElement.style.transform = 'scaleX(-1)'; } else { videoElement.style.transform = ''; }

  cameraRunner = new Camera(videoElement, {
    onFrame: async () => { 
      try{ await hands.send({image: videoElement}); }catch(e){ console.error('hands.send error', e); }
    },
    width: 640,
    height: 480
  });
  await cameraRunner.start();
  console.log('Camera started');
  cameraBtn.innerText = 'Stop Camera';
}

function stopCamera(){
  if(cameraRunner){
    cameraRunner.stop();
    cameraRunner = null;
  }
  if(hands){
    hands.close();
    hands = null;
  }
  videoElement.srcObject = null;
  videoElement.style.display = 'none';
  cameraBtn.innerText = 'Use Camera';
}

cameraBtn.addEventListener('click', async ()=>{
  if(cameraRunner) { stopCamera(); return; }
  try{
    // ask permission and start camera
    await startCamera();
  }catch(err){
    console.error('Camera start failed', err);
    stopCamera();
    alert('Camera access failed or was denied. Use mouse/touch to play.');
  }
});

// When camera starts, ensure the preview is mirrored to match pointer mapping

// draw hand landmarks and connections in a techy style
function drawHand(){
  if(!handLandmarks) return;
  const rect = canvas.getBoundingClientRect();
  // connections taken from MediaPipe Hands topology
  const CONNS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,200,255,0.9)';
  // draw connections
  for(const [a,b] of CONNS){
    const A = handLandmarks[a];
    const B = handLandmarks[b];
    const ax = (mirrored ? (1 - A.x) : A.x) * rect.width;
    const ay = A.y * rect.height;
    const bx = (mirrored ? (1 - B.x) : B.x) * rect.width;
    const by = B.y * rect.height;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  // draw key points
  for(let i=0;i<handLandmarks.length;i++){
    const p = handLandmarks[i];
    const x = (mirrored ? (1 - p.x) : p.x) * rect.width;
    const y = p.y * rect.height;
    // outer ring
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.arc(x, y, 6, 0, Math.PI*2);
    ctx.fill();
    // inner glow
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,200,120,0.95)';
    ctx.arc(x, y, 4, 0, Math.PI*2);
    ctx.fill();
  }
  // highlight index finger tip (landmark 8) with brighter green dot
  const tip = handLandmarks[8];
  if(tip){
    const tx = (mirrored ? (1 - tip.x) : tip.x) * rect.width;
    const ty = tip.y * rect.height;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,255,0,1)';
    ctx.arc(tx, ty, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.arc(tx, ty, 10, 0, Math.PI*2);
    ctx.stroke();
  }
  ctx.restore();
}

