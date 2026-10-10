// Scene definitions for the parallax module. Widths are world units; aspect = SVG width / height.
import { mountParallax } from './parallax.js';

const P = 'assets/parallax/';

const scenes = {
  'hero-scene': {
    intro: true,
    scrollEl: 'hero',
    layers: [
      { src: P + 'hero-bg.svg',          width: 11.0, aspect: 1800 / 1200, pos: [ 0.20,  0.00, -1.0], p: 0.06, sx:  0.00, sy:  0.10 },
      { src: P + 'hero-network.svg',     width: 7.40, aspect: 1440 / 1000, pos: [ 0.30,  0.05, -0.5], p: 0.16, sx: -0.30, sy:  0.12 },
      { src: P + 'hero-overpass.svg',    width: 7.40, aspect: 1440 / 1000, pos: [ 0.35, -0.15, -0.2], p: 0.26, sx:  0.30, sy: -0.06 },
      { src: P + 'hero-card-deploy.svg', width: 2.70, aspect:  960 /  300, pos: [-0.30,  1.75,  0.0], p: 0.40, sx: -0.35, sy:  0.40 },
      { src: P + 'hero-card-env.svg',    width: 2.35, aspect:  840 /  320, pos: [ 0.70, -1.50,  0.2], p: 0.45, sx:  0.40, sy: -0.25 },
    ],
  },
  'path-scene': {
    scrollEl: 'path-scene-wrap',
    fitWidth: 6.6,
    layers: [
      { src: P + 'path-bg.svg',       width: 7.40, aspect: 1600 / 1100, pos: [ 0.00,  0.00, -1.0], p: 0.06, sx:  0.00, sy:  0.08 },
      { src: P + 'path-template.svg', width: 3.20, aspect:  760 /  920, pos: [ 0.10,  0.15, -0.4], p: 0.18, sx:  0.00, sy:  0.20 },
      { src: P + 'path-chip-a.svg',   width: 2.10, aspect:  640 /  200, pos: [-1.65,  1.20,  0.0], p: 0.34, sx: -0.45, sy:  0.30 },
      { src: P + 'path-chip-b.svg',   width: 2.10, aspect:  640 /  200, pos: [ 1.75,  0.05,  0.1], p: 0.38, sx:  0.50, sy:  0.00 },
      { src: P + 'path-chip-c.svg',   width: 2.10, aspect:  640 /  200, pos: [-1.35, -1.45,  0.2], p: 0.42, sx: -0.35, sy: -0.30 },
    ],
  },
};

for (const [id, opts] of Object.entries(scenes)) {
  if (document.getElementById(id)) mountParallax(id, opts);
}
