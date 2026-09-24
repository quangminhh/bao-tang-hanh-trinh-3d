/* BẢO TÀNG HÀNH TRÌNH — đồ vật: nạp mô hình CC0 (Poly Haven), đồ gia dụng Việt dựng bằng mã
   (phản gỗ, chiếu, án thư, bàn thờ, hoành phi, câu đối, khung cửi, chum, cối xay, cối giã, cây rơm, võng,
   giếng gạch, bảng đen, bàn học, cờ bay, băng khẩu hiệu, đèn đường, xe đạp, máy chữ). */
(function () {
  'use strict';
  const T = THREE;
  const HT = window.HT;
  const P = (HT.props = {});
  const A = () => HT.arch;

  /* ======================================================== MÔ HÌNH glTF ======================================================== */
  const loader = new T.GLTFLoader();
  const mcache = new Map();
  HT.modelUrl = (slug) => 'models_cc0/' + slug + '/' + slug + '_1k.gltf';
  function loadModel(slug) {
    if (mcache.has(slug)) return mcache.get(slug);
    const p = new Promise((res) => {
      loader.load(HT.modelUrl(slug), (g) => {
        const sc = g.scene;
        sc.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true; o.receiveShadow = true;
            o.geometry.userData.shared = true;
            const ms = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of ms) {
              m.userData.shared = true;
              for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap']) if (m[k]) { m[k].userData.shared = true; m[k].anisotropy = HT.maxAniso; }
              if (m.map && m.transparent === false && m.alphaTest === 0 && /leaf|leaves|plant|fern|shrub|grass|nettle|weed|periwinkle|calathea|pachira|anthurium/i.test(slug + m.name)) { m.alphaTest = 0.5; m.side = T.DoubleSide; }
            }
          }
        });
        const bb = new T.Box3().setFromObject(sc);
        res({ scene: sc, bb });
      }, undefined, (e) => { console.warn('khong tai mo hinh', slug, e); res(null); });
    });
    mcache.set(slug, p);
    return p;
  }
  HT.loadModel = loadModel;
  /* đặt mô hình: o {x,y,z,ry,s | h (cao mong muốn) | w (rộng mong muốn), env, col:true|'circle', tint, onLoad} */
  HT.model = function (ctx, slug, o) {
    o = o || {};
    const holder = new T.Group();
    holder.position.set(o.x || 0, 0, o.z || 0);
    holder.rotation.y = o.ry || 0;
    holder.name = slug; holder.userData.model = slug;
    (o.parent || ctx.root).add(holder);
    const p = loadModel(slug).then((m) => {
      if (!m) return;
      const c = m.scene.clone(true);
      const size = new T.Vector3(); m.bb.getSize(size);
      let s = o.s || 1;
      if (o.h) s = o.h / Math.max(1e-3, size.y);
      if (o.w) s = o.w / Math.max(1e-3, Math.max(size.x, size.z));
      if (o.sx) c.scale.set(o.sx * s, (o.sy || 1) * s, (o.sz || o.sx) * s); else c.scale.setScalar(s);
      const center = new T.Vector3(); m.bb.getCenter(center);
      c.position.set(-center.x * c.scale.x, -m.bb.min.y * c.scale.y, -center.z * c.scale.z);
      if (o.keepOrigin) c.position.set(0, 0, 0);
      holder.add(c);
      const y = o.y != null ? o.y : ctx.height(holder.position.x, holder.position.z);
      holder.position.y = y + (o.dy || 0);
      if (o.env != null || o.tint) c.traverse((q) => {
        if (!q.isMesh) return;
        if (o.env != null || o.tint) {
          q.material = q.material.clone(); q.material.userData.shared = false;
          if (o.env != null) q.material.envMapIntensity = o.env;
          if (o.tint) q.material.color.multiply(new T.Color(o.tint));
        }
        if (o.noShadow) q.castShadow = false;
      });
      if (o.col) {
        const w = size.x * c.scale.x, d = size.z * c.scale.z;
        if (o.col === 'circle') ctx.colCircle(holder.position.x, holder.position.z, Math.max(w, d) / 2, y, y + size.y * c.scale.y);
        else ctx.colBox(holder.position.x, holder.position.z, w, d, o.ry || 0, y, y + size.y * c.scale.y);
      }
      if (o.click) ctx.click(holder, o.click);
      if (o.onLoad) o.onLoad(holder, c);
    });
    HT.track(p);
    return holder;
  };

  /* ======================================================== VẬT LIỆU THƯỜNG DÙNG ======================================================== */
  P.M = {
    go: () => HT.mat('fine_grained_wood', { tile: 1.0, color: 0xc4a684, env: 0.6 }),
    goToi: () => HT.mat('lacquered_cherry_wood', { tile: 1.0, color: 0xc8a890, env: 0.6 }),
    goSon: () => HT.mat('lacquered_cherry_wood', { tile: 0.8, color: 0x7a1c14, rough: 0.55, env: 0.8 }),
    goMoc: () => HT.mat('rough_wood', { tile: 1.0, env: 0.6 }),
    tre: () => HT.mat('bamboo_veneer', { tile: 0.6, env: 0.6 }),
    dong: () => HT.solid(0x8a6a2c, { rough: 0.32, metal: 1 }),
    sat: () => HT.solid(0x2a2a2a, { rough: 0.45, metal: 0.8 }),
    gom: () => HT.solid(0x6b4a2c, { rough: 0.35 }),
    dat: () => HT.solid(0x8a5a3a, { rough: 0.85 }),
  };

  /* ======================================================== ĐỒ GỖ ======================================================== */
  /* phản gỗ: 3 tấm ván dày trên khung chân */
  P.phan = function (B, x, y, z, ry, o) {
    o = o || {};
    const w = o.w || 2.0, d = o.d || 1.6, h = o.h || 0.45, m = o.mat || P.M.goToi();
    const f = A().frame(x, z, ry);
    const nP = o.planks || 3;
    for (let i = 0; i < nP; i++) { const [px, pz] = f(0, -d / 2 + (d * (i + 0.5)) / nP); B.box(m, w, 0.07, d / nP - 0.006, px, y + h - 0.07, pz, ry, { bevel: 0.01 }); }
    for (const [lx, lz] of [[-w / 2 + 0.1, -d / 2 + 0.1], [w / 2 - 0.1, -d / 2 + 0.1], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, d / 2 - 0.1], [0, -d / 2 + 0.1], [0, d / 2 - 0.1]]) {
      const [lxw, lzw] = f(lx, lz); B.box(m, 0.09, h - 0.07, 0.09, lxw, y, lzw, ry);
    }
    for (const lz of [-d / 2 + 0.1, d / 2 - 0.1]) { const [a, b] = f(0, lz); B.box(m, w - 0.1, 0.08, 0.06, a, y + h - 0.16, b, ry); }
    if (o.chieu) P.chieu(B, x, y + h, z, ry, { w: w - 0.2, d: d - 0.2 });
  };
  P.chieuTex = function () {
    return HT.canvasTex('chieu', 512, 512, (g, W, H) => {
      const r = HT.rng(9);
      g.fillStyle = '#cdb68a'; g.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 3) { g.fillStyle = `rgba(${r() < 0.5 ? '120,95,55' : '235,220,180'},${r.range(0.1, 0.35)})`; g.fillRect(0, y, W, 1); }
      for (let x = 0; x < W; x += 16) { g.fillStyle = 'rgba(100,80,50,0.18)'; g.fillRect(x, 0, 2, H); }
      g.strokeStyle = '#9a2a22'; g.lineWidth = 10; g.strokeRect(24, 24, W - 48, H - 48);
      g.strokeStyle = '#2f5a3a'; g.lineWidth = 4; g.strokeRect(44, 44, W - 88, H - 88);
      g.fillStyle = '#9a2a22'; g.font = 'bold 42px serif'; g.textAlign = 'center'; g.globalAlpha = 0.5; g.fillText('囍', W / 2, H / 2 + 14); g.globalAlpha = 1;
    });
  };
  P.chieu = function (B, x, y, z, ry, o) {
    const m = HT.canvasMat('chieu', P.chieuTex(), { rough: 0.9, env: 0.5 });
    const g = new T.BoxGeometry(o.w, 0.008, o.d);
    HT.scaleUV(g, 1, 1);
    B.add(m, g, { x, y: y + 0.004, z, ry, uv: 'keep' });
  };
  /* bàn (án thư, bàn trà): mặt + 4 chân + giằng */
  P.table = function (B, x, y, z, ry, o) {
    o = o || {};
    const w = o.w || 1.2, d = o.d || 0.7, h = o.h || 0.78, m = o.mat || P.M.goToi(), th = o.top || 0.05, leg = o.leg || 0.06;
    const f = A().frame(x, z, ry);
    B.box(m, w, th, d, x, y + h - th, z, ry, { bevel: 0.008 });
    if (o.apron !== false) for (const lz of [-d / 2 + 0.05, d / 2 - 0.05]) { const [a, b] = f(0, lz); B.box(m, w - 0.12, 0.08, 0.025, a, y + h - th - 0.08, b, ry); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const [lx, lz] = f(sx * (w / 2 - 0.06), sz * (d / 2 - 0.06));
      if (o.curved) B.cyl(m, leg * 0.45, leg * 0.6, h - th, lx, y, lz, 8); else B.box(m, leg, h - th, leg, lx, y, lz, ry);
    }
    if (o.stretcher) for (const sx of [-1, 1]) { const [a, b] = f(sx * (w / 2 - 0.06), 0); B.box(m, 0.035, 0.035, d - 0.12, a, y + 0.12, b, ry); }
    return y + h;
  };
  /* ghế đẩu / ghế băng */
  P.stool = function (B, x, y, z, ry, o) {
    o = o || {};
    return P.table(B, x, y, z, ry, { w: o.w || 0.35, d: o.d || 0.35, h: o.h || 0.42, mat: o.mat, top: 0.04, leg: 0.045, apron: false, stretcher: true });
  };
  P.bench = function (B, x, y, z, ry, o) {
    o = o || {};
    return P.table(B, x, y, z, ry, { w: o.w || 1.8, d: o.d || 0.32, h: o.h || 0.45, mat: o.mat, top: 0.05, leg: 0.06, stretcher: true });
  };
  /* ghế tựa gỗ đơn giản */
  P.chair = function (B, x, y, z, ry, o) {
    o = o || {};
    const m = o.mat || P.M.goToi(); const f = A().frame(x, z, ry);
    P.table(B, x, y, z, ry, { w: 0.44, d: 0.42, h: 0.46, mat: m, top: 0.035, leg: 0.04, apron: false });
    const [bx, bz] = f(0, -0.19);
    for (const sx of [-1, 1]) { const [px, pz] = f(sx * 0.19, -0.19); B.box(m, 0.04, 0.5, 0.04, px, y + 0.46, pz, ry); }
    B.box(m, 0.42, 0.12, 0.03, bx, y + 0.8, bz, ry);
    B.box(m, 0.42, 0.06, 0.025, bx, y + 0.62, bz, ry);
  };
  /* tủ đứng */
  P.cabinet = function (B, x, y, z, ry, o) {
    o = o || {};
    const w = o.w || 1.0, d = o.d || 0.5, h = o.h || 1.8, m = o.mat || P.M.goToi();
    const f = A().frame(x, z, ry);
    B.box(m, w, h - 0.1, d, x, y + 0.1, z, ry, { bevel: 0.01 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const [lx, lz] = f(sx * (w / 2 - 0.05), sz * (d / 2 - 0.05)); B.box(m, 0.06, 0.1, 0.06, lx, y, lz, ry); }
    const [fx, fz] = f(0, d / 2 + 0.005);
    B.box(o.trim || m, w - 0.08, h - 0.3, 0.01, fx, y + 0.2, fz, ry);
    const [kx, kz] = f(0.03, d / 2 + 0.02); B.box(P.M.dong(), 0.02, 0.1, 0.02, kx, y + h * 0.55, kz, ry);
  };
  /* giá sách / tủ sách có sách */
  P.bookshelf = function (B, x, y, z, ry, o) {
    o = o || {};
    const w = o.w || 1.0, d = o.d || 0.32, h = o.h || 1.8, m = o.mat || P.M.goToi(), n = o.shelves || 5;
    const f = A().frame(x, z, ry); const r = HT.rng(o.seed || 3);
    for (const sx of [-1, 1]) { const [a, b] = f(sx * (w / 2 - 0.015), 0); B.box(m, 0.03, h, d, a, y, b, ry); }
    const [bk, bkz] = f(0, -d / 2 + 0.01); B.box(m, w, h, 0.015, bk, y, bkz, ry);
    const cols = [0x6b2a22, 0x2c3e50, 0x7a6a4a, 0x3e5a3a, 0x8a7a5a, 0x5a2a3a, 0xb8a888, 0x2a2a2a];
    for (let i = 0; i <= n; i++) {
      const sy = y + (h * i) / n; const [a, b] = f(0, 0); B.box(m, w - 0.06, 0.025, d, a, sy, b, ry);
      if (i < n && o.books !== false) {
        let bx = -w / 2 + 0.05;
        while (bx < w / 2 - 0.08) {
          const bw = r.range(0.02, 0.05), bh = r.range(0.18, 0.28) * Math.min(1, (h / n) / 0.32);
          const [cx, cz] = f(bx + bw / 2, 0.02);
          if (r() < 0.9) B.box(HT.solid(r.pick(cols), { rough: 0.75, env: 0.5 }), bw, bh, d * 0.75, cx, sy + 0.025, cz, ry + r.range(-0.04, 0.04));
          bx += bw + 0.003;
        }
      }
    }
  };

  /* ======================================================== BÀN THỜ, HOÀNH PHI, CÂU ĐỐI ======================================================== */
  /* hoành phi sơn son thếp vàng; text: chữ Hán (đọc phải sang trái khi viết dọc theo lối cổ — ở đây viết ngang phải->trái) */
  P.hoanhPhiTex = function (key, text, o) {
    o = o || {};
    return HT.canvasTex('hp_' + key, 2048, 640, (g, W, H) => {
      const bg = o.bg || '#6e1410';
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0.3)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#c9a24a'; g.lineWidth = 26; g.strokeRect(20, 20, W - 40, H - 40);
      g.strokeStyle = '#8a6a2a'; g.lineWidth = 6; g.strokeRect(58, 58, W - 116, H - 116);
      /* hoa văn góc */
      g.fillStyle = '#c9a24a';
      for (const [cx, cy] of [[90, 90], [W - 90, 90], [90, H - 90], [W - 90, H - 90]]) { g.beginPath(); g.arc(cx, cy, 18, 0, 6.283); g.fill(); }
      const chars = [...text];
      const n = chars.length;
      g.font = `${Math.min(360, (W - 300) / n * 0.95)}px ${HT.FONT_HAN}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = o.ink || '#e9c35a';
      g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
      for (let i = 0; i < n; i++) {
        const cx = W - 150 - ((W - 300) * (i + 0.5)) / n;
        g.fillText(chars[i], cx, H / 2 + 8);
      }
      g.shadowBlur = 0;
      if (o.small) { g.font = `44px ${HT.FONT_HAN}`; g.fillText(o.small, 150, H / 2); }
    });
  };
  P.hoanhPhi = function (B, x, y, z, ry, text, o) {
    o = o || {};
    const w = o.w || 1.8, h = o.h || w * 0.3125;
    const m = HT.canvasMat('hp_' + (o.key || text), P.hoanhPhiTex(o.key || text, text, o), { rough: 0.35, env: 1.0 });
    const g = new T.BoxGeometry(w, h, 0.05);
    const uv = g.attributes.uv;
    /* chỉ mặt trước dùng ảnh; các mặt khác lấy góc tối của ảnh */
    for (let i = 0; i < uv.count; i++) if (i < 16 || i >= 20) uv.setXY(i, 0.005, 0.5);
    B.add(m, g, { x, y: y + h / 2, z, ry, rx: o.tilt || 0.12, uv: 'keep' });
  };
  /* câu đối dọc: chữ Hán viết từ trên xuống */
  P.cauDoiTex = function (key, text, o) {
    o = o || {};
    return HT.canvasTex('cd_' + key, 360, 2048, (g, W, H) => {
      g.fillStyle = o.bg || '#1c1510'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#b8903e'; g.lineWidth = 14; g.strokeRect(12, 12, W - 24, H - 24);
      const chars = [...text]; const n = chars.length;
      g.font = `${Math.min(210, (H - 200) / n * 0.86)}px ${HT.FONT_HAN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = o.ink || '#d9b45a';
      for (let i = 0; i < n; i++) g.fillText(chars[i], W / 2, 100 + ((H - 200) * (i + 0.5)) / n);
    });
  };
  P.cauDoi = function (B, x, y, z, ry, text, o) {
    o = o || {};
    const w = o.w || 0.26, h = o.h || 1.6;
    const m = HT.canvasMat('cd_' + (o.key || text), P.cauDoiTex(o.key || text, text, o), { rough: 0.4, env: 0.9 });
    const g = new T.BoxGeometry(w, h, 0.025);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) if (i < 16 || i >= 20) uv.setXY(i, 0.02, 0.5);
    B.add(m, g, { x, y: y + h / 2, z, ry, uv: 'keep' });
  };
  /* bàn thờ gia tiên: hương án cao + đồ thờ; trả về cao độ mặt bàn */
  P.altar = function (ctx, B, x, y, z, ry, o) {
    o = o || {};
    const f = A().frame(x, z, ry);
    const w = o.w || 1.6, d = o.d || 0.6, h = o.h || 1.05;
    const m = o.mat || P.M.goToi();
    const top = P.table(B, x, y, z, ry, { w, d, h, mat: m, top: 0.07, leg: 0.09, stretcher: true });
    /* yếm bàn thờ (chạm thủng giả bằng tấm sơn) */
    const [yx, yz] = f(0, d / 2 - 0.02); B.box(o.yem || P.M.goSon(), w - 0.2, 0.22, 0.03, yx, top - 0.3, yz, ry);
    /* bát hương, chân nến, lọ hoa, mâm quả */
    const dong = P.M.dong(), gom = HT.solid(0xe8e1cf, { rough: 0.25 });
    const [bx, bz] = f(0, 0.02);
    B.add(gom, HT.lathe([[0, 0], [0.09, 0.0], [0.11, 0.05], [0.12, 0.12], [0.1, 0.13], [0, 0.13]], 20), { x: bx, y: top, z: bz, uv: 'keep' });
    B.add(HT.solid(0xcfc6b0, { rough: 0.95 }), new T.CylinderGeometry(0.1, 0.1, 0.01, 18), { x: bx, y: top + 0.125, z: bz });
    for (let i = 0; i < 5; i++) { const a = i * 1.25; const [ix, iz] = f(Math.cos(a) * 0.04, 0.02 + Math.sin(a) * 0.04); B.beam(HT.solid(0x8a3a24), ix, top + 0.12, iz, ix + Math.cos(a) * 0.02, top + 0.38, iz + Math.sin(a) * 0.02, 0.004, 0.004, { round: true, seg: 4, noShadow: true }); }
    for (const sx of [-1, 1]) {
      const [cx, cz] = f(sx * w * 0.3, 0);
      B.add(dong, HT.lathe([[0, 0], [0.07, 0], [0.07, 0.02], [0.02, 0.04], [0.018, 0.3], [0.05, 0.32], [0.05, 0.34], [0, 0.34]], 16), { x: cx, y: top, z: cz, uv: 'keep' });
      B.cyl(HT.solid(0xb02a1a, { rough: 0.5 }), 0.018, 0.018, 0.14, cx, top + 0.34, cz, 8);
      const [vx, vz] = f(sx * w * 0.42, -0.08);
      B.add(gom, HT.lathe([[0, 0], [0.06, 0], [0.09, 0.1], [0.06, 0.22], [0.035, 0.28], [0.05, 0.32], [0, 0.32]], 16), { x: vx, y: top, z: vz, uv: 'keep' });
    }
    const [mx, mz] = f(0, -0.16);
    B.add(dong, HT.lathe([[0, 0], [0.05, 0], [0.04, 0.08], [0.16, 0.12], [0.17, 0.14], [0, 0.13]], 20), { x: mx, y: top, z: mz, uv: 'keep' });
    const fr = [0xd9b02a, 0xc93a2a, 0x6aa03a, 0xe7c34a];
    for (let i = 0; i < 7; i++) { const a = i * 0.9; const [qx, qz] = f(Math.cos(a) * 0.08, -0.16 + Math.sin(a) * 0.08); B.add(HT.solid(fr[i % 4], { rough: 0.5 }), new T.SphereGeometry(0.045, 10, 8), { x: qx, y: top + 0.17 + (i === 6 ? 0.05 : 0), z: qz }); }
    if (ctx) ctx.colBox(x, z, w, d, ry, y, y + h);
    return top;
  };

  /* ======================================================== KHUNG CỬI (dệt vải) ======================================================== */
  P.loom = function (B, x, y, z, ry, o) {
    o = o || {};
    const f = A().frame(x, z, ry);
    const m = o.mat || P.M.goMoc();
    const W = 1.0, L = 1.9, H = 1.6;
    for (const sx of [-1, 1]) {
      const [a0, a1] = f(sx * W / 2, -L / 2), [b0, b1] = f(sx * W / 2, L / 2 - 0.3);
      B.box(m, 0.07, H, 0.07, a0, y, a1, ry); B.box(m, 0.07, 1.0, 0.07, b0, y, b1, ry);
      const [c0, c1] = f(sx * W / 2, 0); B.box(m, 0.06, 0.06, L, c0, y + 0.9, c1, ry);
      B.box(m, 0.06, 0.06, L, c0, y + 0.15, c1, ry);
    }
    for (const [lz, ly] of [[-L / 2, H - 0.1], [-L / 2, 0.75], [L / 2 - 0.3, 0.95], [-0.2, 1.25]]) { const [a, b] = f(0, lz); B.cyl(m, 0.04, 0.04, W + 0.12, a, y + ly, b, 10, { rz: Math.PI / 2, ry }); }
    /* thanh go (y 1,25 m) treo bằng hai sợi dây từ cần gác trên hai cột sau — không để thanh lơ lửng giữa khung */
    for (const sx of [-1, 1]) { const [p0, p1] = f(sx * W / 2, -L / 2), [q0, q1] = f(sx * W / 2, -0.2); B.beam(m, p0, y + H - 0.04, p1, q0, y + 1.62, q1, 0.05, 0.05); }
    { const [a, b] = f(0, -0.2); B.cyl(m, 0.03, 0.03, W + 0.12, a, y + 1.62, b, 8, { rz: Math.PI / 2, ry }); }
    for (const sx of [-0.35, 0.35]) { const [a, b] = f(sx, -0.2); B.box(HT.solid(0xd8cfb8, { rough: 0.9 }), 0.012, 0.36, 0.012, a, y + 1.27, b, ry); }
    /* sợi dọc */
    const warp = HT.canvasMat('warp', HT.canvasTex('warp', 256, 64, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < w; i += 3) { g.fillStyle = 'rgba(238,230,210,0.95)'; g.fillRect(i, 0, 1.2, h); } }), { transparent: false, alphaTest: 0.4, side: T.DoubleSide, rough: 0.9 });
    const [wx, wz] = f(0, -0.05);
    const wg = new T.PlaneGeometry(W - 0.12, L * 0.62); wg.rotateX(-Math.PI / 2 + 0.28);
    B.add(warp, wg, { x: wx, y: y + 0.95, z: wz, ry, uv: 'keep', noShadow: true });
    /* tấm vải đã dệt */
    const [cx, cz] = f(0, L / 2 - 0.45);
    B.box(HT.solid(0xd9ceb4, { rough: 0.95 }), W - 0.14, 0.01, 0.4, cx, y + 0.94, cz, ry);
    /* ghế ngồi dệt */
    const [sx2, sz2] = f(0, L / 2 + 0.05); B.box(m, 0.8, 0.06, 0.25, sx2, y + 0.5, sz2, ry);
    for (const sx of [-1, 1]) { const [lx, lz] = f(sx * 0.35, L / 2 + 0.05); B.box(m, 0.05, 0.5, 0.05, lx, y, lz, ry); }
    /* bàn đạp */
    for (const sx of [-0.15, 0.15]) { const [px, pz] = f(sx, L / 2 - 0.5); B.add(m, HT.geoBox(0.08, 0.03, 0.6), { x: px, y: y + 0.08, z: pz, ry, rx: 0.2 }); }
  };

  /* ======================================================== CHUM, VẠI, CỐI, RƠM ======================================================== */
  P.jar = function (B, x, y, z, o) {
    o = o || {};
    const s = o.s || 1;
    const m = o.mat || HT.solid(o.color || 0x5a3a22, { rough: 0.3, env: 0.9 });
    const prof = o.kind === 'vai'
      ? [[0, 0], [0.2, 0], [0.26, 0.1], [0.28, 0.35], [0.26, 0.5], [0.24, 0.55], [0.25, 0.57], [0.22, 0.57], [0.21, 0.54], [0, 0.54]]
      : [[0, 0], [0.18, 0], [0.3, 0.12], [0.36, 0.35], [0.33, 0.55], [0.22, 0.68], [0.2, 0.72], [0.23, 0.74], [0.19, 0.75], [0.17, 0.72], [0, 0.7]];
    B.add(m, HT.lathe(prof.map(([r, h]) => [r * s, h * s]), 28), { x, y, z, uv: 'keep' });
    if (o.water) B.add(HT.solid(0x1c2a28, { rough: 0.05, env: 1.2 }), new T.CircleGeometry(0.17 * s, 20), { x, y: y + 0.66 * s, z, rx: -Math.PI / 2 });
    if (o.lid) B.add(HT.mat('bamboo_wall_02', { tile: 0.5 }), new T.CylinderGeometry(0.26 * s, 0.26 * s, 0.02, 20), { x, y: y + 0.75 * s, z });
  };
  P.pot = function (B, x, y, z, o) {
    o = o || {}; const s = o.s || 1;
    B.add(o.mat || HT.solid(0x3a2a20, { rough: 0.6 }), HT.lathe([[0, 0], [0.1, 0], [0.16, 0.06], [0.17, 0.12], [0.13, 0.18], [0.14, 0.2], [0.12, 0.2], [0, 0.18]].map(([r, h]) => [r * s, h * s]), 20), { x, y, z, uv: 'keep' });
  };
  /* bếp kiềng ba chân + nồi */
  P.hearth = function (B, x, y, z, o) {
    o = o || {};
    const st = HT.solid(0x2c2a28, { rough: 0.8, metal: 0.5 });
    for (let i = 0; i < 3; i++) { const a = i * 2.094; B.beam(st, x + Math.cos(a) * 0.25, y, z + Math.sin(a) * 0.25, x + Math.cos(a) * 0.16, y + 0.28, z + Math.sin(a) * 0.16, 0.02, 0.02, { round: true, seg: 6 }); }
    B.add(st, new T.TorusGeometry(0.17, 0.015, 6, 20), { x, y: y + 0.28, z, rx: Math.PI / 2 });
    P.pot(B, x, y + 0.28, z, { s: 1.1 });
    B.add(HT.solid(0x1a1714, { rough: 1 }), new T.CircleGeometry(0.45, 16), { x, y: y + 0.005, z, rx: -Math.PI / 2 });
    for (let i = 0; i < 5; i++) { const a = i * 1.2; B.beam(HT.mat('bark_brown_01', { tile: 0.5 }), x + Math.cos(a) * 0.5, y + 0.03, z + Math.sin(a) * 0.5, x + Math.cos(a) * 0.12, y + 0.08, z + Math.sin(a) * 0.12, 0.035, 0.035, { round: true, seg: 6 }); }
  };
  /* cối xay lúa bằng tre đất: 2 thớt tròn, tay quay */
  P.riceMill = function (B, x, y, z, o) {
    const m = HT.mat('bamboo_wall_02', { tile: 0.6 });
    B.cyl(m, 0.36, 0.38, 0.35, x, y, z, 18); B.cyl(HT.solid(0x6a5a44, { rough: 0.9 }), 0.4, 0.4, 0.05, x, y + 0.35, z, 18);
    B.cyl(m, 0.34, 0.36, 0.32, x, y + 0.4, z, 18);
    B.beam(P.M.goMoc(), x, y + 0.6, z, x + 0.7, y + 0.62, z, 0.05, 0.05);
    B.beam(P.M.goMoc(), x + 0.7, y + 0.62, z, x + 1.5, y + 0.75, z, 0.04, 0.04, { round: true });
  };
  /* cối giã gạo đạp chân (cối giã chày đạp) */
  P.pestle = function (B, x, y, z, ry) {
    const f = A().frame(x, z, ry);
    const [cx, cz] = f(0, 0);
    B.add(HT.mat('granite_tile', { tile: 0.6, color: 0xc8c4bc }), HT.lathe([[0, 0.25], [0.12, 0.25], [0.2, 0.3], [0.28, 0.35], [0.3, 0.3], [0.3, 0], [0, 0]], 16), { x: cx, y, z: cz, uv: 'keep' });
    const [a, b] = f(0, 0.2), [c, d] = f(0, 2.2);
    B.beam(P.M.goMoc(), a, y + 0.55, b, c, y + 0.3, d, 0.11, 0.11);
    const [px, pz] = f(0, 0.25); B.cyl(P.M.goMoc(), 0.06, 0.06, 0.45, px, y + 0.2, pz, 8);
    for (const sx of [-1, 1]) { const [qx, qz] = f(sx * 0.15, 1.4); B.box(P.M.goMoc(), 0.08, 0.5, 0.08, qx, y, qz, ry); }
  };
  /* cây rơm quanh cọc */
  P.haystack = function (B, x, y, z, o) {
    o = o || {};
    const h = o.h || 2.6, r = o.r || 1.1;
    const m = HT.mat('thatch_roof_angled', { tile: 1.5, color: 0xd9c08a });
    const prof = [[0, 0], [r * 0.85, 0], [r, h * 0.2], [r * 0.98, h * 0.55], [r * 0.7, h * 0.82], [r * 0.25, h * 0.97], [0.05, h], [0, h]];
    const g = HT.lathe(prof, 24);
    const p = g.attributes.position; const rg = HT.rng(o.seed || 2);
    for (let i = 0; i < p.count; i++) { const k = 1 + HT.noise(p.getX(i) * 2, p.getY(i) * 2, p.getZ(i) * 2) * 0.06; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    g.computeVertexNormals();
    B.add(m, g, { x, y, z, uv: 'keep' });
    B.cyl(P.M.tre(), 0.03, 0.035, 0.9, x, y + h - 0.1, z, 6);
  };
  /* võng */
  P.hammock = function (B, x0, y0, z0, x1, y1, z1, o) {
    o = o || {};
    const m = HT.solid(o.color || 0xb89a6a, { rough: 0.95, side: T.DoubleSide });
    const n = 14, w = 0.8;
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
    const nx = -dz / L, nz = dx / L;
    const pos = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n; const sag = Math.sin(Math.PI * t) * (o.sag || 0.6);
      const wid = w * Math.sin(Math.PI * Math.min(1, 0.05 + t * 0.9)) * 0.5 + 0.02;
      for (const sd of [-1, 0, 1]) {
        const cy = y0 + (y1 - y0) * t - sag + Math.abs(sd) * 0.12 * Math.sin(Math.PI * t);
        pos.push(x0 + dx * t + nx * wid * sd, cy, z0 + dz * t + nz * wid * sd);
      }
    }
    for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) { const a = i * 3 + k; idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    B.add(m, g, {});
  };
  /* giếng gạch tròn có thành */
  P.well = function (B, ctx, x, y, z, o) {
    o = o || {};
    const R = o.r || 0.75, h = o.h || 0.75;
    const m = o.mat || HT.mat('red_bricks_04', { tile: 0.9 });
    const g = new T.CylinderGeometry(R, R, h, 28, 1, true); HT.scaleUV(g, 2 * Math.PI * R, h);
    B.add(m, g, { x, y: y + h / 2, z, uv: 'keep' });
    const gi = new T.CylinderGeometry(R - 0.2, R - 0.2, h + 0.4, 28, 1, true); HT.scaleUV(gi, 2 * Math.PI * R, h);
    gi.scale(-1, 1, 1);
    B.add(m, gi, { x, y: y + h / 2 - 0.2, z, uv: 'keep' });
    const top = new T.RingGeometry(R - 0.2, R + 0.02, 28); top.rotateX(-Math.PI / 2);
    B.add(o.cap || HT.mat('concrete_pavement', { tile: 1, color: 0xbcb2a0 }), top, { x, y: y + h, z });
    B.add(HT.solid(0x0c1412, { rough: 0.05, env: 1.3 }), new T.CircleGeometry(R - 0.2, 24), { x, y: y - 0.5, z, rx: -Math.PI / 2 });
    if (ctx) ctx.colCircle(x, z, R + 0.05);
  };
  /* bảng đen (chữ phấn) */
  P.blackboardTex = function (key, lines) {
    return HT.canvasTex('bb_' + key, 1536, 768, (g, W, H) => {
      g.fillStyle = '#1f2a24'; g.fillRect(0, 0, W, H);
      const r = HT.rng(4);
      for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(255,255,255,${r.range(0.01, 0.05)})`; g.fillRect(r() * W, r() * H, r.range(2, 30), 1); }
      g.fillStyle = 'rgba(235,235,225,0.88)'; g.textAlign = 'left';
      let yy = 110;
      for (const [txt, size, font] of lines) { g.font = `${size || 60}px ${font || HT.FONT_SERIF}`; g.fillText(txt, 80, yy); yy += (size || 60) * 1.45; }
    });
  };
  P.blackboard = function (B, x, y, z, ry, key, lines, o) {
    o = o || {};
    const w = o.w || 2.4, h = o.h || 1.2;
    const f = A().frame(x, z, ry);
    const m = HT.canvasMat('bb_' + key, P.blackboardTex(key, lines), { rough: 0.9, env: 0.4 });
    const g = new T.PlaneGeometry(w, h);
    B.add(m, g, { x, y: y + h / 2, z, ry, uv: 'keep' });
    const fm = o.frame || P.M.go();
    for (const [lx, ly, bw, bh] of [[0, -0.04, w + 0.1, 0.06], [0, h - 0.02, w + 0.1, 0.06], [-w / 2 - 0.03, -0.04, 0.06, h + 0.1], [w / 2 + 0.03, -0.04, 0.06, h + 0.1]]) { const [a, b] = f(lx, -0.01); B.box(fm, bw, bh, 0.04, a, y + ly, b, ry); }
    const [tx, tz] = f(0, 0.05); B.box(fm, w, 0.03, 0.08, tx, y - 0.05, tz, ry);
    if (o.easel) for (const sx of [-1, 1]) { const [lx, lz] = f(sx * (w / 2 - 0.1), -0.05); B.beam(fm, lx, y - (o.easelH || 0.9), lz + 0.15, lx, y + h + 0.2, lz, 0.05, 0.05); }
  };
  /* bàn học liền ghế (lớp học đầu thế kỷ 20) */
  P.schoolDesk = function (B, x, y, z, ry, o) {
    o = o || {};
    const w = o.w || 1.6, m = o.mat || P.M.go();
    const f = A().frame(x, z, ry);
    const [tx, tz] = f(0, -0.15);
    B.add(m, HT.geoBox(w, 0.035, 0.42), { x: tx, y: y + 0.72, z: tz, ry, rx: 0.08 });
    const [qx, qz] = f(0, -0.36); B.box(m, w, 0.3, 0.02, qx, y + 0.42, qz, ry);
    const [sx, sz] = f(0, 0.28); B.box(m, w, 0.035, 0.3, sx, y + 0.42, sz, ry);
    for (const s of [-1, 1]) {
      const [a, b] = f(s * (w / 2 - 0.05), -0.15); B.box(m, 0.05, 0.72, 0.05, a, y, b, ry);
      const [c, d] = f(s * (w / 2 - 0.05), 0.28); B.box(m, 0.05, 0.42, 0.05, c, y, d, ry);
      const [e, g2] = f(s * (w / 2 - 0.05), 0.06); B.box(m, 0.04, 0.04, 0.5, e, y + 0.1, g2, ry);
    }
  };
  /* máy chữ (hộp kim loại đen, bàn phím nghiêng, trục giấy) */
  P.typewriter = function (B, x, y, z, ry, o) {
    const f = A().frame(x, z, ry);
    const blk = HT.solid(0x141414, { rough: 0.35, metal: 0.4 }), chr = HT.solid(0xcfcfcf, { rough: 0.25, metal: 1 });
    B.add(blk, HT.geoBox(0.34, 0.1, 0.3, 0.02), { x, y: y + 0.05, z, ry });
    const [kx, kz] = f(0, 0.12);
    B.add(blk, HT.geoBox(0.32, 0.03, 0.12), { x: kx, y: y + 0.07, z: kz, ry, rx: 0.3 });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) { const [ax, az] = f(-0.135 + c * 0.03, 0.07 + r * 0.028); B.cyl(HT.solid(0xe9e4d8, { rough: 0.4 }), 0.009, 0.009, 0.01, ax, y + 0.075 + (3 - r) * 0.008, az, 8); }
    const [px, pz] = f(0, -0.1); B.cyl(blk, 0.025, 0.025, 0.42, px, y + 0.14, pz, 12, { rz: Math.PI / 2, ry });
    B.cyl(chr, 0.008, 0.008, 0.46, px, y + 0.14, pz, 6, { rz: Math.PI / 2, ry });
    const [gx, gz] = f(0, -0.13); B.add(HT.solid(0xf4f0e6, { rough: 0.9, side: T.DoubleSide }), new T.PlaneGeometry(0.21, 0.22), { x: gx, y: y + 0.26, z: gz, ry, rx: -0.2 });
  };
  /* xe đạp cổ */
  P.bicycle = function (B, x, y, z, ry, o) {
    o = o || {};
    const f = A().frame(x, z, ry);
    const blk = HT.solid(o.color || 0x1c1c1c, { rough: 0.35, metal: 0.6 }), tire = HT.solid(0x1a1a1a, { rough: 0.9 }), chr = HT.solid(0xbfbfbf, { rough: 0.3, metal: 1 });
    const R = 0.34;
    for (const lx of [-0.55, 0.55]) {
      const [wx, wz] = f(lx, 0);
      B.add(tire, new T.TorusGeometry(R, 0.018, 8, 36), { x: wx, y: y + R + 0.02, z: wz, ry });
      B.add(chr, new T.TorusGeometry(R - 0.03, 0.006, 4, 36), { x: wx, y: y + R + 0.02, z: wz, ry });
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI; const [sx, sz] = f(lx + Math.cos(a) * (R - 0.03), 0); B.beam(chr, wx, y + R + 0.02, wz, sx, y + R + 0.02 + Math.sin(a) * (R - 0.03), sz, 0.003, 0.003, { round: true, seg: 3, noShadow: true }); const [s2x, s2z] = f(lx - Math.cos(a) * (R - 0.03), 0); B.beam(chr, wx, y + R + 0.02, wz, s2x, y + R + 0.02 - Math.sin(a) * (R - 0.03), s2z, 0.003, 0.003, { round: true, seg: 3, noShadow: true }); }
    }
    const P3 = (lx, ly) => { const [a, b] = f(lx, 0); return [a, y + ly, b]; };
    const seg = (p, q, r) => B.beam(blk, p[0], p[1], p[2], q[0], q[1], q[2], r || 0.02, r || 0.02, { round: true, seg: 6 });
    const bb = P3(-0.05, 0.36), st = P3(-0.15, 0.85), hd = P3(0.4, 0.92), fa = P3(0.55, 0.36), ra = P3(-0.55, 0.36);
    seg(bb, st); seg(st, hd); seg(bb, hd); seg(bb, ra); seg(st, ra); seg(hd, P3(0.47, 0.6)); seg(P3(0.47, 0.6), fa);
    seg(hd, P3(0.4, 1.05)); const [h1x, h1z] = f(0.38, -0.25), [h2x, h2z] = f(0.38, 0.25); B.beam(blk, h1x, y + 1.05, h1z, h2x, y + 1.05, h2z, 0.015, 0.015, { round: true });
    B.add(HT.solid(0x3a2418, { rough: 0.6 }), HT.geoBox(0.22, 0.05, 0.12, 0.02), { x: st[0], y: st[1] + 0.03, z: st[2], ry });
    const [rx, rz] = f(-0.5, 0); B.box(blk, 0.35, 0.02, 0.14, rx, y + 0.72, rz, ry);
  };

  /* ======================================================== CỜ, BĂNG KHẨU HIỆU ======================================================== */
  P.flagTex = function (kind) {
    return HT.canvasTex('flag_' + kind, 768, 512, (g, W, H) => {
      if (kind === 'vn') {
        g.fillStyle = '#da251d'; g.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2, R = H * 0.3;
        g.fillStyle = '#ffde00'; g.beginPath();
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? R * 0.382 : R; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
        g.closePath(); g.fill();
      } else if (kind === 'fr') {
        const c = ['#002395', '#ffffff', '#ed2939']; c.forEach((k, i) => { g.fillStyle = k; g.fillRect((W * i) / 3, 0, W / 3 + 1, H); });
      } else if (kind === 'red') { g.fillStyle = '#c8201a'; g.fillRect(0, 0, W, H); }
      else if (kind === 'tang') { g.fillStyle = '#c01c16'; g.fillRect(0, 0, W, H); g.fillStyle = '#111'; g.fillRect(0, H * 0.42, W, H * 0.16); }
      else if (kind === 'hoang') { g.fillStyle = '#e8b830'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(160,40,20,0.9)'; g.fillRect(0, 0, W, H * 0.06); g.fillRect(0, H * 0.94, W, H * 0.06); }
      else if (kind === 'cr') {
        /* cờ hãng Chargeurs Réunis: nền trắng, năm sao đỏ (2+1+2) */
        g.fillStyle = '#f7f5ef'; g.fillRect(0, 0, W, H);
        const star = (cx, cy, R) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? R * 0.382 : R; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); };
        g.fillStyle = '#c8201a';
        for (const [u, v] of [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]]) star(W * u, H * v, H * 0.13);
      } else if (kind === 'uk') {
        g.fillStyle = '#012169'; g.fillRect(0, 0, W, H);
        g.strokeStyle = '#fff'; g.lineWidth = H * 0.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, H); g.moveTo(W, 0); g.lineTo(0, H); g.stroke();
        g.strokeStyle = '#c8102e'; g.lineWidth = H * 0.07; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, H); g.moveTo(W, 0); g.lineTo(0, H); g.stroke();
        g.fillStyle = '#fff'; g.fillRect(W / 2 - H * 0.17, 0, H * 0.34, H); g.fillRect(0, H / 2 - H * 0.17, W, H * 0.34);
        g.fillStyle = '#c8102e'; g.fillRect(W / 2 - H * 0.1, 0, H * 0.2, H); g.fillRect(0, H / 2 - H * 0.1, W, H * 0.2);
      } else if (kind === 'us') {
        for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#fff' : '#b22234'; g.fillRect(0, (H * i) / 13, W, H / 13 + 1); }
        g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, W * 0.4, (H * 7) / 13);
        g.fillStyle = '#fff'; for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) { g.beginPath(); g.arc(W * 0.025 + c * W * 0.048, H * 0.035 + r * H * 0.088, 5, 0, 6.283); g.fill(); }
      } else if (kind === 'su') {
        g.fillStyle = '#cc0000'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#ffd700'; g.font = `bold ${H * 0.2}px serif`; g.fillText('☭', W * 0.08, H * 0.3);
      } else if (kind === 'th') {
        const c = ['#a51931', '#f4f5f8', '#2d2a4a', '#2d2a4a', '#f4f5f8', '#a51931']; const hs = [1, 1, 1, 1, 1, 1];
        g.fillStyle = '#a51931'; g.fillRect(0, 0, W, H); g.fillStyle = '#f4f5f8'; g.fillRect(0, H / 6, W, (H * 4) / 6); g.fillStyle = '#2d2a4a'; g.fillRect(0, H / 3, W, H / 3);
      } else if (kind === 'cn1925') {
        g.fillStyle = '#c8201a'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#1a3a8a'; g.fillRect(0, 0, W / 2, H / 2);
        g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 4, H / 4, H * 0.1, 0, 6.283); g.fill();
      } else { g.fillStyle = '#ddd'; g.fillRect(0, 0, W, H); }
    });
  };
  /* cờ bay trên cột: lưới vải lượn sóng theo thời gian */
  P.flag = function (ctx, x, y, z, o) {
    o = o || {};
    const H = o.pole != null ? o.pole : 8, fw = o.w || 1.8, fh = o.h || fw * (2 / 3);
    const B = new HT.Builder(ctx);
    if (H > 0) {
      B.cyl(o.poleMat || HT.solid(0xd8d4cc, { rough: 0.35, metal: 0.6 }), 0.035, 0.06, H, x, y, z, 12);
      B.add(P.M.dong(), new T.SphereGeometry(0.07, 12, 8), { x, y: y + H + 0.05, z });
      if (o.base !== false) B.box(HT.mat('concrete_pavement', { tile: 1, color: 0xcfc8b8 }), 0.6, 0.3, 0.6, x, y, z, 0);
      if (ctx) ctx.colCircle(x, z, 0.3);
    }
    B.build(ctx.root);
    const g = new T.PlaneGeometry(fw, fh, 24, 12);
    g.translate(fw / 2, 0, 0);
    const mat = new T.MeshStandardMaterial({ map: P.flagTex(o.kind || 'vn'), side: T.DoubleSide, roughness: 0.85, envMapIntensity: 0.9 });
    const amp = o.amp != null ? o.amp : 0.12;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = HT.uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader
        .replace('#include <beginnormal_vertex>', `
          float fx = position.x / ${fw.toFixed(3)};
          float ph = uTime*3.2 - fx*7.0;
          float dz = sin(ph) * ${amp.toFixed(3)} * fx + sin(uTime*1.7 - fx*3.0 + position.y*1.5) * ${(amp * 0.5).toFixed(3)} * fx;
          float ddx = (cos(ph) * -7.0 * ${amp.toFixed(3)} * fx + sin(ph)*${amp.toFixed(3)}) / ${fw.toFixed(3)};
          vec3 objectNormal = normalize(vec3(-ddx, 0.0, 1.0));
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3( tangent.xyz );
          #endif`)
        .replace('#include <begin_vertex>', `vec3 transformed = vec3(position.x - abs(dz)*0.15, position.y - fx*fx*0.04*${(fh).toFixed(3)}, position.z + dz);`);
    };
    mat.customProgramCacheKey = () => 'flag' + fw + '_' + amp;
    const m = new T.Mesh(g, mat);
    m.position.set(x + (H > 0 ? 0.05 : 0), y + (H > 0 ? H - fh / 2 - 0.1 : 0), z);
    m.rotation.y = o.ry || 0;
    m.castShadow = true; m.receiveShadow = true;
    ctx.add(m);
    return m;
  };
  /* băng vải khẩu hiệu (đỏ chữ vàng) căng giữa 2 điểm */
  P.bannerTex = function (key, text, o) {
    o = o || {};
    const W = 2400, H = Math.round(2400 / (o.aspect || 8));
    return HT.canvasTex('ban_' + key, W, H, (g) => {
      g.fillStyle = o.bg || '#c01d16'; g.fillRect(0, 0, W, H);
      const r = HT.rng(5); for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(0,0,0,${r.range(0.02, 0.06)})`; g.fillRect(r() * W, 0, 1, H); }
      g.fillStyle = o.ink || '#ffd84a'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let size = H * 0.62; g.font = `bold ${size}px ${o.font || HT.FONT_SANS}`;
      while (g.measureText(text).width > W * 0.92 && size > 10) { size -= 4; g.font = `bold ${size}px ${o.font || HT.FONT_SANS}`; }
      g.fillText(text, W / 2, H / 2 + size * 0.04);
    });
  };
  P.banner = function (ctx, B, x0, y0, z0, x1, y1, z1, h, text, o) {
    o = o || {};
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
    const tex = P.bannerTex(o.key || text, text, { aspect: L / h, bg: o.bg, ink: o.ink, font: o.font });
    const m = HT.canvasMat('ban_' + (o.key || text), tex, { rough: 0.85, side: T.DoubleSide, env: 0.8 });
    const g = new T.PlaneGeometry(L, h, 20, 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = p.getX(i) / L + 0.5; p.setZ(i, Math.sin(Math.PI * t) * (o.sag != null ? o.sag : 0.05)); p.setY(i, p.getY(i) - Math.sin(Math.PI * t) * (o.drop || 0.06)); }
    g.computeVertexNormals();
    B.add(m, g, { x: (x0 + x1) / 2, y: (y0 + y1) / 2 - h / 2, z: (z0 + z1) / 2, ry: Math.atan2(-dz, dx), uv: 'keep' });
  };

  /* ======================================================== ĐÈN ĐƯỜNG KIỂU CỔ ======================================================== */
  P.gasLamp = function (B, ctx, x, y, z, o) {
    o = o || {};
    const m = o.mat || HT.solid(0x1d2320, { rough: 0.45, metal: 0.7 });
    const H = o.h || 3.4;
    B.add(m, HT.lathe([[0, 0], [0.16, 0], [0.16, 0.08], [0.1, 0.12], [0.1, 0.5], [0.06, 0.6], [0.045, H - 0.2], [0.08, H - 0.12], [0.0, H - 0.1]], 12), { x, y, z, uv: 'keep' });
    B.add(m, HT.lathe([[0.0, 0], [0.09, 0], [0.18, 0.45], [0.2, 0.47], [0.22, 0.5], [0.05, 0.72], [0.0, 0.76]], 4), { x, y: y + H - 0.12, z, uv: 'keep', ry: Math.PI / 4 });
    const glass = HT.solid(0xfff1c8, { rough: 0.1, emissive: 0xffd89a, ei: o.lit ? 2.5 : 0.2, env: 1.2 });
    B.add(glass, HT.lathe([[0.07, 0], [0.16, 0.42], [0.0, 0.43]], 4), { x, y: y + H - 0.09, z, uv: 'keep', ry: Math.PI / 4, noShadow: true });
    if (ctx) ctx.colCircle(x, z, 0.18);
  };

  /* xe kéo tay (Sài Gòn, Hà Nội, Hồng Kông đầu thế kỷ XX): hai bánh gỗ lớn, thùng ngồi, mui gấp, hai càng dài chống đất */
  P.rickshaw = function (B, x, y, z, ry, o) {
    o = o || {};
    const f = A().frame(x, z, ry);
    const body = HT.solid(o.color || 0x1c1c1a, { rough: 0.35, env: 1.1 });
    const wood = HT.mat('fine_grained_wood', { tile: 0.6, color: 0xb89a78 });
    const iron = HT.solid(0x2a2a2a, { rough: 0.5, metal: 0.7 });
    const R = 0.62, tilt = 0.16;                 /* càng chúi xuống đất phía trước */
    const put = (g, lx, ly, lz, mat, extra) => { const [wx, wz] = f(lx, lz); B.add(mat, g, Object.assign({ x: wx, y: y + ly, z: wz, ry }, extra || {})); };
    for (const sd of [-1, 1]) {
      const rim = new T.TorusGeometry(R, 0.03, 6, 28); rim.rotateY(Math.PI / 2); put(rim, sd * 0.62, R, 0, iron);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; const sp = new T.CylinderGeometry(0.012, 0.012, R, 5); sp.translate(0, R / 2, 0); sp.rotateX(a); put(sp, sd * 0.62, R, 0, wood); }
      const hub = new T.CylinderGeometry(0.07, 0.07, 0.14, 10); hub.rotateZ(Math.PI / 2); put(hub, sd * 0.62, R, 0, iron);
      /* càng: từ thân (lz -0.3, cao) ra trước (lz +2.1, sát đất) */
      const [ax, az] = f(sd * 0.36, -0.2), [bx, bz] = f(sd * 0.3, 2.15);
      B.beam(wood, ax, y + R + 0.12, az, bx, y + 0.12, bz, 0.05, 0.05, { round: true, seg: 6 });
    }
    const ax = new T.CylinderGeometry(0.025, 0.025, 1.3, 6); ax.rotateZ(Math.PI / 2); put(ax, 0, R, 0, iron);
    /* thùng ngồi + lưng tựa */
    const seat = HT.geoBox(0.9, 0.14, 0.62); put(seat, 0, R + 0.18, -0.05, body, { rx: -tilt });
    const back = HT.geoBox(0.9, 0.62, 0.08); put(back, 0, R + 0.5, -0.4, body, { rx: -0.35 });
    const foot = HT.geoBox(0.7, 0.05, 0.42); put(foot, 0, R - 0.05, 0.45, body, { rx: -tilt });
    const side = HT.geoBox(0.06, 0.34, 0.66); for (const sd of [-1, 1]) put(side, sd * 0.45, R + 0.3, -0.08, body, { rx: -tilt });
    /* mui gấp: nửa trụ vải dầu */
    const hood = new T.CylinderGeometry(0.5, 0.5, 0.95, 14, 1, true, 0, Math.PI * (o.hoodOpen === false ? 0.5 : 0.95)); hood.rotateZ(Math.PI / 2); hood.rotateX(Math.PI * 0.45);
    put(hood, 0, R + 0.72, -0.28, HT.solid(0x141412, { rough: 0.6, side: T.DoubleSide }));
    /* đệm */
    const cush = HT.geoBox(0.8, 0.08, 0.5); put(cush, 0, R + 0.3, -0.05, HT.solid(o.cushion || 0x6a1c18, { rough: 0.8 }), { rx: -tilt });
  };

  /* lửa (đống lửa sưởi, bếp củi): củi + ngọn lửa bằng mặt phẳng chéo có shader động + đèn điểm chập chờn */
  P.fire = function (ctx, x, y, z, o) {
    o = o || {};
    const s = o.s || 1;
    const B = new HT.Builder(null);
    const grp = new T.Group(); grp.position.set(x, y, z); ctx.add(grp);
    if (o.logs !== false) {
      const wood = HT.mat('bark_brown_01', { tile: 0.5, color: 0x8a7a6a });
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; B.beam(wood, Math.cos(a) * 0.55 * s, 0.02, Math.sin(a) * 0.55 * s, Math.cos(a) * 0.08 * s, 0.45 * s, Math.sin(a) * 0.08 * s, 0.1 * s, 0.1 * s, { round: true, seg: 7 }); }
      const ember = HT.solid(0x3a1a0a, { rough: 0.9, emissive: 0xff5a10, ei: 1.2 });
      B.add(ember, new T.CylinderGeometry(0.45 * s, 0.55 * s, 0.08, 16), { y: 0.04 });
      if (o.stones) for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; B.add(HT.mat('mossy_rock', { tile: 0.8, color: 0xc8c8c0 }), HT.nature.rockGeo(k + 3, 0.16 * s, 0.12 * s, 0.14 * s, 2), { x: Math.cos(a) * 0.7 * s, y: 0.05, z: Math.sin(a) * 0.7 * s }); }
      B.build(grp);
    }
    const m = new T.ShaderMaterial({
      uniforms: { uTime: HT.uTime, uSeed: { value: Math.random() * 10 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uTime; uniform float uSeed; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        void main(){
          vec2 uv = vUv; float t = uTime * 1.6 + uSeed;
          float q = n(vec2(uv.x * 5.0, uv.y * 4.0 - t * 2.2)) * 0.6 + n(vec2(uv.x * 11.0, uv.y * 9.0 - t * 3.4)) * 0.4;
          float w = (1.0 - uv.y) * 0.55 + 0.08; float dx = abs(uv.x - 0.5 + (q - 0.5) * 0.25 * uv.y);
          float shape = smoothstep(w, w * 0.35, dx) * smoothstep(1.0, 0.25, uv.y + q * 0.35) * smoothstep(0.0, 0.06, uv.y);
          vec3 col = mix(vec3(1.0, 0.25, 0.03), vec3(1.0, 0.85, 0.45), smoothstep(0.2, 0.9, shape));
          gl_FragColor = vec4(col * shape * 2.2, shape);
        }`,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
    });
    for (let k = 0; k < 3; k++) { const pm = new T.Mesh(new T.PlaneGeometry(1.1 * s, 1.6 * s), m); pm.position.y = 0.8 * s; pm.rotation.y = (k / 3) * Math.PI; pm.userData.noAO = true; pm.userData.noMap = true; pm.renderOrder = 6; grp.add(pm); }
    const light = new T.PointLight(0xff9a48, (o.power || 12) * s, 12 * s, 1.6); light.position.y = 1.0 * s; grp.add(light);
    const base = light.intensity;
    let tt = Math.random() * 10;
    ctx.onUpdate((dt) => { tt += dt; light.intensity = base * (0.82 + 0.12 * Math.sin(tt * 13.0) + 0.08 * Math.sin(tt * 27.0 + 1.3)); });
    ctx.colCircle(x, z, 0.8 * s);
    return grp;
  };
})();
