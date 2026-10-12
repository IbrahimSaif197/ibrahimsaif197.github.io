import * as THREE from 'three';

const { gsap, ScrollTrigger, SplitText, Lenis } = window;
gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 900px)').matches;

/* ======================================================================
   Shapes. Each returns a point on the shape for particle i of n.
   Order matches data-shape in index.html.
   ====================================================================== */
const TAU = Math.PI * 2;
const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
const onSphere = () => {
  const u = rnd() * 2 - 1, t = rnd() * TAU, r = Math.sqrt(1 - u * u);
  return [r * Math.cos(t), u, r * Math.sin(t)];
};

const shapes = [
  // 0 brain: two folded hemispheres plus a cerebellum
  () => {
    if (rnd() < 0.09) {
      const [x, y, z] = onSphere(), r = 0.42 * Math.cbrt(0.6 + 0.4 * rnd());
      return [x * r * 1.3, y * r * 0.7 - 0.62, z * r - 0.72];
    }
    let [x, y, z] = onSphere();
    const fold = 1 + 0.07 * Math.sin(x * 11) * Math.sin(y * 13) * Math.sin(z * 9) + 0.04 * Math.sin(y * 23 + z * 17);
    const depth = rnd() < 0.82 ? 1 : 0.5 + 0.5 * rnd();
    const r = fold * depth;
    x *= r * 0.92; y *= r * 0.86; z *= r * 1.18;
    if (y < -0.35) y = -0.35 + (y + 0.35) * 0.45;           // flatter base
    x += Math.sign(x || 1) * 0.07;                            // longitudinal fissure
    return [x, y + 0.1, z];
  },
  // 1 phone: a mobile app frame with right-aligned rows (Eejari is Arabic-first, right to left)
  () => {
    const k = rnd(), hw = 0.6, hh = 1.15;
    if (k < 0.62) {
      const a = rnd() * TAU, c = Math.cos(a), sn = Math.sin(a), e = 2 / 8;
      return [hw * Math.sign(c) * Math.abs(c) ** e, hh * Math.sign(sn) * Math.abs(sn) ** e, (rnd() < 0.5 ? -1 : 1) * 0.07];
    }
    if (k < 0.9) {
      const row = Math.floor(rnd() * 7), y = 0.78 - row * 0.27, len = row === 0 ? 0.76 : 0.25 + 0.5 * Math.abs(Math.sin(row * 2.3));
      const h = row === 0 ? 0.16 : 0.035;
      return [0.38 - rnd() * len, y + (rnd() - 0.5) * h, 0];
    }
    return [(rnd() - 0.5) * 0.3, 0.98 + (rnd() - 0.5) * 0.03, 0.02];
  },
  // 2 database: three stacked cylinders
  () => {
    const tier = Math.floor(rnd() * 3), cy = (tier - 1) * 0.72, a = rnd() * TAU, R = 1.05;
    const k = rnd();
    if (k < 0.5) return [Math.cos(a) * R, cy + (rnd() - 0.5) * 0.5, Math.sin(a) * R];  // wall
    const rr = k < 0.85 ? R : R * Math.sqrt(rnd());                                    // rim or lid
    return [Math.cos(a) * rr, cy + 0.25, Math.sin(a) * rr];
  },
  // 3 tenants: five isolated shells around a core
  () => {
    const [x, y, z] = onSphere();
    if (rnd() < 0.14) return [x * 0.28, y * 0.28, z * 0.28];
    const t = Math.floor(rnd() * 5), a = (t / 5) * TAU + 0.3;
    return [Math.cos(a) * 1.15 + x * 0.42, Math.sin(a * 2) * 0.25 + y * 0.42, Math.sin(a) * 1.15 + z * 0.42];
  },
  // 4 equaliser: a ring of audio bars, readable from any angle as it spins
  () => {
    const bars = 36, b = Math.floor(rnd() * bars), a = (b / bars) * TAU, R = 1.1;
    const h = 0.18 + 0.95 * Math.abs(Math.sin(b * 1.7) * Math.cos(b * 0.45));
    const j = () => (rnd() - 0.5) * 0.05;
    return [Math.cos(a) * R + j(), (rnd() * 2 - 1) * h, Math.sin(a) * R + j()];
  },
  // 5 helix: two strands with rungs, a path of hints
  () => {
    const t = rnd(), a = t * TAU * 2.4, y = (t - 0.5) * 2.9;
    if (rnd() < 0.18) { const m = rnd() * 2 - 1, aa = Math.round(a / 0.6) * 0.6; return [Math.cos(aa) * 0.75 * m, (aa / (TAU * 2.4) - 0.5) * 2.9, Math.sin(aa) * 0.75 * m]; }
    const off = rnd() < 0.5 ? 0 : Math.PI, j = () => (rnd() - 0.5) * 0.08;
    return [Math.cos(a + off) * 0.75 + j(), y + j(), Math.sin(a + off) * 0.75 + j()];
  },
  // 6 radar: concentric alert rings around a beacon
  () => {
    if (rnd() < 0.12) return [(rnd() - 0.5) * 0.06, rnd() * 1.4 - 0.2, (rnd() - 0.5) * 0.06];
    const ring = 1 + Math.floor(rnd() * 5), r = ring * 0.32, a = rnd() * TAU;
    return [Math.cos(a) * r, -0.2 + Math.sin(ring + a * 3) * 0.03, Math.sin(a) * r];
  },
  // 7 globe: latitude and longitude lines, the cloud
  () => {
    const R = 1.25, a = rnd() * TAU;
    if (rnd() < 0.5) { const lat = (Math.floor(rnd() * 7) - 3) * 0.38; return [Math.cos(lat) * Math.cos(a) * R, Math.sin(lat) * R, Math.cos(lat) * Math.sin(a) * R]; }
    const lon = Math.floor(rnd() * 10) * (Math.PI / 10);
    return [Math.cos(a) * Math.cos(lon) * R, Math.sin(a) * R, Math.cos(a) * Math.sin(lon) * R];
  },
];
shapes.push(shapes[0]); // last (contact): back to the brain

