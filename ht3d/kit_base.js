/* BẢO TÀNG HÀNH TRÌNH — bộ công cụ nền: vật liệu PBR, ảnh vẽ bằng canvas, bộ gộp hình học.
   Mọi kích thước tính bằng MÉT. Trục Y hướng lên. Ảnh vật liệu: ht3d/tex/<slug>/<slug>_{diff,nor,rough}.jpg
   (Poly Haven, CC0). Hình học dựng xong được GỘP theo vật liệu để giảm số lần vẽ. */
(function () {
  'use strict';
  const T = THREE;
  const HT = (window.HT = window.HT || {});
  HT.halls = HT.halls || {};
  HT.q = HT.q || { level: 2, grass: 1, shadow: 4096, trees: 1 };

  /* ---------------- số ngẫu nhiên có hạt giống ---------------- */
  HT.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    const r = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.range = (lo, hi) => lo + (hi - lo) * r();
    r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * r());
    r.pick = (arr) => arr[Math.floor(r() * arr.length) % arr.length];
    r.sign = () => (r() < 0.5 ? -1 : 1);
    r.gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += r(); return (s - 2) / 0.58; };
    return r;
  };
  const noise3 = new T.ImprovedNoise();
  HT.noise = (x, y, z) => noise3.noise(x, y, z || 0);
  HT.fbm = function (x, z, oct, lac, gain) {
    oct = oct || 4; lac = lac || 2; gain = gain || 0.5;
    let a = 1, f = 1, s = 0, n = 0;
    for (let i = 0; i < oct; i++) { s += a * noise3.noise(x * f, z * f, 0.37 * i); n += a; a *= gain; f *= lac; }
    return s / n;
  };
  HT.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  HT.smooth = (a, b, v) => { const t = HT.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  HT.lerp = (a, b, t) => a + (b - a) * t;

  /* khoảng cách từ điểm tới đường gấp khúc [[x,z],...] */
  HT.distPoly = function (x, z, pts) {
    let best = 1e9;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1];
      const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1e-9;
      let t = ((x - ax) * dx + (z - az) * dz) / L; t = Math.max(0, Math.min(1, t));
      const px = ax + t * dx - x, pz = az + t * dz - z;
      best = Math.min(best, Math.sqrt(px * px + pz * pz));
    }
    return best;
  };
  HT.inPoly = function (x, z, pts) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], zi = pts[i][1], xj = pts[j][0], zj = pts[j][1];
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
    }
    return c;
  };

  /* ---------------- theo dõi tải ---------------- */
  HT.pending = new Set();
  HT.track = function (p) { HT.pending.add(p); p.finally(() => HT.pending.delete(p)); return p; };
  HT.whenLoaded = async function () { while (HT.pending.size) await Promise.allSettled([...HT.pending]); };

  /* ---------------- ảnh ---------------- */
  const texLoader = new T.TextureLoader();
  const baseTex = new Map();     // url -> Texture (ảnh gốc, dùng chung nguồn)
  const varTex = new Map();      // url|rx|ry|srgb -> Texture
  HT.maxAniso = 8;
  HT.texBase = function (url, srgb) {
    const k = url + '|' + (srgb ? 1 : 0);
    if (baseTex.has(k)) return baseTex.get(k);
    const t = new T.Texture();
    t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = HT.maxAniso;
    t.userData.shared = true;
    const p = new Promise((res) => {
      texLoader.load(url, (img) => { t.image = img.image; t.needsUpdate = true; t.userData.ok = true; res(t); },
        undefined, () => { t.userData.fail = true; console.warn('Khong tai duoc anh', url); res(t); });
    });
    HT.track(p);
    t.userData.promise = p;
    baseTex.set(k, t);
    return t;
  };
  HT.tex = function (url, o) {
    o = o || {};
    const rx = o.rx || o.repeat || 1, ry = o.ry || o.repeat || 1;
    const k = url + '|' + rx.toFixed(4) + '|' + ry.toFixed(4) + '|' + (o.srgb ? 1 : 0) + '|' + (o.clamp ? 1 : 0) + '|' + (o.rot || 0);
    if (varTex.has(k)) return varTex.get(k);
    const b = HT.texBase(url, o.srgb);
    let t;
    if (rx === 1 && ry === 1 && !o.clamp && !o.rot) t = b;
    else {
      t = b.clone();
      t.userData = { shared: true };
      t.repeat.set(rx, ry);
      if (o.rot) t.rotation = o.rot;
      if (o.clamp) t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
      b.userData.promise.then(() => { t.needsUpdate = true; });
    }
    varTex.set(k, t);
    return t;
  };

  /* ---------------- vật liệu PBR ---------------- */
  const matCache = new Map();
  HT.TEXDIR = 'ht3d/tex/';
  /* slug: tên vật liệu Poly Haven; o.tile = số mét cho một lần lặp ảnh (UV hình học tính bằng mét) */
  const MAT_BOOST = { fine_grained_wood: 3.0, lacquered_cherry_wood: 3.0, dark_wood: 2.0 };
  HT.mat = function (slug, o) {
    o = o || {};
    const key = 'pbr|' + slug + '|' + JSON.stringify(o);
    if (matCache.has(key)) return matCache.get(key);
    const tile = o.tile || 2;
    const rx = 1 / (o.tileX || tile), ry = 1 / (o.tileY || tile);
    const base = HT.TEXDIR + slug + '/' + slug;
    const m = new T.MeshStandardMaterial({
      map: HT.tex(base + '_diff.jpg', { rx, ry, srgb: true, rot: o.rot }),
      normalMap: o.noNormal ? null : HT.tex(base + '_nor.jpg', { rx, ry, rot: o.rot }),
      roughnessMap: o.noRough ? null : HT.tex(base + '_rough.jpg', { rx, ry, rot: o.rot }),
      roughness: o.rough != null ? o.rough : 1,
      metalness: o.metal || 0,
      color: new T.Color(o.color != null ? o.color : 0xffffff),
      side: o.side || T.FrontSide,
      envMapIntensity: o.env != null ? o.env : 1,
    });
    if (m.normalMap) { const ns = o.ns != null ? o.ns : 1; m.normalScale.set(ns, ns); }
    if (o.emissive) { m.emissive = new T.Color(o.emissive); m.emissiveIntensity = o.ei || 1; }
    /* vài ảnh gỗ gốc rất tối (óc chó, anh đào sơn mài): nâng độ sáng để màu pha (color) cho ra gỗ nâu thật thay vì gần đen */
    const bst = o.boost != null ? o.boost : (MAT_BOOST[slug] || 1);
    if (bst !== 1) m.color.multiplyScalar(bst);
    m.name = slug;
    m.userData.shared = true;
    matCache.set(key, m);
    return m;
  };
  /* vật liệu màu trơn */
  HT.solid = function (color, o) {
    o = o || {};
    const key = 'solid|' + color + '|' + JSON.stringify(o);
    if (matCache.has(key)) return matCache.get(key);
    const P = o.physical ? T.MeshPhysicalMaterial : T.MeshStandardMaterial;
    const m = new P({
      color: new T.Color(color), roughness: o.rough != null ? o.rough : 0.8, metalness: o.metal || 0,
      side: o.side || T.FrontSide, envMapIntensity: o.env != null ? o.env : 1,
      transparent: !!o.transparent, opacity: o.opacity != null ? o.opacity : 1,
    });
    if (o.emissive) { m.emissive = new T.Color(o.emissive); m.emissiveIntensity = o.ei || 1; }
    if (o.physical) Object.assign(m, o.phys || {});
    if (o.flat) m.flatShading = true;
    m.userData.shared = true;
    matCache.set(key, m);
    return m;
  };
  /* vật liệu dùng ảnh vẽ canvas */
  HT.canvasMat = function (key, tex, o) {
    o = o || {};
    const k = 'cmat|' + key + '|' + JSON.stringify(o);
    if (matCache.has(k)) return matCache.get(k);
    const m = new T.MeshStandardMaterial({
      map: tex, roughness: o.rough != null ? o.rough : 0.85, metalness: o.metal || 0,
      side: o.side || T.FrontSide, transparent: !!o.transparent, alphaTest: o.alphaTest || 0,
      envMapIntensity: o.env != null ? o.env : 1,
    });
    if (o.normalMap) { m.normalMap = o.normalMap; m.normalScale.set(o.ns || 1, o.ns || 1); }
    if (o.roughMap) m.roughnessMap = o.roughMap;
    if (o.emissive) { m.emissive = new T.Color(o.emissive); m.emissiveMap = o.emissiveMap || tex; m.emissiveIntensity = o.ei || 1; }
    if (o.a2c) m.alphaToCoverage = true;
    m.userData.shared = true;
    matCache.set(k, m);
    return m;
  };
  HT.glass = function (o) {
    o = o || {};
    return HT.solid(o.color || 0x1c2528, { rough: o.rough != null ? o.rough : 0.04, metal: 0.0, env: o.env != null ? o.env : 1.4,
      physical: true, phys: { clearcoat: 1, clearcoatRoughness: 0.02, reflectivity: 0.9, specularIntensity: 1 } });
  };

  /* ---------------- ảnh vẽ bằng canvas ---------------- */
  const cvCache = new Map();
  HT.canvas = function (w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  HT.canvasTex = function (key, w, h, draw, o) {
    o = o || {};
    if (cvCache.has(key)) return cvCache.get(key);
    const c = HT.canvas(w, h);
    const g = c.getContext('2d');
    draw(g, w, h, c);
    const t = new T.CanvasTexture(c);
    t.colorSpace = o.linear ? T.NoColorSpace : T.SRGBColorSpace;
    t.wrapS = t.wrapT = o.clamp ? T.ClampToEdgeWrapping : T.RepeatWrapping;
    t.anisotropy = HT.maxAniso;
    if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
    if (o.noMip) { t.generateMipmaps = false; t.minFilter = T.LinearFilter; }
    t.userData.shared = true;
    cvCache.set(key, t);
    return t;
  };
  /* biến ảnh xám (độ cao) thành ảnh pháp tuyến */
  HT.heightToNormal = function (key, src, strength) {
    return HT.canvasTex(key, src.width, src.height, (g, w, h) => {
      const sg = src.getContext('2d').getImageData(0, 0, w, h).data;
      const out = g.createImageData(w, h);
      const H = (x, y) => sg[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
        let nx = -dx, ny = dy, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
        const i = (y * w + x) * 4;
        out.data[i] = (nx * 0.5 + 0.5) * 255; out.data[i + 1] = (ny * 0.5 + 0.5) * 255; out.data[i + 2] = (nz * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
      }
      g.putImageData(out, 0, 0);
    }, { linear: true });
  };
  /* ĐÁ XẺ KHỐI (ashlar) vẽ bằng mã: mạch vữa thẳng, sắc; mỗi viên một sắc độ; vân đá cẩm thạch tuỳ chọn; có bản đồ pháp tuyến
     để mạch lõm bắt sáng. o: {color, joint, bw, bh (m), vein, speck, rough, rustic (viên gờ vát sâu cho tầng trệt)} */
  const ashCache = new Map();
  HT.ashlar = function (key, o) {
    o = o || {};
    const k = key + JSON.stringify(o);
    if (ashCache.has(k)) return ashCache.get(k);
    const bw = o.bw || 1.2, bh = o.bh || 0.45, cols = 4, rows = 8;
    const tw = cols * bw, th = rows * bh;
    const S = 1024, Wp = S, Hp = Math.round(S * th / tw / 4) * 4 || S;
    const base = new T.Color(o.color != null ? o.color : 0xe8e4dc);
    const jc = new T.Color(o.joint != null ? o.joint : 0x9a968e);
    const r = HT.rng(key.length * 17 + 5);
    const px = Wp / tw, py = Hp / th, jw = Math.max(2, Math.round((o.jointW || 0.012) * px)), bev = Math.round((o.rustic ? 0.05 : 0.012) * px);
    const hc = HT.canvas(Wp, Hp), hg = hc.getContext('2d');
    hg.fillStyle = '#000'; hg.fillRect(0, 0, Wp, Hp);
    const tex = HT.canvasTex('ashlar_' + k, Wp, Hp, (g) => {
      g.fillStyle = '#' + jc.getHexString(); g.fillRect(0, 0, Wp, Hp);
      for (let row = 0; row < rows; row++) {
        const off = row % 2 ? bw * 0.5 : 0;
        for (let c = -1; c <= cols; c++) {
          const x0 = Math.round((c * bw + off) * px), x1 = Math.round(((c + 1) * bw + off) * px);
          const y0 = Math.round(row * bh * py), y1 = Math.round((row + 1) * bh * py);
          const v = 1 + r.range(-0.07, 0.07) * (o.vary != null ? o.vary : 1);
          const col = base.clone().multiplyScalar(v);
          const gr = g.createLinearGradient(0, y0, 0, y1);
          gr.addColorStop(0, '#' + col.clone().multiplyScalar(1.03).getHexString()); gr.addColorStop(1, '#' + col.clone().multiplyScalar(0.96).getHexString());
          g.fillStyle = gr; g.fillRect(x0 + jw / 2, y0 + jw / 2, x1 - x0 - jw, y1 - y0 - jw);
          /* chiều cao: viên nổi, mép vát */
          for (let b = 0; b <= bev; b++) { const t = b / Math.max(1, bev); const l = Math.round(150 + 105 * t); hg.fillStyle = `rgb(${l},${l},${l})`; hg.fillRect(x0 + jw / 2 + b, y0 + jw / 2 + b, x1 - x0 - jw - 2 * b, y1 - y0 - jw - 2 * b); }
        }
      }
      /* lốm đốm hạt đá, vân cẩm thạch, vệt bẩn mưa */
      const sp = o.speck != null ? o.speck : 0.06;
      for (let i = 0; i < Wp * Hp * 0.02; i++) { const a = r.range(0, sp); g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 0.8})`; g.fillRect(r() * Wp, r() * Hp, r.range(1, 3), r.range(1, 3)); }
      if (o.vein) { g.lineWidth = 1.2; for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(90,90,96,${r.range(0.08, 0.22)})`; g.beginPath(); let x = r() * Wp, y = r() * Hp; g.moveTo(x, y); for (let k2 = 0; k2 < 8; k2++) { x += r.range(-40, 60); y += r.range(-18, 30); g.lineTo(x, y); } g.stroke(); } }
      if (o.dirt) { for (let i = 0; i < 40; i++) { const x = r() * Wp; const gr = g.createLinearGradient(0, 0, 0, Hp); gr.addColorStop(0, 'rgba(60,55,50,0)'); gr.addColorStop(1, `rgba(60,55,50,${r.range(0.03, 0.09)})`); g.fillStyle = gr; g.fillRect(x, 0, r.range(6, 30), Hp); } }
    });
    tex.repeat.set(1 / tw, 1 / th);
    const nrm = HT.heightToNormal('ashlarN_' + k, hc, o.rustic ? 5 : 3).clone();
    nrm.repeat.set(1 / tw, 1 / th); nrm.wrapS = nrm.wrapT = T.RepeatWrapping; nrm.anisotropy = HT.maxAniso; nrm.needsUpdate = true; nrm.userData.shared = true;
    const m = new T.MeshStandardMaterial({ map: tex, normalMap: nrm, roughness: o.rough != null ? o.rough : 0.62, envMapIntensity: o.env != null ? o.env : 0.9 });
    m.normalScale.set(1, 1);
    m.userData.shared = true;
    ashCache.set(k, m);
    return m;
  };
  /* ngắt dòng chữ */
  HT.wrapText = function (g, text, maxW) {
    const words = String(text).split(/\s+/); const lines = []; let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  HT.FONT_SERIF = "'Palatino Linotype','Book Antiqua',Palatino,'Times New Roman',serif";
  HT.FONT_SANS = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
  HT.FONT_HAN = "KaiTi,STKaiti,'BiauKai','Microsoft JhengHei','Microsoft YaHei',SimSun,serif";
  /* giấy cũ / vữa: nhiễu nhẹ lên canvas */
  HT.grain = function (g, w, h, amt, seed) {
    const r = HT.rng(seed || 7);
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(img, 0, 0);
  };

  /* ---------------- UV theo mét ---------------- */
  const _v = new T.Vector3(), _n = new T.Vector3(), _a = new T.Vector3(), _b = new T.Vector3(), _c = new T.Vector3();
  /* chiếu hộp theo từng tam giác (hình học không chỉ số), trong hệ quay yaw */
  HT.boxUV = function (geo, yaw, scale, offU, offV) {
    scale = scale || 1; offU = offU || 0; offV = offV || 0;
    const pos = geo.attributes.position; const n = pos.count;
    const uv = new Float32Array(n * 2);
    const cy = Math.cos(-(yaw || 0)), sy = Math.sin(-(yaw || 0));
    const rot = (v) => { const x = v.x * cy + v.z * sy; const z = -v.x * sy + v.z * cy; v.x = x; v.z = z; return v; };
    for (let i = 0; i < n; i += 3) {
      _a.fromBufferAttribute(pos, i); _b.fromBufferAttribute(pos, i + 1); _c.fromBufferAttribute(pos, i + 2);
      rot(_a); rot(_b); rot(_c);
      _n.subVectors(_c, _b).cross(_v.subVectors(_a, _b)).normalize();
      const ax = Math.abs(_n.x), ay = Math.abs(_n.y), az = Math.abs(_n.z);
      const P = [_a, _b, _c];
      for (let k = 0; k < 3; k++) {
        const p = P[k]; let u, v;
        if (ay >= ax && ay >= az) { u = p.x; v = p.z * (_n.y > 0 ? -1 : 1); }
        else if (ax >= az) { u = p.z * (_n.x > 0 ? -1 : 1); v = p.y; }
        else { u = p.x * (_n.z > 0 ? 1 : -1); v = p.y; }
        uv[(i + k) * 2] = u * scale + offU; uv[(i + k) * 2 + 1] = v * scale + offV;
      }
    }
    geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
    return geo;
  };
  /* co giãn UV sẵn có của hình học */
  HT.scaleUV = function (geo, su, sv) {
    const uv = geo.attributes.uv; if (!uv) return geo;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
    return geo;
  };

  /* ---------------- BỘ GỘP HÌNH HỌC ---------------- */
  const _m4 = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _s = new T.Vector3(), _p = new T.Vector3();
  class Builder {
    constructor(ctx) { this.ctx = ctx; this.parts = new Map(); this.count = 0; }
    _slot(mat, flags) {
      const k = mat.uuid + (flags || '');
      let s = this.parts.get(k);
      if (!s) { s = { mat, geos: [], flags: flags || '' }; this.parts.set(k, s); }
      return s;
    }
    /* o: {x,y,z, ry, rx, rz, sx,sy,sz | s, uv:'box'|'keep', us, vs (co UV khi keep), uvYaw, uvScale, noShadow, col:{...}} */
    add(mat, geo, o) {
      o = o || {};
      let g = geo.index ? geo.toNonIndexed() : geo.clone();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv' && k !== 'color') g.deleteAttribute(k);
      _e.set(o.rx || 0, o.ry || 0, o.rz || 0, o.order || 'YXZ');
      _q.setFromEuler(_e);
      const S = o.s != null ? o.s : 1;
      _s.set(o.sx != null ? o.sx : S, o.sy != null ? o.sy : S, o.sz != null ? o.sz : S);
      _p.set(o.x || 0, o.y || 0, o.z || 0);
      _m4.compose(_p, _q, _s);
      g.applyMatrix4(_m4);
      if (!g.attributes.normal) g.computeVertexNormals();
      const mode = o.uv || 'box';
      if (mode === 'box') HT.boxUV(g, o.uvYaw != null ? o.uvYaw : (o.ry || 0), o.uvScale || 1, o.offU, o.offV);
      else if (!g.attributes.uv) HT.boxUV(g, o.ry || 0, 1);
      else if (o.us || o.vs) HT.scaleUV(g, o.us || 1, o.vs || 1);
      if (!g.attributes.color && this._needsColor) { /* bỏ qua */ }
      const flags = (o.noShadow ? 'n' : '') + (o.noRecv ? 'r' : '') + (o.flags || '');
      this._slot(mat, flags).geos.push(g);
      this.count++;
      return g;
    }
    /* hộp: (x,z) là tâm đáy, y là cao độ đáy */
    box(mat, w, h, d, x, y, z, ry, o) {
      o = Object.assign({}, o || {}, { x, y: y + h / 2, z, ry: ry || 0 });
      this.add(mat, HT.geoBox(w, h, d, o.bevel), o);
      if (o.col && this.ctx) this.ctx.colBox(x, z, w, d, ry || 0, y, y + h);
      return this;
    }
    /* trụ tròn: y là đáy */
    cyl(mat, rTop, rBot, h, x, y, z, seg, o) {
      o = o || {};
      const g = new T.CylinderGeometry(rTop, rBot, h, seg || 12, o.hseg || 1, !!o.open);
      if (o.uv === 'keep' || o.cylUV !== false) { HT.scaleUV(g, Math.PI * (rTop + rBot), h); }
      /* trụ dựng đứng: y là cao độ đáy; trụ nằm ngang (có rx/rz): y là cao độ trục — tránh trục cuộn vải, trục máy chữ bị nâng lơ lửng */
      this.add(mat, g, Object.assign({}, o, { x, y: (o.rx || o.rz) ? y : y + h / 2, z, uv: o.uv || 'keep' }));
      if (o.col && this.ctx) this.ctx.colCircle(x, z, Math.max(rTop, rBot), y, y + h);
      return this;
    }
    /* thanh nối hai điểm (dầm, kèo, cọc nghiêng) — tiết diện vuông hoặc tròn */
    beam(mat, x0, y0, z0, x1, y1, z1, w, d, o) {
      o = o || {};
      const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0; const L = Math.hypot(dx, dy, dz);
      const g = o.round ? new T.CylinderGeometry(w / 2, (o.w1 || w) / 2, L, o.seg || 8, 1, false) : HT.geoBox(w, L, d || w);
      if (o.round) HT.scaleUV(g, Math.PI * w, L);
      g.translate(0, L / 2, 0);
      const dir = new T.Vector3(dx, dy, dz).normalize();
      const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
      if (o.twist) q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), o.twist));
      g.applyQuaternion(q); g.translate(x0, y0, z0);
      this.add(mat, g, { uv: o.round ? 'keep' : 'box', uvYaw: Math.atan2(dx, dz) + Math.PI / 2, noShadow: o.noShadow });
      return this;
    }
    /* dựng thành lưới: mỗi vật liệu một mesh */
    build(parent, o) {
      o = o || {};
      const out = [];
      for (const s of this.parts.values()) {
        if (!s.geos.length) continue;
        let hasColor = s.geos.some((g) => g.attributes.color);
        if (hasColor) for (const g of s.geos) if (!g.attributes.color) {
          const c = new Float32Array(g.attributes.position.count * 3).fill(1); g.setAttribute('color', new T.BufferAttribute(c, 3));
        }
        const merged = T.BufferGeometryUtils.mergeGeometries(s.geos, false);
        if (!merged) { console.warn('gop loi', s.mat.name); continue; }
        merged.computeBoundingSphere(); merged.computeBoundingBox();
        const mesh = new T.Mesh(merged, s.mat);
        mesh.castShadow = !s.flags.includes('n') && o.shadow !== false;
        mesh.receiveShadow = !s.flags.includes('r');
        if (o.name) mesh.name = o.name;
        if (o.userData) Object.assign(mesh.userData, o.userData);
        parent.add(mesh); out.push(mesh);
        for (const g of s.geos) g.dispose();
      }
      this.parts.clear();
      return out;
    }
  }
  HT.Builder = Builder;

  /* hộp có thể vát cạnh */
  HT.geoBox = function (w, h, d, bevel) {
    if (bevel) return new T.RoundedBoxGeometry(w, h, d, 2, Math.min(bevel, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
    return new T.BoxGeometry(w, h, d);
  };
  /* ống vuốt thon theo đường cong (thân cây, cành, cần câu...) — trả về BufferGeometry chỉ số
     pts: mảng Vector3, radii: mảng bán kính cùng độ dài; UV: u quanh chu vi (mét), v dọc (mét) */
  HT.taperTube = function (pts, radii, seg, closeEnd) {
    seg = seg || 8;
    const n = pts.length;
    const pos = [], nor = [], uv = [], idx = [];
    const T0 = new T.Vector3(), N0 = new T.Vector3(), B0 = new T.Vector3(), tmp = new T.Vector3();
    let len = 0;
    let prevN = null;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      if (i < n - 1) T0.subVectors(pts[i + 1], p); else T0.subVectors(p, pts[i - 1]);
      if (i > 0 && i < n - 1) T0.add(tmp.subVectors(p, pts[i - 1])).multiplyScalar(0.5);
      T0.normalize();
      if (!prevN) { N0.set(0, 1, 0); if (Math.abs(T0.dot(N0)) > 0.9) N0.set(1, 0, 0); N0.sub(tmp.copy(T0).multiplyScalar(N0.dot(T0))).normalize(); }
      else { N0.copy(prevN).sub(tmp.copy(T0).multiplyScalar(prevN.dot(T0))).normalize(); }
      prevN = N0.clone();
      B0.crossVectors(T0, N0).normalize();
      if (i > 0) len += p.distanceTo(pts[i - 1]);
      const r = radii[i];
      const circ = 2 * Math.PI * Math.max(r, 0.02);
      for (let k = 0; k <= seg; k++) {
        const a = (k / seg) * Math.PI * 2;
        const cx = Math.cos(a), sx = Math.sin(a);
        const nx = N0.x * cx + B0.x * sx, ny = N0.y * cx + B0.y * sx, nz = N0.z * cx + B0.z * sx;
        pos.push(p.x + nx * r, p.y + ny * r, p.z + nz * r);
        nor.push(nx, ny, nz);
        uv.push((k / seg) * circ, len);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) {
      const a = i * (seg + 1) + k, b = a + seg + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    if (closeEnd) {
      const c = pos.length / 3; const p = pts[n - 1];
      pos.push(p.x, p.y, p.z); nor.push(T0.x, T0.y, T0.z); uv.push(0, len);
      const base = (n - 1) * (seg + 1);
      for (let k = 0; k < seg; k++) idx.push(base + k, c, base + k + 1);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  };
  /* tấm phẳng từ 4 điểm (theo thứ tự ngược chiều kim đồng hồ khi nhìn từ phía mặt), UV theo mét */
  HT.quad = function (a, b, c, d, uvs) {
    const g = new T.BufferGeometry();
    const p = [a, b, c, a, c, d];
    const pos = new Float32Array(18);
    p.forEach((v, i) => { pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; });
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    if (uvs) {
      const u = [uvs[0], uvs[1], uvs[2], uvs[0], uvs[2], uvs[3]];
      const ua = new Float32Array(12); u.forEach((q, i) => { ua[i * 2] = q[0]; ua[i * 2 + 1] = q[1]; });
      g.setAttribute('uv', new T.BufferAttribute(ua, 2));
    }
    g.computeVertexNormals();
    return g;
  };
  /* lưới tam giác tự do: verts [[x,y,z]...], faces [[i,j,k]...], uvs [[u,v]...] */
  HT.mesh = function (verts, faces, uvs) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(verts.flat(), 3));
    if (uvs) g.setAttribute('uv', new T.Float32BufferAttribute(uvs.flat(), 2));
    g.setIndex(faces.flat());
    g.computeVertexNormals();
    return g;
  };
  /* khối đùn từ đa giác 2D (trong mặt XY), sâu theo Z */
  HT.extrude = function (pts2, depth, holes, o) {
    o = o || {};
    const s = new T.Shape(pts2.map((p) => new T.Vector2(p[0], p[1])));
    if (holes) for (const h of holes) s.holes.push(h instanceof T.Path ? h : new T.Path(h.map((p) => new T.Vector2(p[0], p[1]))));
    const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: !!o.bevel, bevelSize: o.bevel || 0, bevelThickness: o.bevel || 0, bevelSegments: 1, curveSegments: o.curve || 10, steps: 1 });
    return g;
  };
  /* đường tròn / vòm cho lỗ cửa */
  HT.archPath = function (cx, y0, w, springY, seg, pointed) {
    const P = new T.Path();
    const r = w / 2;
    P.moveTo(cx - r, y0); P.lineTo(cx + r, y0); P.lineTo(cx + r, springY);
    if (pointed) { P.quadraticCurveTo(cx + r, springY + r * 1.1, cx, springY + r * 1.35); P.quadraticCurveTo(cx - r, springY + r * 1.1, cx - r, springY); }
    else P.absarc(cx, springY, r, 0, Math.PI, false);
    P.lineTo(cx - r, y0);
    return P;
  };
  HT.rectPath = function (x0, y0, x1, y1) {
    const P = new T.Path(); P.moveTo(x0, y0); P.lineTo(x1, y0); P.lineTo(x1, y1); P.lineTo(x0, y1); P.lineTo(x0, y0); return P;
  };
  /* tiện (lathe) từ biên dạng [[r,y],...] */
  HT.lathe = function (prof, seg) {
    const g = new T.LatheGeometry(prof.map((p) => new T.Vector2(p[0], p[1])), seg || 24);
    let L = 0; for (let i = 1; i < prof.length; i++) L += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]);
    const rmax = Math.max(...prof.map((p) => p[0]));
    HT.scaleUV(g, 2 * Math.PI * rmax, L);
    return g;
  };

  /* ---------------- dọn bộ nhớ khi rời gian ---------------- */
  HT.disposeTree = function (obj) {
    obj.traverse((o) => {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) {
        if (m.userData && m.userData.shared) continue;
        for (const k of ['map', 'normalMap', 'roughnessMap', 'alphaMap', 'emissiveMap', 'aoMap']) if (m[k] && !(m[k].userData && m[k].userData.shared)) m[k].dispose();
        m.dispose();
      }
    });
  };
})();
