(function () {
  'use strict';
  
  // ====================
  // Slideshow & Clock Setup (Main Thread)
  // ====================
  const videoPath = 'assets/';
  const videoCount = 23;
  // Support both .webm and .mp4 per slide
  const videos = Array.from({ length: videoCount }, (_, i) => ({
    mp4: `Side${i + 1}.mp4`
  }));

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
    return Math.floor(seededRandom(getSeed()) * videoCount) + 1;
  }

  // Slide index initialization with localStorage
  let slideIndex = localStorage.getItem('slideIndex');
  const dailyDefault = getDailyDefaultSlideIndex();
  const currentDate = new Date().toDateString();

  if (!slideIndex) {
    slideIndex = dailyDefault;
    localStorage.setItem('slideIndex', slideIndex);
  } else {
    slideIndex = parseInt(slideIndex, 10);
    if (localStorage.getItem('lastAccessedDate') !== currentDate) {
      slideIndex = dailyDefault;
      localStorage.setItem('slideIndex', slideIndex);
    }
  }
  localStorage.setItem('lastAccessedDate', currentDate);

  // Build slideshow HTML once (with dual-format and preload)
  let slideshowHTML = '';
  videos.forEach((vid) => {
    slideshowHTML += `
      <div class="mySlides">
        <video 
          preload="auto" 
          autoplay muted loop playsinline 
          style="cursor:pointer; width:100%; height:auto;" 
          onclick="changeSlide(1)">      
          <source src="${videoPath}${vid.mp4}" type="video/mp4">
        </video>
      </div>
    `;
  });
  slideshow.innerHTML = slideshowHTML;

  let animating = false;

  // Slide change function with optimized transitions.
  window.changeSlide = function (n) {
    if (animating) return;
    const slides = document.getElementsByClassName('mySlides');
    const total = slides.length;
    let next = slideIndex + n;
    if (next > total) next = 1;
    else if (next < 1) next = total;

    const currSlide = slides[slideIndex - 1];
    const nextSlide = slides[next - 1];

    // Prepare next slide
    nextSlide.style.transition = 'none';
    nextSlide.style.transform = `translateY(${n > 0 ? '100%' : '-100%'})`;
    nextSlide.style.opacity = '1';
    nextSlide.offsetHeight; // force reflow
    nextSlide.style.transition = 'transform 0.7s ease, opacity 0.7s ease';

    // Animate
    currSlide.style.transform = `translateY(${n > 0 ? '-100%' : '100%'})`;
    currSlide.style.opacity = '0';
    nextSlide.style.transform = 'translateY(0)';

    animating = true;
    setTimeout(() => {
      // Reset styles
      currSlide.style.opacity = '0';
      currSlide.style.transform = 'translateY(0)';
      currSlide.style.transition = 'none';
      nextSlide.style.position = 'relative';
      currSlide.style.position = 'absolute';

      slideIndex = next;
      localStorage.setItem('slideIndex', slideIndex);
      animating = false;
    }, 700);
  };

  // Set initial slide visibility
  function setSlide(n) {
    const slides = document.getElementsByClassName('mySlides');
    Array.from(slides).forEach((slide, i) => {
      if (i === n - 1) {
        slide.style.opacity = '1';
        slide.style.position = 'relative';
        slide.style.transition = 'none';
        slide.style.transform = 'none';
      } else {
        slide.style.opacity = '0';
        slide.style.position = 'absolute';
        slide.style.transition = 'none';
        slide.style.transform = 'none';
      }
    });
  }
  setSlide(slideIndex);

  // Debounced wheel navigation
  let debounce;
  window.addEventListener('wheel', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => changeSlide(e.deltaY > 0 ? 1 : -1), 100);
  });

  // Clock update
  function updateClock() {
    const now = new Date();
    const day = now.toLocaleDateString('en-GB', { weekday: 'long' });
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('codes').textContent =
      `${day.charAt(0).toUpperCase()}${day.slice(1).toLowerCase()} ${dd}-${mm}-${yyyy} ${time}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ====================
  // OffscreenCanvas & Web Worker Setup (Particle Animation)
  // ====================
  const canvas = document.getElementById('canvas');
  if (canvas.transferControlToOffscreen) {
    const offscreen = canvas.transferControlToOffscreen();
    const worker = new Worker('worker.js');

    worker.postMessage({
      type: 'init',
      canvas: offscreen,
      width: window.innerWidth,
      height: window.innerHeight
    }, [offscreen]);

    const state = { x: null, y: null, pressed: false };
    function sendMouseEvent(e, pressed = state.pressed) {
      state.x = e.clientX;
      state.y = e.clientY;
      state.pressed = pressed;
      worker.postMessage({ type: 'mouse', ...state });
    }

    ['mousemove', 'mousedown', 'mouseup'].forEach((type) =>
      document.addEventListener(type, (e) => {
        const pressed = type === 'mousedown' ? true : type === 'mouseup' ? false : state.pressed;
        sendMouseEvent(e, pressed);
      })
    );

    window.addEventListener('resize', () =>
      worker.postMessage({ type: 'resize', width: window.innerWidth, height: window.innerHeight })
    );
  } else {
    console.error('OffscreenCanvas is not supported by your browser.');
  }
})();
