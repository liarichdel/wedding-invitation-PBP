import * as THREE from 'three';

const { gsap, ScrollTrigger } = window;
const C = { sapphire: 0x0f2f7a, sapphireLight: 0x2557c4, accent: 0xcfe0ff, pearl: 0xf6f3ec, navy: 0x0c1840, skin: 0xe8b890, grey: 0xC7C6C1, cream: 0xF0E3CE };

// deteksi device abilitynya 
const hasWebGL = () => {
  try { const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
  catch { return false; }
};
const LOW = innerWidth < 768 || (navigator.hardwareConcurrency || 4) <= 4;

if (!hasWebGL()) {
  document.body.classList.add('no-webgl');         
  window.dispatchEvent(new Event('scene-fallback')); 
} else init();

function init() {
  // renderer, scene, camera
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.25 : 2));
  renderer.shadowMap.enabled = !LOW;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071a45);
  scene.fog = new THREE.Fog(0x071a45, 22, 55);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  // helper voxel agar hemat memori
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const mats = {};
  // device lemah tetap Standard
  const mat = (c) => (mats[c] ||= (c === C.pearl && !LOW)
    ? new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, sheen: 1, sheenColor: new THREE.Color(0xbcd2ff), sheenRoughness: 0.4 })
    : new THREE.MeshStandardMaterial({ color: c, roughness: c === C.accent ? 0.3 : 0.7, metalness: c === C.accent ? 0.7 : 0.05 }));
  const vox = (parent, color, sx, sy, sz, x, y, z) => {
    const m = new THREE.Mesh(BOX, mat(color));
    m.scale.set(sx, sy, sz); m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = !LOW;
    parent.add(m); return m;
  };

  // lantai marmer 
  const N = 19, floor = new THREE.InstancedMesh(BOX, new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }), N * N);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const k = i * N + j;
    dummy.position.set(i - N / 2 + 0.5, -0.2, j - N / 2 - 1.5);
    dummy.scale.set(0.96, 0.4, 0.96); dummy.updateMatrix();
    floor.setMatrixAt(k, dummy.matrix);
    floor.setColorAt(k, col.set((i + j) % 2 ? C.pearl : C.grey));
  }
  floor.receiveShadow = !LOW; floor.userData.kind = 'floor'; scene.add(floor);

  // altar 
  const altar = new THREE.Group(); altar.position.z = -2; scene.add(altar); altar.userData.kind = 'altar';
  vox(altar, C.navy, 8.4, 0.3, 6.4, 0, 0.15, 0);       
  vox(altar, C.navy, 8, 0.3, 6, 0, 0.45, 0);          // lantai altar
  const TOP = 0.6;
  for (const sx of [-3.4, 3.4]) for (const sz of [-2.4, 2.4]) {
    vox(altar, C.navy, 1.1, 0.4, 1.1, sx, TOP + 0.2, sz);          // kaki pilar
    vox(altar, C.pearl, 0.8, 5, 0.8, sx, TOP + 2.5, sz);         // badan pilar
    vox(altar, C.navy, 1.1, 0.4, 1.1, sx, TOP + 5.2, sz);         // kepala pilar
  }
  vox(altar, C.pearl, 7.8, 0.4, 0.4, 0, 6.1, -2.4); vox(altar, C.pearl, 7.8, 0.4, 0.4, 0, 6.1, 2.4);
  vox(altar, C.pearl, 0.4, 0.4, 5.2, -3.4, 6.1, 0); vox(altar, C.pearl, 0.4, 0.4, 5.2, 3.4, 6.1, 0);
  // atap bertingkat
  [8.6, 6.8, 5, 3.2, 1.6].forEach((s, i) =>
    vox(altar, i % 2 ? C.pearl : C.navy, s, 0.6, s * 0.78, 0, 6.6 + i * 0.6, 0));
  vox(altar, C.pearl, 0.4, 1.2, 0.4, 0, 10, 0);          // puncak

  // karakter voxel
  const person = (bride) => {
    const g = new THREE.Group(), hair = bride ? 0x5a3a22 : 0x2b1b12;
    if (bride) {
      [1.7, 1.35, 1.0].forEach((w, i) => vox(g, C.pearl, w, 0.45, w * 0.8, 0, 0.25 + i * 0.45, 0)); // gaun 
      vox(g, C.pearl, 0.9, 0.8, 0.55, 0, 1.75, 0);
      vox(g, C.skin, 0.26, 0.8, 0.28, -0.6, 1.75, 0); vox(g, C.skin, 0.26, 0.8, 0.28, 0.6, 1.75, 0);
      vox(g, hair, 0.86, 0.9, 0.2, 0, 2.45, -0.3);       // rambut panjang
      vox(g, C.pearl, 0.9, 1.3, 0.05, 0, 2.3, -0.45);    // veil
      vox(g, C.pearl, 0.4, 0.4, 0.4, 0, 1.55, 0.5); vox(g, C.accent, 0.2, 0.2, 0.2, 0, 1.55, 0.7); // buket
    } else {
      vox(g, C.navy, 0.4, 1, 0.4, -0.22, 0.5, 0); vox(g, C.navy, 0.4, 1, 0.4, 0.22, 0.5, 0);
      vox(g, C.navy, 1, 1.1, 0.6, 0, 1.55, 0);
      vox(g, C.accent, 0.18, 0.7, 0.05, 0, 1.6, 0.33);     // dasi biru muda
      vox(g, C.navy, 0.28, 1, 0.3, -0.65, 1.5, 0); vox(g, C.navy, 0.28, 1, 0.3, 0.65, 1.5, 0);
    }
    vox(g, C.skin, 0.8, 0.8, 0.8, 0, 2.55, 0);           // kepala 
    vox(g, hair, 0.86, 0.3, 0.86, 0, 2.95, 0);
    if (bride) vox(g, C.accent, 0.6, 0.12, 0.1, 0, 3.15, 0.3); // mahkota
    return g;
  };
  const groom = person(false), bride = person(true);
  groom.position.set(-0.95, TOP, -1.6); groom.rotation.y = 0.35;
  bride.position.set(0.95, TOP, -1.6); bride.rotation.y = -0.35;
  scene.add(groom, bride);
  groom.userData = { kind: 'groom', hop: 0 }; bride.userData = { kind: 'bride', hop: 0 };

  // bunga voxel di sekeliling altar 
  const flowers = new THREE.Group(); scene.add(flowers);
  const flower = (x, z) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    vox(g, C.sapphire, 0.15, 0.8, 0.15, 0, 0.4, 0);
    [[0.2, 0], [-0.2, 0], [0, 0.2], [0, -0.2]].forEach(([dx, dz]) => vox(g, C.cream, 0.28, 0.28, 0.28, dx, 0.9, dz));
    vox(g, C.accent, 0.22, 0.22, 0.22, 0, 0.98, 0);
    g.userData.kind = 'flower'; flowers.add(g);
  };
  const FL = LOW ? 8 : 14; // jumlah per sisi, dikurangi di device lemah
  for (let i = 0; i < FL; i++) {
    const x = -4.6 + (9.2 * i) / (FL - 1);
    flower(x, 1.6);                                        // barisan depan
    if (i < FL / 2) { flower(-4.9, -4.8 + i * 1.1); flower(4.9, -4.8 + i * 1.1); } // sisi kiri-kanan
  }

  // partikel biru muda 
  const PCOUNT = LOW ? 100 : 260;
  const particles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.14, 0.14),
    new THREE.MeshStandardMaterial({ color: C.accent, emissive: C.accent, emissiveIntensity: 0.9, metalness: 0.5, roughness: 0.4 }), PCOUNT);
  const seeds = Array.from({ length: PCOUNT }, () => ({
    x: (Math.random() - 0.5) * 30, y: 0.5 + Math.random() * 11, z: (Math.random() - 0.5) * 26 - 2,
    s: 0.3 + Math.random() * 0.7, p: Math.random() * 6.28 }));
  scene.add(particles);

  // pencahayaan 
  scene.add(new THREE.AmbientLight(0xdbe7ff, 0.7));
  const sun = new THREE.DirectionalLight(0xeaf2ff, 2.2); 
  sun.position.set(8, 14, 10);
  if (!LOW) {
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 14, bottom: -8, near: 1, far: 40 });
  }
  scene.add(sun);
  const glow = new THREE.PointLight(C.accent, 45, 18, 2); glow.position.set(0, 4.5, -1); scene.add(glow);

  //posisi kamera/ POV
  const KEY = {
    cover:    { angle: 0,    radius: 7,  height: 2.8, tx: 0, ty: 2.3, tz: -1.6 }, // close-up karakter
    mempelai: { angle: 0.26, radius: 13, height: 4.5, tx: 0, ty: 2.5, tz: -1.6 }, // zoom out + putar ±15°
    acara:    { angle: 0.9,  radius: 15, height: 9,   tx: 4, ty: 1.5, tz: -1.6 }, // geser samping, bird's eye
    gallery:  { angle: 0,    radius: 24, height: 9,   tx: 0, ty: 2.5, tz: -2 }    // mundur, lihat seluruh scene
  };
  const rig = { ...KEY.cover };
  let K = 1; 
  const user = { yaw: 0, pitch: 0, zoom: 0 }, mouse = { x: 0, y: 0 };
  // override kamera
  const focus = { w: 0, pos: new THREE.Vector3(), tgt: new THREE.Vector3(), cur: -1 };
  const tg = new THREE.Vector3();
  const applyRig = (t) => {
    const a = rig.angle + Math.sin(t * 0.3) * 0.04 + user.yaw + mouse.x; 
    camera.position.set(rig.tx + Math.sin(a) * rig.radius * K, rig.height + user.pitch + mouse.y, rig.tz + Math.cos(a) * rig.radius * K);
    tg.set(rig.tx, rig.ty, rig.tz);
    if (focus.w > 0.001) {
      camera.position.lerp(focus.pos, focus.w); tg.lerp(focus.tgt, focus.w);
      camera.position.x += (user.yaw + mouse.x) * focus.w * 2;        
      camera.position.y += (user.pitch + mouse.y) * focus.w * 0.3;
    }
    if (user.zoom) camera.position.sub(tg).multiplyScalar(1 + user.zoom).add(tg); // zoom mendekat/menjauh dari target
    camera.lookAt(tg);
  };

  // tiap section menggerakkan rig dari keyframe sebelumnya ke berikutnya
  gsap.registerPlugin(ScrollTrigger);
  [['#mempelai', 'cover', 'mempelai', 'top bottom', 'top 20%'],
   ['#acara', 'mempelai', 'acara', 'top bottom', 'top 20%'],
   ['#gallery', 'acara', 'gallery', 'top bottom', 'top 20%']].forEach(([trigger, from, to, start, end]) =>
    gsap.fromTo(rig, { ...KEY[from] }, { ...KEY[to], ease: 'power2.inOut', immediateRender: false,
      scrollTrigger: { trigger, start, end, scrub: 1.2 } }));

  window.addEventListener('invitation-open', () =>
    gsap.from(rig, { radius: KEY.cover.radius + 5, height: KEY.cover.height + 2, duration: 2.6, ease: 'power2.out' }));

  // galeri bingkai 3D 
  const FRAMES = [
    { src: 'assets/images/pict1.jpg', cap: 'Senja di Tugu Pahlawan', x: -13, z: -1.5 },
    { src: 'assets/images/pict2.jpg', cap: 'Kopi pagi di Kayutangan', x: -9.5, z: -4 },
    { src: 'assets/images/pict3.jpg', cap: 'Sore di Taman Bungkul', x: -6.2, z: -5.5 },
    { src: 'assets/images/pict4.jpg', cap: 'Malam di Jembatan Merah', x: 6.2, z: -5.5 },
    { src: 'assets/images/pict5.jpg', cap: 'Akhir pekan di Batu', x: 9.5, z: -4 },
    { src: 'assets/images/pict6.jpg', cap: 'Hari lamaran keluarga', x: 13, z: -1.5 }
  ];
  const fallbackTex = (n) => { 
    const c = document.createElement('canvas'); c.width = 256; c.height = 320;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 256, 320);
    gr.addColorStop(0, '#2557c4'); gr.addColorStop(0.6, '#0f2f7a'); gr.addColorStop(1, '#4a7fe0');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 320);
    g.fillStyle = 'rgba(255,255,255,.12)';
    for (let y = 0; y < 320; y += 32) for (let x = (y / 32 % 2) * 32; x < 256; x += 64) g.fillRect(x, y, 32, 32);
    g.fillStyle = '#f6f3ec'; g.font = '700 28px serif'; g.textAlign = 'center'; g.fillText('Momen ' + n, 128, 170);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const loader = new THREE.TextureLoader(), frameGroup = new THREE.Group(); scene.add(frameGroup);
  const FW = 2.4, FH = 3, FY = 3.7;
  const frames = FRAMES.map((f, i) => {
    const g = new THREE.Group(); g.position.set(f.x, FY, f.z);
    g.userData = { kind: 'frame', index: i, baseY: FY };
    vox(g, C.accent, FW + 0.5, 0.25, 0.3, 0, FH / 2 + 0.12, 0); vox(g, C.accent, FW + 0.5, 0.25, 0.3, 0, -FH / 2 - 0.12, 0);
    vox(g, C.accent, 0.25, FH, 0.3, -FW / 2 - 0.12, 0, 0); vox(g, C.accent, 0.25, FH, 0.3, FW / 2 + 0.12, 0, 0);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), new THREE.MeshBasicMaterial({ map: fallbackTex(i + 1) }));
    pic.position.z = 0.1; g.add(pic);
    loader.load(f.src, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; pic.material.map = tex; pic.material.needsUpdate = true; }, undefined, () => {});
    g.lookAt(0, FY, 14);                                  // hadap ke arah kamera galeri
    frameGroup.add(g);
    const ped = new THREE.Group(); ped.position.set(f.x, 0, f.z); scene.add(ped);   // pedestal voxel
    vox(ped, C.sapphire, 1.4, 1.2, 1.4, 0, 0.6, 0); vox(ped, C.accent, 1.7, 0.25, 1.7, 0, 1.3, 0);
    return g;
  });

  // geser kamera ke titik fokus
  const emit = () => window.dispatchEvent(new CustomEvent('gallery-state', { detail: {
    index: focus.cur, caption: focus.cur >= 0 ? `${focus.cur + 1} / ${FRAMES.length} · ${FRAMES[focus.cur].cap}` : 'Pilih sebuah bingkai' } }));
  const flyTo = (p, t) => {
    gsap.killTweensOf([focus, focus.pos, focus.tgt]);
    if (focus.w < 0.5) { focus.pos.copy(p); focus.tgt.copy(t); }
    else { gsap.to(focus.pos, { x: p.x, y: p.y, z: p.z, duration: 1.4, ease: 'power2.inOut' });
           gsap.to(focus.tgt, { x: t.x, y: t.y, z: t.z, duration: 1.4, ease: 'power2.inOut' }); }
    gsap.to(focus, { w: 1, duration: 1.6, ease: 'power2.inOut' });
    gsap.to(user, { zoom: 0, duration: 0.6 });
  };
  const release = () => {                                
    gsap.killTweensOf([focus, focus.pos, focus.tgt]);
    gsap.to(focus, { w: 0, duration: 1.4, ease: 'power2.inOut' }); gsap.to(user, { zoom: 0, duration: 0.8 });
    focus.cur = -1; emit();
  };
  const openFrame = (i) => {
    focus.cur = (i + FRAMES.length) % FRAMES.length; emit();
    const g = frames[focus.cur], n = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion);
    const tgt = new THREE.Vector3(g.position.x, FY, g.position.z);
    flyTo(tgt.clone().addScaledVector(n, camera.aspect < 0.8 ? 8.5 : 6.2).add(new THREE.Vector3(0, 0.5, 0)), tgt);
  };
  const PRESET = { couple: [[2.5, 3, 4.8], [0, 2.3, -1.6]], altar: [[9, 6.5, 9], [0, 4.2, -2]], all: [[0, 10, 26], [0, 2.5, -2]] };
  addEventListener('scene-cmd', (e) => {
    const c = e.detail;
    if (PRESET[c]) {
      const [p, t] = PRESET[c].map((a) => new THREE.Vector3(...a));
      focus.cur = -1; emit(); flyTo(t.clone().add(p.sub(t).multiplyScalar(K)), t);
    } else if (c === 'frame:next') openFrame(focus.cur + 1);
    else if (c === 'frame:prev') openFrame(focus.cur < 0 ? FRAMES.length - 1 : focus.cur - 1);
    else release();                                       
  });
  // keluar dari galeri saat scroll menjauh
  const leaveGallery = () => { if (!document.body.classList.contains('focus-mode') && focus.w > 0) release(); };
  ScrollTrigger.create({ trigger: '#gallery', start: 'top 70%', end: 'bottom 30%', onLeave: leaveGallery, onLeaveBack: leaveGallery });
  // Zoom dengan scroll wheel hanya saat mode fokus
  addEventListener('wheel', (e) => {
    if (!document.body.classList.contains('focus-mode')) return;
    e.preventDefault(); user.zoom = gsap.utils.clamp(-0.45, 0.6, user.zoom + e.deltaY * 0.0008);
  }, { passive: false });

  const fx = { flare: 0 };
  let lastT = 0;

  // confetti 
  const CF = LOW ? 60 : 110;
  const cfMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial(), CF);
  cfMesh.frustumCulled = false; scene.add(cfMesh);
  const cf = Array.from({ length: CF }, () => ({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3() }));
  for (let i = 0; i < CF; i++) cfMesh.setColorAt(i, col.set(C.accent));
  let cfI = 0;
  const burst = (pos, n = 30, power = 1) => {
    for (let k = 0; k < n; k++) {
      const i = cfI++ % CF, d = cf[i];
      d.life = 1.2 + Math.random() * 0.6; d.p.copy(pos);
      d.v.set((Math.random() - 0.5) * 6 * power, (3 + Math.random() * 4) * power, (Math.random() - 0.5) * 6 * power);
      cfMesh.setColorAt(i, col.set(Math.random() < 0.6 ? C.accent : C.pearl));
    }
    cfMesh.instanceColor.needsUpdate = true;
  };
  const updateConfetti = (dt) => {
    cf.forEach((d, i) => {
      if (d.life > 0) {
        d.life -= dt; d.v.y -= 9 * dt; d.p.addScaledVector(d.v, dt);
        if (d.p.y < 0.05) { d.p.y = 0.05; d.v.multiplyScalar(0.3); }
        dummy.position.copy(d.p); dummy.rotation.set(d.life * 6, d.life * 4, 0);
        dummy.scale.setScalar(Math.min(Math.max(d.life, 0), 1));
      } else dummy.scale.setScalar(0);
      dummy.updateMatrix(); cfMesh.setMatrixAt(i, dummy.matrix);
    });
    cfMesh.instanceMatrix.needsUpdate = true;
  };

  // reaksi per objek
  const headOf = (o) => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).add(new THREE.Vector3(0, 3.3, 0));
  const hop = (p, spin) => {
    gsap.timeline().to(p.userData, { hop: 1.3, duration: 0.3, ease: 'power2.out' })
      .to(p.userData, { hop: 0, duration: 0.5, ease: 'bounce.out' });
    if (spin) gsap.to(p.rotation, { y: p.rotation.y + Math.PI * 2, duration: 0.9, ease: 'power2.inOut' });
  };
  const met = new Set(); // mencatat siapa yang sudah diklik, klik dua2nya ntar ada perayaan
  const react = (kind, obj, point) => {
    if (kind === 'frame') { openFrame(obj.userData.index); burst(point, 14, 0.6); return; }
    if (kind === 'groom' || kind === 'bride') {
      hop(obj, kind === 'bride');
      if (kind === 'groom') gsap.to(groom.rotation, { x: 0.45, duration: 0.25, yoyo: true, repeat: 1 }); // membungkuk
      burst(headOf(obj), 30); met.add(kind);
      if (met.size === 2) {
        met.clear();
        setTimeout(() => {
          hop(groom, false); hop(bride, false); fx.flare = 250; gsap.to(fx, { flare: 0, duration: 1.6 });
          burst(new THREE.Vector3(0, 4, -1.6), CF, 1.4);
          window.dispatchEvent(new CustomEvent('scene-toast', { detail: 'Mereka resmi bersatu. Selamat!' }));
        }, 500);
      }
    } else if (kind === 'altar') {
      fx.flare = 200; gsap.to(fx, { flare: 0, duration: 1.2 }); burst(point, 40);
    } else if (kind === 'flower') {
      gsap.fromTo(obj.scale, { x: 1.7, y: 1.7, z: 1.7 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'elastic.out(1,.4)' });
      burst(point, 16, 0.7);
    } else burst(point, 14, 0.6); // lantai
  };

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), targets = [groom, bride, altar, flowers, floor, frameGroup];
  const pick = (e) => {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(targets, true)[0];
    if (!hit) return null;
    let o = hit.object; while (o && !o.userData.kind) o = o.parent;
    return o ? { obj: o, kind: o.userData.kind, point: hit.point } : null;
  };

  const mx = gsap.quickTo(mouse, 'x', { duration: 1.2, ease: 'power3.out' });
  const my = gsap.quickTo(mouse, 'y', { duration: 1.2, ease: 'power3.out' });
  let down = null, moved = 0, pending = false;
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, yaw: user.yaw, pitch: user.pitch }; moved = 0;
    gsap.killTweensOf(user); window.dispatchEvent(new Event('scene-interact'));
  });
  addEventListener('pointermove', (e) => {
    if (down) { // sedang drag
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      moved = Math.max(moved, Math.hypot(dx, dy));
      user.yaw = gsap.utils.clamp(-0.9, 0.9, down.yaw - dx * 0.004);
      user.pitch = gsap.utils.clamp(-1.5, 4, down.pitch + dy * 0.012);
      return;
    }
    if (e.pointerType !== 'mouse') return;
    mx((e.clientX / innerWidth - 0.5) * 0.25); my((e.clientY / innerHeight - 0.5) * 1.2); // parallax
    if (e.target === canvas && !pending) { // kursor pointer saat di atas objek interaktif
      pending = true;
      requestAnimationFrame(() => { pending = false; const h = pick(e); canvas.style.cursor = h && h.kind !== 'floor' ? 'pointer' : 'grab'; });
    }
  });
  const endPress = (e) => {
    if (!down) return;
    const isClick = moved < 6 && e.type === 'pointerup'; down = null;
    if (isClick) { const h = pick(e); if (h) react(h.kind, h.obj, h.point);
      else if (focus.cur >= 0) window.dispatchEvent(new CustomEvent('scene-cmd', { detail: document.body.classList.contains('focus-mode') ? 'all' : 'release' })); }
    else gsap.to(user, { yaw: 0, pitch: 0, duration: 1.8, ease: 'power3.out' }); // spring kembali
  };
  addEventListener('pointerup', endPress); addEventListener('pointercancel', endPress);

  //resize
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    K = camera.aspect < 0.8 ? 1.4 : 1;
  };
  resize(); addEventListener('resize', resize);

  //loop animasinya
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) return;                         // hemat baterai saat tab tidak aktif
    const t = clock.getElapsedTime();
    const dt = Math.min(t - lastT, 0.05); lastT = t; updateConfetti(dt);
    groom.position.y = TOP + Math.sin(t * 2) * 0.04 + groom.userData.hop;     // karakter bernapas pelan
    bride.position.y = TOP + Math.sin(t * 2 + 1.2) * 0.04 + bride.userData.hop;
    for (let i = 0; i < PCOUNT; i++) {
      const s = seeds[i];
      dummy.position.set(s.x + Math.sin(t * 0.2 + s.p) * 0.5, s.y + Math.sin(t * s.s + s.p) * 0.6, s.z);
      dummy.rotation.set(t * s.s, t * s.s, 0); dummy.scale.set(1, 1, 1);
      dummy.updateMatrix(); particles.setMatrixAt(i, dummy.matrix);
    }
    particles.instanceMatrix.needsUpdate = true;
    glow.intensity = 45 + Math.sin(t * 1.5) * 6 + fx.flare;
    frames.forEach((g, i) => { g.position.y = g.userData.baseY + Math.sin(t * 1.2 + i) * 0.12; }); 
    applyRig(t);
    renderer.render(scene, camera);
  })();
}
