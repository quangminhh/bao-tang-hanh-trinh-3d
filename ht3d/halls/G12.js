/* GIAN 12 — PÁC BÓ, HÀ QUẢNG, CAO BẰNG (1941 – 1945).
   Dựng lại: thung lũng Pác Bó giữa các chóp núi đá vôi phủ rừng; suối Lê-nin nước trong xanh ngọc chảy trên lòng cuội,
   hai bờ đá phủ rêu, cỏ lau; núi Các Mác sừng sững bên suối; hang Cốc Bó dưới chân vách đá — cửa hang thấp, trong có
   giường ván, bếp lửa nhỏ, chiếc hòm gỗ; "bàn đá chông chênh" bên bờ suối nơi Người làm việc, dịch sách; cột mốc biên giới
   108 ở đầu thung lũng; lán Khuổi Nặm dựng bằng tre nứa, mái lá cọ trong rừng. Sáng sớm sương mù vùng núi đá.
   Trục: suối chảy theo −z → +z (từ đầu nguồn phía bắc xuống nam); núi Các Mác ở phía tây (−x). */
(function () {
  const HT = window.HT;
  HT.halls.G12 = {
    sky: { hdri: 'kloofendal_38d_partly_cloudy_puresky', sunAz: 20, sunDir: [0.16, 0.883, 0.44], exposure: 1.08, fog: 0.003, sat: 1.04, con: 1.05, bloom: 0.14, shadowSize: 60, tint: [0.98, 1.01, 1.02] },
    spawn: { x: 10, z: 34, yaw: 0.05, pitch: 0.02 },
    map: [-48, -60, 48, 48],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo;
      const B = ctx.B, r = ctx.rng;
      const CX = -17, CZ = -44;                    // cửa hang Cốc Bó
      const sx = (z) => 4 * Math.sin(z * 0.045) + 2.2 * Math.sin(z * 0.11 + 1.3);
      const sw = (z) => 2.6 + 1.2 * (0.5 + 0.5 * Math.sin(z * 0.07 + 0.4));
      const H = (x, z) => {
        const d = Math.abs(x - sx(z)) - sw(z);
        let h = 0.35 + HT.noise(x * 0.06, z * 0.06, 2) * 0.25 + HT.fbm(x * 0.02, z * 0.02, 3) * 1.2;
        h += HT.smooth(24, 70, Math.abs(x)) * 14 * (0.6 + 0.4 * HT.noise(x * 0.01, z * 0.01, 5));
        h += HT.smooth(40, 90, -z) * 10;
        if (d < 1.4) h = HT.lerp(-0.85 + HT.noise(x * 0.4, z * 0.4, 7) * 0.08, h, HT.smooth(-0.6, 1.4, d));
        const dc = Math.hypot(x - CX, (z - CZ + 3) * 1.2);
        if (dc < 7.5) h = HT.lerp(0.55, h, HT.smooth(5, 7.5, dc));
        h += HT.fbm(x * 0.004, z * 0.004, 4) * 60 * HT.smooth(180, 600, Math.hypot(x, z));
        return h;
      };
      const W = (x, z, h) => {
        const d = Math.abs(x - sx(z)) - sw(z);
        const bed = d < 0.4 ? 1 : 0;
        const bank = d >= 0.4 && d < 2.2 ? 1 : 0;
        const path = Math.abs(x - sx(z) - 7) < 0.9 && z > -40 && z < 46 ? 0.9 : 0;
        return [path, bed, bank * 0.8 + (h > 3 ? 0.4 : 0)];
      };
      N.terrain(ctx, { size: 1800, inner: 110, step: 0.45, height: H, weights: W, layers: [
        { slug: 'rocky_terrain_02', tile: 3, tint: 0xc0d0a0, rough: 0.95 },
        { slug: 'stony_dirt_path', tile: 2.0, tint: 0xd8ccb8, rough: 0.9 },
        { slug: 'ganges_river_pebbles', tile: 1.6, tint: 0xd8e0d8, rough: 0.6 },
        { slug: 'mossy_rock', tile: 2.4, tint: 0xc8d0b8, rough: 0.85 },
      ], macro: 0.12 });
      ctx.bounds = [[-30, -52], [30, -52], [30, 46], [-30, 46]];
      /* suối Lê-nin: nước trong nhìn thấy đáy cuội */
      const L = [], R2 = [];
      for (let z = -120; z <= 140; z += 2) { L.push([sx(z) - sw(z) - 0.3, z]); R2.push([sx(z) + sw(z) + 0.3, z]); }
      const poly = L.concat(R2.reverse());
      N.waterClear(ctx, { poly, y: -0.38, color: 0xd6fff0, attColor: 0x1f9a86, attDist: 1.1, thickness: 0.7, ripple: 1.4, flow: [0.0, 0.09] });
      /* hai đoạn chặn lòng suối, chừa chỗ cầu tre ở z = 20 */
      for (const [za, zb] of [[-54, 18.6], [21.4, 48]]) { const sb = []; for (let z = za; z <= zb; z += 1) sb.push([sx(z) - sw(z) + 0.2, z]); for (let z = zb; z >= za; z -= 1) sb.push([sx(z) + sw(z) - 0.2, z]); ctx.block(sb); }
      /* cầu tre bắc qua suối */
      { const bz = 20, x0 = sx(bz) - sw(bz) - 1.6, x1 = sx(bz) + sw(bz) + 1.6, by = 0.42;
        const tre = HT.props.M.tre();
        for (let k = -3; k <= 3; k++) B.beam(tre, x0, by, bz + k * 0.19, x1, by, bz + k * 0.19, 0.09, 0.09, { round: true, seg: 6 });
        for (const x of [x0 + 0.8, (x0 + x1) / 2, x1 - 0.8]) for (const sd of [-0.75, 0.75]) B.cyl(tre, 0.05, 0.05, 1.9, x, -0.9, bz + sd, 6);
        for (const sd of [-0.75, 0.75]) B.beam(tre, x0 + 0.8, by + 0.9, bz + sd, x1 - 0.8, by + 0.9, bz + sd, 0.05, 0.05, { round: true, seg: 5 });
        ctx.floorRect((x0 + x1) / 2, bz, x1 - x0, 1.4, by + 0.05, 0); }
      /* đá ven suối phủ rêu, cỏ lau */
      const rockM = HT.mat('mossy_rock', { tile: 1.6, color: 0xd8dccc });
      const brocks = [];
      for (let z = -52; z < 46; z += 1.8) for (const sd of [-1, 1]) if (r() < 0.55) { const x = sx(z) + sd * (sw(z) + r.range(-0.4, 0.8)); brocks.push({ x, z: z + r.range(-0.6, 0.6), s: r.range(0.35, 1.0), sy: r.range(0.25, 0.6), y: H(x, z) - 0.25, col: false }); }
      N.rocks(ctx, brocks, rockM);
      N.grass(ctx, { rect: [-30, -52, 30, 46], density: 9, kind: 'grass', mask: (x, z) => { const d = Math.abs(x - sx(z)) - sw(z); return d < 0.6 ? 0 : d < 3 ? 0.9 : 0.55; }, seed: 3, far: 44 });
      N.grass(ctx, { rect: [-30, -52, 30, 46], density: 4, kind: 'reed', mask: (x, z) => { const d = Math.abs(x - sx(z)) - sw(z); return d > 0.2 && d < 1.6 ? 0.8 : 0; }, seed: 5, far: 36 });

      /* ---------------- núi đá vôi: núi Các Mác và các chóp quanh thung lũng ---------------- */
      const ks = [
        { x: -52, z: -2, r: 26, h: 92, seed: 3, col: true }, { x: 48, z: -30, r: 22, h: 70, seed: 5, col: true }, { x: 30, z: -78, r: 26, h: 88, seed: 7 },
        { x: -40, z: -80, r: 30, h: 110, seed: 9 }, { x: 58, z: 36, r: 24, h: 64, seed: 11 }, { x: -58, z: 52, r: 26, h: 76, seed: 13 },
      ];
      for (let i = 0; i < 26; i++) { const a = r() * 6.283, d = r.range(120, 420); ks.push({ x: Math.cos(a) * d, z: Math.sin(a) * d - 60, r: r.range(30, 60), h: r.range(70, 170), seed: 20 + i }); }
      N.karst(ctx, ks, { slug: 'marble_cliff_03', tile: 10, veg: 1.0, vegBias: 0.4, patch: 0.7, jag: 0.14, ridges: 0.1, streak: 0.3, color: 0xa8c4ff, greenHex: 0x4a6c36, rock: [1, 1, 0.98] });
      E.sign(ctx, B, { key: 'nuicacmac', text: 'Núi Các Mác', x: -26.2, y: 1.6, z: 2, ry: Math.PI / 2, w: 1.8, h: 0.42, bg: '#2a3a2a', ink: '#f0e8c8', font: HT.FONT_SERIF });
      B.box(HT.solid(0x3a3a34, { rough: 0.6 }), 0.1, 1.4, 0.1, -26.3, 0, 2, 0);

      /* ---------------- HANG CỐC BÓ (vách đá phía bắc, đầu nguồn) ---------------- */
      const cliff = []; for (let i = 0; i < 14; i++) { const a = -0.3 + (i / 13) * 3.7; cliff.push({ x: CX + Math.cos(a) * r.range(6, 9), z: CZ - 4 + Math.sin(-a) * r.range(3, 6) - 3, sx: r.range(3, 5), sy: r.range(4, 8), sz: r.range(3, 5), seed: 70 + i, y: H(CX, CZ) - 1 }); }
      N.rocks(ctx, cliff, HT.mat('mossy_rock', { tile: 3.0, color: 0xe0e0d8 }));
      /* lòng hang: vòm đá nhìn từ bên trong */
      { const g = new T.SphereGeometry(4.2, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1.3, 0.72, 1.0);
        const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = HT.noise(x * 0.6, y * 0.6, z * 0.6) * 0.35; p.setXYZ(i, x * (1 + n), y * (1 + n * 0.6), z * (1 + n)); } g.computeVertexNormals();
        const m = HT.mat('mossy_rock', { tile: 2.0, color: 0xc4c4bc, side: T.BackSide });
        const cave = new T.Mesh(g, m); cave.position.set(CX, H(CX, CZ) - 0.2, CZ - 3.2); cave.receiveShadow = true; ctx.add(cave); }
      /* cửa hang thấp: khung đá hai bên + mái đá */
      N.rocks(ctx, [{ x: CX - 2.3, z: CZ, sx: 1.3, sy: 2.4, sz: 1.6, seed: 91 }, { x: CX + 2.4, z: CZ + 0.2, sx: 1.4, sy: 2.6, sz: 1.5, seed: 92 }, { x: CX, z: CZ - 0.6, sx: 3.6, sy: 1.2, sz: 1.8, seed: 93, y: H(CX, CZ) + 1.9, col: false }], HT.mat('mossy_rock', { tile: 2.4, color: 0xd8d8d0 }));
      const gy = H(CX, CZ);
      ctx.floorRect(CX, CZ - 3, 7.5, 6, gy, 0);
      ctx.colSeg(CX - 5.2, CZ - 6.4, CX + 5.2, CZ - 6.4, 0.4, -5, 20); ctx.colSeg(CX - 5.2, CZ - 6.4, CX - 3.4, CZ + 0.2, 0.4, -5, 20); ctx.colSeg(CX + 5.2, CZ - 6.4, CX + 3.6, CZ + 0.2, 0.4, -5, 20);
      /* đồ trong hang: giường ván kê đá, bếp lửa nhỏ, hòm gỗ */
      { const plank = HT.mat('weathered_brown_planks', { tile: 1.0, color: 0xe8d8c0 });
        for (const [dx, dz] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) B.box(HT.mat('mossy_rock', { tile: 0.8, color: 0xd8d8d0 }), 0.3, 0.35, 0.3, CX - 2.2 + dx, gy, CZ - 4.2 + dz, 0);
        B.box(plank, 1.9, 0.06, 0.9, CX - 2.2, gy + 0.35, CZ - 4.2, 0);
        ctx.colBox(CX - 2.2, CZ - 4.2, 1.9, 0.9, 0, gy, gy + 0.5);
        P.fire(ctx, CX + 1.4, gy, CZ - 3.6, { s: 0.45, power: 6, stones: true });
        HT.model(ctx, 'treasure_chest', { x: CX + 2.4, z: CZ - 5.0, y: gy, h: 0.4, ry: -0.3, env: 0.5 });
        HT.model(ctx, 'wooden_bowl_01', { x: CX + 1.9, z: CZ - 2.8, y: gy, h: 0.1, env: 0.5 });
        const l = new T.PointLight(0xffc890, 5, 7, 1.6); l.position.set(CX, gy + 2.2, CZ - 3.2); ctx.add(l); }
      E.sign(ctx, B, { key: 'cocbo', text: 'HANG CỐC BÓ', x: CX, y: gy + 2.6, z: CZ + 0.8, w: 2.2, h: 0.4, bg: '#20281e', ink: '#eadfb8', font: HT.FONT_SERIF });

      /* ---------------- BÀN ĐÁ CHÔNG CHÊNH bên suối ---------------- */
      { const bz = -12, bx = sx(bz) + sw(bz) + 1.6, by = H(bx, bz);
        const slab = N.rockGeo(501, 1.1, 0.18, 0.7, 3); B.add(HT.mat('mossy_rock', { tile: 1.4, color: 0xe4e4dc }), slab, { x: bx, y: by + 0.72, z: bz, ry: 0.3 });
        N.rocks(ctx, [{ x: bx, z: bz, sx: 0.5, sy: 0.72, sz: 0.4, seed: 502, y: by }, { x: bx + 1.05, z: bz + 0.3, sx: 0.45, sy: 0.42, sz: 0.4, seed: 503, y: by }], HT.mat('mossy_rock', { tile: 1, color: 0xd8dccc }));
        HT.model(ctx, 'binder_notebook', { x: bx - 0.2, z: bz + 0.05, y: by + 0.88, h: 0.03, ry: 0.4, env: 0.6 });
        HT.model(ctx, 'book_encyclopedia_set_01', { x: bx + 0.35, z: bz - 0.15, y: by + 0.88, h: 0.08, ry: 0.2, env: 0.6 });
        ctx.colCircle(bx, bz, 0.9); }
      /* cột mốc 108 */
      { const mx = sx(-50) + 9, mz = -49, my = H(mx, mz);
        B.box(HT.ashlar('moc108', { color: 0xd8d4c8, joint: 0xa8a498, bw: 0.4, bh: 0.2, speck: 0.12 }), 0.45, 1.25, 0.3, mx, my, mz, 0.2, { col: true });
        E.sign(ctx, B, { key: 'moc108', text: '108', x: mx + Math.sin(0.2) * 0.16, y: my + 0.95, z: mz + Math.cos(0.2) * 0.16, ry: 0.2, w: 0.34, h: 0.18, bg: '#d8d4c8', ink: '#2a2a2a', font: HT.FONT_SANS }); }

      /* ---------------- LÁN KHUỔI NẶM (tre nứa, mái lá cọ) ---------------- */
      const lan = A.stiltHouse(ctx, B, { x: 22, z: -18, ry: -0.5, w: 4.2, d: 3.2, floorY: 1.1, eave: 1.8, ridge: 3.2, veranda: 0, wall: 'bamboo', floorKind: 'slat', postMat: HT.mat('bamboo_veneer', { tile: 0.8, color: 0xb8a878 }), roof: 'palm', roofMat: HT.mat('reed_roof_03', { tile: 1.4, color: 0x9a9070 }), overhang: 0.7, stairSide: 'front', seed: 31,
        frontOpen: [{ u: 2.1, w: 0.9, y: 0, h: 1.6 }] });
      { const [tx, tz] = lan.f(0.9, -0.6); P.table(B, tx, lan.fy, tz, -0.5, { w: 0.9, d: 0.5, h: 0.6, mat: P.M.tre() }); HT.model(ctx, 'vintage_oil_lamp', { x: tx, z: tz, y: lan.fy + 0.6, h: 0.3, env: 0.6 }); }

      /* ---------------- rừng: cây gỗ, tre, chuối rừng, dương xỉ, cọ ---------------- */
      const forest = N.scatter(61, [-30, -52, 30, 46], 70, 5.5, (x, z) => Math.abs(x - sx(z)) - sw(z) > 3.5 && Math.hypot(x - CX, z - CZ) > 9 && Math.hypot(x - 22, z + 18) > 6 && Math.abs(x - sx(z) - 7) > 2.2 && Math.abs(z - 20) > 3 && !(z > 26 && x > 4));
      N.trees(ctx, 'forest', forest.filter((_, i) => i % 3 === 0).map((p) => ({ x: p.x, z: p.z, s: 0.55 + (((p.x * 13 + p.z * 7) % 10) + 10) % 10 / 40 })), { seed: 12 });
      N.bamboo(ctx, forest.filter((_, i) => i % 3 === 1).slice(0, 10), { n: 22, h: 10, r: 1.0, seed: 6 });
      N.banana(ctx, forest.filter((_, i) => i % 3 === 2).slice(0, 12), { seed: 7 });
      N.palms(ctx, 'co', forest.filter((_, i) => i % 3 === 2).slice(12, 20), { seed: 8 });
      for (const p of forest.slice(0, 30)) HT.model(ctx, r() < 0.5 ? 'fern_02' : 'shrub_03', { x: p.x + 1.4, z: p.z + 0.8, h: r.range(0.6, 1.2), ry: r() * 6.28, env: 0.6 });
      const outer = N.scatter(62, [-260, -300, 260, 200], 260, 12, (x, z) => Math.abs(x) > 34 || z < -56 || z > 50);
      N.trees(ctx, 'forest', outer.map((p) => ({ x: p.x, z: p.z, s: 0.7 })), { seed: 13, collide: false });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [14, 30, -0.35, 'lectern'],
        stories: [[17, 12, -Math.PI / 2 + 0.3], [16, -6, -Math.PI / 2 - 0.2]],
        moc: [16, 22, -0.8],
        quote: [sx(-12) + sw(-12) + 3.6, -8, -Math.PI / 2 + 0.6],
        photos: [[CX + 6, CZ + 5, -0.7, 1.3], [sx(0) + sw(0) + 2.4, 2, -Math.PI / 2, 1.3]],
      });
      E.label(ctx, { key: 'venuoc', x: 13, z: 36.5, ry: Math.PI + 0.2, vi: 'Trở về Tổ quốc (28/1/1941)', en: 'Return to the homeland, 28 January 1941',
        text: 'Sau 30 năm bôn ba, ngày 28/1/1941 Nguyễn Ái Quốc vượt cột mốc 108 về nước, ở Pác Bó. Tháng 5/1941, Người chủ trì Hội nghị Trung ương 8, thành lập Mặt trận Việt Minh, mở lớp huấn luyện, ra báo Việt Nam độc lập.',
        textEn: 'After thirty years abroad he crossed border marker 108 on 28 January 1941. In May 1941 he chaired the 8th Central Committee meeting at Pac Bo, which founded the Viet Minh.' });
      E.label(ctx, { key: 'hang', x: CX + 3.8, z: CZ + 3.2, ry: 0.5, vi: 'Hang Cốc Bó', en: 'Coc Bo cave',
        text: 'Từ ngày 8/2/1941 Người sống trong hang Cốc Bó ẩm lạnh, nằm trên giường ghép bằng ván, sưởi bằng bếp lửa nhỏ. Người đặt tên cho dòng suối là suối Lê-nin, ngọn núi là núi Các Mác.',
        textEn: 'From 8 February 1941 he lived in this damp cave on a plank bed by a small fire. He named the stream after Lenin and the mountain after Marx.' });
      E.label(ctx, { key: 'banda', x: sx(-12) + sw(-12) + 3.2, z: -14.6, ry: -Math.PI / 2 + 0.2, vi: 'Bàn đá bên suối Lê-nin', en: 'The stone table by Lenin Stream',
        text: 'Hằng ngày Người ngồi làm việc bên phiến đá cạnh suối: viết tài liệu huấn luyện, dịch sách, soạn báo. Cảnh sống thanh bạch ấy đi vào bài thơ “Tức cảnh Pác Bó”.',
        textEn: 'He worked every day at this rock by the stream, writing, translating and editing — the scene of his poem “Pac Bo, a view”.' });
      E.label(ctx, { key: 'lan', x: 19, z: -13, ry: 0.4, vi: 'Lán Khuổi Nặm', en: 'Khuoi Nam hut',
        text: 'Lán nhỏ dựng bằng tre nứa trong rừng, nơi Người ở và làm việc khi địch lùng sục gắt gao; tại đây diễn ra Hội nghị Trung ương 8 (5/1941).',
        textEn: 'A small bamboo hut in the forest where he stayed when patrols came near; the May 1941 Central Committee meeting took place here.' });
      E.stdGates(ctx, { hub: [26, 42, -Math.PI / 4], prev: [20.5, 44.5, 0], next: [-24, 30, Math.PI / 2] });
    },
  };
})();
