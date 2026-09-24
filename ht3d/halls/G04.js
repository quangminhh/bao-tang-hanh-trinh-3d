/* GIAN 04 — SÀI GÒN, BẾN NHÀ RỒNG (5/6/1911).
   Dựng lại: tòa Nhà Rồng (trụ sở hãng Messageries Maritimes, xây 1863) — nhà hai tầng tường vàng, hiên vòm tầng trệt,
   cửa chớp xanh, khối giữa cao ba tầng, mái ngói đỏ, trên nóc hai con rồng gốm men xanh chầu mặt nguyệt; bến đá dọc
   sông Sài Gòn với cột neo gang, đèn khí, hàng hóa (thùng gỗ, thùng phuy, bao gạo), xe kéo tay; tàu Amiral Latouche-Tréville
   (hãng Chargeurs Réunis) cập bến với cầu lên tàu; bờ Thủ Thiêm bên kia sông là rặng dừa nước, dừa, xóm nhà thấp.
   Trục: +x = đông (phía sông), −z = bắc (rạch Bến Nghé). */
(function () {
  const HT = window.HT;
  HT.halls.G04 = {
    sky: { hdri: 'kloofendal_48d_partly_cloudy_puresky', sunAz: 112, exposure: 0.95, fog: 0.0011, sat: 1.07, con: 1.05, bloom: 0.12, shadowSize: 70 },
    spawn: { x: 22, z: 58, yaw: 0.2, pitch: 0.0 },
    map: [-70, -100, 120, 72],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      const QX = 36;                                  // mép bến (x)
      const WY = -1.3;                                // mặt nước
      const FAR = 330;                                // bờ Thủ Thiêm
      const H = (x, z) => {
        if (x > QX + 0.2 && x < FAR) return -5 + HT.smooth(FAR - 20, FAR, x) * 5.4;
        let h = 0.4;
        if (x >= FAR) h = 0.4 + HT.fbm(x * 0.01, z * 0.01, 3) * 0.6;
        h += HT.fbm(x * 0.003, z * 0.003, 3) * 18 * HT.smooth(700, 1300, Math.hypot(x - 100, z));
        return h;
      };
      const inR = (x, z, R) => x >= R[0] && x <= R[2] && z >= R[1] && z <= R[3];
      const LAWN = [7.5, -20, 25, 20];
      const W = (x, z) => {
        const apron = x > 25.5 && x <= QX + 1 ? 1 : 0;                     // mặt bến lát đá
        const lawn = inR(x, z, LAWN) && !(Math.abs(z) < 1.6) ? 1 : 0;
        const road = x > -40 && x < -30 ? 1 : 0;
        return [apron, lawn, road];
      };
      N.terrain(ctx, { size: 2200, inner: 120, step: 0.6, height: H, weights: W, layers: [
        { slug: 'grass_path_2', tile: 2.6, tint: 0xe4dccc, rough: 0.9 },
        { slug: 'square_cobblestone', tile: 2.2, tint: 0xd8d2c6, rough: 0.8 },
        { slug: 'forrest_ground_01', tile: 2.4, tint: 0xc4d0a0, rough: 0.95 },
        { slug: 'stony_dirt_path', tile: 2.2, tint: 0xd8c8b0, rough: 0.9 },
      ], macro: 0.1 });
      ctx.bounds = [[-62, -98], [QX - 0.5, -98], [QX - 0.5, 70], [-62, 70]];
      N.waterMirror(ctx, { poly: N.rectPoly(QX, -1100, FAR + 2, 1100), y: WY, color: 0x3a3e2c, distortion: 0.7, size: 1.2, speed: 0.4 });
      N.grass(ctx, { rect: LAWN, density: 12, kind: 'lawn', mask: (x, z) => (W(x, z)[1] > 0.5 ? 0.9 : 0), seed: 4, far: 36 });
      N.grass(ctx, { rect: [-62, -98, 25, 70], density: 4, kind: 'grass', mask: (x, z) => { const w = W(x, z); return w[0] + w[1] + w[2] > 0.3 || (x > -32 && x < 20 && Math.abs(z) < 12) ? 0 : 0.45; }, seed: 8, far: 36 });

      /* ---------------- kè bến đá ---------------- */
      const stone = HT.mat('large_sandstone_blocks', { tile: 1.6, color: 0xc8c4b8 });
      B.box(stone, 1.2, 5.6, 172, QX + 0.4, -5.2, -14, 0);
      B.box(HT.mat('granite_tile_04', { tile: 1.2, color: 0xc8c4bc }), 0.9, 0.18, 172, QX - 0.1, 0.36, -14, 0);
      const iron = HT.solid(0x1e1e1c, { rough: 0.45, metal: 0.7, env: 1.1 });
      const bollards = [];
      for (let z = -94; z <= 62; z += 13) { B.cyl(iron, 0.19, 0.23, 0.62, QX - 0.55, 0.4, z, 14); B.cyl(iron, 0.3, 0.26, 0.1, QX - 0.55, 1.0, z, 14); ctx.colCircle(QX - 0.55, z, 0.3); bollards.push(z); }

      /* ---------------- tàu Amiral Latouche-Tréville ---------------- */
      const SX = QX + 7.6 + 0.9, SZ = -18, L = 124;
      VV.steamer(ctx, { x: SX, y: WY, z: SZ, ry: Math.PI / 2, L, key: 'amiral', name: 'AMIRAL LATOUCHE-TRÉVILLE' });
      /* dây neo từ cột neo lên mạn tàu */
      const rope = HT.solid(0x6a5a40, { rough: 0.9 });
      for (const bz of bollards) if (bz > SZ - L / 2 + 6 && bz < SZ + L / 2 - 6 && (Math.abs(bz - SZ) > 40)) B.beam(rope, QX - 0.5, 1.0, bz, QX + 1.2, WY + 5.6, bz + (bz < SZ ? -6 : 6), 0.05, 0.05, { round: true, seg: 5 });
      /* cầu lên tàu dọc mạn */
      { const plank = HT.mat('weathered_planks', { tile: 1.2 });
        const x0 = QX - 0.2, z0 = -2, x1 = QX + 1.35, z1 = -16, y0 = 0.45, y1 = WY + 5.3;
        B.beam(plank, x0, y0, z0, x1, y1, z1, 1.1, 0.08);
        for (const sd of [-0.5, 0.5]) {
          const n = 8;
          for (let i = 0; i <= n; i++) { const t = i / n; B.cyl(HT.solid(0x3a3228, { rough: 0.7 }), 0.02, 0.02, 1.0, HT.lerp(x0, x1, t) + sd * 0.95, HT.lerp(y0, y1, t), HT.lerp(z0, z1, t) + sd * 0.2, 5); }
          B.beam(rope, x0 + sd * 0.95, y0 + 1.0, z0 + sd * 0.2, x1 + sd * 0.95, y1 + 1.0, z1 + sd * 0.2, 0.04, 0.04, { round: true, seg: 5 });
        }
        B.box(plank, 1.6, 0.12, 2.2, x0 - 0.8, 0.4, z0 + 1.1, 0);
      }

      /* ---------------- NHÀ RỒNG ---------------- */
      const NX = -8, NZ = 0;
      const yel = HT.mat('plastered_wall', { tile: 2.4, color: 0xf7d990, env: 0.7 });
      const white = HT.mat('white_stucco', { tile: 2, color: 0xfbf6ea, env: 0.8 });
      const roofM = HT.mat('clay_roof_tiles_02', { tile: 1.25, color: 0xd98a62 });
      const shutter = HT.solid(0x2e6a4c, { rough: 0.55, env: 0.7 });
      const floorT = HT.mat('floor_tiles_06', { tile: 0.9, color: 0xe8dccc, env: 0.6 });
      const win = { w: 1.15, h: 2.5, kind: 'casement', rows: 4, shutter, frame: white };
      /* hai cánh hai tầng (mái chung) + khối giữa ba tầng nhô ra trước và sau */
      const WW = 13.8, MW = 11;
      const wings = [-1, 1].map((sd) => A.colonial(ctx, B, { x: NX, z: NZ + sd * (MW / 2 + WW / 2), ry: Math.PI / 2, w: WW, d: 13.5, floors: [5.0, 4.6], bays: 4, veranda: 3.0, wall: yel, trim: white, window: win, roof: 'none', plinth: 0.6, floorMat: floorT, steps: [], doorBays: [0, 2], doorKind: 'glass', doorMat: shutter }));
      const main = wings[0];
      A.hipRoof(B, roofM, { x: NX, z: NZ, ry: Math.PI / 2, w: 2 * WW + MW + 1.3, d: 13.5 + 1.3, eave: main.top - 0.05, ridge: main.top + 2.8, thick: 0.16, kind: 'tile', pitch: 0.24, amp: 0.03, ridgeMat: HT.solid(0x9a5a40, { rough: 0.7 }), ridgeR: 0.13 }, white);
      const mid = A.colonial(ctx, B, { x: NX + 0.9, z: NZ, ry: Math.PI / 2, w: MW, d: 15.4, floors: [5.0, 4.6, 3.2], bays: 3, veranda: 3.9, wall: yel, trim: white, window: Object.assign({}, win, { h: 2.4 }), roofMat: roofM, roofH: 4.0, ridgeLen: 7, plinth: 0.6, floorMat: floorT, steps: [1], doorKind: 'glass', doorMat: shutter, sideWin: 1 });
      /* rồng gốm men xanh chầu mặt nguyệt trên nóc khối giữa */
      const glaze = HT.solid(0x2f7a58, { rough: 0.26, env: 1.4 });
      const glazeD = HT.solid(0x1f5a40, { rough: 0.3, env: 1.3 });
      const gold = HT.solid(0xd1a64a, { rough: 0.3, metal: 0.8, env: 1.3 });
      const V3 = (x, y, z) => new T.Vector3(x, y, z);
      const dragon = (lx, dir) => {
        const [wx, wz] = mid.f(lx, 0);
        const yy = mid.ridge + 0.06;
        const rr = Math.PI / 2 + (dir > 0 ? 0 : Math.PI);
        const DB = new HT.Builder(null);
        const pts = [V3(-1.9, 0.12, 0), V3(-1.45, 0.62, 0.05), V3(-0.9, 0.22, -0.05), V3(-0.3, 0.72, 0.06), V3(0.3, 0.3, -0.04), V3(0.8, 0.82, 0.02), V3(1.1, 1.1, 0)];
        DB.add(glaze, HT.taperTube(pts, [0.03, 0.09, 0.13, 0.15, 0.14, 0.13, 0.11], 10), { uv: 'keep' });
        /* vây lưng */
        for (let i = 1; i < pts.length - 1; i++) { const c = new T.ConeGeometry(0.06, 0.24, 5); const p = pts[i]; DB.add(gold, c, { x: p.x, y: p.y + 0.16, z: p.z, rz: -0.3 }); }
        /* đầu, mõm, sừng, râu */
        DB.add(glaze, HT.geoBox(0.46, 0.3, 0.3, 0.06), { x: 1.3, y: 1.18, z: 0 });
        DB.add(glazeD, HT.geoBox(0.3, 0.16, 0.24, 0.04), { x: 1.6, y: 1.12, z: 0 });
        for (const sd of [-1, 1]) {
          DB.add(gold, new T.ConeGeometry(0.035, 0.42, 5), { x: 1.16, y: 1.48, z: sd * 0.1, rz: 0.7 });
          DB.add(gold, new T.CylinderGeometry(0.01, 0.01, 0.5, 4), { x: 1.78, y: 1.02, z: sd * 0.12, rz: 1.2, rx: sd * 0.4 });
          DB.add(HT.solid(0xf2e8c8, { rough: 0.3 }), new T.SphereGeometry(0.035, 8, 6), { x: 1.44, y: 1.3, z: sd * 0.14 });
        }
        /* chân */
        for (const [px, sd] of [[-0.9, 1], [-0.9, -1], [0.3, 1], [0.3, -1]]) DB.add(glazeD, new T.CylinderGeometry(0.03, 0.045, 0.34, 6), { x: px, y: 0.12, z: sd * 0.1, rz: 0.4 });
        /* đuôi lửa */
        DB.add(gold, new T.ConeGeometry(0.1, 0.36, 6), { x: -2.05, y: 0.24, z: 0, rz: 1.1 });
        const grp = new T.Group(); grp.position.set(wx, yy, wz); grp.rotation.y = rr; grp.scale.setScalar(0.8); ctx.add(grp); DB.build(grp);
      };
      dragon(-1.75, 1); dragon(1.75, -1);
      { const [mx, mz] = mid.f(0, 0);
        B.add(gold, new T.SphereGeometry(0.34, 20, 14), { x: mx, y: mid.ridge + 0.9, z: mz, uv: 'keep' });
        const ring = new T.TorusGeometry(0.5, 0.035, 6, 28); B.add(gold, ring, { x: mx, y: mid.ridge + 0.9, z: mz, ry: Math.PI / 2, uv: 'keep' });
        for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; B.add(gold, new T.ConeGeometry(0.04, 0.2, 5), { x: mx, y: mid.ridge + 0.9 + Math.sin(a) * 0.62, z: mz + Math.cos(a) * 0.62, rx: -a + Math.PI / 2, uv: 'keep' }); }
        B.cyl(white, 0.1, 0.16, 0.5, mx, mid.ridge, mz, 10); }
      /* đèn lồng dưới hiên, ghế băng */
      for (const w of wings) for (let i = 0; i < 4; i++) { const [lx, lz] = w.f(-WW / 2 + (WW / 4) * (i + 0.5), 5.2); HT.model(ctx, 'caged_hanging_light', { x: lx, z: lz, y: w.y0 + 4.1, h: 0.55, env: 0.8 }); }

      /* ---------------- kho hàng dọc bến (phía bắc) ---------------- */
      const corr = HT.mat('rusty_corrugated_iron', { tile: 1.3, color: 0xb89a88 });
      const brickW = HT.mat('red_brick_03', { tile: 1.3, color: 0xd8b8a0 });
      for (const [kx, kz, kw] of [[0, -44, 22], [0, -76, 26], [-54, -64, 18]]) {
        const b2 = A.block(ctx, B, { x: kx, z: kz, ry: Math.PI / 2, w: kw, d: 14, floors: [6.5], bays: Math.round(kw / 4.4), wall: brickW, trim: HT.mat('plastered_wall', { tile: 2, color: 0xe8e0d0 }), ground: 'plain', roof: 'gable', roofMat: corr, roofKind: 'corr', roofH: 3.0, cornice: false });
        /* cửa kho lớn trông ra bến */
        const [dx, dz] = b2.f(0, 7.05); B.box(HT.mat('weathered_planks', { tile: 1.2, color: 0x9a8a78 }), 4.2, 4.2, 0.1, dx, 0.4, dz, Math.PI / 2);
      }
      /* hàng hóa trên bến */
      const crates = [[28, -33.6], [29.6, -35.4], [27.8, -37.2], [31, -52], [29.4, -53.8], [27.5, -60], [29, 30], [30.8, 31.6], [28.4, 33.2]];
      crates.forEach(([x, z], i) => HT.model(ctx, i % 2 ? 'wooden_crate_01' : 'wooden_crate_02', { x, z, y: 0.4, w: 1.05, ry: (i % 4) * 0.4 - 0.6, col: true }));
      /* thùng nhỏ xếp chồng lên thùng lớn */
      for (const [x, z] of [[28, -33.6], [31, -52], [29, 30]]) HT.model(ctx, 'wooden_crate_01', { x, z, y: 0.4 + 0.385, w: 0.7, ry: 0.3, col: false });
      for (const [x, z] of [[27, -40], [27.8, -41], [26.9, -41.9], [30, 22], [30.9, 22.8]]) HT.model(ctx, 'Barrel_01', { x, z, y: 0.4, h: 0.95, ry: r() * 6.28, col: true });
      HT.model(ctx, 'wooden_barrels_01', { x: 31, z: -28, y: 0.4, h: 1.2, col: true });
      /* bao gạo chất đống */
      const sackM = HT.solid(0xbfa77e, { rough: 0.95 });
      const sackG = (() => { const g = new T.SphereGeometry(0.5, 12, 8); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, Math.sign(x) * Math.pow(Math.abs(x) / 0.5, 0.55) * 0.42, Math.sign(y) * Math.pow(Math.abs(y) / 0.5, 0.9) * 0.14, Math.sign(z) * Math.pow(Math.abs(z) / 0.5, 0.6) * 0.27); } g.computeVertexNormals(); return g; })();
      for (const [sx, sz] of [[27, 12], [27, 40]]) {
        for (let lv = 0; lv < 4; lv++) for (let i = 0; i < 4 - lv; i++) for (let j = 0; j < 3; j++) B.add(sackM, sackG, { x: sx + j * 0.58, y: 0.55 + lv * 0.27, z: sz + i * 0.9 + lv * 0.45, ry: r.range(-0.1, 0.1) + Math.PI / 2 });
        ctx.colBox(sx + 0.6, sz + 1.6, 2.0, 3.8, 0, 0, 2);
      }
      /* xe kéo tay, xe bò chở hàng */
      P.rickshaw(B, 20, 0.4, 36, -0.5, {});
      P.rickshaw(B, -26, 0.4, 20, Math.PI / 2 + 0.2, { cushion: 0x2a3a5a });
      P.rickshaw(B, 22.5, 0.4, 37.5, -0.9, {});
      ctx.colBox(21, 36.5, 3, 3, 0, 0, 2);
      /* đèn khí dọc bến và đường */
      for (let z = -90; z <= 60; z += 22) P.gasLamp(B, ctx, 33.5, 0.4, z, { h: 4.2 });
      for (let z = -60; z <= 60; z += 20) P.gasLamp(B, ctx, -29, 0.4, z, { h: 4.2 });

      /* ---------------- cây: dầu, me, dừa, bàng ---------------- */
      N.trees(ctx, 'forest', N.along(3, [[-42.5, -50], [-42.5, 66]], 11, 0.6).map((p) => ({ x: p.x, z: p.z, s: 0.62 })), { seed: 3 });
      N.trees(ctx, 'mango', [{ x: 11, z: 24, s: 0.95 }, { x: 11, z: -24, s: 1.0 }, { x: -24, z: 30, s: 0.9 }, { x: -24, z: -30, s: 0.9 }, { x: 22, z: -26, s: 0.85 }], { seed: 5 });
      N.palms(ctx, 'coconut', [{ x: 9, z: 12 }, { x: 9, z: -12 }, { x: 23, z: 14 }, { x: 23, z: -14 }, { x: -30, z: 44 }], { seed: 7 });
      N.hedge(ctx, [[7.5, -20], [7.5, -1.8]], { h: 0.9, w: 0.7, kind: 'hedge', seed: 3 });
      N.hedge(ctx, [[7.5, 1.8], [7.5, 20]], { h: 0.9, w: 0.7, kind: 'hedge', seed: 4 });
      /* bờ Thủ Thiêm: dừa nước, dừa, xóm nhà sàn thấp */
      const fb = []; for (let z = -900; z <= 900; z += 4.5) fb.push({ x: FAR + 1 + r.range(0, 5), z: z + r.range(-1.5, 1.5), s: r.range(0.9, 1.25) });
      N.palms(ctx, 'nipa', fb, { seed: 21, collide: false });
      const fc = []; for (let z = -900; z <= 900; z += 11) fc.push({ x: FAR + 14 + r.range(0, 30), z: z + r.range(-4, 4) });
      N.palms(ctx, 'coconut', fc, { seed: 22, collide: false });
      N.trees(ctx, 'forest', N.scatter(23, [FAR + 40, -900, FAR + 260, 900], 180, 16).map((p) => ({ x: p.x, z: p.z, s: r.range(0.5, 0.8) })), { seed: 23, collide: false });
      const thatch = HT.mat('reed_roof_04', { tile: 1.6, color: 0xb09870 });
      for (let z = -180; z <= 180; z += 26) A.vnHouse(ctx, B, { x: FAR + 12 + r.range(0, 8), z: z + r.range(-6, 6), ry: -Math.PI / 2 + r.range(-0.2, 0.2), gian: 3, gianW: 2.6, depth: 4.2, porch: 0.8, plinth: 0.3, eave: 2.1, ridge: 4.0, roof: 'thatch', roofMat: thatch, back: 'bamboo', ends: 'bamboo', front: 'mud', overhang: 0.6, truss: false, seed: z });
      /* thuyền trên sông */
      VV.sampan(ctx, B, 60, WY + 0.05, 30, 0.3, { L: 8 });
      VV.sampan(ctx, B, 95, WY + 0.05, -40, -0.6, {});
      VV.sampan(ctx, B, 150, WY + 0.05, 20, 1.2, { mui: false });
      VV.junk(ctx, 190, WY, -120, 0.5, { L: 18 });
      VV.junk(ctx, 230, WY, 90, -0.3, {});
      /* bờ bắc xa: phố Sài Gòn thấp, tháp nhà thờ ẩn trong mù */
      for (let x = -300; x <= 200; x += 18) A.block(ctx, B, { x, z: -460 + r.range(-20, 20), ry: 0, w: 14, d: 12, floors: [4.5, 4], bays: 4, wall: HT.mat('plastered_wall', { tile: 2.4, color: [0xf0dca0, 0xe8e4d8, 0xf2e2c8][Math.abs(x) % 3] }), trim: white, ground: 'plain', roof: 'hip', roofMat: roofM, roofH: 2.2, col: false, cornice: false });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [27.5, 50, -0.6, 'lectern'],
        stories: [[18, 26, Math.PI / 2 + 0.2], [18, -26, Math.PI / 2 - 0.2]],
        moc: [30, 8, Math.PI / 2 + 0.3],
        photos: [[26.5, 20, -Math.PI / 2 + 0.4, 1.3], [32, -20, -Math.PI / 2 - 0.2, 1.3], [26, 3.5, -Math.PI / 2 + 0.1, 1.3], [26, -3.5, -Math.PI / 2 - 0.1, 1.2]],
      });
      E.label(ctx, { key: 'nharong', x: 14, z: 6.5, ry: -Math.PI / 2 + 0.5, vi: 'Nhà Rồng', en: 'The Dragon House',
        text: 'Trụ sở hãng tàu Messageries Maritimes, xây năm 1863 bên bến cảng Sài Gòn. Tên gọi Nhà Rồng vì trên nóc có hai con rồng gốm men xanh chầu mặt nguyệt. Nay là Bảo tàng Hồ Chí Minh — chi nhánh Thành phố Hồ Chí Minh.',
        textEn: 'Built in 1863 as the head office of the Messageries Maritimes shipping line; named after the two glazed dragons on its roof. Today a branch of the Ho Chi Minh Museum.' });
      E.label(ctx, { key: 'tau', x: 33.2, z: -6, ry: Math.PI / 2 + 0.3, vi: 'Tàu Amiral Latouche-Tréville', en: 'The steamer Amiral Latouche-Tréville',
        text: 'Tàu buôn của hãng Chargeurs Réunis. Ngày 5/6/1911, người thanh niên Nguyễn Tất Thành, lấy tên Văn Ba, xin làm phụ bếp trên tàu và rời bến Nhà Rồng ra đi tìm đường cứu nước. Tàu ghé Singapore, Colombo, Port Said rồi cập cảng Marseille ngày 6/7/1911.',
        textEn: 'A Chargeurs Reunis steamer. On 5 June 1911 Nguyen Tat Thanh, under the name Van Ba, signed on as a kitchen hand and left Saigon; the ship reached Marseille on 6 July 1911.' });
      E.label(ctx, { key: 'haibantay', x: 22, z: 30, ry: Math.PI - 0.6, vi: 'Hai bàn tay', en: 'Two hands',
        text: 'Theo hồi ký, khi người bạn hỏi lấy đâu ra tiền để đi xa, anh Thành xòe hai bàn tay và nói: “Tiền đây chứ đâu!” — ý rằng sẽ làm bất cứ việc gì để sống và để đi.',
        textEn: 'Asked where the money for the journey would come from, he held out his two hands: “Here it is” — he would work his way.' });
      E.label(ctx, { key: 'ben', x: 31.5, z: 44, ry: Math.PI / 2 + 0.6, vi: 'Bến cảng Sài Gòn', en: 'The port of Saigon',
        text: 'Đầu thế kỷ XX, bến cảng dọc sông Sài Gòn là nơi tàu viễn dương neo đậu, bốc dỡ lúa gạo, hàng hóa; đèn khí, cột neo gang, kho hàng mái tôn nối dài bờ sông.',
        textEn: 'Around 1911 ocean steamers moored along the Saigon River to load rice and cargo.' });
      E.stdGates(ctx, { hub: [0, 66, 0], prev: [-16, 66, 0], next: [33.4, -1, Math.PI / 2] });
    },
  };
})();
