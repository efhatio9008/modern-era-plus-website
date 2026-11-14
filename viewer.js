import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
// Integrated Modern Era Plus home-page viewer; does not embed the previous V0.1 website.
const host = document.getElementById('offshore-viewer');
if (host) {
  const stage = document.getElementById('viewer-canvas');
  const overlay = document.getElementById('viewer-overlay');
  const status = document.getElementById('viewer-status');
  const bar = document.getElementById('viewer-bar');
  const startBtn = document.getElementById('viewer-start');
  const note = document.getElementById('viewer-load-note');
  const rotateBtn = document.getElementById('viewer-rotate');
  const resetBtn = document.getElementById('viewer-reset');
  let scene, camera, renderer, controls, rotor, model, grid, clock;
  let loading = false, loaded = false, autospin = true, mode = 'holo';
  const renderables = [];
  let pristineCamera = new THREE.Vector3(7, 4.8, 8.5);
  const holo = new THREE.MeshBasicMaterial({
    color: 0x39fff0, transparent: true, opacity: .145, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const invisible = new THREE.MeshBasicMaterial({
    color: 0x0, transparent: true, opacity: 0, depthWrite: false
  });
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x6cfff3, transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const setStatus = (str) => {
    status.textContent = str;
  };
  function updateMode() {
    host.querySelectorAll('[data-view-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.viewMode === mode)));
    for (const m of renderables) {
      m.mesh.material = (mode === 'original') ? m.original : (mode === 'wire' ? invisible : holo);
      if (m.lines) {
        m.lines.visible = mode !== 'original';
        m.lines.material.opacity = mode === 'holo' ? .72 : .97;
      }
    }
    if (grid)
      grid.visible = mode !== 'original';
  }
  host.querySelectorAll('[data-view-mode]').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.viewMode;
    updateMode();
  }));
  rotateBtn.addEventListener('click', () => {
    autospin = !autospin;
    rotateBtn.textContent = '⟳ Auto Rotate: ' + (autospin ? 'ON' : 'OFF');
    rotateBtn.setAttribute('aria-pressed', String(autospin));
  });
  resetBtn.addEventListener('click', () => {
    if (rotor)
      rotor.rotation.set(0, 0, 0);
    if (controls && camera) {
      camera.position.copy(pristineCamera);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  });
  function setup() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(43, 1, .025, 200);
    camera.position.copy(pristineCamera);
    renderer = new THREE.WebGLRenderer({
      alpha: true, antialias: true, powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x091b2a, 0);
    renderer.setSize(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight), false);
    stage.append(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Drag to rotate the offshore platform. Scroll or pinch to zoom.');
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .068;
    controls.enablePan = false;
    controls.minDistance = 5.0;
    controls.maxDistance = 21;
    controls.maxPolarAngle = Math.PI * .91;
    controls.minPolarAngle = .14;
    controls.target.set(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xc1edff, 0x263e52, 1.9));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(8, 9, 7);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x52d2dd, 1.1);
    fill.position.set(-7, 5, -9);
    scene.add(fill);
    const glow = new THREE.PointLight(0x44e5d8, 28, 25);
    glow.position.set(0, 3, 0);
    scene.add(glow);
    rotor = new THREE.Group();
    scene.add(rotor);
    grid = new THREE.Group();
    const floor = new THREE.GridHelper(22, 32, 0x3a9a9e, 0x1b5062);
    floor.position.y = -2.85;
    floor.material.transparent = true;
    floor.material.opacity = .3;
    grid.add(floor);
    for (const r of [3.1, 4.5]) {
      const vertices = [];
      for (let i = 0; i <= 124; i++) {
        const a = i / 124 * Math.PI * 2;
        vertices.push(new THREE.Vector3(Math.cos(a) * r, -2.83, Math.sin(a) * r));
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(vertices), new THREE.LineBasicMaterial({
        color: 0x4dd8d9, transparent: true, opacity: r === 3.1 ? .47 : .17
      }));
      grid.add(line);
    }
    scene.add(grid);
    const resize = () => {
      if (!renderer)
        return;
      const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', resize, {passive: true});
    resize();
    clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      if (document.hidden)
        return;
      const dt = Math.min(clock.getDelta(), .045);
      if (autospin && loaded)
        rotor.rotation.y += dt * .14;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  }
  // Keep wireframe responsive: sample a bounded number of triangles instead of exploding 1.87M triangles into edge lines.
  function sampledEdges(geometry, triangleBudget) {
    const position = geometry.getAttribute('position');
    if (!position)
      return null;
    const idx = geometry.getIndex(), count = Math.floor((idx ? idx.count : position.count) / 3);
    const stride = Math.max(1, Math.ceil(count / triangleBudget));
    const buffer = new Float32Array((Math.ceil(count / stride)) * 18);
    let out = 0;
    const add = (n) => {
      buffer[out++] = position.getX(n);
      buffer[out++] = position.getY(n);
      buffer[out++] = position.getZ(n);
    };
    for (let i = 0; i < count; i += stride) {
      const base = i * 3;
      const a = idx ? idx.getX(base) : base, b = idx ? idx.getX(base + 1) : base + 1, c = idx ? idx.getX(base + 2) : base + 2;
      add(a);
      add(b);
      add(b);
      add(c);
      add(c);
      add(a);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(buffer.subarray(0, out), 3));
    geo.computeBoundingSphere();
    return geo;
  }
  function install(gltf) {
    model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.x) || Math.max(size.x, size.y, size.z) < .0001)
      throw Error('Model bounds could not be determined.');
    const scale = 5.65 / Math.max(size.x, size.y, size.z);
    const centered = new THREE.Group();
    centered.scale.setScalar(scale);
    model.position.sub(center);
    centered.add(model);
    rotor.add(centered);
    model.traverse(obj => {
      if (!obj.isMesh)
        return;
      const g = obj.geometry;
      if (!g)
        return;
      const edgeGeom = sampledEdges(g, 31000);
      const line = edgeGeom ? new THREE.LineSegments(edgeGeom, edgeMat) : null;
      if (line) {
        line.name = 'Sampled Hologram Edges';
        line.frustumCulled = false;
        obj.add(line);
      }
      renderables.push({
        mesh: obj, original: obj.material, lines: line
      });
    });
    if (!renderables.length)
      throw Error('This GLB has no renderable mesh.');
    // Dynamic camera framing after geometry normalization.
    const a = Math.max(.62, stage.clientWidth / Math.max(1, stage.clientHeight));
    const distance = a < .86 ? 13.5 : (a < 1.1 ? 11.5 : 10.6);
    pristineCamera = new THREE.Vector3(distance * .67, distance * .47, distance * .75);
    camera.position.copy(pristineCamera);
    controls.minDistance = 4.9;
    controls.maxDistance = 22;
    controls.target.set(0, 0, 0);
    controls.update();
    updateMode();
    loaded = true;
    loading = false;
    overlay.hidden = true;
    bar.style.width = '100%';
    setStatus('3D MODEL READY');
  }
  function fail(err) {
    console.error('Platform viewer:', err);
    loading = false;
    loaded = false;
    setStatus('LOAD UNAVAILABLE');
    overlay.hidden = false;
    overlay.querySelector('h3').textContent = 'Unable to load 3D model';
    note.textContent = 'Check your connection, WebGL support and model file path. Then try again.';
    startBtn.disabled = false;
    startBtn.textContent = 'Retry 3D loading ↻';
  }
  function load() {
    if (loading || loaded)
      return;
    loading = true;
    overlay.hidden = false;
    overlay.querySelector('h3').textContent = 'Preparing the 3D platform';
    note.textContent = 'Downloading the original GLB model. Please keep the page open.';
    startBtn.disabled = true;
    startBtn.textContent = 'Loading model...';
    setStatus('LOADING MODEL');
    try {
      if (!renderer)
        setup();
    }
    catch (e) {
      fail(e);
      return;
    }
    const loader = new GLTFLoader();
    loader.load('assets/models/offshore-platform.glb', gltf => {
      try {
        install(gltf);
      }
      catch (e) {
        fail(e);
      }
    }, event => {
      if (event.lengthComputable && event.total) {
        const pc = Math.min(99, Math.round(event.loaded / event.total * 100));
        bar.style.width = pc + '%';
        note.textContent = `Loading ${pc}% · ${(event.loaded / 1048576).toFixed(1)} MB / ${(event.total / 1048576).toFixed(1)} MB`;
      }
      else
        note.textContent = `Downloading ${(event.loaded / 1048576).toFixed(1)} MB · Original model ~69 MB`;
    }, fail);
  }
  startBtn.addEventListener('click', load);
  // Desktop: load automatically so the platform auto-rotates in the first screen.
  // Phone / Save Data: require deliberate user action to avoid involuntarily transferring ~69 MB.
  const small = window.matchMedia('(max-width: 700px)').matches;
  const save = !!navigator.connection?.saveData;
  if (!small && !save) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) {
          observer.disconnect();
          window.setTimeout(load, 800);
        }
      }, {threshold: .08});
      observer.observe(host);
    }
    else
      window.setTimeout(load, 900);
    note.textContent = 'Desktop auto-load enabled · 69 MB model';
  }
}
