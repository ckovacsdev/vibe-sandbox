// 2.5D parallax scenes: transparent layers on Three.js planes, driven by mouse and scroll.
// Follows .claude/skills/threejs-parallax, plus: reduced-motion support, pausing off-screen,
// a one-time intro where layers settle into place, and a static image fallback without WebGL.
import * as THREE from 'https://esm.sh/three@0.162.0';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Shared pointer state for every scene on the page.
let tX = 0, tY = 0;
document.addEventListener('mousemove', e => {
  tX =  (e.clientX / window.innerWidth  - 0.5) * 2;
  tY = -(e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

const loader  = new THREE.TextureLoader();
const loadTex = src => new Promise((res, rej) => loader.load(src, tex => {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  res(tex);
}, undefined, rej));

/**
 * @param {string} containerId  element the canvas fills (position: absolute/relative, sized)
 * @param {object} opts
 * @param {Array}  opts.layers  back-to-front: { src, width, aspect, pos:[x,y,z], p, order, sx, sy }
 * @param {string} [opts.scrollEl] id of the element whose viewport position drives scroll drift
 * @param {boolean} [opts.intro] play the one-time settle-in on load
 * @param {number} [opts.fitWidth] world width at z=0 that must stay in view; pulls the camera back on narrow containers
 */
export async function mountParallax(containerId, { layers: defs, scrollEl, intro = false, fitWidth = 0 }) {
  await new Promise(r => requestAnimationFrame(r)); // wait for layout

  const container = document.getElementById(containerId);
  if (!container) return;
  const mediaEl = (scrollEl && document.getElementById(scrollEl)) || container;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  canvas.setAttribute('aria-hidden', 'true');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return; // keep the static fallback image
  }

  let W = container.offsetWidth;
  let H = container.offsetHeight;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const fitCamera = () => {
    camera.position.z = Math.max(5, fitWidth / 2 / (halfTan * camera.aspect));
  };
  fitCamera();

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  let textures;
  try {
    textures = await Promise.all(defs.map(d => loadTex(d.src)));
  } catch {
    return;
  }

  const layers = defs.map((d, i) => {
    const geo  = new THREE.PlaneGeometry(d.width, d.width / d.aspect);
    const mat  = new THREE.MeshBasicMaterial({
      map: textures[i], transparent: true, depthWrite: false, depthTest: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const [bx, by, bz] = d.pos;
    mesh.position.set(bx, by, bz);
    mesh.renderOrder       = d.order ?? i;
    mesh.userData.base     = [bx, by, bz];
    mesh.userData.pFactor  = d.p ?? 0;
    mesh.userData.scrollFX = d.sx ?? 0;
    mesh.userData.scrollFY = d.sy ?? 0;
    scene.add(mesh);
    return mesh;
  });

  container.appendChild(canvas);
  container.classList.add('is-live');

  // Scroll progress: -1 below viewport centre, 0 centred, +1 above.
  let scrollProg = 0, smoothScrollProg = 0;
  function updateScrollProg() {
    const rect = mediaEl.getBoundingClientRect();
    const vh   = window.innerHeight;
    const mid  = rect.top + rect.height * 0.5;
    scrollProg = (vh * 0.5 - mid) / (vh * 0.5 + rect.height * 0.5);
    scrollProg = Math.max(-1.4, Math.min(1.4, scrollProg));
  }
  window.addEventListener('scroll', updateScrollProg, { passive: true });
  updateScrollProg();
  smoothScrollProg = scrollProg;

  let cX = 0, cY = 0;
  const introStart = performance.now();
  const INTRO_MS = 1400;
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function frame(now) {
    const still = reduceMotion.matches;
    const mx = still ? 0 : tX, my = still ? 0 : tY;
    cX += (mx - cX) * 0.065;
    cY += (my - cY) * 0.065;
    smoothScrollProg += ((still ? 0 : scrollProg) - smoothScrollProg) * 0.06;

    camera.rotation.y = cX * 0.035;
    camera.rotation.x = cY * 0.025;

    layers.forEach((layer, i) => {
      const [bx, by] = layer.userData.base;
      const f = layer.userData.pFactor;
      let iy = 0, alpha = 1;
      if (intro && !still) {
        // Layers settle in back-to-front, closer layers travel further.
        const t = Math.min(1, Math.max(0, (now - introStart - i * 140) / INTRO_MS));
        const e = easeOut(t);
        iy = (1 - e) * -0.6 * (0.4 + f * 2);
        alpha = e;
      }
      layer.material.opacity = alpha;
      layer.position.x = bx + cX * f + layer.userData.scrollFX * smoothScrollProg;
      layer.position.y = by + cY * f + layer.userData.scrollFY * smoothScrollProg + iy;
    });

    renderer.render(scene, camera);
  }

  // Only animate while visible.
  let running = false, rafId = 0;
  const loop = now => { frame(now); rafId = requestAnimationFrame(loop); };
  const start = () => { if (!running) { running = true; rafId = requestAnimationFrame(loop); } };
  const stop  = () => { running = false; cancelAnimationFrame(rafId); };

  new IntersectionObserver(([entry]) => entry.isIntersecting ? start() : stop(), { rootMargin: '100px' })
    .observe(container);

  const ro = new ResizeObserver(() => {
    W = container.offsetWidth;
    H = container.offsetHeight;
    if (!W || !H) return;
    camera.aspect = W / H;
    fitCamera();
    camera.updateProjectionMatrix();
    renderer.setSize(W, H, false);
    updateScrollProg();
    if (!running) frame(performance.now());
  });
  ro.observe(container);
}
