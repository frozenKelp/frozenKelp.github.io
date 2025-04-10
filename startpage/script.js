// ====================================================
// Slideshow and Daily Randomizer Setup
// ====================================================
const imagePath = 'assets/';
const len = 23;
const images = Array.from({ length: len }, (_, i) => `side${i + 1}.gif`);

function getSeed() {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDailyDefaultSlideIndex() {
  const seed = getSeed();
  return Math.floor(seededRandom(seed) * len) + 1;
}

let slideIndex = localStorage.getItem('slideIndex');
const dailyDefaultSlideIndex = getDailyDefaultSlideIndex();

if (!slideIndex) {
  slideIndex = dailyDefaultSlideIndex;
  localStorage.setItem('slideIndex', slideIndex);
} else {
  slideIndex = parseInt(slideIndex, 10);
  const lastAccessedDate = localStorage.getItem('lastAccessedDate');
  const currentDate = new Date().toDateString();
  if (lastAccessedDate !== currentDate) {
    slideIndex = dailyDefaultSlideIndex;
    localStorage.setItem('slideIndex', slideIndex);
  }
}
localStorage.setItem('lastAccessedDate', new Date().toDateString());

// Build slideshow HTML in one go to reduce reflows.
const slideshow = document.getElementById('slideshow');
let slideshowHTML = '';
images.forEach((img) => {
  slideshowHTML += `<div class="mySlides">
    <img src="${imagePath}${img}" style="cursor:pointer;" onclick="changeSlide(1)">
  </div>`;
});
slideshow.innerHTML = slideshowHTML;

// ====================================================
// Slideshow Animations and Interaction
// ====================================================
let animating = false;

function changeSlide(n) {
  if (animating) return;
  const slides = document.getElementsByClassName("mySlides");
  const totalSlides = slides.length;
  let nextSlideIndex = slideIndex + n;

  if (nextSlideIndex > totalSlides) nextSlideIndex = 1;
  else if (nextSlideIndex < 1) nextSlideIndex = totalSlides;

  const currentSlide = slides[slideIndex - 1];
  const nextSlide = slides[nextSlideIndex - 1];

  // Prepare next slide
  nextSlide.style.transition = "none";
  nextSlide.style.transform = `translateY(${n > 0 ? "100%" : "-100%"})`;
  nextSlide.style.opacity = "1";
  nextSlide.offsetHeight; // Force reflow
  nextSlide.style.transition = "transform 0.7s ease, opacity 0.7s ease";

  // Animate slides
  currentSlide.style.transform = `translateY(${n > 0 ? "-100%" : "100%"})`;
  currentSlide.style.opacity = "0";
  nextSlide.style.transform = "translateY(0)";

  animating = true;
  setTimeout(() => {
    currentSlide.style.opacity = "0";
    currentSlide.style.transform = "translateY(0)";
    currentSlide.style.transition = "none";

    nextSlide.style.position = "relative";
    currentSlide.style.position = "absolute";

    slideIndex = nextSlideIndex;
    localStorage.setItem('slideIndex', slideIndex);
    animating = false;
  }, 700);
}

function setSlide(n) {
  const slides = document.getElementsByClassName("mySlides");
  Array.from(slides).forEach((slide, i) => {
    if (i === n - 1) {
      slide.style.opacity = "1";
      slide.style.position = "relative";
      slide.style.transition = "none";
      slide.style.transform = "none";
    } else {
      slide.style.opacity = "0";
      slide.style.position = "absolute";
      slide.style.transition = "none";
      slide.style.transform = "none";
    }
  });
}
setSlide(slideIndex);

// Debounce wheel events to prevent excessive calls.
let scrollDebounce;
window.addEventListener("wheel", (e) => {
  clearTimeout(scrollDebounce);
  scrollDebounce = setTimeout(() => {
    const direction = e.deltaY > 0 ? 1 : -1;
    changeSlide(direction);
  }, 100);
});

// ====================================================
// Clock Update with setInterval
// ====================================================
function updateClock() {
  const now = new Date();
  const day = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const dayOfMonth = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = `${day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()} ${dayOfMonth}-${month}-${year} ${time}`;
  document.getElementById('codes').textContent = dateString;
}
updateClock();
setInterval(updateClock, 1000);

// ====================================================
// Canvas Particle Animation with Optimized Collision Detection and Attraction
// ====================================================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let width, height, particles;

// Configuration Options
const opts = {
  particleColor: "rgb(143, 143, 143)",
  lineColor: "rgb(143, 143, 143)",
  particleAmount: 40, // Reduced particle count from 80 to 40
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

// Check for OffscreenCanvas support; if available, you might consider offloading
// your animation work to a Web Worker. (Full implementation would require further refactoring.)
if (canvas.transferControlToOffscreen) {
  console.log("OffscreenCanvas is available. Consider moving the particle animation to a Web Worker for better performance.");
}

// Canvas resize with debounce on window resizing.
function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener("resize", () => {
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(resizeCanvas, 200);
});
resizeCanvas();

// Mouse event listeners.
document.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
document.addEventListener('mousedown', () => {
  mouse.pressed = true;
});
document.addEventListener('mouseup', () => {
  mouse.pressed = false;
});

// ----------------------------------------------------
// Particle Class with Unique IDs
// ----------------------------------------------------
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

// ----------------------------------------------------
// Optimized Collision Detection via Spatial Hashing
// ----------------------------------------------------
function detectCollisionsOptimized(particlesArray) {
  const cellSize = 50; // Tune this size as needed
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
                // Elastic collision: swap vectors.
                const temp = { x: p1.vector.x, y: p1.vector.y };
                p1.vector.x = p2.vector.x;
                p1.vector.y = p2.vector.y;
                p2.vector.x = temp.x;
                p2.vector.y = temp.y;
                // Resolve any overlap.
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

// ----------------------------------------------------
// Optimized Attraction Using Spatial Hashing
// ----------------------------------------------------
function applyAttractionOptimized(particlesArray) {
  const cellSize = 50; // Same as used for collisions.
  const grid = new Map();
  
  function getCellKey(x, y) {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return `${col},${row}`;
  }
  
  // Populate grid with particles.
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

// ----------------------------------------------------
// Particle Connection Drawing
// ----------------------------------------------------
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

// ----------------------------------------------------
// Main Animation Loop with Reduced Frequency for Connections
// ----------------------------------------------------
let frameCount = 0;
function loop() {
  // Apply optimized attraction using spatial hashing.
  applyAttractionOptimized(particles);

  // Mouse interaction remains the same.
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

  // Optimized collision detection remains unchanged.
  detectCollisionsOptimized(particles);

  // Draw connections only every 2 frames to save performance.
  if (frameCount % 2 === 0) {
    drawConnections(particles);
  }
  frameCount++;

  requestAnimationFrame(loop);
}

function setup() {
  particles = [];
  for (let i = 0; i < opts.particleAmount; i++) {
    particles.push(new Particle());
  }
  loop();
}
setup();
