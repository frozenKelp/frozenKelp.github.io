// Slideshow
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
const slideshow = document.getElementById('slideshow');
images.forEach((img, i) => {
	slideshow.innerHTML += `<div class="mySlides"><img src="${imagePath}${img}" style="cursor:pointer;" onclick="changeSlide(1)"></div>`;
});

function changeSlide(n) {
	setSlide(slideIndex + n);
}

function setSlide(n) {
	const slides = document.getElementsByClassName("mySlides");
	slideIndex = (n > slides.length) ? 1 : (n < 1) ? slides.length : n;
	[...slides].forEach((s, i) => {
		s.style.opacity = i === slideIndex - 1 ? "1" : "0";
		s.style.transition = "opacity .7s";
	});
	localStorage.setItem('slideIndex', slideIndex);
}

setSlide(slideIndex);

// Clock
function updateClock() {
	const now = new Date();
	const day = now.toLocaleDateString('en-GB', { weekday: 'long' });
	const dayOfMonth = String(now.getDate()).padStart(2, '0');
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const year = now.getFullYear();
	const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	const dateString = `${day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()} ${dayOfMonth}-${month}-${year} ${time}`;
	document.getElementById('codes').textContent = dateString;
	setTimeout(updateClock, 1000);
}
updateClock();
/******************************************************
 * Optimized Background Particle Animation with Mouse Interaction
 * 
 * Features:
 * - Particles with variable speed, collision, and optional attractions.
 * - Combined double loops for linking lines to avoid redundant calculations.
 * - Squared distance checks to avoid expensive square root operations.
 * - Mouse interactions: repelled by pointer, attracted when pressed.
 * - Speed limiting applied to the particles.
 ******************************************************/

/* ========= Canvas and Global Variables ========= */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let width, height, particles;

/* ========= Configuration Object ========= */
const opts = {
    // Colors and visual properties
    particleColor: "rgb(143, 143, 143)",
    lineColor: "rgb(143, 143, 143)",
    
    // Particle settings
    particleAmount: 80,
    defaultSpeed: 0.5,
    variantSpeed: 0.5,
    defaultRadius: 2,
    variantRadius: 2,
    maxSpeed: 2,          // Maximum speed for each particle
    
    // Connection settings
    linkRadius: 250,
    linkRadiusSq: 250 * 250,  // Squared value for performance
    
    // Mouse interaction settings
    interactionRadius: 200, // Radius for mouse influence
    interactionRadiusSq: 200 * 200,
    forceStrength: 100,     // Strength of mouse force
    
    // Attraction strength between particles
    attractionStrength: 0.05  // Strength for inter-particle attraction
};

/* ========= Global Mouse State ========= */
const mouse = {
    x: null,
    y: null,
    pressed: false,
};

/* ========= Canvas Resizing ========= */
function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener("resize", () => {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(resizeCanvas, 200);
});
resizeCanvas();

/* ========= Mouse Event Listeners ========= */
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

/* ========= Particle Class ========= */
class Particle {
    constructor() {
        // Initialize position
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Set initial speed and random direction
        this.speed = opts.defaultSpeed + Math.random() * opts.variantSpeed;
        this.directionAngle = Math.random() * Math.PI * 2;
        // Set particle visual styles
        this.color = opts.particleColor;
        this.radius = opts.defaultRadius + Math.random() * opts.variantRadius;
        // Compute initial velocity vector
        this.vector = {
            x: Math.cos(this.directionAngle) * this.speed,
            y: Math.sin(this.directionAngle) * this.speed
        };
    }

    // Update position, borders, and limit speed.
    update() {
        this.checkBorders();
        this.x += this.vector.x;
        this.y += this.vector.y;

        // Limit the particle's speed
        const currentSpeedSq = this.vector.x * this.vector.x + this.vector.y * this.vector.y;
        if (currentSpeedSq > opts.maxSpeed * opts.maxSpeed) {
            const currentSpeed = Math.sqrt(currentSpeedSq);
            const scale = opts.maxSpeed / currentSpeed;
            this.vector.x *= scale;
            this.vector.y *= scale;
        }
    }