/* ======================================================================
   Three.js scene
   ====================================================================== */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.z = 7;

const PALETTE = ['#8052ff', '#a68aff', '#ffb829', '#2bd4ad', '#ff4fa3', '#4f8bff', '#8052ff', '#ffffff'].map(c => new THREE.Color(c));
const N = mobile ? 4500 : 9000;

const geo = new THREE.BufferGeometry();
const targets = shapes.map(() => new Float32Array(N * 3));
const rand = new Float32Array(N * 4), col = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  shapes.forEach((fn, s) => targets[s].set(s === shapes.length - 1 ? targets[0].subarray(i * 3, i * 3 + 3) : fn(), i * 3));
  rand.set([rnd(), rnd(), rnd(), rnd()], i * 4);
  const c = PALETTE[Math.floor(rnd() * PALETTE.length)];
  col.set([c.r, c.g, c.b], i * 3);
}
geo.setAttribute('position', new THREE.BufferAttribute(targets[0], 3));
for (let s = 1; s < shapes.length; s++) geo.setAttribute('s' + s, new THREE.BufferAttribute(targets[s], 3));
geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));

const uniforms = {
  uTime: { value: 0 },
  uMorph: { value: 0 },
  uScatter: { value: reduced ? 0 : 1 },
  uMouse: { value: new THREE.Vector2(9, 9) },
  uAspect: { value: 1 },
  uSize: { value: 1 },
  uAlpha: { value: 1 },
  uPixel: { value: renderer.getPixelRatio() },
};

// Shared triangle-outline fragment shader: each point sprite becomes a spinning outlined triangle.
const triFrag = /* glsl */`
  varying vec3 vColor; varying float vAlpha; varying float vSpin;
  float sdTri(vec2 p, float r){
    const float k = 1.7320508;
    p.x = abs(p.x) - r; p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
  }
  void main(){
    vec2 p = gl_PointCoord * 2.0 - 1.0; p.y = -p.y;
    float c = cos(vSpin), s = sin(vSpin); p = mat2(c, -s, s, c) * p;
    float d = abs(sdTri(p, 0.62));
    float a = 1.0 - smoothstep(0.06, 0.16, d);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }`;

