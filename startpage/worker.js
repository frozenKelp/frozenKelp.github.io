// worker.js

let canvas, ctx;
let width, height, particles, frameCount = 0;

// Configuration Options – these are similar to your main thread options.
const opts = {
  particleColor: "rgb(143, 143, 143)",
  lineColor: "rgb(143, 143, 143)",
  particleAmount: 40,
  defaultSpeed: 0.5,
  variantSpeed: 0.5,
  defaultRadius: 2,
  variantRadius: 2,
  maxSpeed: 1.4,
  linkRadius: 250,
  linkRadiusSq: 250 * 250,
  interactionRadius: 200,
  interactionRadiusSq: 200 * 200,
  forceStrength: 100,
  attractionStrength: 0.05
};

const mouse = {
  x: null,
  y: null,
  pressed: false,
};

let particleIdCounter = 0;
class Particle {
  constructor() {
    this.id = particleIdCounter++;
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.speed = opts.defaultSpeed + Math.random() * opts.variantSpeed;
    this.directionAngle = Math.random() * Math.PI * 2;
    this.color = opts.particleColor;
    this.radius = opts.defaultRadius + Math.random() * opts.variantRadius;
    this.vector = {
      x: Math.cos(this.directionAngle) * this.speed,
      y: Math.sin(this.directionAngle) * this.speed
    };
  }
  update() {
    this.checkBorders();
    this.x += this.vector.x;
    this.y += this.vector.y;
    const currentSpeedSq = this.vector.x ** 2 + this.vector.y ** 2;
    if (currentSpeedSq > opts.maxSpeed ** 2) {
      const currentSpeed = Math.sqrt(currentSpeedSq);
      const scale = opts.maxSpeed / currentSpeed;
      this.vector.x *= scale;
      this.vector.y *= scale;
    }
  }
  checkBorders() {
    if (this.x >= width || this.x <= 0) this.vector.x *= -1;
    if (this.y >= height || this.y <= 0) this.vector.y *= -1;
    this.x = Math.max(0, Math.min(width, this.x));
    this.y = Math.max(0, Math.min(height, this.y));
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  particleIdCounter = 0;
  for (let i = 0; i < opts.particleAmount; i++) {
    particles.push(new Particle());
  }
}

// Helper: Resize the canvas.
function resizeCanvas() {
  width = canvas.width = self.innerWidth;
  height = canvas.height = self.innerHeight;
}
self.addEventListener("resize", resizeCanvas);

// Optimized collision detection via spatial hashing.
function detectCollisionsOptimized(particlesArray) {
  const cellSize = 50;
  const grid = new Map();

  function getCellKey(x, y) {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return `${col},${row}`;
  }

  for (const p of particlesArray) {
    const key = getCellKey(p.x, p.y);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(p);
  }

  const checkedPairs = new Set();
  grid.forEach((cellParticles, key) => {
    const [col, row] = key.split(',').map(Number);
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const neighborKey = `${col + dc},${row + dr}`;
        if (grid.has(neighborKey)) {
          const neighborParticles = grid.get(neighborKey);
          for (const p1 of cellParticles) {
            for (const p2 of neighborParticles) {
              if (p1 === p2) continue;
              const pairKey = p1.id < p2.id ? `${p1.id},${p2.id}` : `${p2.id},${p1.id}`;
              if (checkedPairs.has(pairKey)) continue;
              checkedPairs.add(pairKey);
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const distSq = dx * dx + dy * dy;
              const minDist = p1.radius + p2.radius;
              if (distSq < minDist * minDist) {
                const temp = { x: p1.vector.x, y: p1.vector.y };
                p1.vector.x = p2.vector.x;
                p1.vector.y = p2.vector.y;
                p2.vector.x = temp.x;
                p2.vector.y = temp.y;
                const dist = Math.sqrt(distSq);
                const overlap = (minDist - dist) / 2;
                const offsetX = (dx / dist) * overlap;
                const offsetY = (dy / dist) * overlap;
                p1.x -= offsetX;
                p1.y -= offsetY;
                p2.x += offsetX;
                p2.y += offsetY;
              }
            }
          }
        }
      }
    }
  });
}

