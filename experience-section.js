/**
 * ExperienceSection — "Where I've Been"
 * Horizontal timeline driven by native vertical scroll.
 *
 * The stage position is derived directly from the scroll position every frame
 * (no lerp/inertia), so it can never lag behind the page. That lag is what used
 * to let the section unpin — and the Explorations section scroll in — before
 * the last chapter had arrived.
 *
 * The vertical track is split into:
 *   [0, HOLD_START)              intro rests before moving
 *   [HOLD_START, 1 - HOLD_END]   horizontal travel, 1:1 with scroll
 *   (1 - HOLD_END, 1]            last chapter rests fully in view before unpinning
 */

const HOLD_START = 0.04;
const HOLD_END = 0.12;
const TRAVEL = 1 - HOLD_START - HOLD_END;

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function initExperienceSection() {
  const section = document.getElementById('experience');
  const stage = document.getElementById('exp-horizontal-stage');
  const viewport = document.getElementById('exp-sticky-viewport');
  if (!section || !stage || !viewport) return;

  const tickerTop = document.getElementById('exp-ticker-top');
  const tickerBottom = document.getElementById('exp-ticker-bottom');
  const hudProgress = document.getElementById('exp-hud-progress');
  const hudPhase = document.getElementById('exp-hud-phase');
  const dateBgs = Array.from(section.querySelectorAll('.exp-date-bg'));
  const panels = Array.from(stage.querySelectorAll('.exp-panel'));
  const jumpButtons = Array.from(section.querySelectorAll('.exp-jump-btn'));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Geometry (measured, never assumed — panel widths differ between mobile and desktop)
  let totalDist = 0;    // vertical scroll distance while pinned
  let maxTranslate = 0; // horizontal distance the stage travels
  let stops = [];       // stage translate at which each panel is aligned to the left edge

  function measure() {
    // Use the sticky viewport's real height (100dvh) rather than innerHeight so
    // mobile URL-bar resizing can't skew the track length.
    totalDist = Math.max(0, section.offsetHeight - viewport.offsetHeight);
    // Travel ends when the last panel's right edge meets the viewport's right edge.
    // (scrollWidth is not used: overflowing content inside a panel inflates it.)
    const last = panels[panels.length - 1];
    maxTranslate = last
      ? Math.max(0, last.offsetLeft + last.offsetWidth - viewport.clientWidth)
      : 0;
    stops = panels.map((p) => Math.min(p.offsetLeft, maxTranslate));
  }

  let activeIndex = -1;

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;

    if (hudPhase && panels[index]) {
      hudPhase.textContent = panels[index].dataset.expPhase || '';
    }

    jumpButtons.forEach((btn) => {
      const isCurrent = Number(btn.dataset.expTarget) === index;
      btn.classList.toggle('text-white', isCurrent);
      btn.classList.toggle('bg-white/20', isCurrent);
      btn.classList.toggle('border-white/40', isCurrent);
      btn.classList.toggle('text-neutral-500', !isCurrent);
      btn.classList.toggle('border-white/5', !isCurrent);
      if (isCurrent) btn.setAttribute('aria-current', 'step');
      else btn.removeAttribute('aria-current');
    });
  }

  function render() {
    rafId = 0;
    if (reducedMotion.matches) {
      stage.style.transform = 'none';
      return;
    }

    const scrolled = -section.getBoundingClientRect().top;
    const raw = totalDist > 0 ? clamp01(scrolled / totalDist) : 0;
    const progress = clamp01((raw - HOLD_START) / TRAVEL);
    const x = -progress * maxTranslate;

    stage.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;

    for (const el of dateBgs) {
      const factor = parseFloat(el.dataset.parallaxFactor || '0.15');
      el.style.transform = `translate3d(${(-x * factor).toFixed(2)}px, 0, 0)`;
    }
    if (tickerTop) tickerTop.style.transform = `translate3d(${(x * 0.35).toFixed(2)}px, 0, 0)`;
    if (tickerBottom) tickerBottom.style.transform = `translate3d(${(-x * 0.25).toFixed(2)}px, 0, 0)`;
    if (hudProgress) hudProgress.style.width = `${(progress * 100).toFixed(1)}%`;

    // Active chapter = the panel whose stop is closest to the current position
    const pos = -x;
    let nearest = 0;
    for (let i = 1; i < stops.length; i++) {
      if (Math.abs(stops[i] - pos) < Math.abs(stops[nearest] - pos)) nearest = i;
    }
    setActive(nearest);
  }

  let rafId = 0;
  function requestRender() {
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  function remeasure() {
    measure();
    requestRender();
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(remeasure);
    ro.observe(stage);
    ro.observe(viewport);
  }
  reducedMotion.addEventListener?.('change', remeasure);

  // Chapter jump buttons: scroll the page to the point where that panel is aligned
  jumpButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const index = Number(btn.dataset.expTarget);
      if (!panels[index]) return;
      measure();
      const progress = maxTranslate > 0 ? stops[index] / maxTranslate : 0;
      const raw = HOLD_START + progress * TRAVEL;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: sectionTop + raw * totalDist, behavior: 'smooth' });
    });
  });

  remeasure();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExperienceSection);
} else {
  initExperienceSection();
}
