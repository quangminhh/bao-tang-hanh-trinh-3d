/* BẢO TÀNG HÀNH TRÌNH — lõi: bộ dựng hình, bầu trời HDRI + mặt trời, hậu kỳ, người xem đi bộ,
   va chạm, nạp/giải phóng từng gian, tham quan tự động, bản đồ nhỏ. */
(function () {
  'use strict';
  const T = THREE;
  const HT = (window.HT = window.HT || {});
  const C = (HT.core = {});
  HT.uTime = { value: 0 };
  HT.lang = 'vi';

  let renderer, scene, camera, composer, pmrem, clock;
  const passes = {};
  let sun, hemi;
  let hall = null;        // bối cảnh gian đang mở
  let busy = false;
  C.scene = () => scene; C.camera = () => camera; C.renderer = () => renderer; C.hall = () => hall;

  /* ------------------------------------------------ chất lượng ------------------------------------------------ */
  const QUAL = [
    { ten: 'Thấp', en: 'Low', pr: 0.75, msaa: 0, ao: false, bloom: false, shadow: 2048, grass: 0.35, trees: 0.6 },
    { ten: 'Vừa', en: 'Medium', pr: 1.0, msaa: 4, ao: false, bloom: true, shadow: 2048, grass: 0.65, trees: 0.85 },
    { ten: 'Cao', en: 'High', pr: 1.25, ss: 1.25, msaa: 4, ao: true, bloom: true, shadow: 4096, grass: 1.0, trees: 1.0 },
    { ten: 'Siêu', en: 'Ultra', pr: 2.0, ss: 1.6, msaa: 8, ao: true, bloom: true, shadow: 4096, grass: 1.35, trees: 1.0 },
  ];
  C.QUAL = QUAL;
  function applyQuality(level) {
    const q = QUAL[level];
    HT.q = { level, grass: q.grass, shadow: q.shadow, trees: q.trees };
    renderer.setPixelRatio(pixelRatioFor(level));
    sun.shadow.mapSize.set(q.shadow, q.shadow);
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    buildComposer();
    onResize();
  }
  /* giới hạn số điểm ảnh vẽ theo mức chất lượng (màn 2K/4K vẫn mượt) */
  /* Cao/Siêu: siêu lấy mẫu (vẽ lớn hơn màn hình rồi thu nhỏ) cho nét hơn; hệ số động C.dyn tự hạ khi máy không kịp 60 hình/giây */
  C.dyn = 1;
  function pixelRatioFor(level) {
    const q = QUAL[level], w = window.innerWidth, h = window.innerHeight;
    const maxPx = [1.3e6, 2.6e6, 5.6e6, 11e6][level];
    const dpr = window.devicePixelRatio || 1;
    const want = q.ss ? Math.max(dpr, 1) * q.ss : Math.min(dpr, q.pr);
    const pr = Math.min(want, 2.5, Math.sqrt(maxPx / Math.max(1, w * h)));
    return Math.max(0.5, Math.round(pr * C.dyn * 20) / 20);
  }
  C.setQuality = function (level) { try { localStorage.setItem('ht3d_q', String(level)); } catch (e) {} applyQuality(level); };

  /* ------------------------------------------------ khởi tạo ------------------------------------------------ */
  C.init = function (canvas) {
    renderer = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    HT.maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(62, 1, 0.08, 4000);
    camera.rotation.order = 'YXZ';
    camera.layers.enable(1);   /* lớp 1: cỏ, lúa, lau sậy — không vẽ vào ảnh phản chiếu mặt nước và bản đồ */
    pmrem = new T.PMREMGenerator(renderer);
    clock = new T.Clock();

    sun = new T.DirectionalLight(0xffffff, 3);
    sun.castShadow = true;
    sun.shadow.bias = -0.00025;
    sun.shadow.normalBias = 0.035;
    sun.shadow.radius = 2.5;
    const S = 42;
    Object.assign(sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 1, far: 420 });
    scene.add(sun, sun.target);
    hemi = new T.HemisphereLight(0xffffff, 0x444433, 0);
    scene.add(hemi);

    let lv = 2;
    try { const s = localStorage.getItem('ht3d_q'); if (s != null) lv = +s; else lv = autoLevel(); } catch (e) { lv = autoLevel(); }
    const qs = new URLSearchParams(location.search);
    const qp = qs.get('q'); if (qp != null) lv = +qp;
    if (qs.has('fixres')) C.fixedRes = true;
    applyQuality(Math.max(0, Math.min(3, lv)));
    window.addEventListener('resize', onResize);
    bindInput(canvas);
    requestAnimationFrame(frame);
  };
  function autoLevel() {
    try {
      const gl = renderer.getContext(); const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
      if (/RTX|Radeon RX [67]|Radeon Pro|Arc A7|Apple M[2-9] (Pro|Max|Ultra)/i.test(name)) return 2;
      if (/Intel|UHD|Iris|Mali|Adreno|PowerVR/i.test(name)) return 1;
      return 2;
    } catch (e) { return 1; }
  }

  /* ------------------------------------------------ hậu kỳ ------------------------------------------------ */
  /* chỉnh màu + làm nét thích ứng (kiểu CAS: nét mạnh ở vùng phẳng, nhẹ ở cạnh đã gắt) + nhiễu hạt mịn chống sọc dải màu */
  const GradeShader = {
    uniforms: { tDiffuse: { value: null }, sat: { value: 1.06 }, con: { value: 1.04 }, vig: { value: 0.28 }, tint: { value: new T.Color(1, 1, 1) }, lift: { value: 0.0 },
      texel: { value: new T.Vector2(1 / 1920, 1 / 1080) }, sharp: { value: 0.45 }, uTime: HT.uTime },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float sat, con, vig, lift, sharp, uTime; uniform vec3 tint; uniform vec2 texel; varying vec2 vUv;
      void main(){
        vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb;
        if (sharp > 0.001) {
          vec3 n = texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb, s2 = texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).rgb;
          vec3 e = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).rgb, w = texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).rgb;
          vec3 mn = min(col, min(min(n, s2), min(e, w))), mx = max(col, max(max(n, s2), max(e, w)));
          vec3 amp = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, 1e-4), 0.0, 1.0));
          vec3 wgt = -amp * mix(0.125, 0.2, sharp) * sharp;
          col = clamp((col + (n + s2 + e + w) * wgt) / (1.0 + 4.0 * wgt), 0.0, 1.0);
        }
        float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = mix(vec3(l), col, sat); col = (col - 0.5) * con + 0.5; col = col * tint + lift;
        vec2 d = vUv - 0.5; col *= 1.0 - vig * dot(d, d) * 1.6;
        float g = fract(sin(dot(vUv * 1000.0 + fract(uTime) * 91.7, vec2(12.9898, 78.233))) * 43758.5453);
        col += (g - 0.5) / 255.0;
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a); }`,
  };
  function buildComposer() {
    const q = QUAL[HT.q.level];
    if (composer) { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); for (const p of composer.passes) p.dispose && p.dispose(); }
    const sz = renderer.getDrawingBufferSize(new T.Vector2());
    const rt = new T.WebGLRenderTarget(Math.max(2, sz.x), Math.max(2, sz.y), { type: T.HalfFloatType, samples: q.msaa });
    composer = new T.EffectComposer(renderer, rt);
    passes.render = new T.RenderPass(scene, camera);
    composer.addPass(passes.render);
    passes.ao = null; passes.bloom = null;
    if (q.ao) {
      const ao = new T.GTAOPass(scene, camera, sz.x, sz.y);
      ao.output = T.GTAOPass.OUTPUT.Default;
      ao.blendIntensity = 0.85;
      ao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.6, thickness: 1.2, scale: 1.0, samples: q.level >= 3 ? 24 : 16, distanceFallOff: 1.0, screenSpaceRadius: false });
      ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
      /* lá cây dùng alphaTest: ẩn khi vẽ pháp tuyến, nếu không sẽ ra bóng AO hình vuông */
      const orig = ao._overrideVisibility.bind(ao);
      ao._overrideVisibility = function () {
        orig();
        const cache = this._visibilityCache;
        scene.traverse((o) => { if (o.visible && o.userData && o.userData.noAO) { cache.push(o); o.visible = false; } });
      };
      composer.addPass(ao); passes.ao = ao;
    }
    if (q.bloom) {
      passes.bloom = new T.UnrealBloomPass(new T.Vector2(sz.x, sz.y), 0.16, 0.5, 1.6);
      composer.addPass(passes.bloom);
    }
    passes.out = new T.OutputPass();
    composer.addPass(passes.out);
    passes.grade = new T.ShaderPass(GradeShader);
    passes.grade.uniforms.texel.value.set(1 / Math.max(2, sz.x), 1 / Math.max(2, sz.y));
    passes.grade.uniforms.sharp.value = [0.25, 0.4, 0.5, 0.42][HT.q.level];
    composer.addPass(passes.grade);
    if (!q.msaa) { passes.smaa = new T.SMAAPass(sz.x, sz.y); composer.addPass(passes.smaa); } else passes.smaa = null;
    if (hall && hall.def.sky) applyGrade(hall.def.sky);
  }
  function applyGrade(sky) {
    const g = passes.grade.uniforms;
    g.sat.value = sky.sat != null ? sky.sat : 1.06;
    g.con.value = sky.con != null ? sky.con : 1.04;
    g.vig.value = sky.vig != null ? sky.vig : 0.28;
    g.tint.value.set(sky.tint != null ? sky.tint : 0xffffff);
    g.lift.value = sky.lift || 0;
    if (passes.bloom) { passes.bloom.strength = sky.bloom != null ? sky.bloom : 0.16; passes.bloom.threshold = sky.bloomThr != null ? sky.bloomThr : 1.6; }
    if (passes.ao) passes.ao.blendIntensity = sky.ao != null ? sky.ao : 0.85;
  }
  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    if (HT.q && renderer.getPixelRatio() !== pixelRatioFor(HT.q.level)) renderer.setPixelRatio(pixelRatioFor(HT.q.level));
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
      const sz = renderer.getDrawingBufferSize(new T.Vector2());
      if (passes.grade) passes.grade.uniforms.texel.value.set(1 / Math.max(2, sz.x), 1 / Math.max(2, sz.y));
    }
  }

  /* ------------------------------------------------ bầu trời HDRI ------------------------------------------------ */
  const skyCache = new Map();
  function loadSky(slug) {
    if (skyCache.has(slug)) return skyCache.get(slug);
    const p = (async () => {
      const L = new T.HDRLoader(); L.setDataType(T.FloatType);
      const tex = await L.loadAsync('ht3d/hdri/' + slug + '.hdr');
      tex.mapping = T.EquirectangularReflectionMapping;
      tex.userData.shared = true;
      const img = tex.image, d = img.data, W = img.width, H = img.height;
      /* tách mặt trời: điểm sáng quá ngưỡng -> đèn mặt trời (có bóng); phần còn lại -> ánh sáng bầu trời */
      const thr = 22;
      const cl = new Float32Array(d.length); cl.set(d);
      const dA = ((2 * Math.PI) / W) * (Math.PI / H);
      let E = 0, cr = 0, cg = 0, cb = 0, best = 0, bx = 0, by = 0;
      const dir = new T.Vector3();
      const hor = [0, 0, 0]; let hn = 0;
      for (let y = 0; y < H; y++) {
        const v = 1 - (y + 0.5) / H, lat = (v - 0.5) * Math.PI, cy = Math.cos(lat), sy = Math.sin(lat);
        const nearHor = lat > 0.005 && lat < 0.06;
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
          const Lm = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          if (y < H / 2 && Lm > best) { best = Lm; bx = x; by = y; }
          if (nearHor) { hor[0] += r; hor[1] += g; hor[2] += b; hn++; }
          if (Lm > thr && y < H * 0.52) {
            const k = thr / Lm, w = dA * cy;
            cr += (r - r * k) * w; cg += (g - g * k) * w; cb += (b - b * k) * w;
            const e = (Lm - thr) * w; E += e;
            const phi = ((x + 0.5) / W - 0.5) * 2 * Math.PI;
            dir.x += Math.cos(phi) * cy * e; dir.y += sy * e; dir.z += Math.sin(phi) * cy * e;
            cl[i] = r * k; cl[i + 1] = g * k; cl[i + 2] = b * k;
          }
        }
      }
      if (E <= 0) {
        const v = 1 - (by + 0.5) / H, lat = (v - 0.5) * Math.PI, phi = ((bx + 0.5) / W - 0.5) * 2 * Math.PI;
        dir.set(Math.cos(phi) * Math.cos(lat), Math.sin(lat), Math.sin(phi) * Math.cos(lat));
      }
      dir.normalize();
      const sumC = cr + cg + cb || 1;
      const sunCol = new T.Color(cr / sumC * 3, cg / sumC * 3, cb / sumC * 3);
      if (E <= 0) sunCol.setRGB(1, 1, 1);
      /* ảnh bầu trời "puresky" không có mặt đất (nửa dưới gần như tối) -> mặt đứng trong bóng râm bị đen.
         Thay nửa dưới bằng ánh sáng dội lại từ mặt đất: L = ρ·(E_mặt trời·sinα + E_trời)/π, chuyển mượt qua đường chân trời. */
      if (/puresky/.test(slug)) {
        const irr = [0, 0, 0];
        for (let y = 0; y < H / 2; y++) {
          const v = 1 - (y + 0.5) / H, lat = (v - 0.5) * Math.PI; if (lat <= 0) continue;
          const w = dA * Math.cos(lat) * Math.sin(lat);
          for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; irr[0] += cl[i] * w; irr[1] += cl[i + 1] * w; irr[2] += cl[i + 2] * w; }
        }
        const sunH = Math.min(E, 9) * Math.max(0.12, dir.y);
        const rho = [0.26, 0.235, 0.19];
        const g = [0, 1, 2].map((c) => (rho[c] * (sunH * (E > 0 ? sunCol.toArray()[c] : 1) + irr[c])) / Math.PI);
        for (let y = 0; y < H; y++) {
          const v = 1 - (y + 0.5) / H, lat = (v - 0.5) * Math.PI;
          if (lat > 0.01) continue;
          const t = HT.smooth(0.01, -0.09, lat);
          for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; cl[i] += (g[0] - cl[i]) * t; cl[i + 1] += (g[1] - cl[i + 1]) * t; cl[i + 2] += (g[2] - cl[i + 2]) * t; }
        }
      }
      const env = new T.DataTexture(cl, W, H, T.RGBAFormat, T.FloatType);
      env.mapping = T.EquirectangularReflectionMapping; env.flipY = tex.flipY; env.magFilter = T.LinearFilter; env.minFilter = T.LinearFilter;
      env.needsUpdate = true;
      const envRT = pmrem.fromEquirectangular(env);
      env.dispose();
      envRT.texture.userData.shared = true;
      const horizon = new T.Color(hor[0] / hn, hor[1] / hn, hor[2] / hn);
      return { bg: tex, env: envRT.texture, sunDir: dir, sunE: E, sunCol, horizon };
    })();
    skyCache.set(slug, p);
    return p;
  }
  C.loadSky = loadSky;
  async function setSky(sky) {
    sky = sky || {};
    let rot = sky.rot || 0;
    const S = sky.hdri ? await loadSky(sky.hdri) : null;
    /* sunAz: hướng (độ) mặt trời chiếu tới, đo từ trục +z (nam) quay sang +x (đông) — tự xoay bầu trời cho khớp */
    if (S && sky.sunAz != null) rot = (sky.sunAz * Math.PI) / 180 - Math.atan2(S.sunDir.x, S.sunDir.z);
    scene.backgroundRotation.set(0, rot, 0);
    scene.environmentRotation.set(0, rot, 0);
    C.skyRot = rot;
    if (sky.hdri) {
      scene.background = sky.bgColor != null ? new T.Color(sky.bgColor) : S.bg;
      scene.environment = S.env;
      scene.backgroundIntensity = sky.bgInt != null ? sky.bgInt : 1;
      scene.environmentIntensity = sky.envInt != null ? sky.envInt : 1.2;
      scene.backgroundBlurriness = sky.blur || 0;
      const d = sky.sunDir ? new T.Vector3().fromArray(sky.sunDir).normalize() : S.sunDir.clone().applyAxisAngle(new T.Vector3(0, 1, 0), rot);
      if (d.y < 0.08) { d.y = 0.08; d.normalize(); }
      C.sunDir = d;
      const Ei = sky.sunInt != null ? sky.sunInt : HT.clamp(S.sunE, 0.3, 9) * (sky.sunMul || 1);
      sun.intensity = Ei;
      sun.color.copy(sky.sunColor != null ? new T.Color(sky.sunColor) : S.sunCol);
      const hz = sky.fogColor != null ? new T.Color(sky.fogColor) : S.horizon.clone().multiplyScalar(scene.backgroundIntensity);
      scene.fog = sky.fog === false ? null : new T.FogExp2(hz, sky.fog != null ? sky.fog : 0.0022);
      C.horizon = hz;
    } else {
      scene.background = new T.Color(sky.bgColor || 0x888888);
      scene.environment = null; scene.fog = null;
    }
    hemi.intensity = sky.hemi || 0;
    if (sky.hemiSky) hemi.color.set(sky.hemiSky);
    if (sky.hemiGround) hemi.groundColor.set(sky.hemiGround);
    renderer.toneMapping = sky.tone === 'agx' ? T.AgXToneMapping : sky.tone === 'neutral' ? T.NeutralToneMapping : T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = sky.exposure != null ? sky.exposure : 1;
    const S2 = sky.shadowSize || 42;
    Object.assign(sun.shadow.camera, { left: -S2, right: S2, top: S2, bottom: -S2 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.radius = sky.shadowSoft != null ? sky.shadowSoft : 2.5;
    applyGrade(sky);
  }

  /* ------------------------------------------------ BỐI CẢNH GIAN ------------------------------------------------ */
  class HallCtx {
    constructor(ma, def) {
      this.ma = ma; this.def = def;
      this.data = (HT.DATA && HT.DATA.gian[ma]) || { ma, ten: ma, anh: [] };
      this.root = new T.Group(); this.root.name = 'gian_' + ma;
      this.B = new HT.Builder(this);
      this.colliders = []; this.floors = []; this.blocks = []; this.clickables = []; this.gates = [];
      this.tour = []; this.updaters = []; this.groundMeshes = []; this.lights = []; this.lods = [];
      this.height = () => 0;
      this.bounds = null;
      let h = 0; for (const ch of ma) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      this.rng = HT.rng(h + 17);
      this.q = HT.q;
      this.spawn = def.spawn || { x: 0, z: 0, yaw: 0 };
    }
    add(o) { this.root.add(o); return o; }
    builder() { return new HT.Builder(this); }
    colBox(x, z, w, d, ry, y0, y1) {
      const c = Math.cos(ry || 0), s = Math.sin(ry || 0);
      this.colliders.push({ t: 0, x, z, hx: w / 2, hz: d / 2, c, s, y0: y0 == null ? -99 : y0, y1: y1 == null ? 99 : y1 });
    }
    colCircle(x, z, r, y0, y1) { this.colliders.push({ t: 1, x, z, r, y0: y0 == null ? -99 : y0, y1: y1 == null ? 99 : y1 }); }
    /* tường dạng đoạn thẳng dày */
    colSeg(x0, z0, x1, z1, th, y0, y1) {
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
      this.colBox((x0 + x1) / 2, (z0 + z1) / 2, L, th || 0.2, Math.atan2(-dz, dx), y0, y1);
    }
    floorRect(x, z, w, d, y, ry) {
      this.floors.push({ t: 0, x, z, hx: w / 2, hz: d / 2, c: Math.cos(ry || 0), s: Math.sin(ry || 0), y });
    }
    ramp(x0, z0, x1, z1, w, y0, y1) {
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
      this.floors.push({ t: 1, x0, z0, ux: dx / L, uz: dz / L, L, hw: w / 2, y0, y1 });
    }
    block(poly) { this.blocks.push(poly); }
    click(obj, info) {
      obj.traverse ? obj.traverse((o) => { if (o.isMesh) { o.userData.click = info; this.clickables.push(o); } }) : null;
      return obj;
    }
    gate(g) { this.gates.push(g); }
    onUpdate(fn) { this.updaters.push(fn); }
    tourStop(s) { this.tour.push(s); }
    finish() { return this.B.build(this.root); }
    /* ẩn vật khi người xem ở xa (cỏ, lúa gần) */
    lod(obj, x, z, far) { this.lods.push({ obj, x, z, far }); }
    groundAt(x, z, feet) {
      let h = this.height(x, z);
      for (const f of this.floors) {
        let fy;
        if (f.t === 0) {
          const dx = x - f.x, dz = z - f.z;
          const lx = f.c * dx - f.s * dz, lz = f.s * dx + f.c * dz;
          if (Math.abs(lx) > f.hx || Math.abs(lz) > f.hz) continue;
          fy = f.y;
        } else {
          const dx = x - f.x0, dz = z - f.z0;
          const t = dx * f.ux + dz * f.uz, p = -dx * f.uz + dz * f.ux;
          if (t < -0.05 || t > f.L + 0.05 || Math.abs(p) > f.hw) continue;
          fy = f.y0 + (f.y1 - f.y0) * HT.clamp(t / f.L, 0, 1);
        }
        if (fy <= feet + 0.62 && fy > h) h = fy;
      }
      return h;
    }
  }
  HT.HallCtx = HallCtx;

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src + '?v=' + (HT.BUILD || 1);
      s.onload = () => res(); s.onerror = () => rej(new Error('khong tai ' + src));
      document.head.appendChild(s);
    });
  }
  C.loadScript = loadScript;

  function disposeHall() {
    if (!hall) return;
    scene.remove(hall.root);
    HT.disposeTree(hall.root);
    for (const l of hall.lights) scene.remove(l);
    hall = null;
  }

  /* chuyển gian: tối màn, dọn gian cũ, dựng gian mới, sáng màn */
  C.goHall = async function (ma, opt) {
    opt = opt || {};
    if (busy) return; busy = true;
    const prev = hall ? hall.ma : null;
    try {
      HT.ui && HT.ui.fade(1, opt.fast ? 250 : 650);
      await sleep(opt.fast ? 260 : 660);
      C.tourStop(true);
      HT.ui && HT.ui.loading(true, ma, 0);
      disposeHall();
      if (!HT.halls[ma]) await loadScript('ht3d/halls/' + ma + '.js');
      const def = HT.halls[ma];
      const ctx = new HallCtx(ma, def);
      hall = ctx;
      scene.add(ctx.root);
      await setSky(def.sky);
      await def.build(ctx, HT);
      ctx.finish();
      let tot = Math.max(1, HT.pending.size);
      while (HT.pending.size) {
        HT.ui && HT.ui.loading(true, ma, 1 - HT.pending.size / tot);
        await Promise.race([Promise.allSettled([...HT.pending]), sleep(250)]);
        tot = Math.max(tot, HT.pending.size);
      }
      /* lớp trải nghiệm: điểm sáng trên hiện vật, bấm đồ vật để xem thẻ */
      if (HT.ui && HT.ui.decorate) { try { HT.ui.decorate(ctx); } catch (e) { console.warn('decorate', e); } }
      ctx.root.updateMatrixWorld(true);
      /* điểm xuất phát */
      let sp = ctx.spawn;
      if (opt.from && def.spawnFrom && def.spawnFrom[opt.from]) sp = def.spawnFrom[opt.from];
      if (opt.spawn) sp = opt.spawn;
      P.x = sp.x; P.z = sp.z; P.yaw = sp.yaw || 0; P.pitch = sp.pitch || 0;
      P.y = ctx.groundAt(P.x, P.z, sp.y != null ? sp.y : 50);
      if (sp.y != null) P.y = sp.y;
      P.vx = P.vz = 0; P.target = null; P.gateLock = 1.5;
      placeCamera(0);
      for (const l of ctx.lods) l.obj.visible = Math.hypot(P.x - l.x, P.z - l.z) < l.far;
      updateSun();
      try { await renderer.compileAsync(scene, camera); } catch (e) {}
      /* nạp sẵn mọi ảnh bề mặt lên GPU và vẽ nháp vài khung khi màn còn tối: vào gian không bị giật */
      try {
        const seen = new Set();
        scene.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) for (const k in m) { const t = m[k]; if (t && t.isTexture && !seen.has(t)) { seen.add(t); try { renderer.initTexture(t); } catch (e) {} } } });
        for (let i = 0; i < 3; i++) { updateSun(); if (composer) composer.render(0.016); await sleep(16); }
      } catch (e) {}
      renderMinimap();
      HT.ui && HT.ui.loading(false);
      HT.ui && HT.ui.hallChanged(ma, prev);
      HT.ui && HT.ui.fade(0, 800);
      try { history.replaceState(null, '', '#' + ma); } catch (e) {}
    } catch (e) {
      console.error(e);
      window.HT_FAIL = ma;
      HT.ui && HT.ui.toast('Lỗi khi dựng gian ' + ma + ': ' + e.message);
      HT.ui && HT.ui.loading(false); HT.ui && HT.ui.fade(0, 300);
    }
    busy = false;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  C.busy = () => busy;

  /* ------------------------------------------------ NGƯỜI XEM ------------------------------------------------ */
  const P = (C.player = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, vx: 0, vz: 0, eye: 1.6, target: null, bob: 0, gateLock: 0, ly: 0, lp: 0, turnV: 0, fov: 62 });
  const keys = {};
  const R = 0.3;
  function collide(x, z, feet) {
    if (!hall) return [x, z];
    const lo = feet + 0.3, hi = feet + 1.75;
    for (let it = 0; it < 3; it++) {
      let moved = false;
      for (const c of hall.colliders) {
        if (c.y1 < lo || c.y0 > hi) continue;
        if (c.t === 0) {
          const dx = x - c.x, dz = z - c.z;
          if (Math.abs(dx) > c.hx + c.hz + R + 1 && Math.abs(dz) > c.hx + c.hz + R + 1) continue;
          const lx = c.c * dx - c.s * dz, lz = c.s * dx + c.c * dz;
          const qx = HT.clamp(lx, -c.hx, c.hx), qz = HT.clamp(lz, -c.hz, c.hz);
          let ex = lx - qx, ez = lz - qz; let d = Math.hypot(ex, ez);
          if (d >= R) continue;
          let nx, nz, push;
          if (d > 1e-6) { nx = ex / d; nz = ez / d; push = R - d; }
          else {
            const px = c.hx - Math.abs(lx), pz = c.hz - Math.abs(lz);
            if (px < pz) { nx = Math.sign(lx) || 1; nz = 0; push = px + R; } else { nx = 0; nz = Math.sign(lz) || 1; push = pz + R; }
          }
          const wx = c.c * nx + c.s * nz, wz = -c.s * nx + c.c * nz;
          x += wx * push; z += wz * push; moved = true;
        } else {
          const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), m = c.r + R;
          if (d < m) { const k = d > 1e-6 ? (m - d) / d : 0; x += dx * k; z += dz * k; if (d <= 1e-6) x += m; moved = true; }
        }
      }
      if (!moved) break;
    }
    return [x, z];
  }
  function allowed(x, z) {
    if (!hall) return true;
    if (hall.bounds && !HT.inPoly(x, z, hall.bounds)) return false;
    for (const b of hall.blocks) if (HT.inPoly(x, z, b)) return false;
    return true;
  }
  function updatePlayer(dt) {
    if (!hall) return;
    if (P.gateLock > 0) P.gateLock -= dt;
    const tour = C._tour;
    let fw = 0, st = 0, turn = 0;
    if (!tour && !HT.ui?.modal()) {
      fw = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
      st = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      turn = (keys.ArrowRight || keys.KeyE ? 1 : 0) - (keys.ArrowLeft || keys.KeyQ ? 1 : 0);
    }
    if (fw || st) P.target = null;
    /* quay bằng phím có gia tốc; quay bằng chuột được làm mượt theo hàm mũ */
    P.turnV += (turn * 1.8 - P.turnV) * (1 - Math.exp(-dt * 10));
    P.yaw -= P.turnV * dt;
    { const km = 1 - Math.exp(-dt * 22); const ay = P.ly * km, ap = P.lp * km; P.yaw += ay; P.pitch = HT.clamp(P.pitch + ap, -1.35, 1.35); P.ly -= ay; P.lp -= ap; if (Math.abs(P.ly) < 1e-5) P.ly = 0; if (Math.abs(P.lp) < 1e-5) P.lp = 0; }
    if (Math.abs(camera.fov - P.fov) > 0.01) { camera.fov += (P.fov - camera.fov) * (1 - Math.exp(-dt * 12)); camera.updateProjectionMatrix(); }
    let run = keys.ShiftLeft || keys.ShiftRight;
    /* đi thường ~3,4 m/giây (nhanh hơn đi bộ thật để đỡ mất thời gian), giữ Shift để chạy 7,5 m/giây */
    let spd = run ? 7.5 : 3.4;
    let dx = 0, dz = 0;
    const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
    if (P.target) {
      const tx = P.target.x - P.x, tz = P.target.z - P.z, d = Math.hypot(tx, tz);
      if (d < 0.25) { P.target = null; }
      else {
        dx = tx / d; dz = tz / d; spd = P.target.speed || (d > 14 ? 6.5 : d > 6 ? 4.6 : 3.0);
        if (d < 1.2) spd *= Math.max(0.35, d / 1.2);
        if (P.target.face !== false) {
          const want = Math.atan2(-dx, -dz);
          let dy = want - P.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
          P.yaw += dy * Math.min(1, dt * 3.2);
        }
        P.target.t = (P.target.t || 0) + dt;
        if (P.target.t > (P.target.max || 25)) P.target = null;
      }
    } else if (fw || st) {
      dx = -sy * fw + cy * st; dz = -cy * fw - sy * st;
      const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    }
    const k = 1 - Math.exp(-dt * 9);
    P.vx += (dx * spd - P.vx) * k; P.vz += (dz * spd - P.vz) * k;
    const sp = Math.hypot(P.vx, P.vz);
    if (sp > 0.01) {
      let nx = P.x + P.vx * dt, nz = P.z + P.vz * dt;
      [nx, nz] = collide(nx, nz, P.y);
      let g = hall.groundAt(nx, nz, P.y);
      let ok = allowed(nx, nz) && g <= P.y + 0.62;
      if (!ok) {
        /* trượt theo từng trục */
        const tries = [[nx, P.z], [P.x, nz]];
        ok = false;
        for (const [ax, az] of tries) {
          const [cx, cz] = collide(ax, az, P.y);
          const g2 = hall.groundAt(cx, cz, P.y);
          if (allowed(cx, cz) && g2 <= P.y + 0.62) { nx = cx; nz = cz; g = g2; ok = true; break; }
        }
        if (!ok && P.target) { P.target.stuck = (P.target.stuck || 0) + dt; if (P.target.stuck > 1.2) P.target = null; }
      }
      if (ok) { P.x = nx; P.z = nz; }
      P.bob += sp * dt * 2.1;
    }
    const g = hall.groundAt(P.x, P.z, P.y);
    if (C.khoaCao) { /* giữ nguyên độ cao máy quay (chụp ảnh minh họa) */ } else if (g < P.y) P.y = Math.max(g, P.y - dt * 6); else P.y += (g - P.y) * Math.min(1, dt * 14);
    /* cổng chuyển gian */
    if (P.gateLock <= 0 && !busy && !C.khoaCao) for (const gt of hall.gates) {
      if (Math.hypot(P.x - gt.x, P.z - gt.z) < (gt.r || 1.1)) { P.gateLock = 3; C.goHall(gt.to, { from: hall.ma, spawn: gt.spawn }); break; }
    }
    placeCamera(sp);
  }
  function placeCamera(sp) {
    const bob = Math.sin(P.bob * Math.PI) * 0.018 * Math.min(1, (sp || 0) / 1.5);
    camera.position.set(P.x, P.y + P.eye + bob, P.z);
    camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
  }
  C.placeCamera = placeCamera;
  C.look = function (x, y, z) {
    const dx = x - P.x, dz = z - P.z, dy = y - (P.y + P.eye);
    P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz));
    placeCamera(0);
  };
  C.teleport = function (x, z, yaw, pitch) {
    P.x = x; P.z = z; if (yaw != null) P.yaw = yaw; if (pitch != null) P.pitch = pitch;
    P.ly = P.lp = 0; P.turnV = 0;
    P.y = hall ? hall.groundAt(x, z, 60) : 0; P.target = null; P.vx = P.vz = 0; placeCamera(0);
    if (hall) for (const l of hall.lods) l.obj.visible = Math.hypot(P.x - l.x, P.z - l.z) < l.far;
  };

  function updateSun() {
    if (!C.sunDir) return;
    const S = sun.shadow.camera.right;
    const texel = (2 * S) / sun.shadow.mapSize.x;
    const cx = Math.round((P.x + C.sunDir.x * 0) / texel) * texel, cz = Math.round(P.z / texel) * texel;
    const fx = cx - Math.sin(P.yaw) * S * 0.45, fz = cz - Math.cos(P.yaw) * S * 0.45;
    const gx = Math.round(fx / texel) * texel, gz = Math.round(fz / texel) * texel;
    sun.target.position.set(gx, P.y, gz);
    sun.position.set(gx + C.sunDir.x * 200, P.y + C.sunDir.y * 200, gz + C.sunDir.z * 200);
    sun.target.updateMatrixWorld();
  }

  /* ------------------------------------------------ chuột / phím ------------------------------------------------ */
  const ray = new T.Raycaster();
  const ndc = new T.Vector2();
  let down = null, hoverT = 0, hoverObj = null, lastMove = null;
  function bindInput(cv) {
    window.addEventListener('keydown', (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      keys[e.code] = true;
      if (e.code === 'Escape') { HT.ui && HT.ui.closeAll(); C.tourStop(); }
      if (e.code === 'KeyT') C.tourToggle();
      if (e.code === 'KeyM') HT.ui && HT.ui.toggleMap();
      if (e.code === 'KeyH' && hall && hall.ma !== 'G00') C.goHall('G00', { from: hall.ma });
      if (e.code === 'PageDown' || e.code === 'KeyN') C.next(1);
      if (e.code === 'PageUp' || e.code === 'KeyB') C.next(-1);
      if (/Arrow/.test(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
    cv.addEventListener('pointerdown', (e) => {
      if (C._tour) C.tourStop();
      down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, id: e.pointerId, lx: e.clientX, ly: e.clientY };
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', (e) => {
      lastMove = e;
      if (!down || down.id !== e.pointerId) return;
      const dx = e.clientX - down.lx, dy = e.clientY - down.ly;
      down.lx = e.clientX; down.ly = e.clientY; down.moved += Math.abs(dx) + Math.abs(dy);
      const k = 0.0032 * (camera.fov / 62);
      P.ly -= dx * k; P.lp -= dy * k;          /* kéo phải = quay phải, kéo xuống = nhìn xuống; dồn vào, khung hình sau mới quay dần cho mượt */
    });
    const up = (e) => {
      if (!down) return;
      const d = down; down = null;
      /* chỉ tính là bấm khi không kéo: cả quãng di chuyển lẫn khoảng cách nhấn–thả đều nhỏ */
      if (d.moved < 6 && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6 && performance.now() - d.t < 600) clickAt(e.clientX, e.clientY);
    };
    cv.addEventListener('pointerup', up);
    /* lăn chuột: phóng to/thu nhỏ góc nhìn để xem chi tiết */
    cv.addEventListener('wheel', (e) => { e.preventDefault(); P.fov = HT.clamp(P.fov * Math.exp(e.deltaY * 0.0011), 24, 72); }, { passive: false });
    cv.addEventListener('pointercancel', () => { down = null; });
    cv.addEventListener('dblclick', () => { P.fov = 62; });
  }
  function pick(cx, cy, list, far) {
    ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera); ray.far = far || 60;
    const hits = ray.intersectObjects(list, false);
    return hits[0] || null;
  }
  function clickAt(cx, cy) {
    if (!hall || busy) return;
    const h = pick(cx, cy, hall.clickables.concat(hall.groundMeshes), 40);
    if (!h) return;
    const info = h.object.userData.click;
    if (info && h.distance < 18) {
      if (typeof info === 'function') info(h); else HT.ui && HT.ui.openInfo(info);
      return;
    }
    if (h.object.userData.walk || hall.groundMeshes.includes(h.object)) {
      P.target = { x: h.point.x, z: h.point.z };
      HT.ui && HT.ui.ping(cx, cy);
    }
  }
  function hover(now) {
    if (!hall || !lastMove || down || now - hoverT < 120) return;
    hoverT = now;
    const h = pick(lastMove.clientX, lastMove.clientY, hall.clickables, 18);
    const obj = h ? h.object : null;
    if (obj !== hoverObj) {
      hoverObj = obj;
      renderer.domElement.style.cursor = obj ? 'pointer' : '';
      HT.ui && HT.ui.hover(obj ? obj.userData.click : null, lastMove.clientX, lastMove.clientY);
    } else if (obj) HT.ui && HT.ui.hover(obj.userData.click, lastMove.clientX, lastMove.clientY);
  }

  /* ------------------------------------------------ chuyển gian kế tiếp ------------------------------------------------ */
  C.next = function (dir) {
    const L = HT.DATA.thu_tu; const i = hall ? L.indexOf(hall.ma) : 0;
    const j = (i + dir + L.length) % L.length;
    C.goHall(L[j], { from: hall ? hall.ma : null });
  };

  /* ------------------------------------------------ THAM QUAN TỰ ĐỘNG ------------------------------------------------ */
  C._tour = null;
  C.tourToggle = function () { if (C._tour) C.tourStop(); else C.tourStart(); };
  C.tourStart = function (all) {
    if (!hall || busy) return;
    let stops = hall.tour.length ? hall.tour.slice() : [{ x: hall.spawn.x, z: hall.spawn.z, yaw: hall.spawn.yaw, wait: 4 }];
    if (hall.def.tourOrder !== 'fixed' && stops.length > 2) {
      /* sắp xếp theo đường đi ngắn: bắt đầu từ chỗ đang đứng, luôn đến điểm gần nhất tiếp theo */
      const rest = stops.slice(); const ord = []; let cx = P.x, cz = P.z;
      while (rest.length) { let bi = 0, bd = 1e9; rest.forEach((s, i) => { const d = Math.hypot(s.x - cx, s.z - cz); if (d < bd) { bd = d; bi = i; } }); const s = rest.splice(bi, 1)[0]; ord.push(s); cx = s.x; cz = s.z; }
      stops = ord;
    }
    C._tour = { stops, i: -1, phase: 'go', t: 0, all: all !== false };
    HT.ui && HT.ui.tourState(true);
    nextStop();
  };
  C.tourStop = function (silent) {
    if (!C._tour) return;
    C._tour = null; P.target = null;
    if (!silent) HT.ui && HT.ui.tourState(false);
  };
  function nextStop() {
    const t = C._tour; if (!t) return;
    t.i++;
    if (t.i >= t.stops.length) {
      if (t.all && hall.ma !== HT.DATA.thu_tu[HT.DATA.thu_tu.length - 1]) {
        const L = HT.DATA.thu_tu; const j = L.indexOf(hall.ma) + 1;
        C.goHall(L[j], { from: hall.ma }).then(() => { if (HT.ui && HT.ui.tourWanted()) C.tourStart(true); });
      }
      C.tourStop(); return;
    }
    const s = t.stops[t.i];
    t.phase = 'go'; t.t = 0;
    P.target = { x: s.x, z: s.z, speed: s.speed || 3.2, max: 30 };
  }
  function updateTour(dt) {
    const t = C._tour; if (!t) return;
    const s = t.stops[t.i]; if (!s) return;
    t.t += dt;
    if (t.phase === 'go') {
      if (!P.target) {
        if (Math.hypot(P.x - s.x, P.z - s.z) > 2.5) C.teleport(s.x, s.z);
        t.phase = 'turn'; t.t = 0; t.y0 = P.yaw; t.p0 = P.pitch;
        let wy = s.yaw, wp = s.pitch || 0;
        if (s.look) { const dx = s.look[0] - P.x, dz = s.look[2] - P.z; wy = Math.atan2(-dx, -dz); wp = Math.atan2(s.look[1] - (P.y + P.eye), Math.hypot(dx, dz)); }
        t.y1 = wy != null ? wy : P.yaw; t.p1 = wp;
        let d = t.y1 - t.y0; d = Math.atan2(Math.sin(d), Math.cos(d)); t.y1 = t.y0 + d;
      }
    } else if (t.phase === 'turn') {
      const k = HT.smooth(0, 1, t.t / 1.4);
      P.yaw = t.y0 + (t.y1 - t.y0) * k; P.pitch = t.p0 + (t.p1 - t.p0) * k; placeCamera(0);
      if (t.t >= 1.4) { t.phase = 'wait'; t.t = 0; if (s.info && HT.ui) HT.ui.openInfo(s.info, true); if (s.say && HT.ui) HT.ui.caption(s.say); }
    } else if (t.phase === 'wait') {
      const doc = HT.ui && HT.ui.dangDoc && HT.ui.dangDoc();
      if ((t.t >= (s.wait || 6) && !doc) || t.t >= 90) { HT.ui && HT.ui.closeInfo(true); nextStop(); }
    }
  }

  /* ------------------------------------------------ BẢN ĐỒ NHỎ ------------------------------------------------ */
  C.map = null;
  function renderMinimap() {
    if (!hall) return;
    const b = hall.def.map || hall.def.mapRect;
    let x0, z0, x1, z1;
    if (b) [x0, z0, x1, z1] = b;
    else if (hall.bounds) { x0 = Math.min(...hall.bounds.map((p) => p[0])); x1 = Math.max(...hall.bounds.map((p) => p[0])); z0 = Math.min(...hall.bounds.map((p) => p[1])); z1 = Math.max(...hall.bounds.map((p) => p[1])); }
    else { x0 = -40; x1 = 40; z0 = -40; z1 = 40; }
    const pad = 4; x0 -= pad; z0 -= pad; x1 += pad; z1 += pad;
    const w = x1 - x0, d = z1 - z0; const S = Math.max(w, d);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const N = 512;
    const cam = new T.OrthographicCamera(-S / 2, S / 2, S / 2, -S / 2, 1, 600);
    cam.position.set(cx, 300, cz); cam.up.set(0, 0, -1); cam.lookAt(cx, 0, cz);
    const rt = new T.WebGLRenderTarget(N, N, { samples: 4 });
    const fog = scene.fog, bg = scene.background; scene.fog = null; scene.background = new T.Color(0x20241f);
    const hid = []; hall.root.traverse((o) => { if (o.userData.noMap && o.visible) { o.visible = false; hid.push(o); } });
    renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null);
    for (const o of hid) o.visible = true;
    scene.fog = fog; scene.background = bg;
    const px = new Uint8Array(N * N * 4); renderer.readRenderTargetPixels(rt, 0, 0, N, N, px); rt.dispose();
    const cv = HT.canvas(N, N), g = cv.getContext('2d'); const im = g.createImageData(N, N);
    const ex = renderer.toneMappingExposure;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const si = ((N - 1 - y) * N + x) * 4, di = (y * N + x) * 4;
      for (let c = 0; c < 3; c++) { const v = (px[si + c] / 255) * ex * 1.1; im.data[di + c] = 255 * Math.pow(v / (1 + v * 0.35), 1 / 2.2); }
      im.data[di + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    C.map = { canvas: cv, cx, cz, S };
    HT.ui && HT.ui.mapReady(C.map);
  }
  C.mapToWorld = function (u, v) { const m = C.map; return m ? [m.cx + (u - 0.5) * m.S, m.cz + (v - 0.5) * m.S] : null; };
  C.worldToMap = function (x, z) { const m = C.map; return m ? [(x - m.cx) / m.S + 0.5, (z - m.cz) / m.S + 0.5] : null; };
  C.walkTo = function (x, z) { P.target = { x, z }; };
  /* nhảy tức thời tới một điểm (có mờ chuyển cảnh), rồi quay mặt về phía vật cần xem */
  C.jumpTo = function (s, openInfo) {
    if (!hall || !s) return;
    if (C._tour) C.tourStop();
    const ui = HT.ui;
    ui && ui.fade(1, 160);
    setTimeout(() => {
      let yaw = s.yaw, pitch = s.pitch || 0;
      C.teleport(s.x, s.z);
      if (s.look) { const dx = s.look[0] - P.x, dz = s.look[2] - P.z; yaw = Math.atan2(-dx, -dz); pitch = Math.atan2(s.look[1] - (P.y + P.eye), Math.hypot(dx, dz)); }
      if (yaw != null) P.yaw = yaw; P.pitch = HT.clamp(pitch, -0.6, 0.6); placeCamera(0);
      ui && ui.fade(0, 320);
      if (openInfo && s.info && ui) setTimeout(() => ui.openInfo(s.info), 260);
    }, 170);
  };
  /* danh sách điểm đến trong gian: các bảng, nhãn hiện vật, ảnh, cổng */
  C.pois = function () {
    if (!hall) return [];
    const out = [];
    for (const s of hall.tour) {
      const i = s.info || {};
      out.push({ x: s.x, z: s.z, look: s.look, info: s.info, ten: i.title || i.label || '', loai: /Ảnh tư liệu/.test(i.kicker || '') ? 'anh' : /Câu chuyện/.test(i.label || '') ? 'chuyen' : (i.label === 'Bảng giới thiệu gian' || i.label === 'Mốc thời gian' || /Lời Bác|Trích dẫn/.test(i.label || '')) ? 'bang' : 'noi' });
    }
    for (const g of hall.gates) {
      const gi = HT.DATA.gian[g.to]; if (!gi) continue;
      out.push({ x: g.x, z: g.z + 0.001, gate: g.to, ten: (g.to === 'G00' ? 'Cổng về Sảnh' : 'Cổng sang ' + (g.to === 'G00' ? '' : 'Gian ' + g.to.slice(1) + ' · ') + gi.ten), loai: 'cong' });
    }
    return out;
  };

  /* ------------------------------------------------ VÒNG LẶP ------------------------------------------------ */
  let fpsN = 0, fpsT = 0, lodTick = 0; C.fps = 0;
  let dtS = 1 / 60, dynT = 0, dynAcc = 0, dynN = 0;
  /* độ phân giải động: đo thời gian khung trung bình mỗi 1,5 giây, hạ/nâng tỉ lệ vẽ 10% để giữ ~60 hình/giây */
  function adaptRes(dtRaw) {
    if (!HT.q || HT.q.level < 1 || C.fixedRes || busy || document.hidden) return;
    dynAcc += dtRaw; dynN++; dynT += dtRaw;
    if (dynT < 1.5) return;
    const avg = dynAcc / dynN; dynT = 0; dynAcc = 0; dynN = 0;
    let nd = C.dyn;
    if (avg > 1 / 48) nd = Math.max(0.6, C.dyn - 0.1);
    else if (avg < 1 / 80 && C.dyn < 1) nd = Math.min(1, C.dyn + 0.1);
    if (Math.abs(nd - C.dyn) > 0.01) { C.dyn = nd; onResize(); }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const dtRaw = Math.min(clock.getDelta(), 0.1);
    dtS += (Math.min(dtRaw, 0.05) - dtS) * 0.25;           /* bước thời gian làm mượt: chuyển động đều, không giật theo nhịp khung */
    const dt = dtS;
    adaptRes(dtRaw);
    HT.uTime.value += dt;
    if (hall && !busy) {
      updateTour(dt);
      updatePlayer(dt);
      if ((lodTick = (lodTick + 1) % 8) === 0) for (const l of hall.lods) l.obj.visible = Math.hypot(P.x - l.x, P.z - l.z) < l.far;
      for (const f of hall.updaters) f(dt, HT.uTime.value, P);
      hover(now);
    }
    updateSun();
    if (composer) composer.render(dt); else renderer.render(scene, camera);
    fpsN++; fpsT += dt; if (fpsT > 0.5) { C.fps = Math.round(fpsN / fpsT); fpsN = 0; fpsT = 0; HT.ui && HT.ui.tick && HT.ui.tick(); }
  }
  C.snapshot = function () {
    if (composer) composer.render(0); else renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/jpeg', 0.93);
  };
  C.renderNow = function () { if (composer) composer.render(0); else renderer.render(scene, camera); };
})();
