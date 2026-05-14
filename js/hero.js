/**
 * Interactivité du hero : tilt 3D suivant la souris + spot de lumière.
 */

const TILT_MAX = 14; // degrés max sur chaque axe

export function initHero() {
  const card = document.querySelector('.code-window');
  if (!card) return;

  // Respect des préférences d'animation
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  let rafId = null;
  let isHovering = false;

  const onMove = (e) => {
    if (!isHovering) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const tiltY = (x - 0.5) * TILT_MAX * 2;
    const tiltX = -(y - 0.5) * TILT_MAX * 2;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      card.style.transform = `perspective(1200px) rotateY(${tiltY}deg) rotateX(${tiltX}deg) translateY(-6px) scale(1.02)`;
    });
  };

  const onEnter = () => {
    isHovering = true;
    card.classList.add('is-active');
  };

  const onLeave = () => {
    isHovering = false;
    card.classList.remove('is-active');
    card.style.transform = '';
    card.style.removeProperty('--mx');
    card.style.removeProperty('--my');
  };

  card.addEventListener('mouseenter', onEnter);
  card.addEventListener('mousemove', onMove);
  card.addEventListener('mouseleave', onLeave);
}
