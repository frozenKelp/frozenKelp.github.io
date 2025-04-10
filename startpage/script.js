// script.js

(function () {
  'use strict';
  
  // ====================
  // Slideshow & Clock Setup (Main Thread)
  // ====================
  const imagePath = 'assets/';
  const imageCount = 23;
  const images = Array.from({ length: imageCount }, (_, i) => `side${i + 1}.gif`);

  // Cache DOM elements
  const slideshow = document.getElementById('slideshow');
  const codesContainer = document.getElementById('codes');

  // Random seed functions for daily default slide index
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
    return Math.floor(seededRandom(seed) * imageCount) + 1;
  }

  // Slide index initialization with localStorage
  let slideIndex = localStorage.getItem('slideIndex');
  const dailyDefaultSlideIndex = getDailyDefaultSlideIndex();
  const currentDateString = new Date().toDateString();

  if (!slideIndex) {
    slideIndex = dailyDefaultSlideIndex;
    localStorage.setItem('slideIndex', slideIndex);
  } else {
    slideIndex = parseInt(slideIndex, 10);
    const lastAccessedDate = localStorage.getItem('lastAccessedDate');
    if (lastAccessedDate !== currentDateString) {
      slideIndex = dailyDefaultSlideIndex;
      localStorage.setItem('slideIndex', slideIndex);
    }
  }
  localStorage.setItem('lastAccessedDate', currentDateString);

  // Build slideshow HTML once to reduce reflows.
  let slideshowHTML = '';
  images.forEach((img) => {
    slideshowHTML += `<div class="mySlides">
      <img src="${imagePath}${img}" style="cursor:pointer;" onclick="changeSlide(1)">
    </div>`;
  });
  slideshow.innerHTML = slideshowHTML;

  let animating = false;

  // Slide change function with optimized transitions.
  window.changeSlide = function (n) { // Expose for inline onclick usage.
    if (animating) return;
    const slides = document.getElementsByClassName("mySlides");
    const totalSlides = slides.length;
    let nextSlideIndex = slideIndex + n;
    if (nextSlideIndex > totalSlides) nextSlideIndex = 1;
    else if (nextSlideIndex < 1) nextSlideIndex = totalSlides;

    const currentSlide = slides[slideIndex - 1];
    const nextSlide = slides[nextSlideIndex - 1];

    // Prepare next slide without animation (force reflow)
    nextSlide.style.transition = "none";
    nextSlide.style.transform = `translateY(${n > 0 ? "100%" : "-100%"})`;
    nextSlide.style.opacity = "1";
    nextSlide.offsetHeight; // Force reflow.
    nextSlide.style.transition = "transform 0.7s ease, opacity 0.7s ease";

    // Animate the current and next slides.
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
  };

  // Set slide visibility based on the current index.
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

  // Debounce for wheel event
  let scrollDebounce;
  window.addEventListener("wheel", (e) => {
    clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(() => {
      const direction = e.deltaY > 0 ? 1 : -1;
      changeSlide(direction);
    }, 100);
  });

  // Clock update function.
  function updateClock() {
    const now = new Date();
    const day = now.toLocaleDateString('en-GB', { weekday: 'long' });
    const dayOfMonth = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = `${day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()} ${dayOfMonth}-${month}-${year} ${time}`;
    codesContainer.textContent = dateString;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ====================
  // OffscreenCanvas & Web Worker Setup (Particle Animation)
  // ====================

  const canvas = document.getElementById("canvas");

  if (canvas.transferControlToOffscreen) {
    const offscreen = canvas.transferControlToOffscreen();
    const worker = new Worker('worker.js');

    // Initialize worker with OffscreenCanvas and current window dimensions.
    worker.postMessage({
      type: 'init',
      canvas: offscreen,
      width: window.innerWidth,
      height: window.innerHeight
    }, [offscreen]);

    // Consolidated mouse event handler function.
    const canvasState = { x: null, y: null, pressed: false };

    function sendMouseEvent(e, pressed = canvasState.pressed) {
      canvasState.x = e.clientX;
      canvasState.y = e.clientY;
      canvasState.pressed = pressed;
      worker.postMessage({
        type: 'mouse',
        x: canvasState.x,
        y: canvasState.y,
        pressed: canvasState.pressed,
      });
    }

    // Forward mouse events.
    ['mousemove', 'mousedown', 'mouseup'].forEach((eventType) => {
      document.addEventListener(eventType, (e) => {
        const isPressed = eventType === 'mousedown' ? true :
                          eventType === 'mouseup' ? false :
                          canvasState.pressed;
        sendMouseEvent(e, isPressed);
      });
    });

    // Resize event forwarding.
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
  // The main thread continues running the slideshow and clock functionalities.
})();
