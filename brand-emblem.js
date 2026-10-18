// Lacquered enamel and brushed metal, lit by a small procedural studio.
const root = document.querySelector('.brand-bridge');
if (root) initEmblem().catch(() => { /* Keep the static brand artwork if WebGL or the CDN is unavailable. */ });

async function initEmblem() {
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
  const canvas = root.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, precision: 'highp' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 3));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new THREE.Scene();
  // Softboxes create real reflections on the lacquer and the bevels.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x201c19);
  for (const [position, size, color] of [
    [[-4, 5, 7], [5, 8], [5, 4.3, 3.5]],
    [[5, 2, 3], [2, 7], [2.1, 1.7, 1.2]],
    [[0, -3, 5], [8, 1.5], [.7, .65, .55]],
    [[-2, 3, -5], [3, 6], [3, 2.2, 1.3]]
  ]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ color: new THREE.Color(...color), side: THREE.DoubleSide }));
    panel.position.set(...position);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, .12);
  scene.environment = environment.texture;
  pmrem.dispose();
  studio.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 50);
  camera.position.set(0, .1, 5.5);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xfff0d6, 0x2a1713, 1.1));
  for (const [color, power, pos] of [[0xffe8d4, 2.2, [-3, 4, 5]], [0xc7a360, 1.3, [4, 1, -3]]]) {
    const light = new THREE.DirectionalLight(color, power);
    light.position.set(...pos);
    scene.add(light);
  }
  const emblem = new THREE.Group();
  scene.add(emblem);
  const outline = new THREE.Shape();
  outline.absellipse(0, 0, 1.72, .83, 0, Math.PI * 2, false, 0);
  const geometry = new THREE.ExtrudeGeometry(outline, { depth: .24, bevelEnabled: true, bevelSegments: 12, steps: 1, bevelSize: .045, bevelThickness: .035, curveSegments: 192 });
  geometry.translate(0, 0, -.12);
  const metal = new THREE.MeshStandardMaterial({ color: 0xbfa77f, metalness: .85, roughness: .26, envMapIntensity: .9 });
  emblem.add(new THREE.Mesh(geometry, metal));
  // High-resolution vector rasterization and a separate relief map keep the lettering crisp.
  const artwork = await new THREE.ImageLoader().loadAsync('assets/brand-emblem.svg');
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = 2048; colorCanvas.height = 1024;
  const colorContext = colorCanvas.getContext('2d');
  colorContext.drawImage(artwork, 0, 0, 2048, 1024);
  const texture = new THREE.CanvasTexture(colorCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const reliefCanvas = document.createElement('canvas');
  reliefCanvas.width = 1024; reliefCanvas.height = 512;
  const reliefContext = reliefCanvas.getContext('2d');
  reliefContext.drawImage(artwork, 0, 0, 1024, 512);
  const reliefPixels = reliefContext.getImageData(0, 0, 1024, 512);
  for (let i = 0; i < reliefPixels.data.length; i += 4) {
    const height = reliefPixels.data[i + 1] > 140 && reliefPixels.data[i + 2] > 110 ? 230 : 12;
    reliefPixels.data[i] = reliefPixels.data[i + 1] = reliefPixels.data[i + 2] = height;
    reliefPixels.data[i + 3] = 255;
  }
  reliefContext.putImageData(reliefPixels, 0, 0);
  const relief = new THREE.CanvasTexture(reliefCanvas);
  relief.anisotropy = texture.anisotropy;
  const faceGeometry = new THREE.RingGeometry(0, 1, 192, 24);
  const positions = faceGeometry.attributes.position;
  const uv = faceGeometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i);
    uv.setXY(i, (x + 1) / 2, (y + 1) / 2);
    positions.setXYZ(i, x * 1.72, y * .83, .024 * (1 - x * x - y * y));
  }
  faceGeometry.computeVertexNormals();
  const material = new THREE.MeshPhysicalMaterial({ map: texture, bumpMap: relief, bumpScale: .009, roughness: .32, metalness: .08, clearcoat: .85, clearcoatRoughness: .18, envMapIntensity: .65, alphaTest: .05 });
  const front = new THREE.Mesh(faceGeometry, material);
  front.position.z = .157;
  emblem.add(front);
  const back = new THREE.Mesh(faceGeometry, material);
  back.rotation.y = Math.PI;
  back.position.z = -.157;
  emblem.add(back);
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xdac49a, metalness: .8, roughness: .22, envMapIntensity: .85 });
  for (const z of [-.16, .16]) {
    const curve = new THREE.EllipseCurve(0, 0, 1.725, .835, 0, Math.PI * 2);
    const path = new THREE.CatmullRomCurve3(curve.getPoints(256).map(p => new THREE.Vector3(p.x, p.y, z)), true);
    emblem.add(new THREE.Mesh(new THREE.TubeGeometry(path, 256, .022, 16, true), rimMaterial));
  }
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, frame = 0, previous = null, angle = -.28;
  function draw() {
    emblem.rotation.set(-.14, angle, -.025);
    renderer.render(scene, camera);
  }
  function animate(time) {
    frame = 0;
    if (!visible || document.hidden || motion.matches) { previous = null; return; }
    if (previous !== null) angle += Math.min((time - previous) / 1000, .05) * .18;
    previous = time;
    draw();
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = null;
    if (motion.matches) { angle = -.28; draw(); }
    else if (visible && !document.hidden) frame = requestAnimationFrame(animate);
  }
  function resize() {
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = Math.max(5.5, 4.2 / camera.aspect);
    camera.updateProjectionMatrix();
    draw();
  }
  new ResizeObserver(resize).observe(canvas.parentElement);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .05 }).observe(root);
  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(frame); root.classList.remove('is-ready'); });
  resize();
  root.classList.add('is-ready');
  root.dataset.quality = 'studio';
}