const material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    attribute vec3 s1; attribute vec3 s2; attribute vec3 s3; attribute vec3 s4; attribute vec3 s5; attribute vec3 s6; attribute vec3 s7; attribute vec3 s8;
    attribute vec4 aRand; attribute vec3 aColor;
    uniform float uTime, uMorph, uScatter, uAspect, uSize, uAlpha, uPixel;
    uniform vec2 uMouse;
    varying vec3 vColor; varying float vAlpha; varying float vSpin;

    vec3 shape(float i){
      if (i < 0.5) return position; if (i < 1.5) return s1; if (i < 2.5) return s2; if (i < 3.5) return s3;
      if (i < 4.5) return s4; if (i < 5.5) return s5; if (i < 6.5) return s6; if (i < 7.5) return s7; return s8;
    }
    void main(){
      float base = floor(uMorph);
      float f = uMorph - base;
      // stagger: each particle leaves a little later than the last, so shapes dissolve rather than snap
      float t = smoothstep(0.0, 1.0, clamp((f - aRand.x * 0.35) / 0.65, 0.0, 1.0));
      vec3 p = mix(shape(base), shape(min(base + 1.0, 8.0)), t);

      // mid-flight swirl
      float flight = sin(t * 3.14159);
      vec3 swirl = vec3(sin(aRand.y * 40.0 + uTime), cos(aRand.z * 40.0 + uTime * 0.8), sin(aRand.w * 40.0 - uTime)) ;
      p += swirl * flight * 0.55;

      // breathing
      p += 0.025 * vec3(sin(uTime * 0.9 + aRand.y * 20.0), cos(uTime * 0.7 + aRand.z * 20.0), sin(uTime * 0.8 + aRand.w * 20.0));

      // intro scatter
      vec3 far = (vec3(aRand.y, aRand.z, aRand.w) * 2.0 - 1.0) * vec3(9.0, 6.0, 6.0);
      p = mix(p, far, uScatter * (0.6 + 0.4 * aRand.x));

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;

      // pointer repulsion in screen space
      vec2 ndc = gl_Position.xy / gl_Position.w;
      vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
      float push = exp(-dot(d, d) * 26.0) * 0.12;
      gl_Position.xy += normalize(d + 1e-5) / vec2(uAspect, 1.0) * push * gl_Position.w;

      gl_PointSize = uSize * uPixel * (5.0 + aRand.x * 7.0) * (7.0 / -mv.z);
      vColor = aColor;
      vAlpha = uAlpha * (0.45 + 0.55 * aRand.w) * (0.6 + 0.4 * smoothstep(-1.5, 1.5, p.z));
      vSpin = aRand.y * 6.28 + uTime * (aRand.z - 0.5) * 1.6;
    }`,
  fragmentShader: triFrag,
});

const group = new THREE.Group();
const constellation = new THREE.Points(geo, material);
group.add(constellation);
scene.add(group);

// Ambient field: sparse, slow, faint triangles across the whole page
const A = mobile ? 250 : 500;
const ambGeo = new THREE.BufferGeometry();
const ambPos = new Float32Array(A * 3), ambRand = new Float32Array(A * 4), ambCol = new Float32Array(A * 3);
for (let i = 0; i < A; i++) {
  ambPos.set([(rnd() - 0.5) * 16, (rnd() - 0.5) * 12, (rnd() - 0.5) * 8 - 2], i * 3);
  ambRand.set([rnd(), rnd(), rnd(), rnd()], i * 4);
  const c = PALETTE[Math.floor(rnd() * 6)];
  ambCol.set([c.r, c.g, c.b], i * 3);
}
ambGeo.setAttribute('position', new THREE.BufferAttribute(ambPos, 3));
ambGeo.setAttribute('aRand', new THREE.BufferAttribute(ambRand, 4));
ambGeo.setAttribute('aColor', new THREE.BufferAttribute(ambCol, 3));
const ambUniforms = { uTime: uniforms.uTime, uScroll: { value: 0 }, uPixel: uniforms.uPixel };
const ambient = new THREE.Points(ambGeo, new THREE.ShaderMaterial({
  uniforms: ambUniforms,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    attribute vec4 aRand; attribute vec3 aColor;
    uniform float uTime, uScroll, uPixel;
    varying vec3 vColor; varying float vAlpha; varying float vSpin;
    void main(){
      vec3 p = position;
      p.y = mod(p.y + uTime * 0.04 * (0.3 + aRand.x) + uScroll * (0.5 + aRand.y), 12.0) - 6.0;
      p.x += sin(uTime * 0.2 + aRand.z * 10.0) * 0.2;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uPixel * (6.0 + aRand.w * 8.0) * (7.0 / -mv.z);
      vColor = aColor; vAlpha = 0.12 + 0.18 * aRand.x;
      vSpin = aRand.y * 6.28 + uTime * (aRand.z - 0.5);
    }`,
  fragmentShader: triFrag,
}));
scene.add(ambient);

