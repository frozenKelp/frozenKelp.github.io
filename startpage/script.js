// script.js

// ====================
// Slideshow & Clock Setup (Main Thread)
// ====================

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

// Build slideshow HTML once to reduce reflows.
const slideshow = document.getElementById('slideshow');
let slideshowHTML = '';
images.forEach((img) => {
  slideshowHTML += `<div class="mySlides">
    <img src="${imagePath}${img}" style="cursor:pointer;" onclick="changeSlide(1)">
  </div>`;
});
slideshow.innerHTML = slideshowHTML;

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

  // Prepare next slide.
  nextSlide.style.transition = "none";
  nextSlide.style.transform = `translateY(${n > 0 ? "100%" : "-100%"})`;
  nextSlide.style.opacity = "1";
  nextSlide.offsetHeight; // Force reflow.
  nextSlide.style.transition = "transform 0.7s ease, opacity 0.7s ease";

  // Animate slides.
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

let scrollDebounce;
window.addEventListener("wheel", (e) => {
  clearTimeout(scrollDebounce);
  scrollDebounce = setTimeout(() => {
    const direction = e.deltaY > 0 ? 1 : -1;
    changeSlide(direction);
  }, 100);
});

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

// ====================
// OffscreenCanvas & Web Worker Setup (Particle Animation)
// ====================

// Get the canvas element.
const canvas = document.getElementById("canvas");

// Check if OffscreenCanvas is supported.
if (canvas.transferControlToOffscreen) {
  // Create an OffscreenCanvas from the main canvas.
  const offscreen = canvas.transferControlToOffscreen();

  // Create a new worker from worker.js.
  const worker = new Worker('worker.js');

  // Post initial data including the OffscreenCanvas reference.
  worker.postMessage({
    type: 'init',
    canvas: offscreen,
    width: window.innerWidth,
    height: window.innerHeight
  }, [offscreen]);

  // Forward mouse move events.
  document.addEventListener('mousemove', (e) => {
    worker.postMessage({
      type: 'mouse',
      x: e.clientX,
      y: e.clientY,
      pressed: false
    });
  });
  document.addEventListener('mousedown', (e) => {
    worker.postMessage({
      type: 'mouse',
      x: e.clientX,
      y: e.clientY,
      pressed: true
    });
  });
  document.addEventListener('mouseup', (e) => {
    worker.postMessage({
      type: 'mouse',
      x: e.clientX,
      y: e.clientY,
      pressed: false
    });
  });

  // Forward window resize events.
  window.addEventListener("resize", () => {
    worker.postMessage({
      type: 'resize',
      width: window.innerWidth,
      height: window.innerHeight
    });
  });
} else {
  console.error("OffscreenCanvas is not supported by your browser.");
}

// The rest of the main thread code (slideshow and clock) remains active.
