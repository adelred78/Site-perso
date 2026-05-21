/**
 * Fond animé du hero : particules connectées (effet réseau / constellation).
 * Léger en perfo : ~28 particules, dessin via requestAnimationFrame.
 */

const CONFIG = {
  count: 28,
  maxDistance: 140,
  speed: 0.25,
  particleSize: 1.6,
};

// Couleurs adaptatives selon le thème actif
function getColors() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    return {
      particle: 'rgba(14, 165, 233, 0.55)',
      line: 'rgba(14, 165, 233, ',
      lineAlphaMax: 0.22,
    };
  }
  return {
    particle: 'rgba(56, 189, 248, 0.7)',
    line: 'rgba(56, 189, 248, ',
    lineAlphaMax: 0.35,
  };
}

export function initBgParticles() {
  const canvas = document.querySelector('[data-bg-particles]');
  if (!canvas) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let particles = [];
  let rafId = null;
  let pointer = { x: -9999, y: -9999, active: false };
  let colors = getColors();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Re-lire les couleurs si le thème change
  const themeObserver = new MutationObserver(() => {
    colors = getColors();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    particles = Array.from({ length: CONFIG.count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * CONFIG.speed,
      vy: (Math.random() - 0.5) * CONFIG.speed,
      r: CONFIG.particleSize + Math.random() * 0.8,
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    // Move + draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Bounce on edges
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Pointer slight attraction
      if (pointer.active) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 180 && dist > 0) {
          p.x += (dx / dist) * 0.15;
          p.y += (dy / dist) * 0.15;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = colors.particle;
      ctx.fill();
    }

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < CONFIG.maxDistance) {
          const alpha = (1 - dist / CONFIG.maxDistance) * colors.lineAlphaMax;
          ctx.strokeStyle = colors.line + alpha + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    rafId = requestAnimationFrame(step);
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;
  }
  function onPointerLeave() {
    pointer.active = false;
    pointer.x = -9999;
    pointer.y = -9999;
  }

  resize();
  createParticles();
  step();

  let resizeRaf = null;
  window.addEventListener('resize', () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resize();
      createParticles();
    });
  });

  canvas.parentElement.addEventListener('mousemove', onPointerMove);
  canvas.parentElement.addEventListener('mouseleave', onPointerLeave);

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
    } else {
      step();
    }
  });
}