/* ---------- layout: where the constellation sits ---------- */
const view = { side: 1, x: 0, y: 0, scale: 1 };
let halfW = 1, halfH = 1;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  uniforms.uAspect.value = camera.aspect;
  halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  halfW = halfH * camera.aspect;
  const narrow = w <= 900;
  view.scale = narrow ? Math.min(1.1, halfW / 1.6) : Math.min(1.1, halfW / 3.7);
  uniforms.uAlpha.value = narrow ? 0.5 : 1;
  uniforms.uSize.value = narrow ? 0.8 : 1;
  placeGroup(0);
}
function placeGroup(duration = 1.6) {
  const narrow = innerWidth <= 900;
  const x = narrow ? 0 : view.side * halfW * 0.5;
  const y = narrow ? halfH * 0.35 : 0;
  gsap.to(group.position, { x, y, duration, ease: 'power3.inOut', overwrite: 'auto' });
  gsap.to(group.scale, { x: view.scale, y: view.scale, z: view.scale, duration, ease: 'power3.inOut', overwrite: 'auto' });
}
addEventListener('resize', resize);
resize();

/* ---------- pointer ---------- */
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
const ndcMouse = new THREE.Vector2(9, 9), ndcTarget = new THREE.Vector2(9, 9);
const cursor = document.querySelector('.cursor');
const moveCursorX = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
const moveCursorY = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
addEventListener('pointermove', e => {
  pointer.tx = e.clientX / innerWidth * 2 - 1;
  pointer.ty = -(e.clientY / innerHeight * 2 - 1);
  ndcTarget.set(pointer.tx, pointer.ty);
  moveCursorX(e.clientX); moveCursorY(e.clientY);
  if (e.pointerType === 'mouse') cursor.style.opacity = 1;
});
document.addEventListener('pointerleave', () => { ndcTarget.set(9, 9); cursor.style.opacity = 0; });
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
  el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
});

/* ---------- render loop ---------- */
const clock = new THREE.Clock();
let scrollVel = 0;
let activeShape = 0;
const FLAT = new Set([1]); // flat shapes sway to face the camera instead of spinning edge-on
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  uniforms.uTime.value = t;
  pointer.x += (pointer.tx - pointer.x) * 0.05;
  pointer.y += (pointer.ty - pointer.y) * 0.05;
  ndcMouse.lerp(ndcTarget, 0.12);
  uniforms.uMouse.value.copy(ndcMouse);

  const spin = reduced ? 0 : dt * (0.12 + Math.min(Math.abs(scrollVel) * 0.004, 0.6));
  if (FLAT.has(activeShape)) {
    const facing = Math.round(constellation.rotation.y / TAU) * TAU + (reduced ? 0 : Math.sin(t * 0.6) * 0.45);
    constellation.rotation.y += (facing - constellation.rotation.y) * 0.04;
  } else constellation.rotation.y += spin;
  group.rotation.x += ((-pointer.y * 0.25 + 0.15) - group.rotation.x) * 0.05;
  group.rotation.z += ((pointer.x * 0.08) - group.rotation.z) * 0.05;
  camera.position.x += (pointer.x * 0.35 - camera.position.x) * 0.04;
  camera.position.y += (pointer.y * 0.25 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}
gsap.ticker.add(frame);

/* ======================================================================
   Smooth scroll + scroll-driven choreography
   ====================================================================== */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', e => { scrollVel = e.velocity; ScrollTrigger.update(); });
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); // released when the intro finishes
}
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  lenis ? lenis.scrollTo(target, { duration: 1.6 }) : target.scrollIntoView();
}));

