(() => {
	// === Slideshow Setup ===
	const imagePath = 'assets/';
	const totalImages = 23;
	const images = Array.from({ length: totalImages }, (_, i) => `side${i + 1}.gif`);
  
	const getSeed = () => {
	  const now = new Date();
	  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
	};
  
	const seededRandom = (seed) => Math.abs(Math.sin(seed) * 10000) % 1;
  
	const getDailyDefaultSlideIndex = () => Math.floor(seededRandom(getSeed()) * totalImages) + 1;
  
	let slideIndex = parseInt(localStorage.getItem('slideIndex')) || getDailyDefaultSlideIndex();
	const lastAccessedDate = localStorage.getItem('lastAccessedDate');
	const currentDate = new Date().toDateString();
  
	if (lastAccessedDate !== currentDate) {
	  slideIndex = getDailyDefaultSlideIndex();
	  localStorage.setItem('slideIndex', slideIndex);
	}
	localStorage.setItem('lastAccessedDate', currentDate);
  
	const slideshow = document.getElementById('slideshow');
	const frag = document.createDocumentFragment();
	images.forEach(() => {
	  const slideDiv = document.createElement('div');
	  slideDiv.classList.add('mySlides');
	  const img = document.createElement('img');
	  img.src = imagePath + images.shift();
	  img.style.cursor = "pointer";
	  img.addEventListener('click', () => changeSlide(1));
	  slideDiv.appendChild(img);
	  frag.appendChild(slideDiv);
	});
	slideshow.appendChild(frag);
  
	function changeSlide(n) {
	  setSlide(slideIndex + n);
	}
  
	function setSlide(n) {
	  const slides = document.getElementsByClassName("mySlides");
	  const count = slides.length;
	  slideIndex = n > count ? 1 : n < 1 ? count : n;
	  Array.from(slides).forEach((slide, i) => {
		slide.style.opacity = (i === slideIndex - 1) ? "1" : "0";
		slide.style.transition = "opacity 0.7s";
	  });
	  localStorage.setItem('slideIndex', slideIndex);
	}
  
	setSlide(slideIndex);
  
	// === Clock Update ===
	const updateClock = () => {
	  const now = new Date();
	  const day = now.toLocaleDateString('en-GB', { weekday: 'long' });
	  const dayOfMonth = String(now.getDate()).padStart(2, '0');
	  const month = String(now.getMonth() + 1).padStart(2, '0');
	  const year = now.getFullYear();
	  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	  const dateString = `${day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()} ${dayOfMonth}-${month}-${year} ${time}`;
	  document.getElementById('codes').textContent = dateString;
	};
	
	updateClock();
	setInterval(updateClock, 1000);
  
	// === Canvas Background Animation ===
	const canvasBody = document.getElementById("canvas");
	const drawArea = canvasBody.getContext("2d");
	let w, h, particles = [];
  
	const opts = {
	  particleColor: "rgb(143, 143, 143)",
	  lineColor: "rgb(143, 143, 143)",
	  particleAmount: 100,
	  defaultSpeed: 0.5,
	  variantSpeed: 0.5,
	  defaultRadius: 2,
	  variantRadius: 2,
	  linkRadius: 250,
	};
  
	function resizeReset() {
	  w = canvasBody.width = window.innerWidth;
	  h = canvasBody.height = window.innerHeight;
	}
  
	window.addEventListener("resize", () => {
	  clearTimeout(window.resizeTimeout);
	  window.resizeTimeout = setTimeout(resizeReset, 200);
	});
  
	const checkDistance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  
	class Particle {
	  constructor() {
		this.x = Math.random() * w;
		this.y = Math.random() * h;
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
		this.x += this.vector.x;
		this.y += this.vector.y;
		this.border();
	  }
  
	  border() {
		if (this.x >= w || this.x <= 0) this.vector.x *= -1;
		if (this.y >= h || this.y <= 0) this.vector.y *= -1;
		this.x = Math.max(0, Math.min(w, this.x));
		this.y = Math.max(0, Math.min(h, this.y));
	  }
  
	  draw() {
		drawArea.beginPath();
		drawArea.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		drawArea.fillStyle = this.color;
		drawArea.fill();
	  }
	}
  
	function setupParticles() {
	  particles = [];
	  resizeReset();
	  for (let i = 0; i < opts.particleAmount; i++) {
		particles.push(new Particle());
	  }
	  animate();
	}
  
	function animate() {
	  drawArea.clearRect(0, 0, w, h);
	  particles.forEach(p => {
		p.update();
		p.draw();
	  });
	  
	  // Optimized linking: iterate over each particle pair only once.
	  for (let i = 0; i < particles.length; i++) {
		for (let j = i + 1; j < particles.length; j++) {
		  const p1 = particles[i];
		  const p2 = particles[j];
		  const distance = checkDistance(p1.x, p1.y, p2.x, p2.y);
		  if (distance < opts.linkRadius) {
			const opacity = 1 - distance / opts.linkRadius;
			const rgb = opts.lineColor.match(/\d+/g);
			drawArea.lineWidth = 0.5;
			drawArea.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
			drawArea.beginPath();
			drawArea.moveTo(p1.x, p1.y);
			drawArea.lineTo(p2.x, p2.y);
			drawArea.stroke();
		  }
		}
	  }
	  requestAnimationFrame(animate);
	}
  
	setupParticles();
  })();
  