// Optimized attraction function using spatial hashing.
function applyAttractionOptimized(particlesArray) {
  const cellSize = 50;
  const grid = new Map();
  
  function getCellKey(x, y) {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return `${col},${row}`;
  }
  particlesArray.forEach(p => {
    const key = getCellKey(p.x, p.y);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(p);
  });
  
  const checkedPairs = new Set();
  grid.forEach((cellParticles, key) => {
    const [col, row] = key.split(',').map(Number);
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const neighborKey = `${col + dc},${row + dr}`;
        if (grid.has(neighborKey)) {
          const neighborParticles = grid.get(neighborKey);
          for (const p1 of cellParticles) {
            for (const p2 of neighborParticles) {
              if (p1 === p2) continue;
              const pairKey = p1.id < p2.id ? `${p1.id},${p2.id}` : `${p2.id},${p1.id}`;
              if (checkedPairs.has(pairKey)) continue;
              checkedPairs.add(pairKey);
              
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const distSq = dx * dx + dy * dy;
              if (distSq < opts.interactionRadiusSq && distSq > 25) {
                const dist = Math.sqrt(distSq);
                const force = opts.attractionStrength / distSq;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                p1.vector.x += fx;
                p1.vector.y += fy;
                p2.vector.x -= fx;
                p2.vector.y -= fy;
              }
            }
          }
        }
      }
    }
  });
}

// Draw connections between particles.
function drawConnections(particlesArray) {
  const rgb = opts.lineColor.match(/\d+/g);
  for (let i = 0; i < particlesArray.length; i++) {
    for (let j = i + 1; j < particlesArray.length; j++) {
      const dx = particlesArray[j].x - particlesArray[i].x;
      const dy = particlesArray[j].y - particlesArray[i].y;
      const distSq = dx * dx + dy * dy;
      if (distSq < opts.linkRadiusSq) {
        const distance = Math.sqrt(distSq);
        const opacity = 1 - distance / opts.linkRadius;
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
        ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
        ctx.stroke();
      }
    }
  }
}

// Main animation loop running inside the worker.
function loop() {
  // Apply optimized attraction.
  applyAttractionOptimized(particles);

  // Mouse interaction (if provided from main thread).
  if (mouse.x !== null && mouse.y !== null) {
    particles.forEach(particle => {
      const dx = particle.x - mouse.x;
      const dy = particle.y - mouse.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < opts.interactionRadiusSq && distSq > 25) {
        const distance = Math.sqrt(distSq);
        let force = opts.forceStrength / distSq;
        if (mouse.pressed) force = -force;
        particle.vector.x += (dx / distance) * force;
        particle.vector.y += (dy / distance) * force;
      }
    });
  }

  ctx.clearRect(0, 0, width, height);

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  detectCollisionsOptimized(particles);

  // Draw connections every 2 frames to ease overhead.
  if (frameCount % 2 === 0) {
    drawConnections(particles);
  }
  frameCount++;
  
  // Use requestAnimationFrame provided by the worker's global scope.
  self.requestAnimationFrame(loop);
}

// Listen for messages from the main thread.
self.onmessage = (event) => {
  if (event.data.type === 'init') {
    // Receive OffscreenCanvas and set up.
    canvas = event.data.canvas;
    ctx = canvas.getContext("2d");
    // Optional: set up dimensions from passed values.
    width = canvas.width = event.data.width;
    height = canvas.height = event.data.height;
    initParticles();
    loop();
  } else if (event.data.type === 'mouse') {
    // Update mouse interactions from main thread.
    mouse.x = event.data.x;
    mouse.y = event.data.y;
    mouse.pressed = event.data.pressed;
  } else if (event.data.type === 'resize') {
    // Update canvas size on resize.
    width = canvas.width = event.data.width;
    height = canvas.height = event.data.height;
  }
};
