/* GIAN 02 — HUẾ: TRƯỜNG QUỐC HỌC và SÔNG HƯƠNG (1908).
   Dựng lại theo hiện trạng năm 1908: cổng trường hai tầng (dựng 1897) với biển sơn son thếp vàng 國學 "Quốc Học",
   các dãy lớp học nhà tranh vách đất (dãy trước dài, dãy sau ngắn hơn) quanh sân rộng — dãy nhà gạch đỏ chỉ có từ 1915;
   đường ven sông, bến và thuyền; bên kia sông Hương là tường Kinh thành và Kỳ Đài cắm cờ; phía đông là cầu Trường Tiền
   (cầu Clémenceau, 1899) sáu nhịp vòm thép. Trục: +z = nam; sông ở phía bắc (−z). */
(function () {
  const HT = window.HT;
  HT.halls.G02 = {
    sky: { hdri: 'qwantani_mid_morning_puresky', sunAz: 95, exposure: 0.92, fog: 0.0016, sat: 1.07, con: 1.05, bloom: 0.14 },
    spawn: { x: 0, z: -22, yaw: Math.PI, pitch: -0.02 },
    map: [-62, -40, 62, 46],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      const BANK = -30;                          // mép bờ nam sông Hương
      const RIVER_W = 210;
      const H = (x, z) => {
        let h = 0.4 + HT.noise(x * 0.05, z * 0.05, 4) * 0.1;
        if (z < BANK + 3) h = HT.lerp(-1.8, h, HT.smooth(BANK - 3, BANK + 3, z));
        if (z < BANK - RIVER_W + 6) h = HT.lerp(0.8, -1.8, HT.smooth(BANK - RIVER_W, BANK - RIVER_W + 6, z));
        h += HT.fbm(x * 0.003, z * 0.003, 3) * 60 * HT.smooth(500, 1100, Math.hypot(x, z - 200));
        return h;
      };
      const ROAD = [-600, BANK + 3, 600, BANK + 11];
      const inR = (x, z, R) => x >= R[0] && x <= R[2] && z >= R[1] && z <= R[3];
      const W = (x, z) => {
        const road = inR(x, z, ROAD) ? 1 : 0;
        const yard = inR(x, z, [-44, 16, 44, 36]) || (Math.abs(x) < 2.5 && z > BANK + 10 && z < 18) ? 1 : 0;
        const bank = z < BANK + 3.5 && z > BANK - 4 ? 1 : 0;
        return [Math.max(road, yard * 0.9), bank, 0];
      };
      N.terrain(ctx, { size: 2000, inner: 90, step: 0.55, height: H, weights: W, layers: [
        { slug: 'leafy_grass', tile: 2.5, tint: 0xa8c48c, rough: 0.95 },
        { slug: 'coast_sand_01', tile: 2.4, tint: 0xf0e6d4, rough: 0.9 },
        { slug: 'brown_mud_rocks_01', tile: 2.2, rough: 0.85 },
        { slug: 'forest_leaves_02', tile: 3 },
      ] });
      ctx.bounds = [[-62, BANK + 1.5], [62, BANK + 1.5], [62, 46], [-62, 46]];
      N.waterMirror(ctx, { poly: N.rectPoly(-900, BANK - RIVER_W - 4, 900, BANK + 2), y: -0.6, color: 0x243a3a, distortion: 0.9, size: 1.2, speed: 0.35 });
      N.grass(ctx, { rect: [-62, BANK + 11, 62, 46], density: 6, mask: (x, z) => (W(x, z)[0] > 0.3 ? 0 : 0.8), seed: 3, far: 46 });
      N.grass(ctx, { rect: [-62, BANK - 2, 62, BANK + 3.2], density: 7, kind: 'tall', mask: () => 0.8, seed: 5 });

      /* ---------------- cổng Quốc Học (1897) ---------------- */
      const gz = 8;
      const brick = HT.mat('red_bricks_04', { tile: 1.3, color: 0xb88a78 });
      const plaster = HT.mat('white_plaster_02', { tile: 2, color: 0xe8e0cc, env: 0.8 });
      const lac = HT.solid(0x7a1a14, { rough: 0.4 });
      const tile = HT.mat('roof_07', { tile: 1.2, color: 0xa87458 });
      const tileY = HT.mat('clay_roof_tiles_02', { tile: 1.2, color: 0xd4a44a });
      const wood = HT.mat('fine_grained_wood', { tile: 1, color: 0xf2dcc4, env: 0.6, rot: Math.PI / 2 });
      /* tầng dưới: khối gạch vữa có vòm cửa giữa */
      A.arcadeWall(B, plaster, { x: 0, z: gz, y: 0.4, n: 1, span: 3.2, pier: 2.4, h: 5.2, spring: 3.6, t: 3.2 });
      ctx.colBox(-2.8, gz, 2.4, 3.2, 0, -1, 6); ctx.colBox(2.8, gz, 2.4, 3.2, 0, -1, 6);
      B.box(plaster, 8.4, 0.3, 3.6, 0, 5.6, gz, 0);
      /* tầng trên: lầu gỗ mái ngói hai lớp, biển Quốc Học */
      for (const sx of [-2.8, -0.9, 0.9, 2.8]) for (const sz of [-1.3, 1.3]) A.column(B, lac, sx, 5.9, gz + sz, 0.13, 3.2, { base: plaster, baseH: 0.1 });
      A.railing(B, lac, [[-3.9, gz + 1.7], [3.9, gz + 1.7]], 5.9, { h: 0.8, spacing: 0.22, r: 0.03, square: true });
      A.railing(B, lac, [[-3.9, gz - 1.7], [3.9, gz - 1.7]], 5.9, { h: 0.8, spacing: 0.22, r: 0.03, square: true });
      A.hipRoof(B, tile, { x: 0, z: gz, w: 9.8, d: 5.4, eave: 8.9, ridge: 11.2, thick: 0.14, kind: 'tile', pitch: 0.2, amp: 0.025, ridgeLen: 4.8, ridgeMat: HT.solid(0xb09a7a, { rough: 0.7 }), ridgeR: 0.14 }, wood);
      A.hipRoof(B, tile, { x: 0, z: gz, w: 10.6, d: 6.2, eave: 7.2, ridge: 8.1, thick: 0.12, kind: 'tile', pitch: 0.2, amp: 0.02, ridgeLen: 7.2 }, wood);
      /* đầu đao cong ở bốn góc mái trên */
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const pts = [new T.Vector3(sx * 4.3, 8.95, gz + sz * 2.1), new T.Vector3(sx * 5.0, 9.05, gz + sz * 2.8), new T.Vector3(sx * 5.3, 9.6, gz + sz * 3.1)];
        B.add(HT.solid(0xb09a7a, { rough: 0.7 }), HT.taperTube(pts, [0.12, 0.1, 0.05], 8), { uv: 'keep' });
      }
      const qh = P.hoanhPhiTex('quochoc', '國學', { bg: '#8a1a12' });
      for (const side of [1, -1]) {
        const m = new T.Mesh(new T.PlaneGeometry(2.2, 0.8), new T.MeshStandardMaterial({ map: qh, roughness: 0.35, envMapIntensity: 1.0 }));
        m.position.set(0, 8.3, gz + side * 1.75); m.rotation.y = side > 0 ? 0 : Math.PI; ctx.add(m);
      }
      /* tường rào thấp hai bên cổng */
      for (const sd of [-1, 1]) {
        A.wall(B, ctx, plaster, { x0: sd * 4.2, z0: gz, x1: sd * 46, z1: gz, y0: 0.4, h: 1.5, t: 0.35 });
        for (let x = 8; x < 46; x += 6) { B.box(plaster, 0.55, 2.0, 0.55, sd * x, 0.4, gz, 0); }
      }
      A.fence(B, null, HT.solid(0x1e1e1e, { rough: 0.5, metal: 0.6 }), [[-46, gz], [-4.2, gz]], { kind: 'sat', h: 0.9, y: 1.9, col: false });
      A.fence(B, null, HT.solid(0x1e1e1e, { rough: 0.5, metal: 0.6 }), [[4.2, gz], [46, gz]], { kind: 'sat', h: 0.9, y: 1.9, col: false });
      for (const sd of [-1, 1]) ctx.colBox(sd * 25, gz + 46, 0.4, 76, 0, -1, 3);

      /* ---------------- dãy lớp học nhà tranh vách đất ---------------- */
      const thatch = HT.mat('reed_roof_04', { tile: 1.6, color: 0xb8a078 });
      const mud = HT.mat('clay_plaster', { tile: 2.4, color: 0xd4bc98, env: 0.65 });
      const front = A.vnHouse(ctx, B, { x: 0, z: 40, ry: Math.PI, gian: 18, gianW: 3.2, depth: 6, porch: 1.6, plinth: 0.35, eave: 2.3, ridge: 5.0, roof: 'thatch', roofMat: thatch, wallMat: mud, back: 'mud', ends: 'mud', front: 'songdo', openBays: [3, 7, 8, 9, 10, 14], col: wood, colR: 0.1, base: HT.mat('rock_wall_08', { tile: 0.8 }), plinthMat: brick, floorMat: HT.mat('terracotta_floor_tiles', { tile: 1.2, color: 0xc89878, env: 0.5 }), overhang: 0.8, roofThick: 0.3, seed: 5, truss: false });
      for (const sd of [-1, 1]) A.vnHouse(ctx, B, { x: sd * 41, z: 22, ry: -sd * Math.PI / 2, gian: 6, gianW: 3.2, depth: 5.6, porch: 1.4, plinth: 0.35, eave: 2.3, ridge: 4.8, roof: 'thatch', roofMat: thatch, wallMat: mud, back: 'mud', ends: 'mud', front: 'songdo', openBays: [2, 3], col: wood, colR: 0.1, base: HT.mat('rock_wall_08', { tile: 0.8 }), plinthMat: brick, floorMat: HT.mat('terracotta_floor_tiles', { tile: 1.2, color: 0xc89878, env: 0.5 }), overhang: 0.8, roofThick: 0.3, seed: 7 + sd, truss: false });
      /* lớp học bên trong gian giữa: bàn ghế, bảng */
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { const [a, b] = front.f(-4.6 + j * 3.1, -0.6 - i * 1.3 + 0.6); P.schoolDesk(B, a, front.y, b, Math.PI, { w: 2.2 }); ctx.colBox(a, b, 2.2, 0.8, 0, front.y, front.y + 0.9); }
      { const [a, b] = front.f(0, -2.85); P.blackboard(B, a, front.y + 0.9, b, 0, 'quochoc', [['Leçon de français', 70], ['Le maître — thầy giáo', 56], ['La patrie — Tổ quốc', 56]], { w: 2.6, h: 1.2 }); }
      /* cây trong sân, cây ven sông */
      N.trees(ctx, 'forest', [{ x: -30, z: 26, s: 0.8 }, { x: 30, z: 27, s: 0.75 }, { x: -18, z: 14, s: 0.6 }, { x: 18, z: 15, s: 0.62 }], { seed: 3 });
      N.trees(ctx, 'mango', [{ x: -40, z: -8 }, { x: 40, z: -6 }, { x: -52, z: 12 }], { seed: 4 });
      N.palms(ctx, 'areca', [{ x: -10, z: 30 }, { x: 10, z: 30.5 }, { x: -34, z: 34 }, { x: 34, z: 34 }], { seed: 5 });
      const riverTrees = []; for (let x = -60; x <= 60; x += 12) if (Math.abs(x) > 6) riverTrees.push({ x: x + r.range(-2, 2), z: BANK + 12.5 + r.range(-0.5, 0.5), s: r.range(0.65, 0.8) });
      N.trees(ctx, 'forest', riverTrees, { seed: 6 });
      N.bamboo(ctx, [{ x: -58, z: 40 }, { x: -58, z: 30 }, { x: 58, z: 38 }, { x: 58, z: 28 }], { n: 30, h: 11, r: 1.2, seed: 2 });

      /* ---------------- bến sông, thuyền ---------------- */
      B.box(HT.mat('rock_wall_08', { tile: 1.5 }), 8, 1.6, 3, -16, -1.6, BANK + 0.5, 0);
      for (let i = 0; i < 5; i++) B.box(HT.mat('rock_wall_08', { tile: 1.2 }), 4, 0.2, 0.5, -16, -0.2 - i * 0.28, BANK - 0.8 - i * 0.5, 0);
      VV.sampan(ctx, B, -12, -0.62, BANK - 6, 0.1, { L: 8 });
      VV.sampan(ctx, B, 6, -0.62, BANK - 9, -0.2, {});
      VV.sampan(ctx, B, 30, -0.62, BANK - 34, 0.6, { L: 9 });
      VV.sampan(ctx, B, -40, -0.62, BANK - 60, -0.4, { mui: false });

      /* ---------------- bờ bắc: tường Kinh thành, Kỳ Đài ---------------- */
      const NB = BANK - RIVER_W;
      const cwall = HT.mat('large_red_bricks', { tile: 2, color: 0x9a8a78 });
      B.box(cwall, 1400, 6.5, 12, 0, H(0, NB - 30) - 0.5, NB - 30, 0);
      for (let x = -700; x < 700; x += 8) B.box(cwall, 3.4, 1.2, 1.2, x, H(0, NB - 30) + 6, NB - 24.6, 0);
      /* Kỳ Đài: ba tầng bệ gạch + cột cờ */
      const kx = -40, kz = NB - 20;
      B.box(cwall, 60, 6, 40, kx, H(kx, kz), kz, 0); B.box(cwall, 38, 5.5, 26, kx, H(kx, kz) + 6, kz, 0); B.box(cwall, 22, 5, 16, kx, H(kx, kz) + 11.5, kz, 0);
      P.flag(ctx, kx, H(kx, kz) + 16.5, kz, { kind: 'hoang', pole: 30, w: 9, amp: 0.3, base: false, poleMat: HT.solid(0x3a3a3a, { rough: 0.5, metal: 0.5 }) });
      /* mái Ngọ Môn thấp thoáng sau tường */
      A.hipRoof(B, tileY, { x: 90, z: NB - 60, w: 58, d: 16, eave: H(90, NB - 60) + 14, ridge: H(90, NB - 60) + 19, thick: 0.3, kind: 'plain', ridgeLen: 40 }, wood);
      B.box(cwall, 60, 12, 26, 90, H(90, NB - 60), NB - 60, 0);
      const farN = []; for (let x = -300; x <= 300; x += 14) farN.push({ x: x + r.range(-4, 4), z: NB - 45 - r.range(0, 60) });
      N.trees(ctx, 'forest', farN, { seed: 9, collide: false });
      /* núi Ngự Bình phía nam xa */
      /* ---------------- cầu Trường Tiền (6 nhịp vòm thép, 1899) ---------------- */
      const bx = 330, span = 35, nsp = 6;
      const steel = HT.solid(0xbfc3c2, { rough: 0.45, metal: 0.7 });
      for (let i = 0; i < nsp; i++) {
        const z0 = BANK + 6 - i * span, z1 = z0 - span;
        B.box(HT.mat('rock_wall_08', { tile: 2 }), 5, 5, 3, bx, -4, z0, 0);
        for (const sd of [-1, 1]) {
          const pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push(new T.Vector3(bx + sd * 3.2, 1.2 + Math.sin(Math.PI * t) * 7.5, z0 - span * t)); }
          B.add(steel, HT.taperTube(pts, pts.map(() => 0.22), 6), { uv: 'keep' });
          B.beam(steel, bx + sd * 3.2, 1.2, z0, bx + sd * 3.2, 1.2, z1, 0.3, 0.4);
          for (let k = 1; k < 16; k++) { const t = k / 16; B.beam(steel, bx + sd * 3.2, 1.2, z0 - span * t, bx + sd * 3.2, 1.2 + Math.sin(Math.PI * t) * 7.5, z0 - span * t, 0.08, 0.08); }
        }
        B.box(HT.mat('weathered_planks', { tile: 2 }), 7, 0.3, span, bx, 1.0, z0 - span / 2, 0);
      }

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [-6.5, -18.6, Math.PI + 0.35],
        stories: [[-13, 20.5, Math.PI / 2 + 0.3], [13, 20.5, -Math.PI / 2 - 0.3]],
        moc: [6.5, -18.6, Math.PI - 0.35],
        photos: [[-8, 28, Math.PI - 0.3], [8, 28, Math.PI + 0.3], [-24, -16, Math.PI - 0.6, 1.3], [0, 30.5, Math.PI, 1.0]],
      });
      E.label(ctx, { key: 'cong', x: -5.8, z: 4.4, ry: Math.PI - 0.3, vi: 'Cổng Trường Quốc Học', en: 'The Quoc Hoc gatehouse',
        text: 'Trường Quốc Học Huế lập năm 1896. Cổng hai tầng dựng năm 1897, trên treo biển sơn son thếp vàng hai chữ Hán 國學 "Quốc Học". Năm 1908 các lớp học còn là những dãy nhà tranh vách đất; dãy nhà gạch sơn đỏ chỉ xây từ năm 1915.',
        textEn: 'Founded in 1896; the two-storey gate dates from 1897. In 1908 the classrooms were still thatched, mud-walled rows.' });
      E.label(ctx, { key: 'thue', x: 16, z: -18.5, ry: Math.PI - 0.2, vi: 'Phong trào chống sưu thuế 1908', en: 'The 1908 tax protests',
        text: 'Mùa xuân năm 1908, nông dân các tỉnh Trung Kỳ kéo về Huế đòi giảm sưu thuế. Học sinh Nguyễn Tất Thành cùng đi với đoàn biểu tình và làm phiên dịch cho nông dân; sau đó anh bị nhà trường đuổi học.',
        textEn: 'In spring 1908 peasants marched on Hue against taxes; student Nguyen Tat Thanh joined them as an interpreter and was then expelled.' });
      E.label(ctx, { key: 'cau', x: 52, z: -24, ry: Math.PI + 0.9, vi: 'Cầu Trường Tiền và sông Hương', en: 'Truong Tien bridge and the Perfume River',
        text: 'Cầu Trường Tiền (tên thời Pháp: Clémenceau) khánh thành năm 1899, sáu nhịp vòm thép. Bên kia sông là Kinh thành Huế với Kỳ Đài cắm cờ.',
        textEn: 'The six-span steel Truong Tien bridge (1899); across the river lies the Citadel with its Flag Tower.' });
      E.stdGates(ctx, { hub: [-58, -22, Math.PI / 2], prev: [-58, 0, Math.PI / 2], next: [58, -22, Math.PI / 2] });
    },
  };
})();
