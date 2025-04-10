(() => {
    'use strict';
    
    let canvas, ctx, width, height, particles;
    let particleIdCounter = 0;
    const mouse = { x: null, y: null, pressed: false };
  
    // Configuration Options.
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
  
    // --------------------
    // Particle Class & Initialization
    // --------------------
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
        this.x += this.vector.x;
        this.y += this.vector.y;
        this.checkBorders();
        // Clamp the vector speed if above maxSpeed.
        const speedSq = this.vector.x ** 2 + this.vector.y ** 2;
        if (speedSq > opts.maxSpeed ** 2) {
          const currentSpeed = Math.sqrt(speedSq);
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
  
    const initParticles = () => {
      particles = [];
      particleIdCounter = 0;
      for (let i = 0; i < opts.particleAmount; i++) {
        particles.push(new Particle());
      }
    };
  
    // --------------------
    // Canvas Resize Helper
    // --------------------
    const resizeCanvas = () => {
      width = canvas.width = self.innerWidth;
      height = canvas.height = self.innerHeight;
    };
    self.addEventListener("resize", resizeCanvas);
  
    // --------------------
    // Grid Helpers for Spatial Hashing
    // --------------------
    const buildGrid = (particlesArray, cellSize) => {
      const grid = new Map();
      const getCellKey = (x, y) => {
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        return `${col},${row}`;
      };
      particlesArray.forEach(p => {
        const key = getCellKey(p.x, p.y);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(p);
      });
      return { grid, getCellKey };
    };
  
    // --------------------
    // Collision Detection (Spatial Hashing)
    // --------------------
    const detectCollisionsOptimized = (particlesArray) => {
      const cellSize = 50;
      const { grid, getCellKey } = buildGrid(particlesArray, cellSize);
      const checkedPairs = new Set();
  
      grid.forEach((cellParticles, key) => {
        const [col, row] = key.split(',').map(Number);
        for (let dc = -1; dc <= 1; dc++) {
          for (let dr = -1; dr <= 1; dr++) {
            const neighborKey = `${col + dc},${row + dr}`;
            if (!grid.has(neighborKey)) continue;
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
                  // Swap vectors.
                  const temp = { x: p1.vector.x, y: p1.vector.y };
                  p1.vector.x = p2.vector.x;
                  p1.vector.y = p2.vector.y;
                  p2.vector.x = temp.x;
                  p2.vector.y = temp.y;
                  // Correct positions.
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
      });
    };
  
    // --------------------
    // Attraction Force using Spatial Hashing
    // --------------------
    const applyAttractionOptimized = (particlesArray) => {
      const cellSize = 50;
      const { grid, getCellKey } = buildGrid(particlesArray, cellSize);
      const checkedPairs = new Set();
  
      grid.forEach((cellParticles, key) => {
        const [col, row] = key.split(',').map(Number);
        for (let dc = -1; dc <= 1; dc++) {
          for (let dr = -1; dr <= 1; dr++) {
            const neighborKey = `${col + dc},${row + dr}`;
            if (!grid.has(neighborKey)) continue;
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
      });
    };
  
    // --------------------
    // Draw Particle Connections
    // --------------------
    const drawConnectionsOptimized = (particlesArray) => {
      const cellSize = 250;
      const { grid, getCellKey } = buildGrid(particlesArray, cellSize);
      const rgb = opts.lineColor.match(/\d+/g);
      const checkedPairs = new Set();
  
      grid.forEach((cellParticles, key) => {
        const [col, row] = key.split(',').map(Number);
        for (let dc = -1; dc <= 1; dc++) {
          for (let dr = -1; dr <= 1; dr++) {
            const neighborKey = `${col + dc},${row + dr}`;
            if (!grid.has(neighborKey)) continue;
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
                if (distSq < opts.linkRadiusSq) {
                  const distance = Math.sqrt(distSq);
                  const opacity = 1 - distance / opts.linkRadius;
                  ctx.lineWidth = 0.5;
                  ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
                  ctx.beginPath();
                  ctx.moveTo(p1.x, p1.y);
                  ctx.lineTo(p2.x, p2.y);
                  ctx.stroke();
                }
              }
            }
          }
        }
      });
    };
  
    // --------------------
    // Main Animation Loop
    // --------------------
    function loop() {
      applyAttractionOptimized(particles);
  
      // Mouse interaction: apply force based on mouse proximity.
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
      drawConnectionsOptimized(particles);
  
      self.requestAnimationFrame(loop);
    }
  
    // --------------------
    // Message Listener from the Main Thread
    // --------------------
    self.onmessage = (event) => {
      const data = event.data;
    
      if (data.type === 'init') {
        canvas = data.canvas;
        ctx = canvas.getContext("2d");
        width = canvas.width = data.width;
        height = canvas.height = data.height;
        initParticles();
        loop();
      } else if (data.type === 'mouse') {
        mouse.x = data.x;
        mouse.y = data.y;
        mouse.pressed = data.pressed;
      } else if (data.type === 'resize') {
        width = canvas.width = data.width;
        height = canvas.height = data.height;
      }
    };
  })();
  