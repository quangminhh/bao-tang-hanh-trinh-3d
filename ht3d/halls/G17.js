/* GIAN 17 — DI SẢN: LĂNG CHỦ TỊCH HỒ CHÍ MINH và QUẢNG TRƯỜNG BA ĐÌNH (khánh thành 29/8/1975).
   Lăng cao 21,6 m, ba lớp: bệ dưới có hai khán đài bậc cấp hai bên; giữa là hàng cột vuông đá hoa cương xám bao quanh;
   trên là mái bậc. Dòng chữ "CHỦ TỊCH HỒ-CHÍ-MINH" bằng đá đỏ trên diềm mặt trước. Quảng trường là các ô cỏ vuông
   chia bằng lối đi; cột cờ giữa quảng trường; hàng tre và cây vạn tuế hai bên lăng.
   Trục: lăng ở phía bắc (−z) quay mặt về quảng trường (+z). */
(function () {
  const HT = window.HT;
  HT.halls.G17 = {
    sky: { hdri: 'kloofendal_38d_partly_cloudy_puresky', sunAz: 18, exposure: 0.95, fog: 0.0012, sat: 1.05, con: 1.06, bloom: 0.12, shadowSize: 60 },
    spawn: { x: 6, z: 58, yaw: 0.068, pitch: 0.06 },
    map: [-75, -75, 75, 95],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo;
      const B = ctx.B, r = ctx.rng;
      const MZ = -30;                         // mặt trước bệ lăng ở z = MZ + 15
      /* ---------------- nền: ô cỏ quảng trường ---------------- */
      const cell = 8.2, path = 1.4;
      const inSquare = (x, z) => Math.abs(x) < 60 && z > -6 && z < 92;
      const lawn = (x, z) => {
        if (!inSquare(x, z)) return 0;
        if (Math.abs(x) < 4.5) return 0;                                 // đường giữa quảng trường
        if (Math.hypot(x, z - 50) < 7) return 0;                         // chân cột cờ
        const gx = ((x + 1000) % (cell + path)), gz = ((z + 1000) % (cell + path));
        return gx < cell && gz < cell ? 1 : 0;
      };
      const H = (x, z) => HT.fbm(x * 0.003, z * 0.003, 3) * 25 * HT.smooth(250, 800, Math.hypot(x, z));
      const W = (x, z) => {
        const l = lawn(x, z);
        const plaza = Math.abs(x) < 60 && z > -48 && z < 96 ? 1 - l : 0;
        const road = Math.abs(z - 98) < 6 || Math.abs(x) > 64 && Math.abs(x) < 72 ? 1 : 0;
        return [plaza * 0.95, road, 0];
      };
      N.terrain(ctx, { size: 1600, inner: 110, step: 0.6, height: H, weights: W, layers: [
        { slug: 'leafy_grass', tile: 2.4, tint: 0x9cc47a, rough: 0.95 },
        { slug: 'concrete_pavement', tile: 3.2, tint: 0xd4dbe4, rough: 0.75 },
        { slug: 'worn_asphalt', tile: 3, tint: 0x9a9a9a, rough: 0.8 },
        { slug: 'forest_leaves_02', tile: 3 },
      ], macro: 0.12 });
      ctx.bounds = [[-66, -52], [66, -52], [66, 100], [-66, 100]];
      N.grass(ctx, { rect: [-60, -6, 60, 92], density: 14, kind: 'lawn', mask: (x, z) => lawn(x, z), seed: 4, far: 30, cell: 10 });

      /* ---------------- LĂNG ---------------- */
      const grey = HT.ashlar('lang', { color: 0xa4a6a6, joint: 0x6c6e6e, bw: 1.6, bh: 0.8, rough: 0.34, speck: 0.16, vary: 0.6 });
      const greyD = HT.ashlar('langD', { color: 0x8a8c8c, joint: 0x5c5e5e, bw: 1.6, bh: 0.46, rough: 0.34, speck: 0.16, vary: 0.6 });
      const dark = HT.mat('granite_tile', { tile: 1.4, color: 0x3a3836, rough: 0.35, env: 1.2 });
      const red = HT.solid(0x6e1e1a, { rough: 0.25, env: 1.2 });
      const z0 = MZ;
      /* bệ */
      B.box(dark, 41.2, 1.0, 32, 0, 0, z0, 0, { col: true });
      /* khán đài bậc cấp hai bên (7 bậc) */
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 7; i++) {
          const w = 8.1 - i * 1.02, h = 0.46 * (i + 1);
          B.box(greyD, w, 0.46, 22, sd * (12.5 + (8.1 - w) + w / 2) - sd * (8.1 - w) , 1.0 + i * 0.46, z0 - 1, 0);
        }
        ctx.colBox(sd * 16.5, z0 - 1, 8.2, 22, 0, 0, 5);
      }
      /* khối giữa (lễ đài) có cửa vào */
      A.wall(B, ctx, dark, { x0: -12.5, z0: z0 + 11, x1: 12.5, z1: z0 + 11, y0: 1.0, h: 3.8, t: 0.6, open: [{ u: 12.5, w: 3.6, y: 0, h: 3.0, blocked: true }] });
      B.box(dark, 25, 3.8, 22, 0, 1.0, z0 - 0.3, 0);
      B.box(HT.solid(0x141414, { rough: 0.3, env: 1 }), 3.6, 3.0, 0.1, 0, 1.0, z0 + 10.66, 0);
      B.box(grey, 26, 0.35, 23.5, 0, 4.8, z0, 0);
      /* hàng cột vuông quanh */
      const S = 23, np = 6;
      B.box(HT.solid(0x2a2a2c, { rough: 0.3, env: 1.2 }), 17, 10.4, 17, 0, 5.15, z0, 0);
      for (let i = 0; i < np; i++) {
        const t = -S / 2 + (S * i) / (np - 1);
        for (const [x, z] of [[t, z0 + S / 2], [t, z0 - S / 2], [-S / 2, z0 + t], [S / 2, z0 + t]]) B.box(grey, 1.3, 10.4, 1.3, x, 5.15, z, 0);
      }
      /* diềm + dòng chữ */
      B.box(grey, 24.6, 1.8, 24.6, 0, 15.55, z0, 0);
      const ins = HT.canvasTex('lang_chu', 2400, 180, (g, Wc, Hc) => {
        g.clearRect(0, 0, Wc, Hc); g.fillStyle = '#6e1e1a'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `bold 120px ${HT.FONT_SANS}`; g.fillText('CHỦ TỊCH HỒ-CHÍ-MINH', Wc / 2, Hc / 2 + 6);
      });
      const insM = new T.Mesh(new T.PlaneGeometry(17, 1.28), new T.MeshStandardMaterial({ map: ins, transparent: true, roughness: 0.3, envMapIntensity: 1.1 }));
      insM.position.set(0, 16.45, z0 + 12.31); ctx.add(insM);
      /* mái bậc */
      B.box(grey, 25.6, 0.9, 25.6, 0, 17.35, z0, 0);
      B.box(grey, 22, 1.1, 22, 0, 18.25, z0, 0);
      B.box(grey, 18.4, 1.2, 18.4, 0, 19.35, z0, 0);
      B.box(greyD, 15.6, 1.05, 15.6, 0, 20.55, z0, 0);
      ctx.colBox(0, z0, 26, 24, 0, 0, 30);
      /* lối đi đá trước lăng, bậc thềm */
      for (let i = 0; i < 3; i++) B.box(dark, 30 - i * 2, 0.16, 1.2, 0, 0.16 * i, z0 + 16.8 - i * 1.2, 0);
      ctx.ramp(0, z0 + 19, 0, z0 + 15.8, 26, 0, 0.48);

      /* ---------------- tre hai bên, vạn tuế, hoa sứ ---------------- */
      const bam = [];
      for (let z = z0 - 22; z <= z0 + 12; z += 4.2) for (const sd of [-1, 1]) bam.push({ x: sd * r.range(26, 28), z: z + r.range(-0.8, 0.8) });
      for (let x = -24; x <= 24; x += 4.5) bam.push({ x: x + r.range(-1, 1), z: z0 - 24 + r.range(-0.8, 0.8) });
      N.bamboo(ctx, bam, { n: 30, h: 12, r: 1.3, seed: 7 });
      const cyc = [];
      for (let i = 0; i < 20; i++) for (const sd of [-1, 1]) cyc.push({ x: sd * (6.5 + (i % 2) * 2.2), z: z0 + 20 + i * 1.8 });
      for (let x = -20; x <= 20; x += 3.2) cyc.push({ x, z: z0 + 18.2 });
      N.palms(ctx, 'cycad', cyc.slice(0, 79), { seed: 9 });
      N.trees(ctx, 'frangi', [{ x: -8.5, z: z0 + 16.5, s: 1.1 }, { x: 8.5, z: z0 + 16.5, s: 1.1 }], { seed: 2 });
      /* cây xa: hàng sấu, cây xanh quanh quảng trường */
      const around = [];
      for (let z = -40; z <= 96; z += 9) for (const sd of [-1, 1]) around.push({ x: sd * 68 + r.range(-1, 1), z: z + r.range(-2, 2) });
      for (let x = -60; x <= 60; x += 9) around.push({ x: x + r.range(-2, 2), z: 104 + r.range(-1, 1) });
      N.trees(ctx, 'forest', around, { seed: 11, collide: false });
      const far = [];
      for (let i = 0; i < 70; i++) { const a = (i / 70) * 6.283; far.push({ x: Math.cos(a) * r.range(120, 200), z: Math.sin(a) * r.range(120, 200) + 20 }); }
      N.trees(ctx, 'forest', far, { seed: 12, collide: false });
      N.trees(ctx, 'banyan', [{ x: -44, z: -40, s: 0.9 }, { x: 46, z: -42, s: 0.85 }], { seed: 13, collide: false });

      /* ---------------- cột cờ giữa quảng trường ---------------- */
      B.box(HT.mat('large_floor_tiles_02', { tile: 2, color: 0xe8e6e2 }), 6, 0.35, 6, 0, 0, 50, 0);
      B.box(HT.mat('large_floor_tiles_02', { tile: 2, color: 0xe8e6e2 }), 4.2, 0.35, 4.2, 0, 0.35, 50, 0);
      ctx.colBox(0, 50, 6, 6, 0, -1, 1);
      P.flag(ctx, 0, 0.7, 50, { kind: 'vn', pole: 25, w: 6.5, amp: 0.25, base: false });
      /* ghế đá, đèn quảng trường */
      for (let z = 4; z <= 86; z += 14) for (const sd of [-1, 1]) P.gasLamp(B, ctx, sd * 5.2, 0, z, { h: 4.2, mat: HT.solid(0x2c2c2a, { rough: 0.4, metal: 0.7 }) });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [-8, 64, Math.PI + 0.3],
        stories: [[-10.2, 38, Math.PI / 2 + 0.2], [10.2, 38, -Math.PI / 2 - 0.2]],
        moc: [8, 64, Math.PI - 0.3],
        photos: [[-10.5, 26, Math.PI / 2], [10.5, 26, -Math.PI / 2], [-10.5, 16, Math.PI / 2], [10.5, 16, -Math.PI / 2], [10.5, 46, -Math.PI / 2]],
        quote: [0, 12, Math.PI],
      });
      E.label(ctx, { key: 'lang', x: -5.2, z: z0 + 24, ry: Math.PI + 0.25, vi: 'Lăng Chủ tịch Hồ Chí Minh', en: 'Ho Chi Minh Mausoleum',
        text: 'Khởi công ngày 2/9/1973, khánh thành ngày 29/8/1975 trên nền lễ đài năm 1945. Lăng cao 21,6 m, ba lớp: bệ có hai khán đài, hàng cột vuông đá hoa cương bao quanh phòng thi hài, mái bậc. Đá, gỗ quý được mang về từ mọi miền đất nước.',
        textEn: 'Built 1973–1975 on the site of the 1945 rostrum; 21.6 m high, clad in grey granite, with stone and precious woods from every region.' });
      E.label(ctx, { key: 'qt', x: 5.4, z: 70, ry: Math.PI - 0.3, vi: 'Quảng trường Ba Đình', en: 'Ba Dinh Square',
        text: 'Nơi Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập ngày 2/9/1945. Quảng trường gồm các ô cỏ vuông chia bởi lối đi, cột cờ ở giữa; hằng ngày có lễ thượng cờ và hạ cờ.',
        textEn: 'Where the Declaration of Independence was read on 2 September 1945; lawns divided by paths, with a flagpole at the centre.' });
      E.stdGates(ctx, { hub: [0, 96, 0], prev: [-30, 96, 0] });
    },
  };
})();
