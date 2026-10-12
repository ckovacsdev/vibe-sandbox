// Header state, mobile menu, and the hero stage.
// The stage follows .claude/skills/threejs-parallax (per-layer parallax factors, scroll drift,
// lerped mouse and scroll), applied to real HTML layers with CSS 3D so the UI text stays crisp.

const header = document.querySelector('.header');
const menuBtn = document.querySelector('.menu-btn');

const onScrollHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScrollHeader, { passive: true });
onScrollHeader();

menuBtn?.addEventListener('click', () => {
  const open = header.classList.toggle('is-open');
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

const frame = document.querySelector('.stage__frame');
if (frame) {
  const rig = frame.querySelector('.rig');
  const el = name => rig.querySelector(`[data-layer="${name}"]`);
  const win = el('win'), floor = el('floor');

  // f: mouse parallax in design px. z: resting depth. open: offset while the lid is closed.
  // leave: drift as the stage scrolls away (the skill's scrollFX / scrollFY).
  const panels = [
    { node: el('preview'), f: 14, z: 60,  open: [ 60,  50, 160], leave: [ 50, -70] },
    { node: el('score'),   f: 20, z: 90,  open: [100,  40, 200], leave: [ 70,  10] },
    { node: el('term'),    f: 26, z: 120, open: [-90,  70, 240], leave: [-60,  50] },
  ];

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let scale = 1;
  const fit = () => {
    scale = frame.clientWidth / 1280;
    frame.style.setProperty('--s', scale);
  };

  let tX = 0, tY = 0, cX = 0, cY = 0;
  window.addEventListener('mousemove', e => {
    tX =  (e.clientX / window.innerWidth  - 0.5) * 2;
    tY = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // open: 0 when the stage top is low in the viewport, 1 once it has risen near the top.
  // leave: 0 until open, then grows as the stage scrolls out.
  let tOpen = 0, tLeave = 0, sOpen = 0, sLeave = 0;
  const measure = () => {
    const r = frame.getBoundingClientRect();
    const vh = window.innerHeight;
    tOpen  = clamp(1 - (r.top - vh * 0.1) / (vh * 0.6), 0, 1);
    tLeave = clamp((vh * 0.1 - r.top) / r.height, 0, 1);
  };
  window.addEventListener('scroll', measure, { passive: true });

  const render = () => {
    const still = reduce.matches;
    const mx = still ? 0 : tX, my = still ? 0 : tY;
    cX += (mx - cX) * 0.065;
    cY += (my - cY) * 0.065;
    sOpen  += ((still ? 1 : tOpen)  - sOpen)  * 0.06;
    sLeave += ((still ? 0 : tLeave) - sLeave) * 0.06;

    const e = easeInOut(sOpen), c = 1 - e;

    rig.style.transform =
      `translateX(-50%) scale3d(${scale}, ${scale}, ${scale}) rotateY(${cX * 2.4}deg) rotateX(${cY * 1.6}deg)`;

    win.style.transform =
      `translate3d(${cX * 6}px, ${-cY * 6 + c * 30}px, ${-c * 140}px) rotateX(${c * 34}deg) scale(${0.9 + 0.1 * e})`;

    floor.style.opacity = 0.35 + 0.65 * e;
    floor.style.transform = `scaleX(${0.78 + 0.22 * e})`;

    for (const p of panels) {
      const x = cX * p.f + p.open[0] * c + p.leave[0] * sLeave;
      const y = -cY * p.f + p.open[1] * c + p.leave[1] * sLeave;
      const z = p.z + p.open[2] * c;
      p.node.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
    }
  };

  let running = false, raf = 0;
  const loop = () => { render(); raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) { running = true; raf = requestAnimationFrame(loop); }
    if (!entry.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
  }).observe(frame);

  new ResizeObserver(() => { fit(); measure(); render(); }).observe(frame);
  fit();
  measure();
  sOpen = reduce.matches ? 1 : tOpen; // start where the page actually is, without a catch-up sweep
  render();
}