// ambient field drifts with scroll
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => { ambUniforms.uScroll.value = self.progress * 6; } });

const sections = [...document.querySelectorAll('[data-shape]')];
const dots = document.querySelector('.dots');
const navLinks = [...document.querySelectorAll('.nav__links a')];
sections.forEach((sec, i) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('aria-label', 'Go to ' + sec.dataset.name);
  b.addEventListener('click', () => lenis ? lenis.scrollTo(sec, { duration: 1.6 }) : sec.scrollIntoView());
  li.append(b); dots.append(li);

  ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: self => {
      if (!self.isActive) return;
      activeShape = +sec.dataset.shape;
      gsap.to(uniforms.uMorph, { value: activeShape, duration: reduced ? 0 : 2.2, ease: 'power2.inOut', overwrite: true });
      view.side = sec.dataset.side === 'left' ? -1 : 1;
      placeGroup(reduced ? 0 : 1.8);
      dots.querySelectorAll('button').forEach((d, j) => d.classList.toggle('is-active', j === i));
      navLinks.forEach(l => l.classList.toggle('is-active', sec.id && l.hash === '#' + sec.id));
    },
  });
});

// nav hides on the way down, returns on the way up; its pill appears once the hero's pill is gone
const nav = document.querySelector('.nav');
const navBtn = document.querySelector('.btn--nav');
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: self => {
    const y = self.scroll();
    nav.classList.toggle('is-hidden', self.direction === 1 && y > 200);
    const inContact = y > document.getElementById('contact').offsetTop - innerHeight * 0.5;
    navBtn.classList.toggle('is-on', y > innerHeight * 0.7 && !inContact);
  },
});

// magnetic buttons
if (!reduced) document.querySelectorAll('.magnetic').forEach(el => {
  const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    xTo((e.clientX - r.left - r.width / 2) * 0.35);
    yTo((e.clientY - r.top - r.height / 2) * 0.45);
  });
  el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
});

/* ---------- text reveals ---------- */
function setupReveals() {
  document.querySelectorAll('.split-lines').forEach(h => {
    const split = SplitText.create(h, { type: 'lines,words', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: self => {
        if (reduced) return;
        const hero = h.closest('.hero');
        return gsap.from(self.words, {
          yPercent: 110, rotate: 4, duration: 1.3, ease: 'expo.out', stagger: 0.06,
          ...(hero ? { delay: 0.2 } : { scrollTrigger: { trigger: h, start: 'top 82%' } }),
        });
      },
    });
    h.style.visibility = 'visible';
    return split;
  });

  if (reduced) return;
  sections.forEach(sec => {
    const items = sec.querySelectorAll('.reveal');
    const hero = sec.classList.contains('hero');
    gsap.from(items, {
      y: 36, autoAlpha: 0, filter: 'blur(8px)', duration: 1.2, ease: 'power3.out', stagger: 0.08,
      ...(hero ? { delay: 0.7 } : { scrollTrigger: { trigger: sec, start: 'top 70%' } }),
    });
  });

  // headings drift a touch slower than the page: cheap depth
  document.querySelectorAll('.split__text').forEach(el => {
    gsap.fromTo(el, { y: 60 }, { y: -60, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ---------- intro ---------- */
const loader = document.querySelector('.loader');
const count = loader.querySelector('.loader__count');
document.querySelectorAll('.split-lines').forEach(h => { h.style.visibility = 'hidden'; });

async function intro() {
  await document.fonts.ready;
  if (reduced) { loader.remove(); setupReveals(); return; }
  const n = { v: 0 };
  const tl = gsap.timeline();
  tl.to(n, { v: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(n.v); } })
    .to(count, { yPercent: -100, autoAlpha: 0, duration: 0.6, ease: 'power3.in' })
    .to(loader, { autoAlpha: 0, duration: 0.8, ease: 'power2.out' }, '-=0.1')
    .to(uniforms.uScatter, { value: 0, duration: 2.8, ease: 'expo.out' }, '<')
    .add(() => { loader.remove(); setupReveals(); lenis?.start(); }, '<0.2');
}
intro();
