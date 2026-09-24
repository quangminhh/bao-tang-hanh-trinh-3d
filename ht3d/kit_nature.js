/* BẢO TÀNG HÀNH TRÌNH — thiên nhiên: địa hình trộn nhiều lớp vật liệu, nước (gương / trong),
   cỏ, lúa, sen, cây Việt Nam (xoài, đa, khế, ổi, bưởi, cây rừng, hoa sứ), cau, dừa, cọ, tre, chuối,
   núi đá vôi, đá tảng. Tất cả vẽ bằng mã, lá cây vẽ trên canvas. */
(function () {
  /* cây ở xa (collide:false, rải ngoài vùng đi lại) không đổ bóng và bỏ qua AO: tiết kiệm nhiều lượt vẽ */
  const farShadow = (o) => (o && o.shadow != null ? o.shadow : !(o && o.collide === false));
  'use strict';
  const T = THREE;
  const HT = window.HT;
  const N = (HT.nature = {});

  /* ======================================================== ĐỊA HÌNH ======================================================== */
  function axisCoords(half, inner, step) {
    const a = [0]; let d = 0;
    while (d < half - 1e-6) { const s = d < inner ? step : step * (1 + (d - inner) / (inner * 0.3)); d = Math.min(half, d + s); a.push(d); }
    const neg = a.slice(1).reverse().map((v) => -v);
    return neg.concat(a);
  }
  /* o: {size, inner, step, cx, cz, height(x,z), layers:[{slug,tile,rough,tint}], weights(x,z,h,ny)->[w1,w2,w3]} */
  N.terrain = function (ctx, o) {
    const half = (o.size || 1600) / 2, inner = o.inner || 70, step = o.step || 0.5;
    const cx = o.cx || 0, cz = o.cz || 0;
    const xs = axisCoords(half, inner, step).map((v) => v + cx);
    const zs = axisCoords(half, inner, step).map((v) => v + cz);
    const nx = xs.length, nz = zs.length;
    const pos = new Float32Array(nx * nz * 3), wts = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2);
    const H = o.height || (() => 0);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, x = xs[i], z = zs[j], y = H(x, z);
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; uv[k * 2] = x; uv[k * 2 + 1] = z;
    }
    const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let q = 0;
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    g.setIndex(new T.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    const nor = g.attributes.normal;
    const W = o.weights || (() => [0, 0, 0]);
    for (let k = 0; k < nx * nz; k++) {
      const w = W(pos[k * 3], pos[k * 3 + 2], pos[k * 3 + 1], nor.getY(k));
      wts[k * 3] = w[0] || 0; wts[k * 3 + 1] = w[1] || 0; wts[k * 3 + 2] = w[2] || 0;
    }
    g.setAttribute('aW', new T.BufferAttribute(wts, 3));
    g.computeBoundingSphere();
    const mat = N.splatMat(o.layers, o);
    const m = new T.Mesh(g, mat);
    m.receiveShadow = true; m.castShadow = o.castShadow !== false;
    m.userData.walk = true;
    m.name = 'dia_hinh';
    ctx.add(m);
    ctx.groundMeshes.push(m);
    ctx.height = H;
    return m;
  };
  /* vật liệu trộn 4 lớp theo trọng số đỉnh, chống lặp ảnh, pháp tuyến trộn */
  N.splatMat = function (layers, o) {
    o = o || {};
    const L = layers.slice(0, 4); while (L.length < 4) L.push(L[L.length - 1]);
    const dif = L.map((l) => HT.texBase(HT.TEXDIR + l.slug + '/' + l.slug + '_diff.jpg', true));
    const nrm = L.map((l) => HT.texBase(HT.TEXDIR + l.slug + '/' + l.slug + '_nor.jpg', false));
    const mat = new T.MeshStandardMaterial({ roughness: 1, metalness: 0, envMapIntensity: o.env != null ? o.env : 1 });
    const tiles = new T.Vector4(...L.map((l) => l.tile || 2));
    const rough = new T.Vector4(...L.map((l) => l.rough != null ? l.rough : 0.95));
    const tints = L.map((l) => new T.Color(l.tint != null ? l.tint : 0xffffff));
    const nstr = new T.Vector4(...L.map((l) => l.ns != null ? l.ns : 1));
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, {
        tD0: { value: dif[0] }, tD1: { value: dif[1] }, tD2: { value: dif[2] }, tD3: { value: dif[3] },
        tN0: { value: nrm[0] }, tN1: { value: nrm[1] }, tN2: { value: nrm[2] }, tN3: { value: nrm[3] },
        uTile: { value: tiles }, uRough: { value: rough }, uNS: { value: nstr },
        uT0: { value: tints[0] }, uT1: { value: tints[1] }, uT2: { value: tints[2] }, uT3: { value: tints[3] },
        uMacro: { value: o.macro != null ? o.macro : 0.22 },
      });
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec3 aW; varying vec3 vW; varying vec3 vWP; varying vec3 vWN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = aW; vWP = (modelMatrix * vec4(transformed,1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform sampler2D tD0, tD1, tD2, tD3, tN0, tN1, tN2, tN3;
          uniform vec4 uTile, uRough, uNS; uniform vec3 uT0, uT1, uT2, uT3; uniform float uMacro;
          varying vec3 vW; varying vec3 vWP; varying vec3 vWN;
          float hh21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
          float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(hh21(i),hh21(i+vec2(1,0)),f.x), mix(hh21(i+vec2(0,1)),hh21(i+vec2(1,1)),f.x), f.y); }
          vec4 texNT(sampler2D t, vec2 uv){ float n=vnoise(uv*0.23); vec2 uv2=vec2(uv.y,-uv.x)*0.61+vec2(0.37,0.71);
            return mix(texture2D(t,uv), texture2D(t,uv2), smoothstep(0.35,0.65,n)*0.55); }
          vec3 nrmNT(sampler2D t, vec2 uv, float s){ vec3 n=texture2D(t,uv).xyz*2.0-1.0; n.xy*=s; return n; }
          vec4 gW; vec3 gN;`)
        .replace('#include <map_fragment>', `
          vec2 P = vWP.xz;
          float sw = clamp(vW.x+vW.y+vW.z, 0.0, 1.0);
          vec4 w = vec4(1.0-sw, vW);
          vec4 c0 = texNT(tD0, P/uTile.x); c0.rgb*=uT0;
          vec4 c1 = texNT(tD1, P/uTile.y); c1.rgb*=uT1;
          vec4 c2 = texNT(tD2, P/uTile.z); c2.rgb*=uT2;
          vec4 c3 = texNT(tD3, P/uTile.w); c3.rgb*=uT3;
          vec4 hgt = vec4(dot(c0.rgb,vec3(.33)), dot(c1.rgb,vec3(.33)), dot(c2.rgb,vec3(.33)), dot(c3.rgb,vec3(.33)));
          vec4 wb = w * (0.35 + hgt*1.3);
          wb = pow(max(wb, vec4(0.0)), vec4(2.2)); wb /= max(dot(wb, vec4(1.0)), 1e-4);
          gW = wb;
          vec3 col = c0.rgb*wb.x + c1.rgb*wb.y + c2.rgb*wb.z + c3.rgb*wb.w;
          float mac = vnoise(P*0.045)*0.65 + vnoise(P*0.013)*0.35;
          col *= 1.0 + (mac-0.5)*2.0*uMacro;
          diffuseColor.rgb *= col;
          gN = nrmNT(tN0,P/uTile.x,uNS.x)*wb.x + nrmNT(tN1,P/uTile.y,uNS.y)*wb.y + nrmNT(tN2,P/uTile.z,uNS.z)*wb.z + nrmNT(tN3,P/uTile.w,uNS.w)*wb.w;`)
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = clamp(dot(gW, uRough) * (1.1 - (diffuseColor.r+diffuseColor.g)*0.25), 0.3, 1.0);')
        .replace('#include <normal_fragment_maps>', `{
            vec3 Nw = normalize(vWN);
            vec3 Tw = normalize(vec3(1.0,0.0,0.0) - Nw*Nw.x);
            vec3 Bw = normalize(vec3(0.0,0.0,1.0) - Nw*Nw.z);
            vec3 n = normalize(vec3(gN.xy, max(gN.z, 0.2)));
            vec3 pw = normalize(Tw*n.x + Bw*n.y + Nw*n.z);
            normal = normalize((viewMatrix * vec4(pw, 0.0)).xyz);
          }`);
    };
    mat.customProgramCacheKey = () => 'splat4';
    return mat;
  };

  /* ======================================================== NƯỚC ======================================================== */
  /* ảnh pháp tuyến sóng lăn tăn, lặp liền mạch */
  N.waterNormals = function (kind) {
    const key = 'wn_' + (kind || 'a');
    return HT.canvasTex(key, 512, 512, (g, w, h) => {
      const r = HT.rng(kind === 'b' ? 91 : 33);
      const waves = [];
      for (let i = 0; i < 38; i++) {
        const kx = r.int(-9, 9), ky = r.int(-9, 9); if (!kx && !ky) continue;
        const f = Math.hypot(kx, ky); waves.push([kx, ky, r() * 6.283, 1 / Math.pow(f, 1.25)]);
      }
      const hgt = new Float32Array(w * h); let mn = 1e9, mx = -1e9;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let s = 0; const u = x / w, v = y / h;
        for (const [kx, ky, ph, a] of waves) s += a * Math.sin(6.283 * (kx * u + ky * v) + ph);
        hgt[y * w + x] = s; mn = Math.min(mn, s); mx = Math.max(mx, s);
      }
      const im = g.createImageData(w, h);
      const Hh = (x, y) => hgt[((y + h) % h) * w + ((x + w) % w)];
      const k = 18 / (mx - mn);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = (Hh(x + 1, y) - Hh(x - 1, y)) * k, dy = (Hh(x, y + 1) - Hh(x, y - 1)) * k;
        let nx = -dx, ny = -dy, nz = 1; const l = Math.hypot(nx, ny, nz);
        const i = (y * w + x) * 4;
        im.data[i] = (nx / l * 0.5 + 0.5) * 255; im.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; im.data[i + 2] = (nz / l * 0.5 + 0.5) * 255; im.data[i + 3] = 255;
      }
      g.putImageData(im, 0, 0);
    }, { linear: true });
  };
  function polyGeo(poly, y) {
    const s = new T.Shape(poly.map((p) => new T.Vector2(p[0], -p[1])));
    const g = new T.ShapeGeometry(s, 12);
    g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
    return g;
  }
  N.polyGeo = polyGeo;
  N.rectPoly = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  /* mặt nước phản chiếu (ao, sông) — dùng Water của three.js */
  N.waterMirror = function (ctx, o) {
    const g = new T.ShapeGeometry(new T.Shape(o.poly.map((p) => new T.Vector2(p[0], -p[1]))), 12);
    const res = HT.q.level >= 2 ? 1024 : 512;
    const w = new T.Water(g, {
      textureWidth: res, textureHeight: res,
      waterNormals: N.waterNormals(o.kind),
      sunDirection: (HT.core.sunDir || new T.Vector3(0.3, 0.8, 0.2)).clone(),
      sunColor: o.sunColor != null ? o.sunColor : 0xfff4e0,
      waterColor: o.color != null ? o.color : 0x1d2a20,
      distortionScale: o.distortion != null ? o.distortion : 1.2,
      fog: true, alpha: 1.0,
    });
    w.rotation.x = -Math.PI / 2;
    w.position.y = o.y;
    w.material.uniforms.size.value = o.size != null ? o.size : 2.5;
    w.userData.noAO = true; w.userData.noMap = false;
    w.receiveShadow = false;
    ctx.add(w);
    const speed = o.speed != null ? o.speed : 0.35;
    ctx.onUpdate((dt) => { w.material.uniforms.time.value += dt * speed; if (HT.core.sunDir) w.material.uniforms.sunDirection.value.copy(HT.core.sunDir); });
    return w;
  };
  /* nước trong (suối Lênin, suối cạn): khúc xạ nhìn thấy đáy sỏi */
  N.waterClear = function (ctx, o) {
    const g = o.geo || polyGeo(o.poly, 0);
    const nt = N.waterNormals('b').clone(); nt.repeat.set(1 / (o.ripple || 1.6), 1 / (o.ripple || 1.6)); nt.userData.shared = false;
    const nt2 = N.waterNormals('a').clone(); nt2.userData.shared = false;
    const m = new T.MeshPhysicalMaterial({
      color: o.color != null ? o.color : 0xd9fff0, roughness: 0.03, metalness: 0,
      transmission: 1, thickness: o.thickness != null ? o.thickness : 0.6, ior: 1.333,
      attenuationColor: new T.Color(o.attColor != null ? o.attColor : 0x2fa58a), attenuationDistance: o.attDist != null ? o.attDist : 1.2,
      normalMap: nt, normalScale: new T.Vector2(0.25, 0.25), envMapIntensity: o.env != null ? o.env : 0.75, specularIntensity: o.spec != null ? o.spec : 0.75,
    });
    // UV theo mét cho ảnh pháp tuyến
    const pa = g.attributes.position; const uv = new Float32Array(pa.count * 2);
    for (let i = 0; i < pa.count; i++) { uv[i * 2] = pa.getX(i); uv[i * 2 + 1] = pa.getZ(i); }
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    const mesh = new T.Mesh(g, m);
    mesh.position.y = o.y || 0;
    mesh.userData.noAO = true;
    ctx.add(mesh);
    const fx = o.flow ? o.flow[0] : 0.02, fz = o.flow ? o.flow[1] : 0.05;
    ctx.onUpdate((dt) => { nt.offset.x += fx * dt; nt.offset.y += fz * dt; });
    return mesh;
  };

  /* ======================================================== CỎ (thực thể lặp) ======================================================== */
  /* bó cỏ: nhiều lá mảnh, màu đỉnh sáng hơn gốc */
  const tuftCache = new Map();
  N.tuftGeo = function (kind) {
    if (tuftCache.has(kind)) return tuftCache.get(kind);
    const r = HT.rng(kind.length * 97 + 5);
    const P = {
      lawn: { n: 16, h: [0.05, 0.11], w: 0.008, spread: 0.2, bend: 0.3, base: [0.1, 0.2, 0.04], tip: [0.3, 0.48, 0.12] },
      grass: { n: 10, h: [0.1, 0.3], w: 0.012, spread: 0.17, bend: 0.45, base: [0.09, 0.15, 0.035], tip: [0.30, 0.42, 0.11] },
      tall: { n: 12, h: [0.45, 0.95], w: 0.013, spread: 0.18, bend: 0.5, base: [0.12, 0.18, 0.05], tip: [0.44, 0.5, 0.19] },
      dry: { n: 10, h: [0.3, 0.7], w: 0.012, spread: 0.16, bend: 0.45, base: [0.22, 0.25, 0.1], tip: [0.55, 0.55, 0.28] },
      rice: { n: 12, h: [0.55, 0.85], w: 0.011, spread: 0.07, bend: 0.4, base: [0.12, 0.22, 0.05], tip: [0.36, 0.52, 0.15] },
      riceY: { n: 14, h: [0.25, 0.4], w: 0.009, spread: 0.05, bend: 0.3, base: [0.22, 0.36, 0.10], tip: [0.55, 0.74, 0.30] },
      riceR: { n: 12, h: [0.7, 0.95], w: 0.011, spread: 0.08, bend: 0.55, base: [0.3, 0.33, 0.1], tip: [0.72, 0.58, 0.22] },
      reed: { n: 8, h: [1.2, 2.0], w: 0.016, spread: 0.12, bend: 0.3, base: [0.24, 0.28, 0.10], tip: [0.58, 0.60, 0.30] },
    }[kind] || { n: 9, h: [0.3, 0.5], w: 0.012, spread: 0.1, bend: 0.3, base: [0.2, 0.3, 0.1], tip: [0.5, 0.6, 0.2] };
    const pos = [], col = [], nor = [];
    const SEG = 3;
    for (let b = 0; b < P.n; b++) {
      const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * P.spread;
      const bx = Math.cos(a) * rr, bz = Math.sin(a) * rr;
      const hgt = r.range(P.h[0], P.h[1]);
      const lean = r.range(0.1, P.bend) * hgt, la = a + r.range(-0.6, 0.6);
      const facing = r() * Math.PI;
      const fx = Math.cos(facing), fz = Math.sin(facing);
      const dark = r.range(0.8, 1.1);
      let prev = null;
      for (let s = 0; s <= SEG; s++) {
        const t = s / SEG;
        const y = hgt * t * (1 - 0.25 * t * t * P.bend);
        const off = lean * t * t;
        const cx = bx + Math.cos(la) * off, cz = bz + Math.sin(la) * off;
        const wid = P.w * (1 - t * 0.92);
        const L = [cx - fx * wid, y, cz - fz * wid], R = [cx + fx * wid, y, cz + fz * wid];
        const cc = [0, 1, 2].map((k) => (P.base[k] + (P.tip[k] - P.base[k]) * Math.pow(t, 0.8)) * dark);
        if (prev) {
          const quad = [prev.L, prev.R, R, prev.L, R, L];
          const cs = [prev.c, prev.c, cc, prev.c, cc, cc];
          quad.forEach((p, i) => { pos.push(...p); col.push(...cs[i]); nor.push(Math.cos(la) * 0.25, 0.95, Math.sin(la) * 0.25); });
        }
        prev = { L, R, c: cc };
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.userData.shared = true;
    tuftCache.set(kind, g);
    return g;
  };
  /* gắn gió vào vật liệu (đỉnh dao động theo độ cao cục bộ) */
  N.wind = function (mat, amp, freq, pw, flutter) {
    amp = amp || 0.1; freq = freq || 1.6; pw = pw || 2; flutter = flutter || 0;
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      if (prev) prev(sh, r);
      sh.uniforms.uTime = HT.uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          #ifdef USE_INSTANCING
            vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          #else
            vec3 ip = vec3(modelMatrix[3][0], modelMatrix[3][1], modelMatrix[3][2]);
          #endif
          float hh = max(position.y, 0.0);
          float ph = ip.x*0.23 + ip.z*0.19;
          float gust = 0.65 + 0.35*sin(uTime*0.37 + ip.x*0.02);
          float w1 = sin(uTime*${freq.toFixed(3)} + ph)*0.7 + sin(uTime*${(freq * 2.7).toFixed(3)} + ph*1.9 + position.x*0.9)*0.3;
          float k = ${amp.toFixed(4)} * pow(hh, ${pw.toFixed(2)}) * gust;
          transformed.x += w1 * k;
          transformed.z += cos(uTime*${(freq * 0.83).toFixed(3)} + ph*1.3) * k * 0.6;
          ${flutter ? `transformed += normal * sin(uTime*7.0 + position.x*4.0 + position.z*3.0 + ph) * ${flutter.toFixed(4)} * min(hh,1.0);` : ''}
        }`);
    };
    const key = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
    mat.customProgramCacheKey = () => key + '|w' + amp + '_' + freq + '_' + pw + '_' + flutter;
    return mat;
  };
  /* vật liệu lá: ảnh có alpha đã nhân trước, bỏ lật pháp tuyến mặt sau, ánh sáng xuyên lá */
  N.foliageMat = function (tex, o) {
    o = o || {};
    const m = new T.MeshStandardMaterial({
      map: tex, alphaTest: o.alphaTest || 0.42, side: T.DoubleSide, roughness: o.rough != null ? o.rough : 0.82,
      metalness: 0, envMapIntensity: o.env != null ? o.env : 0.65, color: new T.Color(o.color != null ? o.color : 0xffffff),
    });
    m.alphaToCoverage = HT.q.level >= 1;
    m.shadowSide = T.DoubleSide;
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb /= max(pow(diffuseColor.a, 2.2), 0.02);')
        .replace('#include <normal_fragment_begin>', `float faceDirection = gl_FrontFacing ? 1.0 : -1.0;
          vec3 normal = normalize( vNormal ); vec3 nonPerturbedNormal = normal;`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          #if NUM_DIR_LIGHTS > 0
            { float bl = max(dot(-geometryViewDir, directionalLights[0].direction), 0.0);
              reflectedLight.directDiffuse += diffuseColor.rgb * directionalLights[0].color * pow(bl, 4.0) * ${(o.trans != null ? o.trans : 0.35).toFixed(3)}; }
          #endif`);
    };
    m.customProgramCacheKey = () => 'foliage' + (o.trans || 0);
    if (o.wind !== false) N.wind(m, o.amp || 0.01, o.freq || 1.3, o.pw || 1.4, o.flutter != null ? o.flutter : 0.015);
    m.userData.shared = false;
    return m;
  };

  /* rải cỏ trong vùng; chia ô để khung nhìn tự bỏ phần khuất */
  N.grass = function (ctx, o) {
    const kind = o.kind || 'grass';
    const geo = N.tuftGeo(kind);
    const mat = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.85, metalness: 0, envMapIntensity: 0.8 });
    N.wind(mat, o.amp || (kind === 'tall' || kind === 'reed' ? 0.09 : 0.12), o.freq || 1.8, 2.0);
    const [x0, z0, x1, z1] = o.rect;
    const dens = (o.density || 6) * HT.q.grass;
    const cell = o.cell || 12;
    const r = HT.rng(o.seed || 11);
    const H = ctx.height;
    const tint = o.tint ? new T.Color(o.tint) : null;
    const m4 = new T.Matrix4(), qq = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3(), col = new T.Color();
    const out = [];
    for (let cz = z0; cz < z1; cz += cell) for (let cx = x0; cx < x1; cx += cell) {
      const w = Math.min(cell, x1 - cx), d = Math.min(cell, z1 - cz);
      const n = Math.round(w * d * dens);
      const items = [];
      for (let i = 0; i < n; i++) {
        const x = cx + r() * w, z = cz + r() * d;
        let m = o.mask ? o.mask(x, z) : 1;
        if (o.poly && !HT.inPoly(x, z, o.poly)) m = 0;
        if (m <= 0 || r() > m) continue;
        items.push([x, z, m]);
      }
      if (!items.length) continue;
      const im = new T.InstancedMesh(geo, mat, items.length);
      items.forEach(([x, z, m], i) => {
        const s = (o.scale || 1) * r.range(0.65, 1.25) * (0.55 + 0.45 * m);
        qq.setFromAxisAngle(new T.Vector3(0, 1, 0), r() * 6.283);
        const y = (o.y != null ? o.y : H(x, z)) - 0.02;
        ps.set(x, y, z); sc.set(s, s * r.range(0.8, 1.2), s);
        m4.compose(ps, qq, sc); im.setMatrixAt(i, m4);
        const v = r.range(0.82, 1.12);
        col.setRGB(v, v * r.range(0.95, 1.05), v * r.range(0.85, 1.05)); if (tint) col.multiply(tint);
        im.setColorAt(i, col);
      });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
      im.receiveShadow = true; im.castShadow = !!o.castShadow;
      im.userData.noAO = true; im.userData.noMap = true;
      im.layers.set(1);
      ctx.add(im); out.push(im);
      ctx.lod(im, cx + w / 2, cz + d / 2, (o.far || 48) + cell * 0.7);
    }
    return out;
  };
  /* ruộng lúa xa: khóm lúa dạng thẻ chéo có alpha (rẻ), đặt theo hàng */
  N.riceClumpTex = function (stage) {
    return HT.canvasTex('riceclump_' + stage, 256, 256, (g, W, H) => {
      const r = HT.rng(stage.length * 7 + 3);
      g.clearRect(0, 0, W, H);
      const ripe = stage === 'ripe';
      for (let i = 0; i < 70; i++) {
        const x0 = W / 2 + r.range(-22, 22), a = r.range(-0.55, 0.55), L = r.range(150, 245);
        const bend = r.range(-40, 40);
        const k = r.range(0.75, 1.2);
        const c = ripe ? (r() < 0.5 ? [196, 168, 74] : [150, 150, 60]) : [84, 128, 46];
        g.strokeStyle = `rgb(${c[0] * k | 0},${c[1] * k | 0},${c[2] * k | 0})`; g.lineWidth = r.range(2, 3.4);
        g.beginPath(); g.moveTo(x0, H); g.quadraticCurveTo(x0 + Math.sin(a) * L * 0.5, H - L * 0.6, x0 + Math.sin(a) * L + bend, H - L); g.stroke();
      }
      if (ripe) for (let i = 0; i < 18; i++) {
        const x = W / 2 + r.range(-80, 80), y = r.range(20, 90);
        g.strokeStyle = 'rgb(214,178,82)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y + 10, x + 26, y + 46); g.stroke();
      }
    });
  };
  N.riceCards = function (ctx, plots, o) {
    o = o || {};
    const byStage = {};
    for (const p of plots) (byStage[p.stage || 'green'] = byStage[p.stage || 'green'] || []).push(p);
    const r = HT.rng(o.seed || 17);
    for (const stage in byStage) {
      const tex = N.riceClumpTex(stage); tex.premultiplyAlpha = true;
      const mat = N.foliageMat(tex, { amp: 0.05, freq: 1.3, pw: 2, flutter: 0, trans: 0.3, alphaTest: 0.35 });
      const hgt = stage === 'young' ? 0.35 : stage === 'ripe' ? 0.85 : 0.72;
      const g = new T.PlaneGeometry(0.62, hgt); g.translate(0, hgt / 2, 0);
      const g2 = g.clone(); g2.rotateY(Math.PI / 2);
      const geo = T.BufferGeometryUtils.mergeGeometries([g, g2]);
      const nn = geo.attributes.normal; for (let i = 0; i < nn.count; i++) nn.setXYZ(i, 0, 1, 0);
      geo.userData.shared = false;
      const pts = [];
      for (const p of byStage[stage]) {
        const [x0, z0, x1, z1] = p.rect;
        for (let z = z0 + 0.35; z < z1 - 0.2; z += o.sz || 0.36) for (let x = x0 + 0.35; x < x1 - 0.2; x += o.sx || 0.36) pts.push([x + r.range(-0.08, 0.08), p.y, z + r.range(-0.08, 0.08)]);
      }
      const im = new T.InstancedMesh(geo, mat, pts.length);
      const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3();
      pts.forEach(([x, y, z], i) => { q.setFromAxisAngle(new T.Vector3(0, 1, 0), r() * 3.14); const s = r.range(0.85, 1.15); ps.set(x, y, z); sc.set(s, s * r.range(0.9, 1.1), s); m4.compose(ps, q, sc); im.setMatrixAt(i, m4); });
      im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
      im.receiveShadow = true; im.userData.noAO = true; im.userData.noMap = true; im.layers.set(1);
      ctx.add(im);
    }
  };

  /* ======================================================== LÁ VẼ TRÊN CANVAS ======================================================== */
  function hsl(h, s, l, a) { return 'hsla(' + h.toFixed(1) + ',' + s.toFixed(1) + '%,' + l.toFixed(1) + '%,' + (a == null ? 1 : a) + ')'; }
  N.hsl = hsl;
  function leafShape(g, L, W, kind) {
    g.beginPath(); g.moveTo(0, 0);
    if (kind === 'lance') { g.bezierCurveTo(L * 0.2, -W * 0.55, L * 0.75, -W * 0.35, L, 0); g.bezierCurveTo(L * 0.75, W * 0.35, L * 0.2, W * 0.55, 0, 0); }
    else if (kind === 'ovate') { g.bezierCurveTo(L * 0.05, -W * 0.7, L * 0.7, -W * 0.65, L, 0); g.bezierCurveTo(L * 0.7, W * 0.65, L * 0.05, W * 0.7, 0, 0); }
    else if (kind === 'narrow') { g.bezierCurveTo(L * 0.15, -W * 0.5, L * 0.6, -W * 0.45, L, 0); g.bezierCurveTo(L * 0.6, W * 0.45, L * 0.15, W * 0.5, 0, 0); }
    else { g.bezierCurveTo(L * 0.1, -W * 0.6, L * 0.65, -W * 0.6, L, 0); g.bezierCurveTo(L * 0.65, W * 0.6, L * 0.1, W * 0.6, 0, 0); }
    g.closePath();
  }
  function drawLeaf(g, x, y, ang, L, W, H, S, Lt, kind, r) {
    g.save(); g.translate(x, y); g.rotate(ang);
    leafShape(g, L, W, kind);
    const gr = g.createLinearGradient(0, -W / 2, 0, W / 2);
    gr.addColorStop(0, hsl(H, S, Lt * 0.82)); gr.addColorStop(0.47, hsl(H + 3, S, Lt * 1.12)); gr.addColorStop(0.53, hsl(H, S, Lt * 0.95)); gr.addColorStop(1, hsl(H - 2, S, Lt * 0.72));
    g.fillStyle = gr; g.fill();
    g.strokeStyle = hsl(H + 8, S * 0.7, Math.min(90, Lt * 1.45), 0.55); g.lineWidth = Math.max(0.8, W * 0.045);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(L * 0.96, 0); g.stroke();
    if (W > 14) {
      g.lineWidth = Math.max(0.5, W * 0.018); g.strokeStyle = hsl(H + 8, S * 0.6, Math.min(90, Lt * 1.3), 0.3);
      for (let t = 0.15; t < 0.9; t += 0.11) { g.beginPath(); g.moveTo(L * t, 0); g.lineTo(L * (t + 0.12), -W * 0.36 * (1 - t * 0.6)); g.moveTo(L * t, 0); g.lineTo(L * (t + 0.12), W * 0.36 * (1 - t * 0.6)); g.stroke(); }
    }
    g.restore();
  }
  N.drawLeaf = drawLeaf;
  /* bộ ảnh lá 2x2 ô cho từng loài */
  const SPEC = {
    mango: { H: [92, 112], S: [38, 55], L: [14, 28], len: [62, 96], wid: [15, 22], shape: 'lance', rosette: [7, 12], clusters: 46, twig: '#4a3a28', young: 0.06 },
    banyan: { H: [85, 105], S: [40, 58], L: [18, 34], len: [60, 95], wid: [32, 46], shape: 'ovate', rosette: [4, 7], clusters: 44, twig: '#5a4a38', young: 0.0 },
    star: { H: [78, 96], S: [42, 60], L: [26, 42], len: [26, 44], wid: [12, 18], shape: 'ovate', pinnate: true, clusters: 30, twig: '#5b4a30', young: 0 },
    guava: { H: [70, 92], S: [35, 52], L: [26, 42], len: [60, 90], wid: [30, 40], shape: 'oval', rosette: [2, 4], clusters: 40, twig: '#7a6650', young: 0.05 },
    citrus: { H: [95, 115], S: [45, 62], L: [14, 27], len: [55, 80], wid: [26, 36], shape: 'oval', rosette: [3, 6], clusters: 44, twig: '#3b3322', young: 0 },
    forest: { H: [80, 110], S: [30, 52], L: [16, 34], len: [45, 80], wid: [20, 32], shape: 'ovate', rosette: [3, 6], clusters: 48, twig: '#4b3d2c', young: 0 },
    frangi: { H: [85, 100], S: [40, 55], L: [22, 36], len: [110, 160], wid: [34, 48], shape: 'lance', rosette: [6, 9], clusters: 10, twig: '#6d6457', young: 0, flower: '#fbf6ea' },
    hedge: { H: [95, 118], S: [35, 55], L: [14, 30], len: [30, 48], wid: [16, 24], shape: 'ovate', rosette: [3, 5], clusters: 90, twig: '#3e3424', young: 0, flower: '#c8202a' },
    chetau: { H: [88, 108], S: [35, 55], L: [13, 27], len: [24, 38], wid: [11, 16], shape: 'oval', rosette: [4, 7], clusters: 120, twig: '#3e3424', young: 0.04 },
    bamboo: { H: [72, 92], S: [35, 55], L: [24, 44], len: [90, 150], wid: [11, 17], shape: 'narrow', bamboo: true, clusters: 16, twig: '#8a8a4a', young: 0 },
    peach: { H: [88, 100], S: [30, 45], L: [20, 32], len: [60, 90], wid: [12, 18], shape: 'narrow', rosette: [4, 7], clusters: 24, twig: '#4e3b2e', young: 0 },
    spruce: { H: [120, 150], S: [18, 32], L: [14, 24], len: [16, 26], wid: [3, 5], shape: 'narrow', needle: true, clusters: 40, twig: '#3d3326', young: 0 },
  };
  N.leafAtlas = function (kind) {
    const sp = SPEC[kind] || SPEC.forest;
    return HT.canvasTex('leaf_' + kind, 1024, 1024, (g, W, Hh) => {
      const r = HT.rng(kind.length * 1013 + 7);
      for (let cell = 0; cell < 4; cell++) {
        const ox = (cell % 2) * 512, oy = Math.floor(cell / 2) * 512;
        g.save(); g.beginPath(); g.rect(ox + 2, oy + 2, 508, 508); g.clip();
        const leaf = (x, y, a, scl, bright) => {
          const L = r.range(sp.len[0], sp.len[1]) * scl, Wd = r.range(sp.wid[0], sp.wid[1]) * scl;
          let H = r.range(sp.H[0], sp.H[1]), S = r.range(sp.S[0], sp.S[1]), Lt = r.range(sp.L[0], sp.L[1]) * bright;
          if (sp.young && r() < sp.young) { H = r.range(18, 40); S = 45; Lt = 30; }
          drawLeaf(g, x, y, a, L, Wd, H, S, Lt, sp.shape, r);
        };
        if (sp.needle) {
          for (let b = 0; b < 7; b++) {
            const x0 = ox + 40 + r() * 430, y0 = oy + 60 + r() * 400, a0 = r.range(-0.6, 0.6) + (r() < 0.5 ? 0 : Math.PI);
            g.strokeStyle = sp.twig; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y0); const L = r.range(160, 260); g.lineTo(x0 + Math.cos(a0) * L, y0 + Math.sin(a0) * L); g.stroke();
            for (let t = 0; t < L; t += 4) for (const sd of [-1, 1]) {
              const x = x0 + Math.cos(a0) * t, y = y0 + Math.sin(a0) * t;
              leaf(x, y, a0 + sd * r.range(0.6, 1.1), 1, r.range(0.8, 1.2) * (0.7 + 0.3 * t / L));
            }
          }
        } else if (sp.bamboo) {
          for (let b = 0; b < sp.clusters; b++) {
            const x0 = ox + 30 + r() * 450, y0 = oy + 30 + r() * 300;
            const a0 = r.range(0.9, 2.2);
            const L = r.range(120, 240);
            g.strokeStyle = sp.twig; g.lineWidth = 2;
            g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a0) * L * 0.5 + 20, y0 + Math.sin(a0) * L * 0.5, x0 + Math.cos(a0) * L, y0 + Math.sin(a0) * L); g.stroke();
            const nl = r.int(5, 9);
            for (let k = 0; k < nl; k++) {
              const t = 0.25 + (k / nl) * 0.75; const x = x0 + Math.cos(a0) * L * t, y = y0 + Math.sin(a0) * L * t;
              leaf(x, y, a0 + r.range(-0.9, 0.9) * (k % 2 ? 1 : -1) * 0.8 + 0.2, 1, r.range(0.85, 1.2));
            }
          }
        } else if (sp.pinnate) {
          for (let b = 0; b < sp.clusters; b++) {
            const x0 = ox + 40 + r() * 430, y0 = oy + 40 + r() * 430, a0 = r() * 6.283, L = r.range(110, 170);
            g.strokeStyle = sp.twig; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(a0) * L, y0 + Math.sin(a0) * L); g.stroke();
            for (let t = 12; t < L; t += 15) for (const sd of [-1, 1]) leaf(x0 + Math.cos(a0) * t, y0 + Math.sin(a0) * t, a0 + sd * 1.25, 1, r.range(0.85, 1.2));
            leaf(x0 + Math.cos(a0) * L, y0 + Math.sin(a0) * L, a0, 1, 1.1);
          }
        } else {
          /* cành con + chùm lá hoa thị ở đầu cành */
          const nc = sp.clusters;
          for (let c = 0; c < nc; c++) {
            const depth = c / nc;
            const cxp = ox + 60 + r() * 392, cyp = oy + 60 + r() * 392;
            const bright = 0.72 + depth * 0.45;
            const n = r.int(sp.rosette[0], sp.rosette[1]);
            const a0 = r() * 6.283;
            g.strokeStyle = sp.twig; g.lineWidth = 2.2;
            g.beginPath(); g.moveTo(cxp, cyp); g.lineTo(cxp - Math.cos(a0) * 40, cyp - Math.sin(a0) * 40 + 30); g.stroke();
            for (let k = 0; k < n; k++) {
              const a = a0 + (k / n) * 6.283 + r.range(-0.3, 0.3);
              leaf(cxp, cyp, a, r.range(0.75, 1.1), bright * r.range(0.9, 1.1));
            }
            if (sp.flower && r() < (kind === 'hedge' ? 0.12 : 0.7)) {
              for (let f = 0; f < (kind === 'frangi' ? 6 : 1); f++) {
                const fx = cxp + r.range(-14, 14), fy = cyp + r.range(-14, 14);
                for (let p = 0; p < 5; p++) {
                  g.save(); g.translate(fx, fy); g.rotate(p * 1.2566 + r() * 0.3);
                  g.fillStyle = sp.flower; g.beginPath(); g.ellipse(9, 0, 10, 6, 0, 0, 6.283); g.fill();
                  g.restore();
                }
                g.fillStyle = kind === 'frangi' ? '#f2c542' : '#f3d25a'; g.beginPath(); g.arc(fx, fy, 3.5, 0, 6.283); g.fill();
              }
            }
          }
        }
        g.restore();
      }
    }, {});
  };
  function leafTexture(kind) {
    const t = N.leafAtlas(kind);
    t.premultiplyAlpha = true;
    return t;
  }

  /* ======================================================== CÂY THÂN GỖ ======================================================== */
  const TREE = {
    mango: { h: [9, 13], trunkH: [0.16, 0.22], r0: 0.038, limbs: [4, 6], spread: 0.95, rise: 0.8, crown: [0.5, 0.62], cards: 1150, card: [1.1, 1.6], leaf: 'mango', bark: 'bark_platanus', barkTint: 0xc8b8a4, dense: 0.8 },
    banyan: { h: [15, 20], trunkH: [0.18, 0.24], r0: 0.07, limbs: [6, 8], spread: 1.35, rise: 0.45, crown: [0.8, 0.36], cards: 900, card: [1.8, 2.6], leaf: 'banyan', bark: 'bark_platanus', barkTint: 0xd4cec4, roots: true, buttress: true, dense: 0.85 },
    star: { h: [5, 7], trunkH: [0.22, 0.3], r0: 0.04, limbs: [4, 5], spread: 1.0, rise: 0.6, crown: [0.55, 0.45], cards: 240, card: [1.1, 1.5], leaf: 'star', bark: 'bark_brown_01', barkTint: 0x8a8070, dense: 0.6 },
    guava: { h: [4.5, 6.5], trunkH: [0.18, 0.28], r0: 0.035, limbs: [3, 5], spread: 1.0, rise: 0.7, crown: [0.5, 0.45], cards: 300, card: [0.85, 1.2], leaf: 'guava', bark: 'bark_willow', barkTint: 0xc4a88a, dense: 0.55 },
    citrus: { h: [4, 5.5], trunkH: [0.14, 0.2], r0: 0.03, limbs: [4, 6], spread: 0.9, rise: 0.8, crown: [0.5, 0.6], cards: 380, card: [0.8, 1.1], leaf: 'citrus', bark: 'bark_platanus', barkTint: 0x9a9082, dense: 0.9, fruit: 0xd9d060 },
    forest: { h: [16, 24], trunkH: [0.32, 0.45], r0: 0.028, limbs: [4, 6], spread: 0.75, rise: 0.95, crown: [0.32, 0.5], cards: 700, card: [1.6, 2.4], leaf: 'forest', bark: 'bark_platanus', barkTint: 0xb8ac9c, dense: 0.8 },
    frangi: { h: [5, 7], trunkH: [0.25, 0.3], r0: 0.05, limbs: [4, 6], spread: 1.1, rise: 0.7, crown: [0.6, 0.35], cards: 110, card: [1.0, 1.3], leaf: 'frangi', bark: 'bark_willow', barkTint: 0xb3a898, dense: 0.35, candelabra: true },
    peach: { h: [3.5, 4.5], trunkH: [0.2, 0.3], r0: 0.035, limbs: [3, 5], spread: 1.0, rise: 0.6, crown: [0.55, 0.4], cards: 140, card: [0.9, 1.2], leaf: 'peach', bark: 'bark_brown_01', barkTint: 0x6a5048, dense: 0.5 },
    spruce: { h: [10, 16], conifer: true, r0: 0.025, cards: 460, card: [1.4, 2.0], leaf: 'spruce', bark: 'bark_brown_01', barkTint: 0x7a6a5a },
  };
  N.TREE = TREE;
  /* sinh một biến thể cây (hệ tọa độ cục bộ, gốc ở 0,0,0) */
  N.treeVariant = function (kind, seed) {
    const P = TREE[kind]; const r = HT.rng(seed);
    const h = r.range(P.h[0], P.h[1]);
    const woods = [];
    const cards = [];
    const V = (x, y, z) => new T.Vector3(x, y, z);
    const tube = (pts, r0, r1, seg) => {
      const radii = pts.map((_, i) => r0 + (r1 - r0) * (i / (pts.length - 1)));
      woods.push(HT.taperTube(pts, radii, seg || 7));
    };
    const cy = h * (P.conifer ? 0.5 : 1 - P.crown[1] * 0.9);
    const crownR = P.conifer ? h * 0.22 : h * P.crown[0], crownH = P.conifer ? h * 0.85 : h * P.crown[1];
    const center = V(0, P.conifer ? h * 0.5 : h - crownH * 0.5, 0);
    const tipPts = [];
    if (P.conifer) {
      const pts = []; for (let i = 0; i <= 8; i++) pts.push(V(r.range(-0.05, 0.05), h * i / 8, r.range(-0.05, 0.05)));
      tube(pts, h * P.r0, 0.02, 8);
      for (let i = 0; i < P.cards; i++) {
        const t = Math.pow(r(), 0.8); const y = h * (0.12 + 0.86 * t); const rad = (1 - t) * h * 0.24 + 0.2;
        const a = r() * 6.283; const rr = rad * Math.sqrt(r.range(0.2, 1));
        cards.push({ p: V(Math.cos(a) * rr, y, Math.sin(a) * rr), s: r.range(P.card[0], P.card[1]) * (0.5 + (1 - t) * 0.6), a, tilt: r.range(-0.2, 0.3), cell: r.int(0, 3) });
      }
      return { woods, cards, center: V(0, h * 0.45, 0), h, crownR: h * 0.26, kind };
    }
    /* thân */
    const tH = h * r.range(P.trunkH[0], P.trunkH[1]);
    const r0 = h * P.r0 * r.range(0.9, 1.15);
    const lean = V(r.range(-0.12, 0.12), 1, r.range(-0.12, 0.12)).normalize();
    const trunk = [];
    const wa = r() * 6.283, wb = r() * 6.283, wamp = h * r.range(0.012, 0.03);
    for (let i = 0; i <= 6; i++) { const t = i / 6; trunk.push(V(lean.x * tH * t + Math.sin(t * 3.1 + wa) * wamp * t, tH * t, lean.z * tH * t + Math.sin(t * 2.7 + wb) * wamp * t)); }
    const radii = trunk.map((_, i) => { const t = i / 6; return r0 * (1 - 0.3 * t) * (P.buttress && t < 0.15 ? 1 + (0.15 - t) * 5 : 1) * (t < 0.05 ? 1.25 : 1); });
    woods.push(HT.taperTube(trunk, radii, 10));
    const top = trunk[trunk.length - 1];
    /* cành chính */
    const nL = r.int(P.limbs[0], P.limbs[1]);
    const a0 = r() * 6.283;
    for (let i = 0; i < nL; i++) {
      const a = a0 + (i / nL) * 6.283 + r.range(-0.35, 0.35);
      const dir = V(Math.cos(a) * P.spread, P.rise + r.range(-0.15, 0.2), Math.sin(a) * P.spread).normalize();
      const L1 = Math.hypot(crownR * r.range(0.55, 0.85), (h - tH) * 0.55);
      const start = top.clone().add(V(0, -tH * r.range(0, 0.18), 0));
      const pts = [start];
      let p = start.clone(), d = dir.clone();
      for (let s = 1; s <= 5; s++) { d.add(V(r.range(-0.18, 0.18), 0.06, r.range(-0.18, 0.18))).normalize(); p = p.clone().add(d.clone().multiplyScalar(L1 / 5)); pts.push(p); }
      const lr0 = r0 * r.range(0.5, 0.65);
      tube(pts, lr0, lr0 * 0.35, 7);
      /* cành con */
      const nB = r.int(2, 4);
      for (let b = 0; b < nB; b++) {
        const t = r.range(0.45, 0.95); const si = Math.min(4, Math.floor(t * 5)); const sp = pts[si].clone().lerp(pts[si + 1], t * 5 - si);
        const bd = d.clone().add(V(r.range(-0.9, 0.9), r.range(0.1, 0.7), r.range(-0.9, 0.9))).normalize();
        const L2 = L1 * r.range(0.35, 0.6);
        const bp = [sp]; let q = sp.clone();
        for (let s = 1; s <= 3; s++) { bd.add(V(r.range(-0.2, 0.2), 0.08, r.range(-0.2, 0.2))).normalize(); q = q.clone().add(bd.clone().multiplyScalar(L2 / 3)); bp.push(q); }
        tube(bp, lr0 * 0.4, lr0 * 0.12, 5);
        tipPts.push(q);
      }
      tipPts.push(p);
      if (P.candelabra) {
        for (let b = 0; b < 2; b++) {
          const sp2 = p.clone(); const bd = V(r.range(-0.4, 0.4), 1, r.range(-0.4, 0.4)).normalize();
          const e = sp2.clone().add(bd.multiplyScalar(r.range(0.6, 1.1)));
          tube([sp2, sp2.clone().lerp(e, 0.5).add(V(0, 0.05, 0)), e], lr0 * 0.4, lr0 * 0.3, 6);
          tipPts.push(e);
        }
      }
    }
    /* rễ phụ của cây đa */
    if (P.roots) {
      for (let i = 0; i < 26; i++) {
        const a = r() * 6.283, rr = r.range(1.5, crownR * 0.75);
        const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        const y1 = h - crownH * r.range(0.75, 1.0);
        const thick = r() < 0.25;
        const pts = []; for (let k = 0; k <= 5; k++) pts.push(V(x + r.range(-0.05, 0.05), y1 * (1 - k / 5) - (thick ? 0.1 : r.range(0, y1 * 0.4) * (k / 5)), z + r.range(-0.05, 0.05)));
        if (thick) pts[pts.length - 1].y = -0.1;
        tube(pts, thick ? 0.08 : 0.018, thick ? 0.14 : 0.01, 5);
      }
    }
    /* thẻ lá: dồn ở lớp ngoài tán + quanh đầu cành */
    const nC = Math.round(P.cards * (HT.q.trees || 1));
    for (let i = 0; i < nC; i++) {
      let p;
      if (r() < 0.45 && tipPts.length) { p = r.pick(tipPts).clone().add(V(r.range(-1, 1), r.range(-0.4, 0.8), r.range(-1, 1)).multiplyScalar(crownR * 0.22)); }
      else {
        const u = r() * 6.283, v = Math.acos(r.range(-0.8, 1)), s = Math.pow(r.range(0.5, 1), 0.55);
        p = V(Math.sin(v) * Math.cos(u) * crownR * s, Math.cos(v) * crownH * 0.55 * s, Math.sin(v) * Math.sin(u) * crownR * s).add(center);
      }
      cards.push({ p, s: r.range(P.card[0], P.card[1]), a: r() * 6.283, tilt: r.range(-0.7, 0.7), cell: r.int(0, 3) });
    }
    return { woods, cards, center, h, crownR, kind };
  };
  /* ghép thẻ lá thành một hình học; pháp tuyến hướng ra khỏi tâm tán cho bóng mềm */
  function cardsGeo(cards, center, conifer) {
    const pos = [], nor = [], uv = [];
    const up = new T.Vector3(0, 1, 0), t1 = new T.Vector3(), t2 = new T.Vector3(), nn = new T.Vector3();
    for (const c of cards) {
      const half = c.s / 2;
      const cu = (c.cell % 2) * 0.5, cv = Math.floor(c.cell / 2) * 0.5;
      for (let k = 0; k < 2; k++) {
        const a = c.a + k * 1.5708;
        t1.set(Math.cos(a), 0, Math.sin(a));
        t2.set(-Math.sin(a) * Math.sin(c.tilt), Math.cos(c.tilt), Math.cos(a) * Math.sin(c.tilt)).normalize();
        const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        const P4 = corners.map(([i, j]) => c.p.clone().addScaledVector(t1, i * half).addScaledVector(t2, j * half * (conifer ? 0.6 : 1)));
        const U4 = corners.map(([i, j]) => [cu + (i * 0.5 + 0.5) * 0.5, 0.5 - cv + (j * 0.5 + 0.5) * 0.5]);
        const order = [0, 1, 2, 0, 2, 3];
        for (const o of order) {
          const p = P4[o]; pos.push(p.x, p.y, p.z);
          nn.subVectors(p, center); if (conifer) nn.y *= 0.3; nn.normalize(); nn.y = nn.y * 0.7 + 0.35; nn.normalize();
          nor.push(nn.x, nn.y, nn.z); uv.push(U4[o][0], U4[o][1]);
        }
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    return g;
  }
  const treeVarCache = new Map();
  function treeVariants(kind, nVar) {
    const key = kind + '|' + nVar + '|' + HT.q.trees;
    if (treeVarCache.has(key)) return treeVarCache.get(key);
    const out = [];
    for (let v = 0; v < nVar; v++) {
      const tv = N.treeVariant(kind, 1000 + v * 77 + kind.length * 13);
      const wood = T.BufferGeometryUtils.mergeGeometries(tv.woods.map((g) => g.index ? g : g), false);
      const leaf = cardsGeo(tv.cards, tv.center, TREE[kind].conifer);
      wood.userData.shared = true; leaf.userData.shared = true;
      wood.computeBoundingSphere(); leaf.computeBoundingSphere();
      out.push({ wood, leaf, h: tv.h, crownR: tv.crownR });
    }
    treeVarCache.set(key, out);
    return out;
  }
  const treeMatCache = new Map();
  function treeMats(kind) {
    if (treeMatCache.has(kind)) return treeMatCache.get(kind);
    const P = TREE[kind];
    const bark = HT.mat(P.bark, { tile: 1.2, color: P.barkTint, ns: 1.2 }).clone();
    bark.userData.shared = true;
    N.wind(bark, 0.0025, 1.1, 1.3);
    const leaf = N.foliageMat(leafTexture(P.leaf), { amp: kind === 'spruce' ? 0.004 : 0.006, pw: 1.3, trans: 0.4, flutter: 0.02 });
    leaf.userData.shared = true;
    const r = { bark, leaf };
    treeMatCache.set(kind, r);
    return r;
  }
  /* trồng cây: list [{x,z,s,ry,y}] cùng một loài -> thực thể lặp theo biến thể */
  N.trees = function (ctx, kind, list, o) {
    o = o || {};
    if (!list.length) return [];
    const vars = treeVariants(kind, o.variants || 3);
    const mats = treeMats(kind);
    const r = HT.rng(o.seed || 5);
    const groups = vars.map(() => []);
    list.forEach((t, i) => groups[t.v != null ? t.v % vars.length : i % vars.length].push(t));
    const out = [];
    const m4 = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), p = new T.Vector3();
    groups.forEach((g, vi) => {
      if (!g.length) return;
      const V = vars[vi];
      const wim = new T.InstancedMesh(V.wood, mats.bark, g.length);
      const lim = new T.InstancedMesh(V.leaf, mats.leaf, g.length);
      g.forEach((t, i) => {
        const sc = t.s || r.range(0.85, 1.15);
        q.setFromAxisAngle(new T.Vector3(0, 1, 0), t.ry != null ? t.ry : r() * 6.283);
        p.set(t.x, t.y != null ? t.y : ctx.height(t.x, t.z) - 0.05, t.z); s.set(sc, sc * (t.sy || 1), sc);
        m4.compose(p, q, s); wim.setMatrixAt(i, m4); lim.setMatrixAt(i, m4);
        if (o.collide !== false) ctx.colCircle(t.x, t.z, Math.max(0.25, V.h * TREE[kind].r0 * sc * 1.1));
      });
      for (const im of (o.bare ? [wim] : [wim, lim])) { im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = farShadow(o); im.receiveShadow = true; if (!farShadow(o)) im.userData.noAO = true; ctx.add(im); out.push(im); }
      lim.userData.noAO = true;
    });
    return out;
  };

  /* ======================================================== CAU, DỪA, CỌ ======================================================== */
  N.frondTex = function (kind) {
    return HT.canvasTex('frond_' + kind, 256, 1024, (g, W, H) => {
      const r = HT.rng(kind.length * 31 + 3);
      const cx = W / 2;
      const nL = kind === 'coconut' ? 96 : kind === 'areca' ? 48 : kind === 'cycad' ? 80 : 60;
      for (let i = 0; i < nL; i++) {
        const t = 0.04 + (i / nL) * 0.94;
        const y = H * (1 - t);
        const len = W * 0.5 * (kind === 'areca' ? 0.95 : 0.98) * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.05)) * r.range(0.85, 1.05);
        for (const sd of [-1, 1]) {
          const th = (kind === 'areca' ? 0.95 : 1.05) + r.range(-0.08, 0.08);
          const wid = kind === 'areca' ? r.range(12, 18) : kind === 'coconut' ? r.range(11, 15) : kind === 'cycad' ? r.range(9, 12) : r.range(8, 12);
          const L2 = Math.min(len, (W * 0.5 - 4) / Math.sin(th));
          const H0 = kind === 'coconut' ? r.range(82, 100) : r.range(78, 98), S = r.range(38, 55), L = kind === 'cycad' ? r.range(14, 24) : kind === 'coconut' ? r.range(20, 31) : r.range(24, 38);
          g.save(); g.translate(cx, y); g.rotate(Math.atan2(-Math.cos(th), sd * Math.sin(th)));
          leafShape(g, L2, wid, 'narrow');
          const gr = g.createLinearGradient(0, -wid / 2, 0, wid / 2);
          gr.addColorStop(0, hsl(H0, S, L * 0.8)); gr.addColorStop(0.5, hsl(H0 + 4, S, L * 1.15)); gr.addColorStop(1, hsl(H0, S, L * 0.75));
          g.fillStyle = gr; g.fill();
          g.strokeStyle = hsl(H0 + 10, S * 0.6, L * 1.5, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(L2 * 0.95, 0); g.stroke();
          g.restore();
        }
      }
      g.strokeStyle = kind === 'coconut' ? '#a79a55' : '#8f9a4a'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(cx, H); g.lineTo(cx, 6); g.stroke();
    });
  };
  N.fanTex = function () {
    /* lá cọ hình quạt */
    return HT.canvasTex('fan_co', 1024, 1024, (g, W, H) => {
      const r = HT.rng(71);
      const cx = W / 2, cy = H / 2;
      const segs = 56;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const len = W * 0.48 * r.range(0.9, 1.0);
        g.save(); g.translate(cx, cy); g.rotate(a);
        const w = (Math.PI * 2 * len / segs) * 0.62;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(len * 0.7, -w * 0.5); g.lineTo(len, -w * 0.12); g.lineTo(len * 0.93, 0); g.lineTo(len, w * 0.12); g.lineTo(len * 0.7, w * 0.5); g.closePath();
        const L = r.range(22, 32);
        const gr = g.createLinearGradient(0, -w / 2, 0, w / 2);
        gr.addColorStop(0, hsl(95, 42, L * 0.75)); gr.addColorStop(0.5, hsl(92, 45, L * 1.2)); gr.addColorStop(1, hsl(95, 42, L * 0.7));
        g.fillStyle = gr; g.fill();
        g.strokeStyle = hsl(90, 30, 45, 0.5); g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(len * 0.93, 0); g.stroke();
        g.restore();
      }
      g.fillStyle = '#6d7a3a'; g.beginPath(); g.arc(cx, cy, 16, 0, 6.283); g.fill();
    });
  };
  N.ringTex = function (kind) {
    return HT.canvasTex('ring_' + kind, 128, 512, (g, W, H) => {
      const r = HT.rng(kind.length * 7 + 1);
      const base = kind === 'areca' ? [112, 114, 100] : kind === 'co' ? [110, 98, 84] : [120, 108, 92];
      for (let y = 0; y < H; y++) { const n = r.range(-10, 10); g.fillStyle = `rgb(${base[0] + n},${base[1] + n},${base[2] + n})`; g.fillRect(0, y, W, 1); }
      for (let x = 0; x < W; x += 2) { g.fillStyle = `rgba(60,55,45,${r.range(0.02, 0.12)})`; g.fillRect(x, 0, 1, H); }
      const step = kind === 'areca' ? 64 : kind === 'co' ? 40 : 48;
      for (let y = step / 2; y < H; y += step) {
        g.fillStyle = kind === 'areca' ? 'rgba(80,80,70,0.55)' : 'rgba(70,58,44,0.7)';
        g.fillRect(0, y, W, kind === 'areca' ? 3 : 7);
        g.fillStyle = 'rgba(210,205,190,0.25)'; g.fillRect(0, y + (kind === 'areca' ? 3 : 7), W, 2);
      }
    });
  };
  /* một tàu lá: dải cong có gập chữ V dọc gân giữa */
  function frondGeo(len, wid, droop, fold, seg, rnd) {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      const x = len * t * (1 - droop * 0.15 * t);
      const y = len * (0.45 * t - droop * t * t * 0.9);
      const w = wid * Math.sin(Math.PI * Math.min(1, 0.08 + t)) * (t < 0.12 ? t / 0.12 : 1);
      const twist = (rnd || 0) * t;
      for (const sd of [-1, 0, 1]) {
        const zz = sd * w * 0.5 * Math.cos(fold);
        const yy = y + Math.abs(sd) * w * 0.5 * Math.sin(fold) - Math.abs(sd) * w * 0.08 * t;
        pos.push(x, yy + sd * twist * w * 0.2, zz);
        uv.push(0.5 + sd * 0.5, t);
      }
    }
    for (let i = 0; i < seg; i++) for (let k = 0; k < 2; k++) { const a = i * 3 + k, b = a + 3; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function fanGeo(R, cup, seg) {
    const g = new T.CircleGeometry(R, seg || 20, 0, Math.PI * 1.55);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const d = Math.hypot(x, y) / R; const a = Math.atan2(y, x); p.setZ(i, cup * d * d + Math.sin(a * 28) * 0.03 * d); }
    g.rotateX(-Math.PI / 2 + 0.25);
    g.computeVertexNormals();
    return g;
  }
  const palmCache = new Map();
  function palmVariant(kind, seed) {
    const r = HT.rng(seed);
    const V = (x, y, z) => new T.Vector3(x, y, z);
    const out = { trunk: [], frond: [], extra: [] };
    let h, r0, r1, curve;
    if (kind === 'areca') { h = r.range(9, 13.5); r0 = 0.08; r1 = 0.065; curve = r.range(0.1, 0.5); }
    else if (kind === 'coconut') { h = r.range(8, 13); r0 = 0.2; r1 = 0.13; curve = r.range(0.8, 2.2); }
    else if (kind === 'co') { h = r.range(6, 10); r0 = 0.16; r1 = 0.13; curve = r.range(0.1, 0.5); }
    else if (kind === 'cycad') { h = r.range(0.8, 2.0); r0 = 0.24; r1 = 0.2; curve = r.range(0.0, 0.15); }
    else if (kind === 'nipa') { h = 0.25; r0 = 0.16; r1 = 0.12; curve = 0; }
    else { h = r.range(8, 12); r0 = 0.17; r1 = 0.12; curve = 0.4; }
    const dirA = r() * 6.283;
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; const off = curve * (t * t * 0.6 + t * 0.4); pts.push(V(Math.cos(dirA) * off, h * t, Math.sin(dirA) * off)); }
    const radii = pts.map((_, i) => { const t = i / 10; return (r0 + (r1 - r0) * t) * (t < 0.06 ? 1.35 - t * 5 : 1); });
    out.trunk.push(HT.taperTube(pts, radii, 10));
    const top = pts[10];
    if (kind === 'areca') {
      const cs = []; for (let i = 0; i <= 3; i++) cs.push(V(top.x, top.y + i * 0.4, top.z));
      out.extra.push({ g: HT.taperTube(cs, [0.1, 0.105, 0.09, 0.05], 10), m: 'crownshaft' });
    }
    const ctr = V(top.x, top.y + (kind === 'areca' ? 1.2 : 0), top.z);
    if (kind === 'co') {
      const n = r.int(16, 22);
      for (let i = 0; i < n; i++) {
        const a = i * 2.39996 + r() * 0.3, el = r.range(-0.3, 1.1);
        const pet = r.range(1.2, 2.0);
        const e = V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
        const tip = ctr.clone().addScaledVector(e, pet);
        out.trunk.push(HT.taperTube([ctr, ctr.clone().lerp(tip, 0.5).add(V(0, 0.1, 0)), tip], [0.03, 0.02, 0.015], 4));
        const f = fanGeo(r.range(0.8, 1.05), r.range(-0.25, 0.1), 18);
        f.rotateY(-a + Math.PI / 2 + r.range(-0.3, 0.3));
        f.translate(tip.x, tip.y, tip.z);
        out.frond.push(f);
      }
      return out;
    }
    if (kind === 'cycad') {
      const n = r.int(24, 32);
      for (let i = 0; i < n; i++) {
        const a = i * 2.39996 + r() * 0.2; const el = r.range(0.25, 1.0);
        const f = frondGeo(r.range(1.2, 1.7), r.range(0.6, 0.8), r.range(0.1, 0.35), 0.5, 10, r.range(-0.2, 0.2));
        f.rotateZ(el); f.rotateY(-a); f.translate(top.x, top.y - 0.05, top.z);
        out.frond.push(f);
      }
      return out;
    }
    const nF = kind === 'coconut' ? r.int(18, 26) : kind === 'nipa' ? r.int(9, 14) : r.int(10, 13);
    for (let i = 0; i < nF; i++) {
      const a = i * 2.39996 + r() * 0.25;
      const age = i / nF;
      const el = kind === 'areca' ? HT.lerp(1.15, -0.35, age) + r.range(-0.1, 0.1) : kind === 'nipa' ? HT.lerp(1.3, 0.55, age) + r.range(-0.1, 0.1) : HT.lerp(0.9, -0.55, age) + r.range(-0.15, 0.15);
      const len = kind === 'areca' ? r.range(2.2, 2.9) : kind === 'nipa' ? r.range(4.5, 6.5) : r.range(3.6, 4.8);
      const wid = kind === 'areca' ? r.range(1.1, 1.45) : kind === 'nipa' ? r.range(1.3, 1.7) : r.range(1.4, 1.9);
      const droop = kind === 'areca' ? r.range(0.5, 0.9) + age * 0.4 : kind === 'nipa' ? r.range(0.15, 0.4) : r.range(0.6, 1.1) + age * 0.5;
      const f = frondGeo(len, wid, droop, kind === 'areca' ? 0.35 : 0.5, 14, r.range(-0.4, 0.4));
      f.rotateZ(el * 0.8);
      f.rotateY(-a);
      f.translate(ctr.x, ctr.y, ctr.z);
      out.frond.push(f);
    }
    if (kind === 'coconut') {
      const nc = r.int(6, 14);
      for (let i = 0; i < nc; i++) { const s = new T.SphereGeometry(0.13, 8, 6); s.scale(1, 1.15, 1); const a = r() * 6.283; s.translate(top.x + Math.cos(a) * 0.28, top.y - r.range(0.05, 0.45), top.z + Math.sin(a) * 0.28); out.extra.push({ g: s, m: 'nut' }); }
      for (let i = 0; i < 3; i++) { const f = frondGeo(3.4, 1.2, 1.6, 0.7, 10, 0.4); f.rotateZ(-1.35); f.rotateY(-(r() * 6.283)); f.translate(top.x, top.y - 0.1, top.z); out.extra.push({ g: f, m: 'dead' }); }
    }
    if (kind === 'areca') {
      const nb = r.int(1, 3);
      for (let i = 0; i < nb; i++) { const a = r() * 6.283; for (let k = 0; k < 9; k++) { const s = new T.SphereGeometry(0.025, 6, 4); s.translate(top.x + Math.cos(a) * 0.14 + r.range(-0.05, 0.05), top.y - 0.05 - k * 0.035, top.z + Math.sin(a) * 0.14 + r.range(-0.05, 0.05)); out.extra.push({ g: s, m: 'nutA' }); } }
    }
    return out;
  }
  function palmMats(kind) {
    const key = 'pm_' + kind;
    if (treeMatCache.has(key)) return treeMatCache.get(key);
    let trunk;
    if (kind === 'cycad') { trunk = HT.mat('palm_bark', { tile: 0.6, color: 0xd8c8b0 }).clone(); }
    else if (kind === 'coconut') { trunk = HT.mat('palm_tree_bark', { tile: 0.9, color: 0xb8ada0 }).clone(); }
    else { const t = N.ringTex(kind).clone(); t.userData.shared = true; t.repeat.set(1 / 0.6, 1 / (kind === 'areca' ? 0.9 : 0.7)); t.needsUpdate = true; trunk = new T.MeshStandardMaterial({ map: t, roughness: 0.85 }); }
    trunk.userData.shared = true;
    N.wind(trunk, kind === 'areca' ? 0.0022 : 0.0012, 0.8, 1.6);
    const ft = kind === 'co' ? N.fanTex() : N.frondTex(kind); ft.premultiplyAlpha = true;
    const frond = N.foliageMat(ft, { amp: kind === 'areca' ? 0.0022 : 0.0012, freq: 0.8, pw: 1.6, flutter: 0.05, trans: 0.45 });
    frond.userData.shared = true;
    const ex = {
      crownshaft: new T.MeshStandardMaterial({ color: 0x6f8a3c, roughness: 0.55 }),
      nut: new T.MeshStandardMaterial({ color: 0x6e7b2e, roughness: 0.6 }),
      nutA: new T.MeshStandardMaterial({ color: 0x7d8a2e, roughness: 0.6 }),
      dead: (() => { const m = N.foliageMat(ft, { wind: false, color: 0x9a7a4a, trans: 0.2 }); m.userData.shared = true; return m; })(),
    };
    for (const k in ex) { if (k !== 'dead') N.wind(ex[k], kind === 'areca' ? 0.0022 : 0.0012, 0.8, 1.6); ex[k].userData.shared = true; }
    const r = { trunk, frond, ex };
    treeMatCache.set(key, r);
    return r;
  }
  N.palms = function (ctx, kind, list, o) {
    o = o || {};
    if (!list.length) return [];
    const nV = o.variants || 3;
    const key = kind + '|' + nV;
    let vars = palmCache.get(key);
    if (!vars) {
      vars = [];
      for (let v = 0; v < nV; v++) {
        const pv = palmVariant(kind, 500 + v * 91 + kind.length);
        const m = (arr) => { const g = T.BufferGeometryUtils.mergeGeometries(arr.map((x) => (x.index ? x.toNonIndexed() : x)), false); g.userData.shared = true; return g; };
        const exG = {};
        for (const e of pv.extra) (exG[e.m] = exG[e.m] || []).push(e.g);
        const ex = {}; for (const k in exG) ex[k] = m(exG[k]);
        vars.push({ trunk: m(pv.trunk), frond: m(pv.frond), ex });
      }
      palmCache.set(key, vars);
    }
    const mats = palmMats(kind);
    const r = HT.rng(o.seed || 9);
    const out = [];
    const groups = vars.map(() => []);
    list.forEach((t, i) => groups[i % vars.length].push(t));
    const m4 = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), p = new T.Vector3();
    groups.forEach((g, vi) => {
      if (!g.length) return;
      const V = vars[vi];
      const parts = [[V.trunk, mats.trunk], [V.frond, mats.frond]];
      for (const k in V.ex) parts.push([V.ex[k], mats.ex[k]]);
      const ims = parts.map(([geo, mat]) => new T.InstancedMesh(geo, mat, g.length));
      g.forEach((t, i) => {
        const sc = t.s || r.range(0.85, 1.1);
        q.setFromAxisAngle(new T.Vector3(0, 1, 0), t.ry != null ? t.ry : r() * 6.283);
        p.set(t.x, t.y != null ? t.y : ctx.height(t.x, t.z) - 0.05, t.z); s.set(sc, sc * (t.sy || 1), sc);
        m4.compose(p, q, s);
        for (const im of ims) im.setMatrixAt(i, m4);
        if (o.collide !== false) ctx.colCircle(t.x, t.z, kind === 'areca' ? 0.18 : 0.3);
      });
      ims.forEach((im, k) => { im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = farShadow(o); im.receiveShadow = true; if (k > 0 || !farShadow(o)) im.userData.noAO = true; ctx.add(im); out.push(im); });
    });
    return out;
  };

  /* ======================================================== TRE ======================================================== */
  N.culmTex = function (kind) {
    return HT.canvasTex('culm_' + (kind || 'g'), 64, 256, (g, W, H) => {
      const r = HT.rng(3);
      const gr = g.createLinearGradient(0, 0, W, 0);
      const c = kind === 'old' ? ['#8b8a55', '#b4b070', '#7d7a48'] : ['#5f7a2e', '#8fa449', '#5a722a'];
      gr.addColorStop(0, c[0]); gr.addColorStop(0.5, c[1]); gr.addColorStop(1, c[2]);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '230,225,170' : '50,60,20'},${r.range(0.04, 0.12)})`; g.fillRect(r() * W, 0, 1 + r() * 2, H); }
      g.fillStyle = 'rgba(70,70,40,0.85)'; g.fillRect(0, H - 10, W, 5);
      g.fillStyle = 'rgba(225,220,170,0.6)'; g.fillRect(0, H - 5, W, 3);
      g.fillStyle = 'rgba(40,45,20,0.35)'; g.fillRect(0, H - 14, W, 4);
    });
  };
  const bambooCache = new Map();
  function bambooVariant(seed, o) {
    const r = HT.rng(seed);
    const culms = [], leaves = [];
    const n = o.n || 34, R = o.r || 1.1, H = o.h || 11;
    const V = (x, y, z) => new T.Vector3(x, y, z);
    const lc = [];
    for (let i = 0; i < n; i++) {
      const a = r() * 6.283, rr = Math.sqrt(r()) * R;
      const bx = Math.cos(a) * rr, bz = Math.sin(a) * rr;
      const h = H * r.range(0.6, 1.08);
      const out = V(Math.cos(a), 0, Math.sin(a));
      const lean = r.range(0.12, 0.42) * (0.4 + rr / R);
      const pts = [];
      for (let s = 0; s <= 10; s++) {
        const t = s / 10;
        const off = lean * h * t * t * 0.9;
        pts.push(V(bx + out.x * off, h * t * (1 - lean * t * t * 0.35), bz + out.z * off));
      }
      const rad = r.range(0.035, 0.06);
      culms.push(HT.taperTube(pts, pts.map((_, k) => rad * (1 - k / 10 * 0.75)), 6));
      for (let s = 4; s <= 10; s++) {
        const p = pts[s];
        const cnt = s >= 9 ? 3 : 1 + (r() < 0.6 ? 1 : 0);
        for (let c = 0; c < cnt; c++) lc.push({ p: p.clone().add(V(out.x * r.range(0.2, 0.9), r.range(-0.6, 0.2), out.z * r.range(0.2, 0.9))), s: r.range(1.1, 1.8), a: r() * 6.283, tilt: r.range(-0.5, 0.5), cell: r.int(0, 3) });
      }
    }
    return { culms, lc, center: V(0, H * 0.7, 0) };
  }
  N.bamboo = function (ctx, list, o) {
    o = o || {};
    const nV = 3;
    const key = 'b|' + (o.n || 34) + '|' + (o.h || 11) + '|' + (o.r || 1.1);
    let vars = bambooCache.get(key);
    if (!vars) {
      vars = [];
      for (let v = 0; v < nV; v++) {
        const bv = bambooVariant(700 + v * 13, o);
        const culm = T.BufferGeometryUtils.mergeGeometries(bv.culms, false); culm.userData.shared = true;
        const leaf = cardsGeo(bv.lc, bv.center, false); leaf.userData.shared = true;
        vars.push({ culm, leaf });
      }
      bambooCache.set(key, vars);
    }
    let mats = treeMatCache.get('bamboo');
    if (!mats) {
      const ct = N.culmTex().clone(); ct.userData.shared = true; ct.repeat.set(1 / 0.2, 1 / 0.38); ct.needsUpdate = true;
      const culm = new T.MeshStandardMaterial({ map: ct, roughness: 0.45, envMapIntensity: 1 }); culm.userData.shared = true;
      N.wind(culm, 0.0035, 1.0, 1.9);
      const lt = N.leafAtlas('bamboo'); lt.premultiplyAlpha = true;
      const leaf = N.foliageMat(lt, { amp: 0.0035, freq: 1.0, pw: 1.9, flutter: 0.03, trans: 0.5 }); leaf.userData.shared = true;
      mats = { culm, leaf }; treeMatCache.set('bamboo', mats);
    }
    const r = HT.rng(o.seed || 21);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), p = new T.Vector3();
    const groups = vars.map(() => []);
    list.forEach((t, i) => groups[i % nV].push(t));
    const out = [];
    groups.forEach((g, vi) => {
      if (!g.length) return;
      const a = new T.InstancedMesh(vars[vi].culm, mats.culm, g.length), b = new T.InstancedMesh(vars[vi].leaf, mats.leaf, g.length);
      g.forEach((t, i) => {
        const sc = t.s || r.range(0.85, 1.15);
        q.setFromAxisAngle(new T.Vector3(0, 1, 0), r() * 6.283);
        p.set(t.x, t.y != null ? t.y : ctx.height(t.x, t.z) - 0.05, t.z); s.set(sc, sc * r.range(0.9, 1.1), sc);
        m4.compose(p, q, s); a.setMatrixAt(i, m4); b.setMatrixAt(i, m4);
        if (o.collide !== false) ctx.colCircle(t.x, t.z, (o.r || 1.1) * sc * 0.9);
      });
      for (const im of [a, b]) { im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = farShadow(o); im.receiveShadow = true; if (!farShadow(o)) im.userData.noAO = true; ctx.add(im); out.push(im); }
      b.userData.noAO = true;
    });
    return out;
  };

  /* ======================================================== CHUỐI ======================================================== */
  N.bananaTex = function () {
    return HT.canvasTex('banana_leaf', 256, 1024, (g, W, H) => {
      const r = HT.rng(17);
      const cx = W / 2;
      g.beginPath();
      g.moveTo(cx, H);
      g.bezierCurveTo(W * 0.02, H * 0.85, W * 0.0, H * 0.15, cx, 4);
      g.bezierCurveTo(W, H * 0.15, W * 0.98, H * 0.85, cx, H);
      g.closePath();
      const gr = g.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(0, '#46731f'); gr.addColorStop(0.48, '#78a33a'); gr.addColorStop(0.52, '#6d9834'); gr.addColorStop(1, '#3e6a1c');
      g.fillStyle = gr; g.fill();
      g.save(); g.clip();
      for (let y = 20; y < H; y += 5) { g.strokeStyle = `rgba(30,60,10,${r.range(0.08, 0.18)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, y); g.lineTo(0, y - 60); g.moveTo(cx, y); g.lineTo(W, y - 60); g.stroke(); }
      /* rách lá theo gân */
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 18; i++) { const y = r.range(60, H - 60); const sd = r.sign(); g.lineWidth = r.range(2, 5); g.beginPath(); g.moveTo(cx + sd * r.range(20, 50), y); g.lineTo(cx + sd * W, y - 64); g.stroke(); }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(150,120,50,0.35)'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(r() < 0.5 ? r.range(4, 30) : r.range(W - 30, W - 4), r() * H, r.range(4, 12), 0, 6.283); g.fill(); }
      g.restore();
      g.strokeStyle = '#b9c77a'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx, H); g.lineTo(cx, 6); g.stroke();
    });
  };
  N.banana = function (ctx, list, o) {
    o = o || {};
    let vars = palmCache.get('banana');
    if (!vars) {
      vars = [];
      for (let v = 0; v < 3; v++) {
        const r = HT.rng(333 + v * 7);
        const V = (x, y, z) => new T.Vector3(x, y, z);
        const h = r.range(2.2, 3.2);
        const stem = [];
        for (let i = 0; i <= 5; i++) stem.push(V(0, h * i / 5, 0));
        const trunk = [HT.taperTube(stem, stem.map((_, i) => 0.13 - i * 0.012), 10)];
        const leaves = [], dead = [];
        const nL = r.int(7, 10);
        for (let i = 0; i < nL; i++) {
          const a = i * 2.39996 + r() * 0.3;
          const el = HT.lerp(1.2, 0.2, i / nL) + r.range(-0.1, 0.1);
          const f = frondGeo(r.range(1.7, 2.4), r.range(0.5, 0.65), r.range(0.4, 0.9), 0.15, 12, r.range(-0.8, 0.8));
          f.rotateZ(el); f.rotateY(-a); f.translate(0, h - 0.1, 0);
          leaves.push(f);
        }
        for (let i = 0; i < 3; i++) { const f = frondGeo(1.4, 0.35, 1.8, 0.4, 8, 0.6); f.rotateZ(-1.2); f.rotateY(-(r() * 6.283)); f.translate(0, h * r.range(0.55, 0.85), 0); dead.push(f); }
        const M = (arr) => { const g = T.BufferGeometryUtils.mergeGeometries(arr.map((x) => (x.index ? x.toNonIndexed() : x)), false); g.userData.shared = true; return g; };
        vars.push({ trunk: M(trunk), leaf: M(leaves), dead: M(dead) });
      }
      palmCache.set('banana', vars);
    }
    let mats = treeMatCache.get('banana');
    if (!mats) {
      const lt = N.bananaTex(); lt.premultiplyAlpha = true;
      const trunk = HT.solid(0x6f7a3e, { rough: 0.7 });
      const leaf = N.foliageMat(lt, { amp: 0.012, freq: 1.1, pw: 1.5, flutter: 0.04, trans: 0.55 });
      const dead = N.foliageMat(lt, { wind: false, color: 0x8b6a3a, trans: 0.2 });
      leaf.userData.shared = dead.userData.shared = true;
      mats = { trunk, leaf, dead }; treeMatCache.set('banana', mats);
    }
    const r = HT.rng(o.seed || 4);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), p = new T.Vector3();
    const groups = [[], [], []]; list.forEach((t, i) => groups[i % 3].push(t));
    groups.forEach((g, vi) => {
      if (!g.length) return;
      const V = vars[vi];
      const ims = [[V.trunk, mats.trunk], [V.leaf, mats.leaf], [V.dead, mats.dead]].map(([a, b]) => new T.InstancedMesh(a, b, g.length));
      g.forEach((t, i) => {
        const sc = t.s || r.range(0.8, 1.15);
        q.setFromAxisAngle(new T.Vector3(0, 1, 0), r() * 6.283);
        p.set(t.x, t.y != null ? t.y : ctx.height(t.x, t.z) - 0.05, t.z); s.set(sc, sc, sc);
        m4.compose(p, q, s); ims.forEach((im) => im.setMatrixAt(i, m4));
        if (o.collide !== false) ctx.colCircle(t.x, t.z, 0.25);
      });
      ims.forEach((im, k) => { im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = farShadow(o); im.receiveShadow = true; if (k || !farShadow(o)) im.userData.noAO = true; ctx.add(im); });
    });
  };

  /* ======================================================== RUỘNG LÚA, SEN ======================================================== */
  /* ô ruộng: nước bùn + khóm lúa theo hàng; o.stage 'young' | 'green' | 'ripe' */
  N.riceTex = function (stage) {
    return HT.canvasTex('ricecanopy_' + stage, 512, 512, (g, W, H) => {
      const r = HT.rng(stage.length * 13);
      const base = stage === 'ripe' ? [150, 128, 52] : stage === 'young' ? [92, 140, 50] : [78, 118, 40];
      g.fillStyle = `rgb(${base[0] * 0.55},${base[1] * 0.55},${base[2] * 0.55})`; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 9000; i++) {
        const x = r() * W, y = r() * H, L = r.range(6, 22), a = r.range(-0.9, 0.9) + Math.PI / 2, k = r.range(0.6, 1.25);
        g.strokeStyle = `rgba(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0},0.9)`; g.lineWidth = r.range(1, 2.2);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
      }
    });
  };
  N.paddy = function (ctx, o) {
    const [x0, z0, x1, z1] = o.rect;
    const y = o.y;
    const kind = o.stage === 'young' ? 'riceY' : o.stage === 'ripe' ? 'riceR' : 'rice';
    if (o.lod === 'far') {
      /* ruộng xa: mặt tán lúa phẳng + mép đứng, rẻ hơn hàng vạn khóm lúa */
      const hh = o.stage === 'young' ? 0.3 : o.stage === 'ripe' ? 0.8 : 0.65;
      const t = N.riceTex(o.stage || 'green').clone(); t.userData.shared = false; t.repeat.set((x1 - x0) / 3, (z1 - z0) / 3); t.needsUpdate = true;
      const m = new T.MeshStandardMaterial({ map: t, roughness: 0.9, envMapIntensity: 0.7 });
      const B = new HT.Builder(ctx);
      const top = new T.PlaneGeometry(x1 - x0 - 0.6, z1 - z0 - 0.6); top.rotateX(-Math.PI / 2);
      B.add(m, top, { x: (x0 + x1) / 2, y: y + hh, z: (z0 + z1) / 2, uv: 'keep', noShadow: true });
      for (const [ax, az, bx, bz] of [[x0 + 0.3, z0 + 0.3, x1 - 0.3, z0 + 0.3], [x1 - 0.3, z0 + 0.3, x1 - 0.3, z1 - 0.3], [x1 - 0.3, z1 - 0.3, x0 + 0.3, z1 - 0.3], [x0 + 0.3, z1 - 0.3, x0 + 0.3, z0 + 0.3]]) {
        const L = Math.hypot(bx - ax, bz - az); const g = new T.PlaneGeometry(L, hh); HT.scaleUV(g, L / 3, hh / 3);
        B.add(m, g, { x: (ax + bx) / 2, y: y + hh / 2, z: (az + bz) / 2, ry: Math.atan2(-(bz - az), bx - ax) + Math.PI, uv: 'keep', noShadow: true });
      }
      B.build(ctx.root, { shadow: false });
      return null;
    }
    if (o.water !== false) {
      const wm = HT.solid(0x3b3a26, { rough: 0.06, env: 1.1, physical: true, phys: { clearcoat: 1, clearcoatRoughness: 0.08 } });
      const g = new T.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2);
      const m = new T.Mesh(g, wm); m.position.set((x0 + x1) / 2, y + 0.02, (z0 + z1) / 2); m.receiveShadow = true; m.userData.noAO = true;
      ctx.add(m);
    }
    if (o.lod === 'water') return null;
    const geo = N.tuftGeo(kind);
    const mat = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.8, envMapIntensity: 0.8 });
    N.wind(mat, 0.09, 1.3, 2.0);
    const sx = o.sx || 0.26, sz = o.sz || 0.2;
    const r = HT.rng(o.seed || 3);
    const pts = [];
    const dens = Math.min(1, HT.q.grass * 1.1);
    for (let z = z0 + 0.3; z < z1 - 0.3; z += sz) for (let x = x0 + 0.3; x < x1 - 0.3; x += sx) { if (r() <= dens) pts.push([x + r.range(-0.03, 0.03), z + r.range(-0.03, 0.03)]); }
    const im = new T.InstancedMesh(geo, mat, pts.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), p = new T.Vector3(), c = new T.Color();
    pts.forEach(([x, z], i) => {
      const sc = r.range(0.85, 1.12);
      q.setFromAxisAngle(new T.Vector3(0, 1, 0), r() * 6.283); p.set(x, y, z); s.set(sc, sc, sc);
      m4.compose(p, q, s); im.setMatrixAt(i, m4);
      const v = r.range(0.9, 1.08); c.setRGB(v, v, v * r.range(0.9, 1.05)); im.setColorAt(i, c);
    });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere();
    im.receiveShadow = true; im.userData.noAO = true; im.userData.noMap = true;
    im.layers.set(1);
    ctx.add(im);
    return im;
  };
  /* bờ ruộng đắp đất */
  N.bund = function (B, mat, x0, z0, x1, z1, y, w, h) {
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
    const g = new T.CylinderGeometry(w * 0.35, w * 0.5, h, 6, 1, false);
    g.rotateZ(Math.PI / 2); g.scale(L / h, 1, 1);
    B.add(mat, g, { x: (x0 + x1) / 2, y: y + h * 0.3, z: (z0 + z1) / 2, ry: -Math.atan2(dz, dx) });
  };
  N.lotusTex = function () {
    return HT.canvasTex('lotus_pad', 512, 512, (g, W, H) => {
      const r = HT.rng(5); const cx = W / 2, cy = H / 2;
      const gr = g.createRadialGradient(cx, cy, 10, cx, cy, W / 2);
      gr.addColorStop(0, '#7aa04a'); gr.addColorStop(0.6, '#4e7e2c'); gr.addColorStop(1, '#3b6522');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, W / 2 - 2, 0, 6.283); g.fill();
      g.strokeStyle = 'rgba(190,210,140,0.45)'; g.lineWidth = 2;
      for (let i = 0; i < 22; i++) { const a = (i / 22) * 6.283; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * W * 0.48, cy + Math.sin(a) * H * 0.48); g.stroke(); }
      for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '30,60,20' : '160,190,110'},0.08)`; g.beginPath(); g.arc(r() * W, r() * H, r() * 6, 0, 6.283); g.fill(); }
    });
  };
  N.lotus = function (ctx, o) {
    const r = HT.rng(o.seed || 8);
    const B = new HT.Builder(ctx);
    const pad = HT.canvasMat('lotus_pad', N.lotusTex(), { rough: 0.45, side: T.DoubleSide });
    const stem = HT.solid(0x5f7a34, { rough: 0.6 });
    const petal = HT.solid(0xe89ab4, { rough: 0.5, side: T.DoubleSide });
    const petalW = HT.solid(0xf6e6ea, { rough: 0.5, side: T.DoubleSide });
    const pod = HT.solid(0xc8c060, { rough: 0.6 });
    const n = o.n || 40;
    for (let i = 0; i < n; i++) {
      let x, z, tries = 0;
      do { x = r.range(o.rect[0], o.rect[2]); z = r.range(o.rect[1], o.rect[3]); tries++; } while (o.poly && !HT.inPoly(x, z, o.poly) && tries < 20);
      const R = r.range(0.25, 0.45);
      const raised = r() < 0.45;
      const yy = o.y + (raised ? r.range(0.3, 1.0) : 0.015);
      const g = new T.CircleGeometry(R, 20);
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) { const d = Math.hypot(p.getX(k), p.getY(k)) / R; p.setZ(k, raised ? d * d * R * 0.45 : d * 0.01); }
      g.computeVertexNormals();
      const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k), uv.getY(k));
      B.add(pad, g, { x, y: yy, z, rx: -Math.PI / 2 + (raised ? r.range(-0.3, 0.3) : 0), rz: r() * 6.28, uv: 'keep' });
      if (raised) B.beam(stem, x, o.y - 0.1, z, x, yy, z, 0.012, 0.012, { round: true, seg: 5, noShadow: true });
      if (r() < (o.flowers || 0.25)) {
        const fx = x + r.range(-0.3, 0.3), fz = z + r.range(-0.3, 0.3), fy = o.y + r.range(0.5, 1.1);
        B.beam(stem, fx, o.y - 0.1, fz, fx, fy, fz, 0.011, 0.011, { round: true, seg: 5, noShadow: true });
        const pm = r() < 0.8 ? petal : petalW;
        const np = 10;
        for (let k = 0; k < np; k++) {
          const a = (k / np) * 6.283; const outer = k % 2;
          const pg = new T.SphereGeometry(0.07, 8, 6, 0, Math.PI); pg.scale(0.6, 1.9, 0.35);
          pg.rotateX(-0.3 - outer * 0.35); pg.translate(0, 0.1, 0.03); pg.rotateY(a);
          B.add(pm, pg, { x: fx, y: fy, z: fz, uv: 'keep', noShadow: true });
        }
        B.cyl(pod, 0.035, 0.025, 0.04, fx, fy + 0.08, fz, 10, { noShadow: true });
      }
    }
    for (const m of B.build(ctx.root, { shadow: false })) m.layers.set(1);
  };

  /* ======================================================== ĐÁ, NÚI ĐÁ VÔI ======================================================== */
  /* khối đá tảng biến dạng bằng nhiễu */
  N.rockGeo = function (seed, sx, sy, sz, detail) {
    const g = new T.IcosahedronGeometry(1, detail || 3);
    const p = g.attributes.position; const r = HT.rng(seed); const o = [r() * 100, r() * 100, r() * 100];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = HT.noise(x * 1.6 + o[0], y * 1.6 + o[1], z * 1.6 + o[2]) * 0.35 + HT.noise(x * 4 + o[1], y * 4 + o[2], z * 4 + o[0]) * 0.1;
      const k = 1 + n; let yy = y * k; if (yy < -0.35) yy = -0.35 + (yy + 0.35) * 0.2;
      p.setXYZ(i, x * k * sx, yy * sy, z * k * sz);
    }
    g.computeVertexNormals();
    return g;
  };
  N.rocks = function (ctx, list, mat) {
    const B = new HT.Builder(ctx);
    const m = mat || HT.mat('mossy_rock', { tile: 2.5, color: 0xdcdcd4 });
    list.forEach((k, i) => {
      const g = N.rockGeo(k.seed || i * 13 + 1, k.sx || k.s || 1, k.sy || (k.s || 1) * 0.7, k.sz || k.s || 1, k.detail);
      B.add(m, g, { x: k.x, y: k.y != null ? k.y : ctx.height(k.x, k.z), z: k.z, ry: k.ry || 0 });
      if (k.col !== false) ctx.colCircle(k.x, k.z, Math.max(k.sx || k.s || 1, k.sz || k.s || 1) * 0.85);
    });
    return B.build(ctx.root);
  };
  /* núi đá vôi dạng tháp: thành dốc đứng, đỉnh tròn, phủ xanh ở chỗ thoải */
  N.karst = function (ctx, list, o) {
    o = o || {};
    const mat = HT.mat(o.slug || 'marble_cliff_03', { tile: o.tile || 6, color: o.color != null ? o.color : 0xa8c4ff, ns: 1.2 }).clone();
    mat.vertexColors = true; mat.userData.shared = false;
    /* thảm cây trên vách: pha màu lá theo thuộc tính 'veg' (không nhân với ảnh đá để khỏi bị tối) */
    const gHex = o.greenHex != null ? o.greenHex : 0x4e6e38;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uGreen = { value: new T.Color(gHex) };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float veg; varying float vVeg;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n vVeg = veg;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uGreen; varying float vVeg;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n { float l = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); vec3 gcol = uGreen * (0.45 + 2.2 * l); diffuseColor.rgb = mix(diffuseColor.rgb, gcol, clamp(vVeg, 0.0, 1.0)); }');
    };
    mat.customProgramCacheKey = () => 'karstVeg';
    const out = [];
    for (const k of list) {
      const seg = k.seg || 48, rings = k.rings || 28;
      const g = new T.CylinderGeometry(1, 1, 1, seg, rings, false);
      g.translate(0, 0.5, 0);
      const p = g.attributes.position; const col = new Float32Array(p.count * 3);
      const r = HT.rng(k.seed || 1); const off = [r() * 50, r() * 50];
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const a = Math.atan2(z, x);
        let prof = y < 0.75 ? 1 - Math.pow(y / 0.75, 3) * 0.25 : 0.75 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 0.75) / 0.25, 2)));
        if (y >= 0.999) prof = 0;
        const jag = o.jag != null ? o.jag : 0.08;
        let n = HT.fbm(Math.cos(a) * 1.3 + off[0], y * 3 + Math.sin(a) * 1.3 + off[1], 4) * 0.55 + HT.noise(Math.cos(a) * 6, y * 12, off[0]) * jag;
        /* gờ đá dựng đứng (vách karst bị nước mưa xẻ rãnh) */
        if (o.ridges) n += (Math.abs(HT.noise(Math.cos(a) * 11 + off[1], Math.sin(a) * 11, y * 2.5 + off[0])) - 0.3) * o.ridges;
        const rr = prof * (1 + n) * (1 + 0.25 * (1 - y));
        const ly = y + HT.noise(Math.cos(a) * 2 + off[1], Math.sin(a) * 2, 3.1) * 0.05 * (y > 0.02 ? 1 : 0);
        p.setXYZ(i, Math.cos(a) * rr * k.r, Math.max(-0.05, ly) * k.h, Math.sin(a) * rr * k.r);
      }
      g.computeVertexNormals();
      const nr = g.attributes.normal; const vegA = new Float32Array(p.count);
      for (let i = 0; i < p.count; i++) {
        const ny = nr.getY(i); const y = p.getY(i) / k.h;
        const vb = o.vegBias || 0;
        const px = p.getX(i), py = p.getY(i), pz = p.getZ(i);
        let veg = HT.smooth(0.15 - vb, 0.55 - vb, ny + HT.noise(px * 0.08, pz * 0.08, 1.7) * 0.35);
        /* mảng cây bám trên vách (không phụ thuộc độ dốc) */
        if (o.patch) veg = Math.max(veg, o.patch * HT.smooth(0.05, 0.45, HT.noise(px * 0.035, py * 0.05, pz * 0.035 + 4.2)));
        veg = HT.clamp(veg * (o.veg != null ? o.veg : 1), 0, 1);
        const rc = o.rock || [1, 1, 0.98];
        /* vệt nước mưa chảy dọc vách: sẫm theo dải đứng */
        const st = o.streak ? 1 - o.streak * HT.smooth(-0.1, 0.5, HT.noise(Math.atan2(pz, px) * 9 + off[0], y * 1.2, 7.7)) : 1;
        const tint = 0.9 + 0.2 * HT.noise(px * 0.02, py * 0.02, pz * 0.02);
        for (let c = 0; c < 3; c++) col[i * 3 + c] = rc[c] * st * tint;
        vegA[i] = veg * (0.85 + 0.3 * HT.noise(px * 0.2, py * 0.2, pz * 0.2));
        if (y < 0.03) { col[i * 3] *= 0.8; col[i * 3 + 1] *= 0.85; col[i * 3 + 2] *= 0.8; }
      }
      g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setAttribute('veg', new T.BufferAttribute(vegA, 1));
      HT.scaleUV(g, k.r * 6.28, k.h);
      const m = new T.Mesh(g, mat);
      m.position.set(k.x, k.y != null ? k.y : ctx.height(k.x, k.z) - 2, k.z);
      m.rotation.y = r() * 6.28;
      m.castShadow = k.shadow !== false; m.receiveShadow = true;
      ctx.add(m); out.push(m);
      if (k.col) ctx.colCircle(k.x, k.z, k.r * 0.95);
    }
    return out;
  };


  /* ======================================================== HÀNG RÀO CÂY XANH (chè tàu, dâm bụt) ======================================================== */
  N.hedge = function (ctx, pts, o) {
    o = o || {};
    const h = o.h || 1.3, w = o.w || 0.8, kind = o.kind || 'hedge';
    const r = HT.rng(o.seed || 12);
    const cards = [];
    const V = (x, y, z) => new T.Vector3(x, y, z);
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L * (o.dens || 7));
      for (let k = 0; k < n; k++) {
        const t = r(); const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        const nx = -(bz - az) / L, nz = (bx - ax) / L; const off = r.range(-w / 2, w / 2);
        const y = ctx.height(x, z) + r.range(0.15, h);
        cards.push({ p: V(x + nx * off, y, z + nz * off), s: r.range(0.55, 0.9), a: r() * 6.283, tilt: r.range(-0.6, 0.6), cell: r.int(0, 3) });
      }
      if (o.col !== false) ctx.colSeg(ax, az, bx, bz, w, -5, 50);
    }
    /* pháp tuyến: hướng ra khỏi trục hàng rào + lên trên */
    const g = cardsGeoLine(cards, pts, h, ctx);
    const t = N.leafAtlas(kind); t.premultiplyAlpha = true;
    const m = N.foliageMat(t, { amp: 0.004, pw: 1.2, trans: o.trans != null ? o.trans : 0.3, flutter: 0.01, color: o.color });
    const mesh = new T.Mesh(g, m); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.noAO = true;
    ctx.add(mesh);
    return mesh;
  };
  function cardsGeoLine(cards, pts, h, ctx) {
    const g = cardsGeo(cards, new T.Vector3(0, -1e5, 0), false);
    const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      let best = 1e9, bx = 0, bz = 0;
      for (let k = 0; k < pts.length - 1; k++) {
        const [ax, az] = pts[k], [cx, cz] = pts[k + 1]; const dx = cx - ax, dz = cz - az; const L2 = dx * dx + dz * dz;
        let t = ((x - ax) * dx + (z - az) * dz) / L2; t = Math.max(0, Math.min(1, t));
        const qx = ax + dx * t, qz = az + dz * t; const d = (x - qx) ** 2 + (z - qz) ** 2; if (d < best) { best = d; bx = qx; bz = qz; }
      }
      const gy = ctx.height(bx, bz) + h * 0.45;
      const v = new T.Vector3(x - bx, (y - gy) * 1.2 + 0.4, z - bz).normalize();
      n.setXYZ(i, v.x, v.y, v.z);
    }
    return g;
  }
  /* ======================================================== RẢI ĐIỂM ======================================================== */
  /* rải điểm cách nhau tối thiểu d trong vùng rect, lọc qua ok(x,z) */
  N.scatter = function (seed, rect, n, d, ok) {
    const r = HT.rng(seed); const pts = []; let tries = 0;
    while (pts.length < n && tries < n * 40) {
      tries++;
      const x = r.range(rect[0], rect[2]), z = r.range(rect[1], rect[3]);
      if (ok && !ok(x, z)) continue;
      let good = true; for (const p of pts) if ((p.x - x) ** 2 + (p.z - z) ** 2 < d * d) { good = false; break; }
      if (good) pts.push({ x, z });
    }
    return pts;
  };
  /* rải dọc đường gấp khúc */
  N.along = function (seed, pts, step, jitter, side) {
    const r = HT.rng(seed); const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; const L = Math.hypot(bx - ax, bz - az);
      const nx = -(bz - az) / L, nz = (bx - ax) / L;
      for (let t = 0; t < L; t += step) {
        const k = t / L; const off = (side || 0) + r.range(-jitter, jitter);
        out.push({ x: ax + (bx - ax) * k + nx * off, z: az + (bz - az) * k + nz * off });
      }
    }
    return out;
  };
})();
