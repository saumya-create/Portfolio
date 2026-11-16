/**
 * ProjectStack — sticky stacking cards for "Project Highlights".
 *
 * Each card lives in an 85vh wrapper that is position: sticky with a
 * progressive top offset (index * 28px), so every new card slides up over the
 * previous one and leaves a 28px edge of it visible.
 *
 * Scaling mirrors the Framer Motion recipe:
 *   const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] })
 *   const scale = useTransform(scrollYProgress, [index / total, 1], [1, targetScale])
 *   targetScale = 1 - (total - 1 - index) * 0.03
 * implemented here with a single passive scroll listener + rAF, writing only
 * `transform` and `opacity` (compositor-friendly). No wheel hijacking, no scroll locking.
 *
 * Polish on top of the base recipe: incoming cards tilt back slightly and settle
 * flat as they land; covered cards dim; scale/dim ease toward the scroll position.
 */

export const PROJECTS = [
  {
    title: 'Raisn Website',
    category: 'Website Design',
    image: 'Project Images/Raisn website.png',
    href: 'https://raisn.ai/'
  },
  {
    title: 'Billing Page UI',
    category: 'Product UI',
    image: 'Project Images/Billing Page.png',
    href: 'https://www.figma.com/design/3aKDmsT0bqoQl1R4D5dl0u/Billing-page?node-id=0-1&t=JuJ8wJ0m6EugALdu-1'
  },
  {
    title: 'AI Voice Assistant App',
    category: 'AI Product',
    image: 'Project Images/AI voice assistant app.png',
    href: 'https://jovial-cat-fabc7f.netlify.app'
  },
  {
    title: 'AI Campaign Manager',
    category: 'AI Product',
    image: 'Project Images/AI campaign manager.png',
    href: 'https://celebrated-haupia-93df03.netlify.app/'
  },
  {
    title: 'Real Estate Client App',
    category: 'App Design',
    image: 'Project Images/Realestate voice bot.png',
    href: 'https://www.figma.com/design/aONd9W8PQ6x7KKQ7b86tPK/Real-Estate-Voice-bot-app?node-id=0-1&t=pKF4U3XeLuR4svhR-1'
  },
  {
    title: 'RCTCET Website',
    category: 'Website Design',
    image: 'Project Images/RCTCET website.png',
    href: 'https://vermillion-alfajores-ff7861.netlify.app'
  },
  {
    title: 'Dream Visualization App',
    category: 'AI Product',
    image: 'Project Images/Deja Vu Hackathon.png',
    href: 'https://comfy-heliotrope-13a8e4.netlify.app/'
  }
];

// Until dedicated screenshots exist, each card frames different areas of the
// project's main image. Add `images: [topLeft, bottomLeft, right]` to a
// project above to use separate images instead.
const FALLBACK_FRAMING = ['0% 0%', '100% 100%', '50% 0%'];

const SCALE_STEP = 0.03;   // scale lost per card stacked on top (reference formula)
const EASE_MS = 90;        // time constant for easing scale/dim toward scroll progress
const ENTRY_RANGE = 0.75;  // viewport heights over which an incoming card settles
const ENTRY_TILT = 9;      // max backward tilt (deg) of an incoming card
const ENTRY_SHRINK = 0.05; // max extra shrink of an incoming card
const MAX_SHADE = 0.55;    // darkness of a card once fully covered

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (t) => t * t * (3 - 2 * t);

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function imageTile(src, alt, framing, extraClass) {
  return (
    `<div class="${extraClass} min-h-0 rounded-2xl overflow-hidden border border-white/80 bg-[#161616]">` +
      `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" draggable="false" ` +
      `class="w-full h-full object-cover select-none" style="object-position: ${framing};">` +
    `</div>`
  );
}

function cardMarkup(item, i) {
  const number = String(i + 1).padStart(2, '0');
  const imgs = item.images && item.images.length >= 3
    ? item.images.slice(0, 3)
    : [item.image, item.image, item.image];
  const framing = item.images && item.images.length >= 3 ? ['50% 50%', '50% 50%', '50% 50%'] : FALLBACK_FRAMING;
  const isFigma = /figma\.com/.test(item.href || '');
  const linkLabel = isFigma ? 'View Design' : 'Live Project';

  const link = item.href
    ? `<a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer" ` +
        `class="shrink-0 inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-[#D7E2EA] bg-transparent text-[10px] md:text-xs font-bold tracking-wider uppercase text-[#D7E2EA] ` +
        `transition-colors duration-300 hover:bg-[#D7E2EA] hover:text-[#0C0C0C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D7E2EA]" ` +
        `aria-label="${esc(linkLabel)}: ${esc(item.title)} (opens in a new tab)">` +
        `${linkLabel}` +
        `<svg class="w-3.5 h-3.5 -rotate-45" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke-linecap="round" stroke-linejoin="round"></path></svg>` +
      `</a>`
    : '';

  return (
    `<div class="ps-wrap" style="--ps-i: ${i};">` +
      `<article class="ps-card relative w-full flex flex-col rounded-2xl md:rounded-3xl border border-[#2E2E2E] bg-[#0C0C0C] bg-gradient-to-br from-[#262626] via-[#161616] to-[#0A0A0A] p-4 sm:p-6 md:p-8" ` +
        `aria-label="${esc(item.title)}">` +

        // Top: number, category, name, live link
        `<header class="flex items-start justify-between gap-4 px-2 md:px-3 pt-1 pb-4 md:pb-6">` +
          `<div class="flex items-start gap-4 md:gap-8 min-w-0">` +
            `<span class="pt-0.5 text-xs md:text-sm font-semibold tracking-widest uppercase text-neutral-400">${number}</span>` +
            `<div class="min-w-0">` +
              `<p class="mb-1 md:mb-1.5 text-[10px] md:text-[11px] font-semibold tracking-widest uppercase text-[#D7E2EA]/60">${esc(item.category || 'Featured Project')}</p>` +
              `<h3 class="text-xl sm:text-2xl md:text-4xl font-medium tracking-[-0.01em] leading-tight text-[#D7E2EA]">${esc(item.title)}</h3>` +
            `</div>` +
          `</div>` +
          link +
        `</header>` +

        // Bottom: 40% (two stacked) / 60% (one tall)
        `<div class="flex-1 min-h-0 flex gap-2 sm:gap-3 md:gap-4">` +
          `<div class="w-[40%] min-h-0 flex flex-col gap-2 sm:gap-3 md:gap-4">` +
            imageTile(imgs[0], `${item.title} — detail 1`, framing[0], 'flex-1') +
            imageTile(imgs[1], `${item.title} — detail 2`, framing[1], 'flex-1') +
          `</div>` +
          imageTile(imgs[2], item.title, framing[2], 'w-[60%]') +
        `</div>` +
        // Darkens as later cards stack on top, giving the layers depth
        `<div class="ps-shade" aria-hidden="true"></div>` +
      `</article>` +
    `</div>`
  );
}