    // Handle bouncing off the canvas edges
    checkBorders() {
        if (this.x >= width || this.x <= 0) this.vector.x *= -1;
        if (this.y >= height || this.y <= 0) this.vector.y *= -1;
        // Ensure particle remains within bounds
        this.x = Math.max(0, Math.min(width, this.x));
        this.y = Math.max(0, Math.min(height, this.y));
    }

    // Draw the particle as a circle.
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

/* ========= Particle Interactions ========= */

// Elastic collision detection and response between particles.
function detectCollisions(particlesArray) {
    for (let i = 0; i < particlesArray.length; i++) {
        for (let j = i + 1; j < particlesArray.length; j++) {
            const p1 = particlesArray[i];
            const p2 = particlesArray[j];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distSq = dx * dx + dy * dy;
            const minDist = p1.radius + p2.radius;
            if (distSq < minDist * minDist) {
                // Elastic collision: swap the velocity vectors
                const temp = { x: p1.vector.x, y: p1.vector.y };
                p1.vector.x = p2.vector.x;
                p1.vector.y = p2.vector.y;
                p2.vector.x = temp.x;
                p2.vector.y = temp.y;

                // Move particles apart to resolve overlapping.
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

// Apply gravitational attraction between particles.
function applyAttraction(particlesArray) {
    for (let i = 0; i < particlesArray.length; i++) {
        for (let j = i + 1; j < particlesArray.length; j++) {
            const p1 = particlesArray[i];
            const p2 = particlesArray[j];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distSq = dx * dx + dy * dy;
            // Apply attraction if particles are neither too far nor too close
            if (distSq < 10000 && distSq > 25) {
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

// Apply mouse interaction forces: repelling normally and attracting when mouse is pressed.
function applyMouseInteraction(particlesArray) {
    // Abort if mouse position is not available
    if (mouse.x === null || mouse.y === null) return;
    
    particlesArray.forEach(particle => {
        const dx = particle.x - mouse.x;
        const dy = particle.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < opts.interactionRadiusSq && distSq > 25) {
            const distance = Math.sqrt(distSq);
            let force = opts.forceStrength / distSq;
            // Reverse the force if the mouse is pressed (attraction)
            if (mouse.pressed) {
                force = -force;
            }
            particle.vector.x += (dx / distance) * force;
            particle.vector.y += (dy / distance) * force;
        }
    });
}

/* ========= Drawing Connection Lines ========= */
// Loop through unique pairs and draw a line if within the link radius.
function drawConnections(particlesArray) {
    // Extract RGB components once outside the loop.
    const rgb = opts.lineColor.match(/\d+/g);
    for (let i = 0; i < particlesArray.length; i++) {
        for (let j = i + 1; j < particlesArray.length; j++) {
            const dx = particlesArray[j].x - particlesArray[i].x;
            const dy = particlesArray[j].y - particlesArray[i].y;
            const distSq = dx * dx + dy * dy;
            // Draw line only if within the linkRadius
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

/* ========= Main Animation Loop ========= */
function loop() {
    // Apply particle forces from attraction and mouse interaction.
    applyAttraction(particles);
    applyMouseInteraction(particles);
    
    // Clear the canvas.
    ctx.clearRect(0, 0, width, height);

    // Update and draw each particle.
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Process collisions between particles.
    detectCollisions(particles);
    
    // Draw lines between nearby particles using a combined double loop.
    drawConnections(particles);

    // Schedule the next frame.
    requestAnimationFrame(loop);
}

/* ========= Initialization ========= */
function setup() {
    particles = [];
    // Create all particles.
    for (let i = 0; i < opts.particleAmount; i++) {
        particles.push(new Particle());
    }
    loop();
}

// Start the animation.
setup();
