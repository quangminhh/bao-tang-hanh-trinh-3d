/* GIAN 16 — PHỦ CHỦ TỊCH, NHÀ SÀN (Hà Nội, 1954 – 1969).
   Dựng lại: nhà sàn gỗ 2 tầng (10,5 × 6,2 m) bên ao cá, tầng dưới để trống làm nơi họp, tầng trên hai phòng
   (làm việc, ngủ) ngăn bằng giá sách, hành lang quanh, mành tre, mái ngói; bến ao; đường xoài; Nhà 54; nhà để xe
   với ba chiếc ô tô (ZIS-110 đen, Pobeda xám, Peugeot 404 xám bạc); xa xa là Phủ Chủ tịch sơn vàng.
   Trục: +z = nam, +x = đông. Ao ở giữa, nhà sàn bờ tây quay mặt ra ao. */
(function () {
  const HT = window.HT;
  HT.halls.G16 = {
    sky: { hdri: 'qwantani_afternoon_puresky', sunAz: 62, exposure: 0.95, fog: 0.0018, sat: 1.07, con: 1.05, bloom: 0.12 },
    spawn: { x: -30, z: 20, yaw: 0.35, pitch: -0.04 },
    map: [-62, -48, 50, 46],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      /* ---------------- ao cá ---------------- */
      const pond = [];
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * 6.283;
        const k = 1 + 0.12 * Math.sin(a * 2 + 0.6) + 0.07 * Math.sin(a * 3 + 1.9) + 0.04 * Math.sin(a * 5);
        pond.push([8 + Math.cos(a) * 34 * k, -2 + Math.sin(a) * 22 * k]);
      }
      const inPond = (x, z, s) => HT.inPoly(8 + (x - 8) / (s || 1), -2 + (z + 2) / (s || 1), pond);
      const dPond = (x, z) => HT.distPoly(x, z, pond.concat([pond[0]])) * (inPond(x, z) ? -1 : 1);
      const H = (x, z) => {
        const d = dPond(x, z);
        let h = 0.05 + HT.noise(x * 0.05, z * 0.05, 3) * 0.12;
        if (d < 1.5) h = HT.lerp(-1.6, h, HT.smooth(-3, 1.5, d));
        const R = Math.hypot(x, z);
        h += HT.fbm(x * 0.003, z * 0.003, 3) * 18 * HT.smooth(300, 900, R);
        return h;
      };
      const W = (x, z, h) => {
        const d = dPond(x, z);
        let path = 0, dirt = 0, leaf = 0;
        const paths = [[[-45, 46], [-45, -46]], [[-45, 20], [-30, 20], [-22, 12]], [[-45, -12], [-36, -12]], [[-45, 30], [-52, 30]]];
        for (const p of paths) path = Math.max(path, 1 - HT.smooth(1.3, 1.9, HT.distPoly(x, z, p)));
        if (d > -0.5 && d < 1.8) dirt = 1 - HT.smooth(0.8, 1.8, d);
        if (x < -48 || z < -38) leaf = 0.5;
        return [path, dirt, leaf * (1 - path)];
      };
      N.terrain(ctx, { size: 1800, inner: 80, step: 0.5, height: H, weights: W, layers: [
        { slug: 'leafy_grass', tile: 2.4, tint: 0xa9c890, rough: 0.95 },
        { slug: 'floor_bricks_02', tile: 1.6, tint: 0xd8c8b8, rough: 0.8 },
        { slug: 'brown_mud_leaves_01', tile: 2.2, rough: 0.8 },
        { slug: 'forest_leaves_02', tile: 3, rough: 0.9 },
      ] });
      ctx.bounds = [[-60, -46], [48, -46], [48, 44], [-60, 44]];
      const pondIn = pond.map(([x, z]) => [8 + (x - 8) * 0.97, -2 + (z + 2) * 0.97]);
      ctx.block(pondIn);
      N.waterMirror(ctx, { poly: pond.map(([x, z]) => [8 + (x - 8) * 1.04, -2 + (z + 2) * 1.04]), y: -0.35, color: 0x16241e, distortion: 0.3, size: 3, speed: 0.15 });
      N.grass(ctx, { rect: [-60, -46, 48, 44], density: 7, mask: (x, z) => { const d = dPond(x, z); const [pa] = W(x, z); return d < 0.6 || pa > 0.3 ? 0 : 0.8; }, seed: 3, far: 50 });
      N.grass(ctx, { rect: [-30, -30, 46, 26], density: 9, kind: 'reed', mask: (x, z) => { const d = dPond(x, z); return d > -0.8 && d < 0.4 && ((x + z) % 7 + 7) % 7 < 3 ? 1 : 0; }, seed: 5 });

      /* ---------------- NHÀ SÀN ---------------- */
      const hx = -31, hz = -11, hry = Math.PI / 2 - 0.32;
      const f = A.frame(hx, hz, hry);
      const Lh = 10.5, Dh = 6.2, fy0 = H(hx, hz) + 0.2, fy1 = fy0 + 2.55;
      const wood = HT.mat('japanese_cedar_planks', { tile: 1.4, color: 0xc49a6c, env: 0.6 });
      const post = HT.mat('fine_grained_wood', { tile: 0.8, color: 0x9a6a3e, env: 0.6, rot: Math.PI / 2 });
      const floorW = HT.mat('old_wood_floor', { tile: 1.6, color: 0xc49a6c, env: 0.5 });
      const tileRoof = HT.mat('roof_tiles_14', { tile: 1.4, color: 0xb88a6a });
      /* nền tầng dưới lát gạch, bậc thềm */
      const [bx0, bz0] = f(0, 0);
      B.box(HT.mat('floor_bricks_02', { tile: 1.2, color: 0xd8c0a8, env: 0.7 }), Lh + 0.6, fy0 - H(hx, hz) + 0.25, Dh + 0.6, bx0, H(hx, hz) - 0.25, bz0, hry);
      ctx.floorRect(bx0, bz0, Lh + 0.6, Dh + 0.6, fy0, hry);
      /* cột */
      const xs = [-5.1, -1.7, 1.7, 5.1], zs = [-3.0, 0, 3.0];
      for (const x of xs) for (const z of zs) {
        const [px, pz] = f(x, z);
        B.box(HT.mat('concrete_pavement', { tile: 1, color: 0xcfc8bb }), 0.34, 0.25, 0.34, px, fy0, pz, hry, { bevel: 0.03 });
        B.box(post, 0.2, fy1 + 2.4 - fy0 - 0.25, 0.2, px, fy0 + 0.25, pz, hry);
        ctx.colBox(px, pz, 0.3, 0.3, hry, fy0 - 1, fy1 + 3);
      }
      /* sàn tầng trên + dầm */
      const [cx, cz] = f(0, 0);
      B.box(floorW, Lh + 0.3, 0.12, Dh + 0.3, cx, fy1 - 0.12, cz, hry);
      for (const z of zs) { const [a, b] = f(0, z); B.box(post, Lh + 0.4, 0.22, 0.16, a, fy1 - 0.34, b, hry); }
      for (const x of xs) { const [a, b] = f(x, 0); B.box(post, 0.16, 0.22, Dh + 0.4, a, fy1 - 0.34, b, hry); }
      ctx.floorRect(cx, cz, Lh + 0.3, Dh + 0.3, fy1, hry);
      /* hai phòng giữa (6,4 × 3,4 m), vách ván, cửa sổ chớp mở */
      const RW = 6.4, RD = 3.4, wh = 2.35;
      const room = [[-RW / 2, -RD / 2], [RW / 2, -RD / 2], [RW / 2, RD / 2], [-RW / 2, RD / 2]];
      const opens = [
        [{ u: 1.0, w: 0.9, y: 0.9, h: 1.0 }, { u: 2.2, w: 0.9, y: 0.9, h: 1.0 }, { u: 4.2, w: 0.9, y: 0.9, h: 1.0 }, { u: 5.4, w: 0.9, y: 0.9, h: 1.0 }],
        [{ u: 1.7, w: 0.85, y: 0, h: 2.05 }],
        [{ u: 1.0, w: 0.9, y: 0.9, h: 1.0 }, { u: 2.2, w: 0.9, y: 0.9, h: 1.0 }, { u: 4.2, w: 0.9, y: 0.9, h: 1.0 }, { u: 5.4, w: 0.9, y: 0.9, h: 1.0 }],
        [{ u: 1.7, w: 0.85, y: 0, h: 2.05 }],
      ];
      for (let i = 0; i < 4; i++) {
        const [ax, az] = f(...room[i]), [bx, bz] = f(...room[(i + 1) % 4]);
        const wl = A.wall(B, ctx, wood, { x0: ax, z0: az, x1: bx, z1: bz, y0: fy1, h: wh, t: 0.05, open: opens[i] });
        for (const op of opens[i]) {
          if (op.y > 0) {
            const [wx, wz] = wl.at(op.u, 0);
            A.window(B, { x: wx, z: wz, ry: wl.ry + Math.PI, w: op.w, h: op.h, y: fy1 + op.y, t: 0.05, kind: 'open', frame: post, shutter: wood, shutterOpen: 1, sill: false });
          }
        }
      }
      /* vách giá sách chia hai phòng (có lối đi) */
      { const [a, b] = f(0, -0.85); P.bookshelf(B, a, fy1, b, hry + Math.PI / 2, { w: 1.7, h: 2.1, d: 0.32, shelves: 6, mat: HT.mat('fine_grained_wood', { tile: 0.8, color: 0x8a5a34 }) }); ctx.colBox(a, b, 0.35, 1.7, hry, fy1, fy1 + 2); }
      { const [a, b] = f(0, 1.35); B.box(wood, 0.05, wh, 0.7, a, fy1, b, hry); }
      /* trần phòng */
      B.box(HT.mat('bamboo_veneer', { tile: 0.8, color: 0xd8c4a0, env: 0.5 }), RW, 0.03, RD, cx, fy1 + wh, cz, hry);
      /* lan can hành lang */
      const rail = [f(-Lh / 2, -Dh / 2), f(Lh / 2, -Dh / 2), f(Lh / 2, Dh / 2), f(-Lh / 2, Dh / 2)];
      A.railing(B, post, [rail[1], rail[2], rail[3]], fy1, { h: 0.85, spacing: 0.14, r: 0.018, square: true, mid: true });
      A.railing(B, post, [rail[0], rail[1]], fy1, { h: 0.85, spacing: 0.14, r: 0.018, square: true, mid: true });
      for (let i = 0; i < 3; i++) { const a = [rail[1], rail[2], rail[3]][i], b = [rail[2], rail[3], rail[0]][i]; if (i < 2) ctx.colSeg(a[0], a[1], b[0], b[1], 0.12, fy1, fy1 + 1.2); }
      ctx.colSeg(rail[0][0], rail[0][1], rail[1][0], rail[1][1], 0.12, fy1, fy1 + 1.2);
      /* lan can đầu hồi phía cầu thang để trống 1,3 m */
      { const a = f(-Lh / 2, -Dh / 2), b = f(-Lh / 2, -0.65); A.railing(B, post, [a, b], fy1, { h: 0.85, spacing: 0.14, r: 0.018, square: true }); ctx.colSeg(a[0], a[1], b[0], b[1], 0.12, fy1, fy1 + 1.2);
        const c = f(-Lh / 2, 0.65), d = f(-Lh / 2, Dh / 2); A.railing(B, post, [c, d], fy1, { h: 0.85, spacing: 0.14, r: 0.018, square: true }); ctx.colSeg(c[0], c[1], d[0], d[1], 0.12, fy1, fy1 + 1.2); }
      /* mành tre cuốn lửng ở mép mái */
      const blind = HT.canvasTex('manh_tre', 512, 512, (g) => {
        g.fillStyle = '#b89a62'; g.fillRect(0, 0, 512, 512);
        for (let y = 0; y < 512; y += 5) { g.fillStyle = y % 10 ? 'rgba(90,70,40,0.45)' : 'rgba(240,220,170,0.25)'; g.fillRect(0, y, 512, 2); }
        for (const x of [60, 200, 330, 460]) { g.fillStyle = 'rgba(60,40,20,0.6)'; g.fillRect(x, 0, 4, 512); }
      });
      const bm = new T.MeshStandardMaterial({ map: blind, roughness: 0.9, side: T.DoubleSide, envMapIntensity: 0.6 });
      for (const [a, b] of [[rail[1], rail[2]], [rail[2], rail[3]], [rail[3], rail[0]]]) {
        const L2 = Math.hypot(b[0] - a[0], b[1] - a[1]); const ry2 = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
        const m = new T.Mesh(new T.PlaneGeometry(L2 - 0.3, 0.9), bm); m.position.set((a[0] + b[0]) / 2, fy1 + 1.85, (a[1] + b[1]) / 2); m.rotation.y = ry2; m.castShadow = true; ctx.add(m);
        const roll = new T.CylinderGeometry(0.06, 0.06, L2 - 0.3, 10); roll.rotateZ(Math.PI / 2);
        B.add(HT.mat('bamboo_veneer', { tile: 0.3, color: 0xa08050 }), roll, { x: (a[0] + b[0]) / 2, y: fy1 + 1.4, z: (a[1] + b[1]) / 2, ry: ry2 });
      }
      /* mái ngói 4 mái */
      const [rx, rz] = f(0, 0);
      A.hipRoof(B, tileRoof, { x: rx, z: rz, ry: hry, w: Lh + 2.2, d: Dh + 2.2, eave: fy1 + 2.35, ridge: fy1 + 4.35, thick: 0.12, kind: 'tile', pitch: 0.2, amp: 0.022, ridgeLen: Lh - Dh + 0.6, underMat: HT.mat('bamboo_veneer', { tile: 0.8, color: 0xc8b088, env: 0.5 }), ridgeMat: HT.solid(0x6a4a3a, { rough: 0.8 }), ridgeR: 0.09 }, HT.mat('fine_grained_wood', { tile: 1, color: 0x8a6a4a }));
      /* cầu thang gỗ đầu hồi bắc */
      { const [sx, sz] = f(-Lh / 2 - 3.2, 0); A.stairs(B, ctx, wood, { x: sx, z: sz, ry: hry - Math.PI / 2, w: 1.2, n: 14, rise: fy1 - fy0, run: 3.0, y0: fy0, solid: false, stringer: post });
        const s0 = f(-Lh / 2 - 3.2, -0.65), s1 = f(-Lh / 2, -0.65), s2 = f(-Lh / 2 - 3.2, 0.65), s3 = f(-Lh / 2, 0.65);
        B.beam(post, s0[0], fy0 + 0.9, s0[1], s1[0], fy1 + 0.9, s1[1], 0.05, 0.05); B.beam(post, s2[0], fy0 + 0.9, s2[1], s3[0], fy1 + 0.9, s3[1], 0.05, 0.05); }
      /* đồ đạc tầng trên: phòng làm việc (bắc) và phòng ngủ (nam) */
      { const [a, b] = f(-1.9, -1.25); const top = P.table(B, a, fy1, b, hry, { w: 1.15, d: 0.6, h: 0.76, mat: HT.mat('fine_grained_wood', { tile: 0.8, color: 0x7a4a2a }) }); ctx.colBox(a, b, 1.15, 0.6, hry, fy1, fy1 + 1);
        { const [tx, tz] = f(-1.8, -1.25); P.typewriter(B, tx, top, tz, hry + Math.PI, {}); }
        const [c, d] = f(-1.9, -0.6); P.chair(B, c, fy1, d, hry + Math.PI, { mat: HT.mat('fine_grained_wood', { tile: 0.8, color: 0x7a4a2a }) });
        { const [kx, kz] = f(-2.3, -1.4); HT.model(ctx, 'alarm_clock_01', { x: kx, z: kz, y: top, h: 0.12, ry: hry, env: 0.6 }); }
        { const [nx, nz] = f(-1.52, -1.15); HT.model(ctx, 'binder_notebook', { x: nx, z: nz, y: top, w: 0.28, ry: hry, tint: 0xe0d8c0, env: 0.5 }); } }
      { const [a, b] = f(-2.6, 1.1); P.bookshelf(B, a, fy1, b, hry + Math.PI, { w: 0.9, h: 1.7, d: 0.32, shelves: 5 }); }
      { const [a, b] = f(1.9, -0.9); P.phan(B, a, fy1, b, hry, { w: 1.9, d: 0.95, h: 0.45, chieu: true, planks: 2, mat: HT.mat('fine_grained_wood', { tile: 0.8, color: 0x7a4a2a }) }); ctx.colBox(a, b, 1.9, 0.95, hry, fy1, fy1 + 0.6);
        const [c, d] = f(2.6, -0.9); B.box(HT.solid(0xe9e2cf, { rough: 0.95 }), 0.45, 0.14, 0.7, c, fy1 + 0.46, d, hry, { bevel: 0.05 }); }
      { const [a, b] = f(2.9, 1.2); P.cabinet(B, a, fy1, b, hry + Math.PI, { w: 0.9, h: 1.7, d: 0.45, mat: HT.mat('fine_grained_wood', { tile: 0.8, color: 0x6a3e22 }) }); ctx.colBox(a, b, 0.9, 0.45, hry, fy1, fy1 + 1.7); }
      { const [a, b] = f(0.8, 1.25); const top = P.table(B, a, fy1, b, hry, { w: 0.6, d: 0.45, h: 0.7 }); HT.model(ctx, 'vintage_radio_transceiver', { x: a, z: b, y: top, w: 0.36, ry: hry + Math.PI, env: 0.6 }); }
      /* tầng dưới: bàn họp, ghế, tủ sách */
      { const [a, b] = f(0.6, 0.2); const top = P.table(B, a, fy0, b, hry, { w: 2.6, d: 1.05, h: 0.76, mat: HT.mat('fine_grained_wood', { tile: 0.8, color: 0x6a3e22 }), leg: 0.07 }); ctx.colBox(a, b, 2.6, 1.05, hry, fy0, fy0 + 1);
        for (let i = -1; i <= 1; i++) for (const sd of [-1, 1]) { const [c, d] = f(0.6 + i * 0.85, 0.2 + sd * 0.85); P.chair(B, c, fy0, d, hry + (sd > 0 ? Math.PI : 0), { mat: HT.mat('fine_grained_wood', { tile: 0.8, color: 0x6a3e22 }) }); }
        for (const sd of [-1, 1]) { const [c, d] = f(0.6 + sd * 1.7, 0.2); P.chair(B, c, fy0, d, hry + sd * Math.PI / 2, { mat: HT.mat('fine_grained_wood', { tile: 0.8, color: 0x6a3e22 }) }); }
        B.box(HT.mat('velour_velvet', { tile: 0.6, color: 0x2f5a3a }), 2.4, 0.01, 0.9, a, top, b, hry); }
      { const [a, b] = f(4.3, -2.6); P.bookshelf(B, a, fy0, b, hry, { w: 1.2, h: 1.6, d: 0.35, shelves: 5 }); }
      /* bến ao: bậc đá xuống nước, ghế đá */
      { const [a, b] = f(0, Dh / 2 + 4.6); B.box(HT.mat('concrete_pavement', { tile: 1.2, color: 0xc8c0b0 }), 2.6, 0.2, 2.4, a, H(a, b) - 0.35, b, hry);
        for (let i = 0; i < 3; i++) { const [c, d] = f(0, Dh / 2 + 6.0 + i * 0.35); B.box(HT.mat('concrete_pavement', { tile: 1.2, color: 0xbab2a2 }), 2.2, 0.15, 0.35, c, -0.55 - i * 0.16, d, hry); } }

      /* ---------------- đường xoài, cây quanh ao ---------------- */
      const mangoes = [];
      for (let z = -44; z <= 42; z += 7.5) { mangoes.push({ x: -48.5 + r.range(-0.3, 0.3), z: z + r.range(-0.6, 0.6), s: r.range(0.95, 1.15) }); mangoes.push({ x: -41.5 + r.range(-0.3, 0.3), z: z + 3.5 + r.range(-0.6, 0.6), s: r.range(0.95, 1.15) }); }
      N.trees(ctx, 'mango', mangoes, { seed: 3 });
      N.trees(ctx, 'mango', [{ x: -22, z: -2, s: 0.95 }, { x: -25, z: -28, s: 1.1 }, { x: 40, z: -24 }, { x: 44, z: 12 }], { seed: 5 });
      N.trees(ctx, 'citrus', [{ x: -26, z: -20 }, { x: -20, z: -23 }, { x: -15, z: 22 }, { x: -9, z: 25 }, { x: 30, z: 26 }], { seed: 9 });
      N.trees(ctx, 'forest', [{ x: 20, z: -34 }, { x: 34, z: -32 }, { x: 46, z: -6 }, { x: 36, z: 32 }, { x: 5, z: 36 }, { x: -12, z: -38 }], { seed: 11 });
      N.trees(ctx, 'banyan', [{ x: -20, z: 34, s: 0.7 }], { seed: 12 });
      N.bamboo(ctx, [{ x: -5, z: -32 }, { x: 4, z: -34 }, { x: 12, z: -36 }, { x: 46, z: 24 }], { n: 30, h: 11, r: 1.2, seed: 6 });
      N.hedge(ctx, [[-44, 8], [-36, 8], [-36, 17]], { h: 1.1, w: 0.7, kind: 'hedge', seed: 3, dens: 10 });
      N.hedge(ctx, [[-44, -24], [-38, -24]], { h: 1.1, w: 0.7, kind: 'hedge', seed: 4, dens: 10 });
      /* rặng cây xa ngoài khu di tích */
      const far = [];
      for (let i = 0; i < 240; i++) { const a = (i / 240) * 6.283; const R = r.range(62, 140); far.push({ x: Math.cos(a) * R - 5, z: Math.sin(a) * R * 0.85 }); }
      N.trees(ctx, 'forest', far, { seed: 21, collide: false });
      N.trees(ctx, 'mango', far.filter((_, i) => i % 3 === 0).map((p) => ({ x: p.x * 0.9, z: p.z * 0.9 })), { seed: 22, collide: false });

      /* ---------------- NHÀ 54 ---------------- */
      const h54 = A.frame(-30, 25, Math.PI / 2 - 0.1);
      const yel = HT.mat('yellow_plaster', { tile: 2.2, color: 0xf0cf78, env: 0.8 });
      const whiteT = HT.solid(0xf2eee4, { rough: 0.7 });
      A.block(ctx, B, { x: -30, z: 25, ry: Math.PI / 2 - 0.1, w: 13, d: 8, floors: [3.9], bays: 5, wall: yel, trim: whiteT, base: yel, window: { w: 1.0, h: 1.9, kind: 'casement', shutter: HT.solid(0x3d6a4a, { rough: 0.6 }), shutterOpen: 1, frame: whiteT }, ground: 'door', doorMat: HT.mat('fine_grained_wood', { tile: 1, color: 0xa08870 }), roof: 'hip', roofMat: HT.mat('clay_roof_tiles', { tile: 1.4, color: 0xc07a5a }), roofH: 2.2, cornice: true });
      /* hàng hiên cột trước Nhà 54 */
      for (let i = 0; i < 6; i++) { const [a, b] = h54(-6 + i * 2.4, 5.2); A.column(B, whiteT, a, H(a, b), b, 0.14, 3.2, { base: whiteT, cap: whiteT, seg: 12 }); ctx.colCircle(a, b, 0.2); }
      { const [a, b] = h54(0, 4.8); B.box(HT.mat('red_brick_pavers', { tile: 1, color: 0xc8a088 }), 13.6, 0.18, 2.2, a, H(a, b), b, Math.PI / 2 - 0.1); B.box(yel, 13.6, 0.35, 2.3, a, H(a, b) + 3.2, b, Math.PI / 2 - 0.1); }
      /* ---------------- NHÀ ĐỂ XE + ô tô ---------------- */
      const gx = -50, gz = 33;
      const gar = A.frame(gx, gz, 0);
      const garW = 11, garD = 6.5;
      const garM = HT.mat('yellow_plaster_02', { tile: 2, color: 0xe8d6a8 });
      A.wall(B, ctx, garM, { x0: gx - garW / 2, z0: gz - garD / 2, x1: gx + garW / 2, z1: gz - garD / 2, y0: H(gx, gz), h: 3.2, t: 0.25 });
      A.wall(B, ctx, garM, { x0: gx - garW / 2, z0: gz - garD / 2, x1: gx - garW / 2, z1: gz + garD / 2, y0: H(gx, gz), h: 3.2, t: 0.25 });
      A.wall(B, ctx, garM, { x0: gx + garW / 2, z0: gz - garD / 2, x1: gx + garW / 2, z1: gz + garD / 2, y0: H(gx, gz), h: 3.2, t: 0.25 });
      for (let i = 1; i < 3; i++) { const x = gx - garW / 2 + (garW * i) / 3; A.column(B, garM, x, H(x, gz + garD / 2), gz + garD / 2 - 0.2, 0.18, 3.2, { square: true }); ctx.colCircle(x, gz + garD / 2 - 0.2, 0.22); }
      B.box(HT.mat('concrete_pavement', { tile: 2, color: 0xa8a49a }), garW + 0.6, 0.25, garD + 0.6, gx, H(gx, gz) + 3.2, gz, 0);
      B.box(HT.mat('concrete_pavement', { tile: 2, color: 0xbab6aa }), garW, 0.06, garD, gx, H(gx, gz), gz, 0, { noShadow: true });
      const carInfo = (vi, en, txt) => ({ kicker: 'Hiện vật · Gian 16', title: vi, sub: en, paras: [txt], label: vi });
      VV.car(ctx, 'zis110', gx - 3.7, H(gx, gz) + 0.06, gz + 0.3, -Math.PI / 2, { click: carInfo('Xe ZIS-110', 'ZIS-110 limousine', 'Xe ZIS-110 do Liên Xô sản xuất, màu đen — một trong những chiếc xe Chủ tịch Hồ Chí Minh dùng khi đi công tác, tiếp khách. Nay được trưng bày trong nhà để xe của Khu Di tích Phủ Chủ tịch.') });
      VV.car(ctx, 'pobeda', gx, H(gx, gz) + 0.06, gz + 0.5, -Math.PI / 2, { click: carInfo('Xe Pobeda (GAZ-M20)', 'Pobeda GAZ-M20', 'Xe Pobeda (GAZ-M20) màu xám do Liên Xô sản xuất, được Người sử dụng trong những năm sau kháng chiến chống Pháp.') });
      VV.car(ctx, 'p404', gx + 3.7, H(gx, gz) + 0.06, gz + 0.6, -Math.PI / 2, { click: carInfo('Xe Peugeot 404', 'Peugeot 404', 'Xe Peugeot 404 màu xám bạc — chiếc xe Người dùng trong những năm cuối đời, thường chạy trên con đường xoài trong khu Phủ Chủ tịch.') });

      /* ---------------- PHỦ CHỦ TỊCH (xa, phía tây nam) ---------------- */
      const pal = { x: -118, z: 36, ry: Math.PI / 2 };
      const palYel = HT.mat('yellow_plaster', { tile: 3, color: 0xf2c85c, env: 0.8 });
      const palWhite = HT.solid(0xf4f0e6, { rough: 0.6 });
      A.block(ctx, B, { x: pal.x, z: pal.z, ry: pal.ry, w: 64, d: 18, floors: [4.6, 4.4, 4.2], bays: 17, wall: palYel, trim: palWhite, base: palYel, window: { w: 1.3, h: 2.5, kind: 'casement', frame: palWhite, shutter: HT.solid(0x3c6a48, { rough: 0.6 }), shutterOpen: 1 }, ground: 'plain', roof: 'mansard', roofMat: HT.mat('roof_slates_02', { tile: 1.2, color: 0x6a6f70 }), dormers: 12, mansardH: 3.2, col: false });
      A.block(ctx, B, { x: pal.x + 3, z: pal.z, ry: pal.ry, w: 16, d: 20, floors: [4.6, 4.4, 4.2, 2.6], bays: 5, wall: palYel, trim: palWhite, base: palYel, window: { w: 1.3, h: 2.5, kind: 'casement', frame: palWhite }, ground: 'door', roof: 'mansard', roofMat: HT.mat('roof_slates_02', { tile: 1.2, color: 0x6a6f70 }), mansardH: 3.8, col: false });
      for (let i = 0; i < 4; i++) { const zz = pal.z - 5.4 + i * 3.6; A.column(B, palWhite, pal.x + 14.2, 0, zz, 0.4, 8.8, { base: palWhite, cap: palWhite }); }
      HT.props.flag(ctx, pal.x + 3, 21.5, pal.z, { kind: 'vn', pole: 6, w: 3.6, base: false });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [-35.2, 22.5, 0.35],
        stories: [[-40, 6.5, Math.PI / 2], [-40, -3.5, Math.PI / 2]],
        moc: [-24.5, 17.5, -0.6],
        photos: [[-38.8, 14.4, 0.9], [-24, 26.5, -0.4], [-13.5, 28.6, 0.2], [-8.5, 31.2, 0.3], [-37.6, -3.5, 1.1, 1.3], [-37, -19.5, 1.4], [-37.6, 31.6, 0.5], [-58, 20, Math.PI / 2 + 0.2, 1.4]],
        quote: [-18.6, 6.8, -0.9],
      });
      E.label(ctx, { key: 'nhasan', x: -26.4, z: -18.5, ry: 0.35, vi: 'Nhà sàn Bác Hồ', en: 'Uncle Ho\'s stilt house',
        text: 'Người ở và làm việc tại đây từ 17/5/1958 đến 1969. Nhà gỗ hai tầng theo kiểu nhà sàn dân tộc Việt Bắc: tầng dưới để trống, làm nơi họp và tiếp khách; tầng trên hai phòng nhỏ — phòng làm việc và phòng ngủ — ngăn bằng giá sách, quanh là hành lang và mành tre.',
        textEn: 'His home from May 1958 to 1969: an open ground floor for meetings, and two small rooms upstairs — study and bedroom — divided by a bookshelf.' });
      E.label(ctx, { key: 'ao', x: -21.5, z: -6.8, ry: 1.2, vi: 'Ao cá', en: 'The fish pond',
        text: 'Ao rộng hơn ba nghìn mét vuông trước nhà sàn. Người thường ra bến ao cho cá ăn, vừa nghỉ ngơi vừa suy nghĩ công việc.',
        textEn: 'The pond in front of the stilt house, where he often fed the fish.' });
      E.label(ctx, { key: 'xe', x: -45.5, z: 38.8, ry: Math.PI, vi: 'Nhà để xe', en: 'The garage',
        text: 'Ba chiếc xe Người từng sử dụng: ZIS-110 (đen), Pobeda (xám) và Peugeot 404 (xám bạc). Bấm vào từng xe để xem.',
        textEn: 'Three cars he used: a black ZIS-110, a grey Pobeda and a silver-grey Peugeot 404.' });
      E.label(ctx, { key: 'n54', x: -25.2, z: 30.6, ry: -0.3, vi: 'Nhà 54', en: 'House 54',
        text: 'Ngôi nhà một tầng, nguyên là nhà của người thợ điện thời Pháp. Người ở đây từ cuối năm 1954 đến tháng 5/1958, trước khi chuyển sang nhà sàn.',
        textEn: 'A one-storey house where he lived from late 1954 to May 1958.' });
      E.stdGates(ctx, { hub: [-45, 42, 0], next: [-45, -44, 0], prev: [-56, 12, Math.PI / 2] });
    },
  };
})();