export function initProjectStack(container, items = PROJECTS) {
  if (!container || !items.length) return null;

  const total = items.length;
  container.style.setProperty('--ps-n', String(total));
  container.innerHTML =
    items.map(cardMarkup).join('') +
    // Lets the final card rest briefly before the whole stack scrolls away together
    `<div class="ps-tail" aria-hidden="true"></div>`;

  const wraps = Array.from(container.querySelectorAll('.ps-wrap'));
  const cards = wraps.map((w) => w.querySelector('.ps-card'));
  const shades = wraps.map((w) => w.querySelector('.ps-shade'));
  const ranges = cards.map((_, i) => ({
    start: i / total,
    target: 1 - (total - 1 - i) * SCALE_STEP
  }));
  const maxScaleLoss = Math.max(SCALE_STEP, (total - 1) * SCALE_STEP);

  // Each wrapper's sticky top in px (depends on viewport width via --ps-top)
  let stickTops = [];
  const measure = () => {
    stickTops = wraps.map((w) => parseFloat(getComputedStyle(w).top) || 0);
  };
  measure();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let rafId = 0;
  let inView = false;
  let smooth = null; // eased copy of the scroll progress
  let lastTime = 0;

  function render(now) {
    rafId = 0;
    if (reducedMotion.matches) {
      cards.forEach((c) => { c.style.transform = ''; });
      shades.forEach((s) => { s.style.opacity = '0'; });
      smooth = null;
      return;
    }

    // --- Reads first (avoid layout thrash) ---
    // useScroll({ target: container, offset: ['start start', 'end end'] })
    const vh = window.innerHeight;
    const rect = container.getBoundingClientRect();
    const span = container.offsetHeight - vh;
    const progress = span > 0 ? clamp01(-rect.top / span) : 0;
    const wrapTops = wraps.map((w) => w.getBoundingClientRect().top);

    // Ease the scale/dim progress toward the scroll position (frame-rate independent).
    // Card *positions* stay native-sticky, so scrolling itself never lags.
    const dt = lastTime ? Math.min(64, now - lastTime) : 16;
    lastTime = now;
    if (smooth === null) smooth = progress;
    smooth += (progress - smooth) * (1 - Math.exp(-dt / EASE_MS));
    const settled = Math.abs(progress - smooth) < 0.0004;
    if (settled) smooth = progress;

    // --- Writes ---
    for (let i = 0; i < cards.length; i++) {
      const { start, target } = ranges[i];

      // Stacking: useTransform(progress, [start, 1], [1, targetScale]), with a soft ease
      const t = smoothstep(start >= 1 ? 0 : clamp01((smooth - start) / (1 - start)));
      const stackScale = 1 + (target - 1) * t;

      // Entry: while a card travels up toward its sticky slot it is tilted back and a
      // touch smaller, then settles flat as it lands on the stack.
      const d = clamp01((wrapTops[i] - stickTops[i]) / (vh * ENTRY_RANGE));
      const e = d * d * (3 - 2 * d);
      const tilt = e * ENTRY_TILT;
      const entryScale = 1 - e * ENTRY_SHRINK;

      cards[i].style.transform =
        `perspective(1600px) rotateX(${tilt.toFixed(3)}deg) scale(${(stackScale * entryScale).toFixed(4)})`;
      // Dim in proportion to depth: the front card stays clear, the deepest is darkest
      const depth = (1 - stackScale) / maxScaleLoss;
      shades[i].style.opacity = (depth * MAX_SHADE).toFixed(3);
    }

    if (!settled) rafId = requestAnimationFrame(render);
  }

  function requestRender() {
    if (inView && !rafId) rafId = requestAnimationFrame(render);
  }

  // Only do work while the stack is near the viewport
  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    requestRender();
  }, { rootMargin: '25% 0px' });
  io.observe(container);

  window.addEventListener('scroll', requestRender, { passive: true });
  const onResize = () => { measure(); requestRender(); };
  window.addEventListener('resize', onResize, { passive: true });
  reducedMotion.addEventListener?.('change', () => { inView = true; requestRender(); });

  inView = true;
  render(performance.now());

  return {
    destroy() {
      io.disconnect();
      window.removeEventListener('scroll', requestRender);
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    }
  };
}

function boot() {
  initProjectStack(document.getElementById('project-stack'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
