/* GIAN 15 — VIỆT BẮC: AN TOÀN KHU ĐỊNH HÓA (1947 – 1954).
   Dựng lại: khu lán Tỉn Keo (Phú Đình, Định Hóa, Thái Nguyên) giữa rừng cọ, đồi chè — lán nứa nhỏ mái lá cọ nơi Người ở và
   làm việc (bàn tre, máy chữ, đèn dầu, giường tre; vườn hoa nhỏ trước lán); lán họp Bộ Chính trị với bộ bàn ghế mộc và bản đồ,
   nơi ngày 6/12/1953 quyết định mở Chiến dịch Điện Biên Phủ; hầm trú ẩn đào vào sườn đồi với lối xuống ốp gỗ; lán cảnh vệ;
   bếp Hoàng Cầm (bếp không khói); suối nhỏ phía tây, đồi chè Thái Nguyên phía đông.
   Trục: lối mòn từ nam (+z) đi lên phía bắc (−z) vào chân đồi. */
(function () {
  const HT = window.HT;
  HT.halls.G15 = {
    sky: { hdri: 'qwantani_mid_morning_puresky', sunAz: 300, exposure: 0.96, fog: 0.0026, sat: 1.06, con: 1.05, bloom: 0.13, shadowSize: 60 },
    spawn: { x: 4, z: 31, yaw: 0.0, pitch: 0.02 },
    map: [-30, -50, 46, 44],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo;
      const B = ctx.B, r = ctx.rng;
      const TX = 34, TZ = 14;                                        // đỉnh đồi chè
      const HX = -4, HZ = -39;                                       // hầm trú ẩn
      const sx = (z) => -29 + 2.5 * Math.sin(z * 0.06) + 1.2 * Math.sin(z * 0.17 + 1);
      const px = (z) => 3 + 2.2 * Math.sin(z * 0.08);                 // lối mòn chính
      const seg = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz; const t = HT.clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
      const path = (x, z) => (z > -12 && z < 40 && Math.abs(x - px(z)) < 1.1) || seg(x, z, px(-12), -12, -6, -14) < 0.9 || seg(x, z, px(-12), -12, 9, -18.5) < 0.9 ||
        seg(x, z, -6, -14, HX, HZ + 7) < 0.8 || seg(x, z, px(0), 0, -17, -6) < 0.8 || seg(x, z, 9, -18.5, 20, -12) < 0.8;
      const H0 = (x, z) => {
        let h = 0.4 + HT.noise(x * 0.05, z * 0.05, 3) * 0.25;
        h += Math.max(0, -z - 8) * 0.2 * (0.8 + 0.2 * HT.noise(x * 0.03, z * 0.03, 1));
        h += 9 * Math.exp(-((x - TX) ** 2 + (z - TZ) ** 2) / (2 * 11 * 11));
        h += HT.smooth(34, 70, -x) * 10 + HT.smooth(48, 90, x) * 14;
        return h;
      };
      const H = (x, z) => {
        let h = H0(x, z);
        /* suối phía tây */
        const ds = Math.abs(x - sx(z)) - 2.0;
        if (ds < 1.6) h = HT.lerp(-0.7 + HT.noise(x * 0.4, z * 0.4, 7) * 0.08, h, HT.smooth(-0.4, 1.6, ds));
        /* gò hầm + lối xuống hầm */
        h += 2.4 * Math.exp(-((x - HX) ** 2 + ((z - HZ) * 1.2) ** 2) / (2 * 3.2 * 3.2));
        if (Math.abs(x - HX) < 1.1 && z > HZ + 2.4 && z < HZ + 8) { const t = HT.smooth(HZ + 8, HZ + 2.6, z); h = HT.lerp(h, H0(HX, HZ + 8) - 1.1, t * HT.smooth(1.1, 0.6, Math.abs(x - HX))); }
        h += HT.fbm(x * 0.004, z * 0.004, 4) * 80 * HT.smooth(160, 600, Math.hypot(x, z + 40));
        return h;
      };
      const W = (x, z) => { const ds = Math.abs(x - sx(z)) - 2.0; const near = Math.abs(x) < 60 && z > -70 && z < 60; return [path(x, z) ? 1 : 0, ds < 0.3 ? 1 : 0, near && z < -16 && !path(x, z) ? 0.55 + 0.25 * HT.noise(x * 0.06, z * 0.06, 4) : 0]; };
      N.terrain(ctx, { size: 2000, inner: 120, step: 0.5, height: H, weights: W, layers: [
        { slug: 'leafy_grass', tile: 2.6, tint: 0x9cbc7c, rough: 0.95 },
        { slug: 'stony_dirt_path', tile: 2.0, tint: 0xd4c0a4, rough: 0.9 },
        { slug: 'ganges_river_pebbles', tile: 1.6, tint: 0xd8e0d8, rough: 0.6 },
        { slug: 'forest_leaves_02', tile: 3 },
      ], macro: 0.1 });
      ctx.bounds = [[-25, 42], [44, 42], [44, -47], [-25, -47]];
      /* suối */
      { const L = [], R2 = []; for (let z = -140; z <= 160; z += 2) { L.push([sx(z) - 2.3, z]); R2.push([sx(z) + 2.3, z]); }
        N.waterClear(ctx, { poly: L.concat(R2.reverse()), y: -0.3, color: 0xd6fff0, attColor: 0x2a8a70, attDist: 1.0, thickness: 0.6, ripple: 1.3, flow: [0.0, 0.08] });
        const rk = []; for (let z = -46; z < 42; z += 2.2) if (r() < 0.6) { const x = sx(z) + 2.2 + r.range(-0.3, 0.8); rk.push({ x, z: z + r.range(-0.7, 0.7), s: r.range(0.35, 0.9), sy: r.range(0.3, 0.6), y: H(x, z) - 0.2, col: false }); }
        N.rocks(ctx, rk, HT.mat('mossy_rock', { tile: 1.6, color: 0xd8dccc })); }
      N.grass(ctx, { rect: [-25, -47, 44, 42], density: 7, kind: 'grass', mask: (x, z) => (path(x, z) ? 0 : Math.abs(x - sx(z)) < 3.6 ? 0.3 : 0.7), seed: 6, far: 44 });
      N.grass(ctx, { rect: [-25, -47, 44, 42], density: 3, kind: 'tall', mask: (x, z) => (path(x, z) || z > -14 ? 0 : 0.6), seed: 7, far: 34 });

      const post = HT.mat('rough_wood', { tile: 1.0, color: 0xd0c0a8 });
      const coLeaf = HT.mat('reed_roof_03', { tile: 1.4, color: 0xa89c78 });
      const treM = HT.mat('bamboo_veneer', { tile: 0.8, color: 0xc0b080 });
      const tre = P.M.tre();

      /* ---------------- LÁN BÁC Ở VÀ LÀM VIỆC ---------------- */
      const lan = A.stiltHouse(ctx, B, { x: -8, z: -19, ry: 0.25, w: 4.8, d: 3.3, floorY: 0.9, eave: 1.9, ridge: 3.5, veranda: 1.0, wall: 'bamboo', floorKind: 'slat', postMat: treM, roof: 'palm', roofMat: coLeaf, overhang: 0.8, stairSide: 'front', seed: 81,
        frontOpen: [{ u: 1.4, w: 0.9, y: 0, h: 1.7 }, { u: 3.5, w: 1.0, y: 0.75, h: 0.65 }], leftOpen: [{ u: 1.6, w: 0.8, y: 0.75, h: 0.6 }] });
      { const [tx, tz] = lan.f(1.0, -0.4); const top = P.table(B, tx, lan.fy, tz, 0.25, { w: 1.0, d: 0.6, h: 0.66, mat: tre });
        P.typewriter(B, tx - 0.1, top, tz + 0.02, 0.25);
        HT.model(ctx, 'vintage_oil_lamp', { x: tx + 0.36, z: tz - 0.12, y: top, h: 0.3, env: 0.6 });
        const [cx, cz] = lan.f(1.0, 0.25); P.stool(B, cx, lan.fy, cz, 0.25, { mat: tre });
        const [bx, bz] = lan.f(-1.3, -0.3); B.box(tre, 1.9, 0.4, 0.95, bx, lan.fy, bz, 0.25 + Math.PI / 2);
        B.box(HT.solid(0x5a6a58, { rough: 0.95 }), 0.8, 0.08, 0.9, bx, lan.fy + 0.4, bz - 0.3, 0.25 + Math.PI / 2);
        const [hx, hz] = lan.f(-0.2, -1.55); B.add(HT.solid(0x7a7258, { rough: 0.9 }), new T.SphereGeometry(0.17, 16, 8, 0, 6.283, 0, Math.PI / 2), { x: hx, y: lan.fy + 1.55, z: hz, sy: 0.6 });
        const l = new T.PointLight(0xffd8a8, 5, 6, 1.5); l.position.set(tx, lan.fy + 1.6, tz); ctx.add(l); }
      /* vườn hoa nhỏ trước lán */
      { const [gx, gz] = lan.f(0, 4.3); const gw = 3.2, gd = 1.4;
        const fr = A.frame(gx, gz, 0.25);
        for (const [a, b2] of [[[-gw / 2, -gd / 2], [gw / 2, -gd / 2]], [[gw / 2, -gd / 2], [gw / 2, gd / 2]], [[gw / 2, gd / 2], [-gw / 2, gd / 2]], [[-gw / 2, gd / 2], [-gw / 2, -gd / 2]]]) { const [ax, az] = fr(a[0], a[1]), [bx2, bz2] = fr(b2[0], b2[1]); B.beam(tre, ax, H(ax, az) + 0.08, az, bx2, H(bx2, bz2) + 0.08, bz2, 0.06, 0.06, { round: true, seg: 6 }); }
        const n = 140, stem = new T.InstancedMesh(new T.CylinderGeometry(0.006, 0.008, 1, 4).translate(0, 0.5, 0), HT.solid(0x3a5a24, { rough: 0.9 }), n);
        const head = new T.InstancedMesh(new T.IcosahedronGeometry(0.045, 0), new T.MeshStandardMaterial({ roughness: 0.7 }), n);
        const cols = [0xf4f0e6, 0xf2c830, 0xd83a2a, 0xe87aa0, 0xf6e8a0], m4 = new T.Matrix4(), c = new T.Color();
        for (let i = 0; i < n; i++) { const [x, z] = fr(r.range(-gw / 2 + 0.15, gw / 2 - 0.15), r.range(-gd / 2 + 0.15, gd / 2 - 0.15)); const y = H(x, z), h = r.range(0.25, 0.55);
          m4.makeScale(1, h, 1).setPosition(x, y, z); stem.setMatrixAt(i, m4); m4.makeScale(1, 0.7, 1).setPosition(x, y + h, z); head.setMatrixAt(i, m4); head.setColorAt(i, c.setHex(r.pick(cols))); }
        stem.castShadow = head.castShadow = true; ctx.add(stem); ctx.add(head);
        N.grass(ctx, { rect: [gx - 2, gz - 2, gx + 2, gz + 2], density: 30, kind: 'lawn', mask: (x, z) => { const dx = x - gx, dz = z - gz, u = dx * Math.cos(0.25) - dz * Math.sin(0.25), v = dx * Math.sin(0.25) + dz * Math.cos(0.25); return Math.abs(u) < gw / 2 && Math.abs(v) < gd / 2 ? 0.9 : 0; }, seed: 9, far: 24 }); }

      /* ---------------- LÁN HỌP BỘ CHÍNH TRỊ ---------------- */
      const hop = A.stiltHouse(ctx, B, { x: 11, z: -24, ry: -0.2, w: 7.4, d: 5.0, floorY: 0.35, eave: 2.2, ridge: 4.2, veranda: 0, wall: 'bamboo', floorKind: 'plank', postMat: post, roof: 'palm', roofMat: coLeaf, overhang: 1.0, stairSide: 'front', stairW: 1.4, seed: 82,
        frontOpen: [{ u: 1.6, w: 1.2, y: 0, h: 1.9 }, { u: 3.9, w: 1.6, y: 0.8, h: 0.9 }, { u: 6.0, w: 1.2, y: 0.8, h: 0.9 }], leftOpen: [{ u: 2.5, w: 1.4, y: 0.8, h: 0.9 }], rightOpen: [{ u: 2.5, w: 1.4, y: 0.8, h: 0.9 }] });
      const dbp = HT.canvasTex('ban_do_dbp_1953', 1024, 720, (g, Wd, Hd) => {
        g.fillStyle = '#e6dcc0'; g.fillRect(0, 0, Wd, Hd);
        const rr = HT.rng(77); g.strokeStyle = 'rgba(140,100,60,0.55)'; g.lineWidth = 2;
        for (let k = 0; k < 9; k++) { g.beginPath(); for (let a = 0; a <= 6.3; a += 0.1) { const R = 60 + k * 38 + Math.sin(a * 3 + k) * 18; const x = Wd / 2 + Math.cos(a) * R * 1.45, y = Hd / 2 + Math.sin(a) * R; a === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
        g.fillStyle = 'rgba(220,210,170,0.9)'; g.beginPath(); g.ellipse(Wd / 2, Hd / 2, 170, 300, 0.1, 0, 6.283); g.fill();
        g.strokeStyle = '#2a5a8a'; g.lineWidth = 6; g.beginPath(); g.moveTo(Wd / 2 - 40, 40); g.bezierCurveTo(Wd / 2 + 60, 220, Wd / 2 - 60, 450, Wd / 2 + 30, Hd - 40); g.stroke();
        g.fillStyle = '#555'; g.fillRect(Wd / 2 - 110, Hd / 2 - 150, 22, 230);
        g.strokeStyle = '#c01a14'; g.lineWidth = 4; const pts = [['Him Lam', 610, 170], ['Độc Lập', 520, 70], ['Bản Kéo', 380, 120], ['Mường Thanh', 470, 360], ['Hồng Cúm', 500, 640]];
        g.font = `bold 22px ${HT.FONT_SANS}`; g.fillStyle = '#8a1a14';
        for (const [n, x, y] of pts) { g.beginPath(); g.arc(x, y, 16, 0, 6.283); g.stroke(); g.fillText(n, x + 22, y + 7); }
        g.fillStyle = '#1a1a1a'; g.font = `bold 34px ${HT.FONT_SERIF}`; g.fillText('ĐIỆN BIÊN PHỦ · 12/1953', 40, 60);
        g.font = `20px ${HT.FONT_SERIF}`; g.fillText('Nậm Rốm', Wd / 2 + 40, 250);
        for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(90,70,40,' + (0.05 + rr() * 0.08) + ')'; g.beginPath(); g.arc(rr() * Wd, rr() * Hd, rr() * 30, 0, 6.283); g.fill(); }
      });
      { const go = P.M.go(); const [tx, tz] = hop.f(0, 0);   /* bàn họp đặt giữa hai hàng cột lán (z = ±0,83) */
        const top = P.table(B, tx, hop.fy, tz, -0.2, { w: 3.0, d: 1.1, h: 0.76, mat: go }); ctx.colBox(tx, tz, 3.0, 1.1, -0.2, hop.fy, hop.fy + 1);
        for (const dz of [-1.13, 1.13]) { const [bx, bz] = hop.f(0, dz); P.bench(B, bx, hop.fy, bz, -0.2, { w: 2.8, mat: go }); }
        for (const dx of [-1.95, 1.95]) { const [bx, bz] = hop.f(dx, 0); P.stool(B, bx, hop.fy, bz, -0.2, { mat: go }); }
        B.add(new T.MeshStandardMaterial({ map: dbp, roughness: 0.85 }), HT.geoBox(1.4, 0.004, 0.98), { x: tx, y: top + 0.003, z: tz, ry: -0.2 + 0.04, uv: 'keep' });
        HT.model(ctx, 'vintage_oil_lamp', { x: tx + 1.15 * Math.cos(-0.2), z: tz - 1.15 * Math.sin(-0.2), y: top, h: 0.32, env: 0.6 });
        HT.model(ctx, 'tea_set_01', { x: tx - 1.1 * Math.cos(-0.2), z: tz + 1.1 * Math.sin(-0.2), y: top, h: 0.13, env: 0.7 });
        const paper = new T.MeshStandardMaterial({ color: 0xece2c8, roughness: 0.9 });
        for (let k = 0; k < 5; k++) { const [qx, qz] = hop.f(-0.9 + k * 0.45, 0.25 * (k % 2 ? 1 : -1)); B.add(paper, HT.geoBox(0.21, 0.004, 0.29), { x: qx, y: top + 0.002, z: qz, ry: r.range(-0.4, 0.4) }); }
        const [wx, wz] = hop.f(0, -2.42); const wm = new T.Mesh(new T.PlaneGeometry(1.7, 1.2), new T.MeshStandardMaterial({ map: dbp, roughness: 0.85 })); wm.position.set(wx, hop.fy + 1.5, wz); wm.rotation.y = -0.2; ctx.add(wm);
        const l = new T.PointLight(0xffd8a8, 8, 9, 1.4); const [lx, lz] = hop.f(0, -0.3); l.position.set(lx, hop.fy + 2.0, lz); ctx.add(l); }
      P.flag(ctx, 16.5, H(16.5, -19.5), -19.5, { kind: 'vn', pole: 7, w: 1.8, amp: 0.14, poleMat: treM, base: false });

      /* ---------------- HẦM TRÚ ẨN ---------------- */
      { const ey = H0(HX, HZ + 8) - 1.1, zE = HZ + 2.5;
        const log = HT.mat('bark_brown_01', { tile: 0.8, color: 0xc8b8a0 });
        for (const dx of [-0.9, 0.9]) B.cyl(log, 0.11, 0.12, 2.1, HX + dx, ey - 0.1, zE, 8, { col: true });
        B.beam(log, HX - 1.25, ey + 1.95, zE, HX + 1.25, ey + 1.95, zE, 0.22, 0.22, { round: true, seg: 8 });
        for (let k = 0; k < 4; k++) B.beam(log, HX - 1.2, ey + 2.2 + k * 0.001, zE - 0.3 - k * 0.3, HX + 1.2, ey + 2.2, zE - 0.3 - k * 0.3, 0.18, 0.18, { round: true, seg: 7 });
        B.box(HT.solid(0x0b0a09, { rough: 1 }), 1.7, 1.95, 0.1, HX, ey - 0.1, zE - 0.9, 0);
        B.box(HT.mat('brown_mud_rocks_01', { tile: 1.2, color: 0x9a8a78 }), 2.2, 2.4, 1.2, HX, ey - 0.2, zE - 1.5, 0);
        for (const sd of [-1, 1]) for (let k = 0; k < 7; k++) { const z = zE + 0.5 + k * 0.8; B.cyl(tre, 0.035, 0.04, 1.3, HX + sd * 1.0, H(HX + sd * 1.0, z) - 1.1, z, 6); }
        for (const sd of [-1, 1]) B.beam(tre, HX + sd * 1.0, H(HX + sd, zE + 5.5) - 0.05, zE + 5.5, HX + sd * 1.0, ey + 0.6, zE + 0.4, 0.05, 0.05, { round: true, seg: 5 });
        ctx.colSeg(HX - 1.2, zE - 0.2, HX + 1.2, zE - 0.2, 0.3, -5, 20); }
      N.rocks(ctx, [{ x: HX - 3, z: HZ + 1, s: 1.2, sy: 0.7, seed: 301 }, { x: HX + 3.2, z: HZ + 0.5, s: 1.0, sy: 0.6, seed: 302 }], HT.mat('mossy_rock', { tile: 1.4, color: 0xc8ccb8 }));

      /* ---------------- LÁN CẢNH VỆ, BẾP HOÀNG CẦM ---------------- */
      A.stiltHouse(ctx, B, { x: 22, z: -11, ry: -0.6, w: 4.2, d: 3.0, floorY: 0.9, eave: 1.8, ridge: 3.2, veranda: 0.8, wall: 'bamboo', floorKind: 'slat', postMat: treM, roof: 'palm', roofMat: coLeaf, overhang: 0.7, stairSide: 'front', seed: 83,
        frontOpen: [{ u: 1.2, w: 0.85, y: 0, h: 1.6 }] });
      { const bx = -17.5, bz = -7, by = H(bx, bz);
        for (const [dx, dz] of [[-1.5, -1.1], [1.5, -1.1], [-1.5, 1.1], [1.5, 1.1]]) B.cyl(treM, 0.07, 0.08, 2.1, bx + dx, by - 0.1, bz + dz, 7);
        A.gableRoof(B, coLeaf, { x: bx, z: bz, ry: 0.4, w: 3.8, d: 3.0, eave: by + 1.9, ridge: by + 2.8, kind: 'thatch', thick: 0.18 });
        P.hearth(B, bx, by, bz, {}); P.fire(ctx, bx, by, bz, { s: 0.35, power: 5 });
        /* rãnh dẫn khói chạy ngầm ra xa, phủ cành lá — bếp không khói */
        for (let k = 0; k < 6; k++) { const x = bx - 2 - k * 1.1, z = bz + 0.5 + k * 0.25; B.add(HT.mat('brown_mud_rocks_01', { tile: 1, color: 0x8a7a68 }), N.rockGeo(700 + k, 0.55, 0.18, 0.4, 2), { x, y: H(x, z) - 0.02, z, ry: 0.2 }); }
        HT.model(ctx, 'wooden_bucket_01', { x: bx + 1.1, z: bz - 0.7, y: by, h: 0.4, env: 0.6 });
        HT.model(ctx, 'wicker_basket_01', { x: bx - 1.0, z: bz + 0.8, y: by, h: 0.35, env: 0.6 });
        ctx.colCircle(bx, bz, 0.7); }

      /* ---------------- ĐỒI CHÈ ---------------- */
      for (let R = 3.4, k = 0; R < 22; R += 1.9, k++) {
        const pts = []; const a0 = k * 0.7;
        for (let q = 0; q <= 72; q++) { const a = a0 + (q / 72) * 6.283; pts.push([TX + Math.cos(a) * R * 1.12, TZ + Math.sin(a) * R]); }
        N.hedge(ctx, pts, { kind: 'chetau', h: 0.85, w: 0.8, dens: 4.6, col: false, color: 0x5e8a4a, trans: 0.1, seed: 30 + k });
      }

      /* ---------------- cây: cọ, nứa, rừng, chuối ---------------- */
      const huts = [[-8, -19, 6], [11, -24, 7.5], [22, -11, 5.5], [-17.5, -7, 4.5], [HX, HZ, 5], [-6, -14.5, 3]];
      const free = (x, z) => !path(x, z) && Math.abs(x - sx(z)) > 3.8 && seg(x, z, -6, -14, HX, HZ + 7) > 3.2 && Math.hypot(x - 4, z - 31) > 6 && !huts.some(([hx, hz, R]) => Math.hypot(x - hx, z - hz) < R) && Math.hypot((x - TX) / 1.12, z - TZ) > 23;
      const coP = N.scatter(91, [-25, -47, 44, 40], 110, 4.2, free);
      N.palms(ctx, 'co', coP.filter((_, i) => i % 2 === 0), { seed: 19 });
      N.trees(ctx, 'forest', coP.filter((_, i) => i % 4 === 1).map((p) => ({ x: p.x, z: p.z, s: 0.62 })), { seed: 20 });
      N.bamboo(ctx, coP.filter((_, i) => i % 4 === 3).slice(0, 10), { n: 22, h: 11, r: 1.1, seed: 21 });
      N.banana(ctx, [{ x: -13, z: -2 }, { x: -20, z: -12 }, { x: 18, z: -4 }], { seed: 22 });
      for (const p of coP.slice(0, 24)) HT.model(ctx, r() < 0.5 ? 'fern_02' : 'shrub_03', { x: p.x + 1.3, z: p.z + 0.7, h: r.range(0.6, 1.1), ry: r() * 6.28, env: 0.6 });
      const outer = N.scatter(92, [-600, -600, 600, 500], 900, 11, (x, z) => x < -30 || x > 48 || z < -52 || z > 48);
      N.palms(ctx, 'co', outer.filter((_, i) => i % 2 === 0), { seed: 23, collide: false });
      N.trees(ctx, 'forest', outer.filter((_, i) => i % 2 === 1).map((p) => ({ x: p.x, z: p.z, s: 0.72 })), { seed: 24, collide: false });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [7.8, 25.5, -0.55, 'lectern'],
        stories: [[-1.8, 20, 0.45], [7.4, 6, -0.4]],
        moc: [-1.6, 12, 0.5],
        photos: [[8.2, 16, -0.45, 1.3], [-2.4, 4, 0.45, 1.2], [6.8, -4, -0.5, 1.3], [-10, -9.5, 0.6, 1.2], [15.5, -15.5, -0.6, 1.2], [-11.5, 3, 0.2, 1.3]],
      });
      E.label(ctx, { key: 'atk', x: -1.8, z: 30, ry: 0.5, vi: 'An toàn khu Việt Bắc', en: 'The Viet Bac Safe Zone',
        text: 'Từ tháng 5/1947, Trung ương và Chính phủ lên An toàn khu Việt Bắc. Người ở và làm việc ở nhiều nơi: Khuôn Tát, Tỉn Keo (Định Hóa, Thái Nguyên), Kim Quan, Hùng Lợi (Tuyên Quang)… Tháng 2/1951, Đại hội II của Đảng họp tại Chiêm Hóa, Tuyên Quang.',
        textEn: 'From May 1947 the leadership moved to the Viet Bac Safe Zone; he lived at Khuon Tat and Tin Keo (Dinh Hoa), Kim Quan and Hung Loi (Tuyen Quang). The Second Party Congress met at Chiem Hoa in February 1951.' });
      E.label(ctx, { key: 'lanbac', x: -4.2, z: -13.2, ry: 0.35, vi: 'Lán Bác ở và làm việc', en: 'The hut where he lived and worked',
        text: 'Lán nứa nhỏ, mái lá cọ, sàn cao tránh ẩm và thú rừng; một bàn tre với chiếc máy chữ, đèn dầu, giường tre. Trước lán là vườn hoa nhỏ do Người trồng và chăm.',
        textEn: 'A small bamboo hut with a palm-leaf roof raised on stilts: a bamboo desk with a typewriter, an oil lamp, a bamboo bed, and a small flower garden he tended in front.' });
      E.label(ctx, { key: 'lanhop', x: 6.2, z: -18.6, ry: -0.2, vi: 'Lán họp Bộ Chính trị', en: 'The Politburo meeting hut',
        text: 'Ngày 6/12/1953, tại lán họp này, Bộ Chính trị do Chủ tịch Hồ Chí Minh chủ trì quyết định mở Chiến dịch Điện Biên Phủ. Bộ bàn ghế gỗ mộc, bản đồ trải trên bàn — năm tháng sau là chiến thắng 7/5/1954.',
        textEn: 'Here on 6 December 1953 the Politburo, chaired by Ho Chi Minh, decided to launch the Dien Bien Phu campaign; victory came on 7 May 1954.' });
      E.label(ctx, { key: 'ham', x: HX + 2.6, z: HZ + 9.5, ry: 0.1, vi: 'Hầm trú ẩn', en: 'Air-raid shelter',
        text: 'Hầm đào sâu vào sườn đồi, lối xuống ốp cọc tre, cửa hầm bằng gỗ tròn; giao thông hào nối hầm với các lán để tránh máy bay địch.',
        textEn: 'A shelter dug into the hillside, reached by a bamboo-staked trench, with a log-framed entrance.' });
      E.label(ctx, { key: 'bep', x: -14.2, z: -3.6, ry: 0.6, vi: 'Bếp Hoàng Cầm', en: 'The Hoang Cam smokeless stove',
        text: 'Bếp đào dưới đất, khói dẫn theo rãnh ngầm phủ cành lá tỏa ra xa, máy bay địch không phát hiện được — sáng kiến của anh nuôi Hoàng Cầm (1951).',
        textEn: 'A dug-in stove whose smoke is led away through covered channels so enemy planes could not spot it — devised by army cook Hoang Cam in 1951.' });
      E.label(ctx, { key: 'doiche', x: 15.5, z: 22, ry: -0.9, vi: 'Đồi chè Thái Nguyên', en: 'Tea hills of Thai Nguyen',
        text: 'Những đồi chè xanh và rừng cọ, rừng nứa của Định Hóa che chở cho cơ quan đầu não kháng chiến suốt chín năm.',
        textEn: 'Tea hills, palm and bamboo forests sheltered the leadership of the resistance for nine years.' });
      E.stdGates(ctx, { hub: [-8, 38, 0], prev: [-3.5, 38, 0], next: [26, -40, -0.5] });
    },
  };
})();
