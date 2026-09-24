/* GIAN 01 — LÀNG SEN (Kim Liên) và quê ngoại HOÀNG TRÙ, Nam Đàn, Nghệ An. 1890–1895 · 1901–1906.
   Dựng lại: khu vườn nhà cụ Phó bảng Nguyễn Sinh Sắc ở làng Sen — nhà tranh năm gian (dân làng góp công dựng
   năm 1901), nhà ngang ba gian (bếp, cối xay, cối giã, khung cửi), sân đất, vườn cau, bưởi, xoài, rặng tre, hàng rào
   chè tàu, cổng tre; đường làng, ruộng lúa, ao sen; bên kia cánh đồng là ngôi nhà ba gian ở Hoàng Trù, nơi Người
   chào đời. Hướng: nhà quay về nam (+z). Đơn vị: mét. */
(function () {
  const HT = window.HT;
  HT.halls.G01 = {
    sky: { hdri: 'kloofendal_48d_partly_cloudy_puresky', sunAz: 28, exposure: 0.92, fog: 0.0014, sat: 1.08, con: 1.05, bloom: 0.12 },
    spawn: { x: -6, z: 24.2, yaw: 0, pitch: -0.02 },
    map: [-48, -30, 80, 30],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo;
      const r = ctx.rng;
      const inR = (x, z, R) => x >= R[0] && x <= R[2] && z >= R[1] && z <= R[3];
      const COMP = [-26, -24, 16, 18];          // khuôn viên nhà làng Sen
      const HTRU = [34, -18, 62, 12];           // khuôn viên nhà Hoàng Trù
      const ROAD = [-90, 21.5, 100, 26];        // đường làng
      const YARD = [-16.5, 0.6, 4.5, 10.5];     // sân đất trước nhà chính
      const POND = { cx: -38, cz: 4, rx: 10, rz: 8 };
      const pondIn = (x, z, k) => ((x - POND.cx) / (POND.rx * (k || 1))) ** 2 + ((z - POND.cz) / (POND.rz * (k || 1))) ** 2;
      /* ---------------- địa hình ---------------- */
      const paddyH = (x, z) => {
        if (z < 27 || z > 120) return null;
        const gx = ((x + 64) % 16 + 16) % 16, gz = ((z - 27) % 12 + 12) % 12;
        const d = Math.min(gx, 16 - gx, gz, 12 - gz);
        return d < 0.35 ? -0.02 : d < 0.8 ? HT.lerp(-0.02, -0.45, (d - 0.35) / 0.45) : -0.45;
      };
      const hills = (x, z) => {
        const R = Math.hypot(x, z);
        let h = HT.fbm(x * 0.004 + 3, z * 0.004 - 2, 4) * 70 * HT.smooth(220, 700, R);
        h += 48 * Math.exp(-(((x + 260) / 130) ** 2 + ((z + 330) / 110) ** 2));     // núi Chung phía tây bắc
        h += 130 * Math.exp(-(((x - 120) / 420) ** 2 + ((z + 900) / 200) ** 2));    // dãy núi Đại Huệ phía bắc
        return Math.max(0, h);
      };
      const H = (x, z) => {
        let h = HT.noise(x * 0.07, z * 0.07, 1.3) * 0.08;
        const pd = paddyH(x, z);
        if (pd != null && Math.abs(x) < 400) h = pd;
        const pi = pondIn(x, z);
        if (pi < 1.6) h = HT.lerp(-1.1, h, HT.smooth(0.55, 1.6, pi));
        if (inR(x, z, ROAD)) h = 0.04;
        if (inR(x, z, [COMP[0] - 1, COMP[1] - 1, COMP[2] + 1, COMP[3] + 1])) h = 0.02 + HT.noise(x * 0.2, z * 0.2, 5) * 0.03;
        return h + hills(x, z);
      };
      const W = (x, z, h, ny) => {
        let dirt = 0, soil = 0, leaves = 0;
        if (inR(x, z, ROAD)) dirt = 1;
        if (inR(x, z, YARD)) dirt = 1;
        if (x > -7.4 && x < -4.6 && z > 10 && z < 21.6) dirt = 1;                        // lối từ cổng vào sân
        if (x > 46.6 && x < 49.4 && z > 5 && z < 21.6) dirt = 1;                        // lối vào nhà Hoàng Trù
        if (inR(x, z, [37, -3, 59, 6])) dirt = Math.max(dirt, 0.9);
        if (inR(x, z, [4, -9, 13.5, 5])) dirt = Math.max(dirt, 0.85);                   // sân trước nhà ngang
        if (z > 26.5 && z < 120 && Math.abs(x) < 400) soil = 1;
        if (z < -17 || x < -21 || x > 11) leaves = inR(x, z, COMP) ? 0.8 : 0;
        const pi = pondIn(x, z); if (pi < 1.25) soil = Math.max(soil, HT.smooth(1.25, 0.8, pi));
        dirt *= 0.85 + 0.3 * HT.noise(x * 0.5, z * 0.5, 2);
        return [HT.clamp(dirt, 0, 1), soil, leaves * (1 - dirt)];
      };
      N.terrain(ctx, {
        size: 2000, inner: 85, step: 0.5, height: H, weights: W,
        layers: [
          { slug: 'leafy_grass', tile: 2.6, rough: 0.95, tint: 0xb8d49a },
          { slug: 'dirt_floor', tile: 2.2, rough: 0.9, tint: 0xd8cdbd },
          { slug: 'farm_soil', tile: 2.4, rough: 0.8, tint: 0xd8cbb8 },
          { slug: 'forest_leaves_02', tile: 3.0, rough: 0.9 },
        ],
      });
      ctx.bounds = [[-48, -30], [80, -30], [80, 26.3], [-48, 26.3]];
      const pondPoly = []; for (let i = 0; i < 32; i++) { const a = (i / 32) * 6.283; pondPoly.push([POND.cx + Math.cos(a) * POND.rx * 1.02, POND.cz + Math.sin(a) * POND.rz * 1.02]); }
      ctx.block(pondPoly);

      /* ---------------- nước: ao sen, ruộng lúa ---------------- */
      const pw = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * 6.283; pw.push([POND.cx + Math.cos(a) * POND.rx * 1.12, POND.cz + Math.sin(a) * POND.rz * 1.12]); }
      N.waterMirror(ctx, { poly: pw, y: -0.28, color: 0x243322, distortion: 0.6, size: 3.5, speed: 0.25 });
      N.lotus(ctx, { rect: [POND.cx - POND.rx, POND.cz - POND.rz, POND.cx + POND.rx, POND.cz + POND.rz], poly: pondPoly.map(([x, z]) => [POND.cx + (x - POND.cx) * 0.9, POND.cz + (z - POND.cz) * 0.9]), y: -0.28, n: 170, flowers: 0.3, seed: 4 });
      const farPlots = [];
      for (let gx = -64; gx < 96; gx += 16) for (let gz = 27; gz < 99; gz += 12) {
        const stage = ((gx + 64) / 16 + (gz - 27) / 12) % 3 === 0 ? 'green' : 'ripe';
        const rect = [gx + 0.7, gz + 0.7, gx + 15.3, gz + 11.3];
        N.paddy(ctx, { rect, y: -0.32, stage, seed: gx * 7 + gz, sx: 0.3, sz: 0.26, lod: 'water' });
        if (gz === 27 && gx >= -32 && gx <= 16) N.paddy(ctx, { rect, y: -0.32, stage, seed: gx * 7 + gz, sx: 0.3, sz: 0.26, water: false });
        else farPlots.push({ rect, stage, y: -0.32 });
      }
      N.riceCards(ctx, farPlots, { seed: 5 });

      /* ---------------- nhà chính 5 gian (làng Sen) ---------------- */
      const B = ctx.B;
      const thatch = HT.mat('reed_roof_04', { tile: 1.6, color: 0xc2ab86 });
      const mud = HT.mat('clay_plaster', { tile: 2.4, color: 0xcfb691, env: 0.65 });
      const woodDark = HT.mat('fine_grained_wood', { tile: 1.1, color: 0xdcc4ac, env: 0.6, rot: Math.PI / 2 });
      const house = A.vnHouse(ctx, B, {
        x: -6, z: -4, ry: 0, gian: 5, gianW: 2.5, depth: 4.6, porch: 1.3, plinth: 0.28, eave: 2.2, ridge: 4.7,
        roof: 'thatch', roofMat: thatch, wallMat: mud, back: 'mud', ends: 'mud', front: 'liep', openBays: [0, 1, 2, 3, 4],
        col: woodDark, colR: 0.09, base: HT.mat('rock_wall_08', { tile: 0.8 }), plinthMat: HT.mat('dirt_floor', { tile: 2, color: 0xcdb99a }),
        floorMat: HT.mat('dirt_floor', { tile: 1.6, color: 0xb9a07e, env: 0.5 }), overhang: 0.75, roofThick: 0.26, hipK: 0.72, seed: 11,
        backOpen: [{ u: 11.2, w: 0.8, y: 0.9, h: 0.7 }],
      });
      const hy = house.y, hf = house.f;
      /* gác xép gian đầu hồi phía đông + thang */
      const [lx, lz] = hf(5.0, -0.6); B.box(HT.mat('bamboo_veneer', { tile: 0.8, env: 0.45 }), 2.3, 0.06, 3.0, lx, hy + 2.05, lz, 0);
      for (const dx of [-1.1, 1.1]) { const [bx, bz] = hf(5.0 + dx, -0.6); B.box(woodDark, 0.08, 0.1, 3.0, bx, hy + 1.95, bz, 0); }
      { const [a, b] = hf(4.1, 0.95); B.beam(HT.props.M.tre(), a, hy, b, a, hy + 2.2, b - 0.7, 0.05, 0.05, { round: true }); const [c, d] = hf(4.6, 0.95); B.beam(HT.props.M.tre(), c, hy, d, c, hy + 2.2, d - 0.7, 0.05, 0.05, { round: true }); for (let k = 1; k < 8; k++) { const t = k / 8; B.beam(HT.props.M.tre(), a, hy + 2.2 * t, b - 0.7 * t, c, hy + 2.2 * t, d - 0.7 * t, 0.03, 0.03, { round: true }); } }
      /* bàn thờ gian thứ hai + hoành phi + câu đối */
      const [ax, az] = hf(-2.5, -1.9);   /* đặt giữa gian thứ hai, không đè lên cột */
      P.altar(ctx, B, ax, hy, az, 0, { w: 1.7, d: 0.62, h: 1.08 });
      const [hx, hz] = hf(-2.5, -2.16); P.hoanhPhi(B, hx, hy + 2.05, hz, 0, '恩賜寧家', { w: 1.7, key: 'antu', tilt: 0.1 });
      for (const [cx, txt] of [[-3.62, '天地君親師'], [-1.38, '祖功宗德厚']]) { const [qx, qz] = hf(cx, -2.3 + 4.6 * 0.33 + 0.12); P.cauDoi(B, qx, hy + 0.35, qz, 0, txt, { key: 'cd' + cx, h: 1.5, w: 0.24 }); }
      const [pbx, pbz] = hf(-5.6, -2.16); P.hoanhPhi(B, pbx, hy + 1.75, pbz, 0, '副榜', { w: 0.9, key: 'phobang', tilt: 0.08, bg: '#1d2a3a', ink: '#e8c55e' });
      /* phản gỗ tiếp khách, chiếu cói */
      const [p0x, p0z] = hf(-5.0, 0.6); P.phan(B, p0x, hy, p0z, Math.PI / 2, { w: 2.0, d: 1.55, chieu: true });
      const [p1x, p1z] = hf(0, 0.5); P.phan(B, p1x, hy, p1z, Math.PI / 2, { w: 1.9, d: 1.5, chieu: true });
      const [p2x, p2z] = hf(2.5, -0.9); P.phan(B, p2x, hy, p2z, 0, { w: 1.8, d: 1.2, chieu: true });
      for (const [q, w, d] of [[[-5.0, 0.6], 1.55, 2.0], [[0, 0.5], 1.5, 1.9], [[2.5, -0.9], 1.8, 1.2]]) { const [cx, cz] = hf(q[0], q[1]); ctx.colBox(cx, cz, w, d, 0, hy, hy + 0.5); }
      /* góc học tập gian đông: án thư, ấm chén, giá sách, võng */
      const [dx0, dz0] = hf(4.4, -1.6);
      const top = P.table(B, dx0, hy, dz0, 0, { w: 1.3, d: 0.62, h: 0.52, mat: woodDark, top: 0.05, leg: 0.07 });
      ctx.colBox(dx0, dz0, 1.3, 0.62, 0, hy, hy + 0.6);
      HT.model(ctx, 'tea_set_01', { x: dx0 - 0.3, z: dz0 + 0.05, y: top, h: 0.11, env: 0.5 });
      HT.model(ctx, 'binder_notebook', { x: dx0 + 0.35, z: dz0 - 0.05, y: top, w: 0.3, env: 0.5, tint: 0xd8c8a0 });
      const [bsx, bsz] = hf(5.9, -1.95); P.bookshelf(B, bsx, hy, bsz, 0, { w: 0.9, h: 1.5, d: 0.3, shelves: 4 });
      const [m1x, m1z] = hf(3.75, 1.0), [m2x, m2z] = hf(6.2, -0.2); P.hammock(B, m1x, hy + 1.5, m1z, m2x, hy + 1.5, m2z, { sag: 0.75, color: 0xa88c62 });
      const [sx, sz] = hf(3.0, -1.6); P.stool(B, sx, hy, sz, 0.3, {});

      /* ---------------- nhà ngang 3 gian: bếp, cối, khung cửi ---------------- */
      const ng = A.vnHouse(ctx, B, {
        x: 8.8, z: -1.5, ry: -Math.PI / 2, gian: 3, gianW: 2.6, depth: 4.0, porch: 1.1, plinth: 0.2, eave: 2.1, ridge: 4.2,
        roof: 'thatch', roofMat: thatch, wallMat: mud, back: 'mud', ends: 'mud', front: 'liep', openBays: [0, 1, 2],
        col: woodDark, colR: 0.085, base: HT.mat('rock_wall_08', { tile: 0.8 }), plinthMat: HT.mat('dirt_floor', { tile: 2, color: 0xcdb99a }),
        floorMat: HT.mat('dirt_floor', { tile: 1.6, color: 0xa99070, env: 0.45 }), overhang: 0.7, roofThick: 0.25, hipK: 0.8, seed: 17,
      });
      const ny = ng.y, nf = ng.f;
      { const [x, z] = nf(-2.6, -0.4); P.hearth(B, x, ny, z, {}); P.pot(B, ...nf(-3.3, -1.2).slice(0, 1), ny, nf(-3.3, -1.2)[1], { s: 0.9 }); }
      { const [x, z] = nf(-1.9, -1.4); P.jar(B, x, ny, z, { kind: 'vai', s: 0.9, color: 0x4a3222 }); }
      { const [x, z] = nf(0.2, 0.2); P.riceMill(B, x, ny, z, {}); ctx.colCircle(x, z, 0.45, ny, ny + 1); }
      { const [x, z] = nf(0.8, -1.2); P.pestle(B, x, ny, z, -Math.PI / 2 + 0.2); }
      { const [x, z] = nf(2.6, -0.3); P.loom(B, x, ny, z, -Math.PI / 2 + Math.PI, {}); ctx.colBox(x, z, 1.1, 2.1, -Math.PI / 2, ny, ny + 1.6); }
      HT.model(ctx, 'wicker_basket_01', { x: nf(-0.6, 1.4)[0], z: nf(-0.6, 1.4)[1], y: ny, h: 0.32, env: 0.6 });
      HT.model(ctx, 'wicker_basket_02', { x: nf(1.5, 1.5)[0], z: nf(1.5, 1.5)[1], y: ny, h: 0.28, env: 0.6 });
      /* chum nước, gáo dừa trước hiên nhà ngang */
      for (const [x, z, s] of [[4.2, -5.6, 1.0], [4.0, -4.6, 0.85]]) { P.jar(B, x, 0.02, z, { s, water: true, lid: s < 1 }); ctx.colCircle(x, z, 0.36 * s); }
      B.add(HT.solid(0x4a3524, { rough: 0.6 }), new T.SphereGeometry(0.09, 12, 8, 0, 6.283, 0, 1.6), { x: 4.2, y: 0.8, z: -5.6, rx: Math.PI });
      B.beam(HT.props.M.goMoc(), 4.2, 0.79, -5.6, 4.45, 0.9, -5.2, 0.018, 0.018, { round: true });
      P.haystack(B, 12.5, 0.02, 11.0, { h: 3.0, r: 1.25 }); ctx.colCircle(12.5, 11.0, 1.35);
      P.haystack(B, 11.2, 0.02, 13.9, { h: 2.2, r: 0.9, seed: 5 }); ctx.colCircle(11.2, 13.9, 1.0);
      /* đống củi, sào tre */
      for (let i = 0; i < 14; i++) { const y0 = 0.05 + Math.floor(i / 5) * 0.09; B.beam(HT.mat('bark_brown_01', { tile: 0.6 }), 12.6, y0, -8 + (i % 5) * 0.12, 13.9, y0 + 0.02, -8 + (i % 5) * 0.12 + r.range(-0.05, 0.05), 0.045, 0.045, { round: true, seg: 6 }); }
      ctx.colBox(13.25, -7.75, 1.4, 0.7, 0, 0, 0.5);
      for (let i = 0; i < 6; i++) B.beam(HT.props.M.tre(), 14.2 + i * 0.07, 0, -3.2 + i * 0.1, 14.9 + i * 0.05, 3.6, -3.4 + i * 0.1, 0.028, 0.028, { round: true, seg: 6 });

      /* ---------------- cổng tre, hàng rào chè tàu ---------------- */
      const gateMat = HT.mat('rough_wood', { tile: 1 });
      for (const gx of [-7.4, -4.6]) { B.cyl(gateMat, 0.09, 0.1, 2.3, gx, 0, 18, 10); ctx.colCircle(gx, 18, 0.12); }
      B.beam(gateMat, -7.6, 2.25, 18, -4.4, 2.25, 18, 0.1, 0.1, { round: true });
      A.hipRoof(B, thatch, { x: -6, z: 18, w: 3.6, d: 1.5, eave: 2.3, ridge: 2.85, thick: 0.18, kind: 'thatch', seed: 3, ridgeLen: 2.2 }, thatch);
      { const lm = HT.mat('bamboo_wall_02', { tile: 1 }); B.add(lm, HT.geoBox(1.3, 1.5, 0.04), { x: -7.35 + 0.1, y: 0.85, z: 18.7, ry: -1.35 }); B.add(lm, HT.geoBox(1.3, 1.5, 0.04), { x: -4.65 - 0.1, y: 0.85, z: 18.7, ry: 1.35 }); }
      const hedgeS = [[COMP[0], COMP[3]], [-7.8, COMP[3]]], hedgeS2 = [[-4.2, COMP[3]], [COMP[2], COMP[3]]];
      N.hedge(ctx, hedgeS, { h: 1.3, w: 0.9, seed: 1, kind: 'chetau', dens: 11 }); N.hedge(ctx, hedgeS2, { h: 1.3, w: 0.9, seed: 2, kind: 'chetau', dens: 11 });
      N.hedge(ctx, [[COMP[2], COMP[3]], [COMP[2], COMP[1]]], { h: 1.35, w: 0.9, seed: 3, kind: 'chetau', dens: 11 });
      N.hedge(ctx, [[COMP[0], COMP[1]], [COMP[0], COMP[3]]], { h: 1.3, w: 0.9, seed: 4, kind: 'chetau', dens: 11 });
      N.hedge(ctx, [[COMP[0], COMP[1]], [COMP[2], COMP[1]]], { h: 1.2, w: 0.8, seed: 5, kind: 'chetau', dens: 11 });

      /* ---------------- vườn: cau, bưởi, xoài, ổi, chuối, tre ---------------- */
      const areca = []; for (let x = -21; x <= 10; x += 3.3) areca.push({ x: x + r.range(-0.4, 0.4), z: -13.5 + r.range(-0.8, 0.8) });
      areca.push({ x: -19, z: -1 }, { x: -20.5, z: 3.5 }, { x: 13.5, z: -13 }, { x: 13, z: -17 }, { x: -24, z: 15 }, { x: 14.5, z: 15.5 });
      N.palms(ctx, 'areca', areca, { seed: 3 });
      N.trees(ctx, 'mango', [{ x: -19.5, z: 8.5, s: 1.15 }, { x: -12, z: -19.5, s: 1.05 }, { x: 8.5, z: -18.5, s: 0.95 }], { seed: 5 });
      N.trees(ctx, 'citrus', [{ x: 11.5, z: 7.2 }, { x: 13.8, z: 3 }, { x: -22.5, z: -6 }, { x: -17, z: -8.5 }, { x: 3, z: -16 }], { seed: 7 });
      N.trees(ctx, 'guava', [{ x: -2.4, z: 15.2 }, { x: -11.5, z: 15.4, s: 0.9 }], { seed: 9 });
      N.banana(ctx, [{ x: 13.8, z: -10.5 }, { x: 14.7, z: -12.6 }, { x: 12.6, z: -14 }, { x: -24, z: 6 }, { x: -23.6, z: 9.6 }, { x: 15, z: -6 }], { seed: 2 });
      const bam = [];
      for (let x = -24; x <= 14; x += 6.5) bam.push({ x: x + r.range(-1, 1), z: -22.2 + r.range(-0.5, 0.5) });
      for (let z = -16; z <= 12; z += 7) bam.push({ x: -24.3 + r.range(-0.4, 0.4), z: z + r.range(-1, 1) });
      N.bamboo(ctx, bam, { n: 36, h: 12, r: 1.3, seed: 4 });

      /* ---------------- nhà Hoàng Trù (quê ngoại, nơi Người sinh ra) ---------------- */
      const ht = A.vnHouse(ctx, B, {
        x: 48, z: -5, ry: 0, gian: 3, gianW: 2.45, depth: 4.2, porch: 1.1, plinth: 0.24, eave: 2.1, ridge: 4.3,
        roof: 'thatch', roofMat: thatch, wallMat: mud, back: 'mud', ends: 'mud', front: 'liep', openBays: [0, 1, 2],
        col: woodDark, colR: 0.085, base: HT.mat('rock_wall_08', { tile: 0.8 }), plinthMat: HT.mat('dirt_floor', { tile: 2, color: 0xcdb99a }),
        floorMat: HT.mat('dirt_floor', { tile: 1.6, color: 0xb09878, env: 0.45 }), overhang: 0.7, roofThick: 0.25, hipK: 0.78, seed: 23,
      });
      { const [x, z] = ht.f(-2.45, -0.7); P.loom(B, x, ht.y, z, Math.PI / 2, {}); ctx.colBox(x, z, 2.1, 1.1, 0, ht.y, ht.y + 1.6); }
      { const [x, z] = ht.f(2.3, -1.2); P.phan(B, x, ht.y, z, 0, { w: 1.68, d: 1.0, h: 0.5, chieu: true, planks: 2 }); ctx.colBox(x, z, 1.7, 1.0, 0, ht.y, ht.y + 0.55); }
      { const [x, z] = ht.f(0, -1.6); P.altar(ctx, B, x, ht.y, z, 0, { w: 1.4, d: 0.55, h: 1.0 }); }
      { const [x, z] = ht.f(2.6, 0.9); B.box(HT.mat('lacquered_cherry_wood', { tile: 0.6, color: 0x5a2418, env: 0.6 }), 0.9, 0.45, 0.5, x, ht.y, z, 0.1, { bevel: 0.02 }); ctx.colBox(x, z, 0.9, 0.5, 0.1, ht.y, ht.y + 0.5); }
      N.hedge(ctx, [[HTRU[0], HTRU[3]], [46.8, HTRU[3]]], { h: 1.3, seed: 8, kind: 'chetau', dens: 11 }); N.hedge(ctx, [[49.2, HTRU[3]], [HTRU[2], HTRU[3]]], { h: 1.3, seed: 9, kind: 'chetau', dens: 11 });
      N.hedge(ctx, [[HTRU[0], HTRU[1]], [HTRU[0], HTRU[3]]], { h: 1.3, seed: 10, kind: 'chetau', dens: 11 }); N.hedge(ctx, [[HTRU[2], HTRU[1]], [HTRU[2], HTRU[3]]], { h: 1.3, seed: 11, kind: 'chetau', dens: 11 });
      N.bamboo(ctx, [{ x: 36, z: -16 }, { x: 43, z: -17 }, { x: 51, z: -16.5 }, { x: 59, z: -16 }, { x: 60.5, z: -8 }], { n: 34, h: 11.5, r: 1.2, seed: 9 });
      N.palms(ctx, 'areca', [{ x: 38, z: 8 }, { x: 40.5, z: 9 }, { x: 57, z: 8.5 }, { x: 59, z: 5 }, { x: 44, z: -12 }, { x: 53, z: -12.5 }], { seed: 5 });
      N.trees(ctx, 'mango', [{ x: 57.5, z: -3, s: 0.9 }], { seed: 11 });
      N.trees(ctx, 'citrus', [{ x: 38.5, z: -6 }, { x: 39, z: 1 }], { seed: 13 });
      N.banana(ctx, [{ x: 60, z: 1 }, { x: 36.5, z: 4 }], { seed: 6 });
      for (const gx of [46.8, 49.2]) { B.cyl(gateMat, 0.08, 0.09, 2.1, gx, 0, 12, 10); ctx.colCircle(gx, 12, 0.11); }
      B.beam(gateMat, 46.6, 2.05, 12, 49.4, 2.05, 12, 0.09, 0.09, { round: true });

      /* ---------------- xóm làng xung quanh (nền) ---------------- */
      const vil = [[-44, -44, 0.15], [-18, -48, -0.1], [22, -50, 0.2], [66, -40, -0.3], [-70, -14, Math.PI / 2 + 0.1], [88, -18, -Math.PI / 2], [30, -30, 0.05]];
      for (const [x, z, ry] of vil) {
        const vh = A.vnHouse(ctx, B, { x, z, ry, gian: 3, gianW: 2.4, depth: 4, porch: 1, plinth: 0.2, eave: 1.8, ridge: 3.9, roof: 'thatch', roofMat: thatch, wallMat: mud, front: 'mud', openBays: [1], col: woodDark, overhang: 0.65, seed: Math.round(x * 7 + z) });
        { /* bày biện trong nhà hàng xóm: bàn thờ gian giữa, phản gian bên, chum nước, ghế đẩu */
          const hy = vh.y;
          const [ax, az] = vh.f(0, -1.45); P.table(B, ax, hy, az, ry, { w: 1.1, d: 0.45, h: 0.9, mat: woodDark, top: 0.05, leg: 0.06 }); ctx.colBox(ax, az, 1.1, 0.45, ry, hy, hy + 0.9);
          const [bx, bz] = vh.f(-2.35, -0.35); P.phan(B, bx, hy, bz, ry + Math.PI / 2, { w: 1.8, d: 1.2, chieu: true }); ctx.colBox(bx, bz, 1.2, 1.8, ry, hy, hy + 0.5);
          const [cx, cz] = vh.f(2.4, -1.2); P.jar(B, cx, hy, cz, { kind: 'vai', s: 0.75, color: 0x4a3222 }); ctx.colCircle(cx, cz, 0.3);
          const [sx, sz] = vh.f(0.7, 0.2); P.stool(B, sx, hy, sz, ry + 0.3, {});
        }
        N.bamboo(ctx, [{ x: x - 8, z: z - 5 }, { x: x + 8, z: z - 6 }, { x: x, z: z - 9 }], { n: 30, h: 11, r: 1.2, seed: Math.round(x) });
        N.palms(ctx, 'areca', [{ x: x - 5, z: z + 5 }, { x: x + 5, z: z + 5.5 }], { seed: Math.round(z) });
      }
      /* lũy tre làng, xóm xa nơi chân trời: từng cụm tre + cây ăn quả + mái nhà */
      const rr = HT.rng(77);
      const farBam = [], farTree = [], farMango = [];
      for (let i = 0; i < 34; i++) {
        const a = (i / 34) * 6.283 + rr.range(-0.08, 0.08);
        const R = rr.range(105, 230);
        const cx = Math.cos(a) * R + 10, cz = Math.sin(a) * R;
        if (cz > 20 && cz < 100 && cx > -70 && cx < 100) continue;
        const n = rr.int(4, 8);
        for (let k = 0; k < n; k++) farBam.push({ x: cx + rr.range(-14, 14), z: cz + rr.range(-10, 10), s: rr.range(0.9, 1.25) });
        for (let k = 0; k < rr.int(2, 4); k++) (rr() < 0.5 ? farTree : farMango).push({ x: cx + rr.range(-12, 12), z: cz + rr.range(-9, 9), s: rr.range(0.9, 1.2) });
        if (rr() < 0.45) A.vnHouse(ctx, B, { x: cx + rr.range(-4, 4), z: cz + rr.range(-3, 3), ry: rr.range(-0.4, 0.4), gian: 3, gianW: 2.4, depth: 4, porch: 0.8, plinth: 0.15, eave: 2.0, ridge: 4.0, roof: 'thatch', roofMat: thatch, wallMat: mud, front: 'mud', col: woodDark, overhang: 0.6, seed: i, truss: false });
      }
      N.bamboo(ctx, farBam, { n: 30, h: 13, r: 1.6, seed: 31, collide: false });
      N.trees(ctx, 'forest', farTree, { seed: 33, collide: false });
      N.trees(ctx, 'mango', farMango, { seed: 35, collide: false });
      /* cây trên bờ ruộng, bờ ao */
      N.palms(ctx, 'areca', [{ x: -30, z: 16 }, { x: -46, z: 12 }, { x: -44, z: -6 }], { seed: 21 });
      N.trees(ctx, 'banyan', [{ x: 92, z: 12, s: 1.0 }], { seed: 41, collide: false });

      /* ---------------- cỏ ---------------- */
      const noGrass = (x, z) => inR(x, z, YARD) || inR(x, z, ROAD) || (x > -7.6 && x < -4.4 && z > 10) || inR(x, z, [-13.5, -8.2, 1.5, 0.8]) || inR(x, z, [4, -7.5, 13.8, 5]) || inR(x, z, [43, -9, 53, 1.2]) || (x > 46.4 && x < 49.6 && z > 1);
      N.grass(ctx, { rect: [-26, -24, 16, 18], density: 10, mask: (x, z) => (noGrass(x, z) ? 0 : 0.55 + 0.45 * HT.noise(x * 0.15, z * 0.15, 7)), seed: 3 });
      N.grass(ctx, { rect: [34, -18, 62, 12], density: 10, mask: (x, z) => (noGrass(x, z) ? 0 : 0.7), seed: 4 });
      N.grass(ctx, { rect: [-48, -30, 80, 21.4], density: 5, kind: 'grass', mask: (x, z) => (inR(x, z, COMP) || inR(x, z, HTRU) || pondIn(x, z) < 1.05 ? 0 : 0.8), seed: 5 });
      N.grass(ctx, { rect: [-90, 25.8, 100, 27.2], density: 8, kind: 'tall', mask: () => 1, seed: 6 });
      N.grass(ctx, { rect: [POND.cx - 13, POND.cz - 11, POND.cx + 13, POND.cz + 11], density: 7, kind: 'reed', mask: (x, z) => { const p = pondIn(x, z); return p > 0.85 && p < 1.25 ? 1 : 0; }, seed: 7 });
      N.rocks(ctx, [{ x: -8.8, z: 19.6, s: 0.35 }, { x: -3.1, z: 19.8, s: 0.3 }, { x: POND.cx + 9, z: POND.cz + 6, s: 0.6 }], HT.mat('mossy_rock', { tile: 1.5, color: 0xe0e0d8 }));

      /* ---------------- đồ vật ngoài sân: nia phơi thóc, chổi, ghế ---------------- */
      const nia = HT.mat('bamboo_wall_02', { tile: 0.5, color: 0xb8a078 });
      const thoc = HT.solid(0xc9a64a, { rough: 0.95 });
      for (const [x, z, rr] of [[1.8, 6.5, 0.55], [3.0, 7.6, 0.5], [0.6, 7.8, 0.5]]) {
        B.add(nia, new T.CylinderGeometry(rr, rr * 0.97, 0.05, 28), { x, y: 0.05, z, uv: 'box' });
        B.add(thoc, new T.CylinderGeometry(rr * 0.9, rr * 0.9, 0.012, 28), { x, y: 0.085, z, noShadow: true });
        B.add(nia, new T.TorusGeometry(rr, 0.02, 6, 28), { x, y: 0.08, z, rx: Math.PI / 2 });
      }
      HT.model(ctx, 'wooden_broom', { x: 5.2, z: -8.1, ry: 0.4, h: 1.35, env: 0.6 });
      HT.model(ctx, 'wooden_bucket_01', { x: 4.9, z: -4.0, h: 0.4, env: 0.6 });
      P.stool(B, -1.3, 0.02, 2.2, 0.3, { mat: HT.mat('rough_wood', { tile: 1 }) });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [-10.6, 20.4, 0],
        stories: [[-15.2, 4.8, Math.PI / 2], [3.2, 4.8, -Math.PI / 2]],
        moc: [-11.2, 12.8, 0.3],
        photos: [[45, 15.2, 0, 1.3], [-13.6, 8.6, 0.7], [41, 5, Math.PI / 2], [1.4, 8.8, -0.7], [-28.5, 12.5, -0.6, 1.1]],
      });
      E.label(ctx, { key: 'nha5', x: -12.5, z: 2.2, ry: 0.25, vi: 'Nhà tranh năm gian', en: 'The five-room thatched house',
        text: 'Năm 1901, khi ông Nguyễn Sinh Sắc đỗ Phó bảng, dân làng Kim Liên góp công dựng ngôi nhà này cho gia đình. Nhà vách đất, mái rạ, cửa liếp tre chống lên bằng sào; một bên là nơi thờ tự, tiếp khách, đầu hồi là chỗ ông Sắc dạy học.',
        textEn: 'Built by Kim Lien villagers in 1901 when Nguyen Sinh Sac earned the Pho bang degree: mud walls, straw thatch, bamboo shutters propped open on poles.' });
      E.label(ctx, { key: 'banTho', x: -7.9, z: -0.2, y: hy, ry: 0.15, vi: 'Bàn thờ và bức hoành phi', en: 'Ancestral altar and lacquered board',
        text: 'Gian thờ đặt hương án, bát hương, chân nến. Phía trên treo bức hoành phi bốn chữ Hán "Ân tứ ninh gia" 恩賜寧家; trên cột là câu đối. Bức nhỏ "Phó bảng" 副榜 ghi học vị của chủ nhà.',
        textEn: 'Incense altar with the lacquered board "An tu ninh gia" above it and parallel scrolls on the pillars; a small board reads "Pho bang", the host\'s degree.' });
      E.label(ctx, { key: 'hoc', x: -1.2, z: 1.4, y: hy, ry: -0.5, vi: 'Góc học và bàn trà', en: 'Study corner and tea table',
        text: 'Gian đầu hồi phía đông: án thư thấp, ấm chén, giá sách, chiếc võng đay. Ở đây Tất Thành học chữ Hán cùng cha và nghe các bậc cha chú bàn chuyện nước.',
        textEn: 'A low desk, tea set, bookshelf and hammock, where young Tat Thanh studied Chinese characters with his father.' });
      E.label(ctx, { key: 'ngang', x: 3.4, z: -9.2, ry: -1.2, vi: 'Nhà ngang: bếp, cối, khung cửi', en: 'Side house: kitchen, mill, loom',
        text: 'Nhà ngang ba gian là nơi nấu ăn, xay lúa, giã gạo và dệt vải. Chum nước, gáo dừa đặt trước hiên. Nghề dệt là sinh kế của nhiều phụ nữ xứ Nghệ; bà Hoàng Thị Loan dệt vải nuôi chồng con ăn học.',
        textEn: 'The three-room side house held the kitchen, rice mill, pounder and loom; water jars and a coconut-shell dipper stand by the porch.' });
      E.label(ctx, { key: 'hoangtru', x: 44.2, z: 5.2, ry: -0.35, vi: 'Nhà ba gian ở Hoàng Trù', en: 'The three-room house at Hoang Tru',
        text: 'Quê ngoại Hoàng Trù, cách làng Sen khoảng 2 km. Ông bà ngoại dựng ngôi nhà nhỏ này cho vợ chồng ông Nguyễn Sinh Sắc; ngày 19/5/1890 cậu bé Nguyễn Sinh Cung chào đời tại đây. Trong nhà: khung cửi của bà Hoàng Thị Loan, giường nhỏ, bàn thờ.',
        textEn: 'At his mother\'s village of Hoang Tru, about 2 km away, Nguyen Sinh Cung was born on 19 May 1890 in this small house; inside are his mother\'s loom and a small bed.' });
      E.label(ctx, { key: 'ao', x: -27.2, z: 8.6, ry: -1.1, vi: 'Ao sen làng Sen', en: 'Lotus pond',
        text: 'Làng Sen mang tên loài hoa mọc khắp ao đầm quanh làng. Mùa hè sen nở hồng cả mặt ao, hương thơm lan theo gió đồng.',
        textEn: 'Sen village is named after the lotus flowers that fill its ponds every summer.' });

      /* ---------------- cổng chuyển gian ---------------- */
      E.stdGates(ctx, { hub: [-24, 23.8, Math.PI / 2], next: [72, 23.8, Math.PI / 2] });
    },
  };
})();
