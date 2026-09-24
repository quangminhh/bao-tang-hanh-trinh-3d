/* GIAN 07 — NƯỚC MỸ: BOSTON, PHỐ SCHOOL (mùa đông 1912 – 1913).
   Dựng lại: phố School ở trung tâm Boston — khách sạn Parker House mặt đá cẩm thạch trắng bảy tầng, mái mansard;
   nhà thờ King’s Chapel bằng đá granit Quincy xám sẫm (1754) với tháp vuông và hiên cột Ionic ở góc phố Tremont;
   Tòa thị chính cũ (1865) kiểu Đế chế thứ hai mái mansard, hàng rào sắt; phố Tremont có đường ray xe điện.
   Tuyết đọng bên vỉa hè, cây trơ cành, đèn khí. Cửa hông Parker House mở vào gian bếp bánh (dựng lại): lò gạch,
   bàn nhồi bột, khay bánh mì Parker House.
   Trục: phố School chạy theo x (z −6 … 6); phố Tremont theo z ở x −44 … −30. */
(function () {
  const HT = window.HT;
  HT.halls.G07 = {
    sky: { hdri: 'snow_field_puresky', sunAz: 160, exposure: 0.95, fog: 0.004, sat: 0.9, con: 1.05, bloom: 0.14, shadowSize: 60, tint: [0.98, 1.0, 1.04] },
    spawn: { x: 22, z: 2, yaw: 1.45, pitch: 0.04 },
    map: [-60, -40, 50, 44],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      const H = (x, z) => HT.fbm(x * 0.003, z * 0.003, 3) * 14 * HT.smooth(400, 900, Math.hypot(x, z));
      const road = (x, z) => (Math.abs(z) < 4 && x > -30) || (x > -41 && x < -33) ? 1 : 0;
      const W = (x, z) => {
        const rd = road(x, z);
        const snow = rd ? HT.smooth(0.25, 0.6, HT.noise(x * 0.25, z * 0.25, 3) + 0.2) * 0.35 : HT.smooth(0.1, 0.55, HT.noise(x * 0.18, z * 0.18, 5) + 0.15) * 0.8;
        return [rd, 0, snow];
      };
      N.terrain(ctx, { size: 1600, inner: 90, step: 0.5, height: H, weights: W, layers: [
        { slug: 'large_floor_tiles_02', tile: 2.2, tint: 0xd4d0c8, rough: 0.55 },
        { slug: 'worn_asphalt', tile: 3, tint: 0x8a8884, rough: 0.28 },
        { slug: 'cobblestone_05', tile: 2, rough: 0.5 },
        { slug: 'snow_02', tile: 3, tint: 0xf2f4f8, rough: 0.7 },
      ], macro: 0.06 });
      ctx.bounds = [[-44, -36], [-30, -36], [-30, -5.9], [-2.2, -5.9], [-2.2, -12.6], [5, -12.6], [5, -5.9], [44, -5.9], [44, 17.6], [8.2, 17.6], [8.2, 5.9], [-30, 5.9], [-30, 36], [-44, 36]];
      const curb = HT.mat('granite_tile', { tile: 1, color: 0xa8a8a6 });
      B.box(curb, 70, 0.14, 0.3, 5, -0.02, -4, 0); B.box(curb, 70, 0.14, 0.3, 5, -0.02, 4, 0);
      for (const sx of [-41, -33]) B.box(curb, 0.3, 0.14, 72, sx, -0.02, 0, 0);
      /* đường ray xe điện trên phố Tremont */
      const rail = HT.solid(0x6a6a6a, { rough: 0.3, metal: 0.9 });
      for (const rx of [-38.3, -36.9, -37.6 + 2.4, -37.6 + 3.8].slice(0, 2)) B.box(rail, 0.07, 0.03, 90, rx, 0, 0, 0);
      /* đống tuyết dọc vỉa hè */
      const snowM = HT.mat('snow_02', { tile: 1.2, color: 0xf4f6fa, rough: 0.75 });
      const piles = [];
      for (let x = -28; x < 38; x += 2.2 + r() * 2) { if (r() < 0.7) piles.push({ x, z: -4.5 - r() * 0.4, sx: r.range(0.5, 1.2), sy: r.range(0.25, 0.5), sz: r.range(0.35, 0.6), col: false }); if (r() < 0.7) piles.push({ x: x + 1, z: 4.5 + r() * 0.4, sx: r.range(0.5, 1.2), sy: r.range(0.25, 0.5), sz: r.range(0.35, 0.6), col: false }); }
      for (let z = -34; z < 34; z += 2.5 + r() * 2) { if (Math.abs(z) < 7) continue; if (z < 5 || z > 26) piles.push({ x: -32.5, z, sx: r.range(0.35, 0.6), sy: r.range(0.25, 0.5), sz: r.range(0.6, 1.2), col: false }); piles.push({ x: -41.5, z: z + 1, sx: r.range(0.35, 0.6), sy: r.range(0.25, 0.5), sz: r.range(0.6, 1.2), col: false }); }
      piles.forEach((p) => { p.y = 0; });
      N.rocks(ctx, piles, snowM);

      /* ---------------- vật liệu ---------------- */
      const marble = HT.ashlar('parker', { color: 0xf5f4f1, joint: 0xc4c2be, bw: 1.4, bh: 0.55, vein: true, rough: 0.42, speck: 0.04 });
      const quincy = HT.ashlar('quincy', { color: 0x5e5c58, joint: 0x3a3836, bw: 1.2, bh: 0.6, rustic: true, speck: 0.14, vary: 1.6 });
      const granL = HT.ashlar('cityhall', { color: 0xdedcd6, joint: 0x9a9892, bw: 1.3, bh: 0.5, speck: 0.1 });
      const slate = HT.mat('roof_slates_03', { tile: 1.2, color: 0x9aa0a6 });
      const lead = HT.solid(0x5e6468, { rough: 0.45, metal: 0.5 });
      const brick = HT.mat('red_brick_03', { tile: 1.5, color: 0xe0c0b0 });
      const brickB = HT.mat('brick_wall_10', { tile: 1.5, color: 0xf0d8c8 });
      const glass = HT.glass();
      const iron = HT.solid(0x1a1c1c, { rough: 0.45, metal: 0.7 });
      const sash = { w: 1.15, h: 2.1, kind: 'sash', rows: 2, cols: 2, frame: HT.solid(0xeeeae2, { rough: 0.5 }) };
      const snowRoof = (x, z, w, d, y, ry) => B.box(snowM, w, 0.12, d, x, y, z, ry || 0);

      /* ---------------- PARKER HOUSE (phía bắc phố School) ---------------- */
      const PX0 = -30, PX1 = 10, PZ = -6, PD = 22, GH = 4.6;
      A.block(ctx, B, { x: (PX0 + PX1) / 2, z: PZ - PD / 2, ry: 0, yb: GH, w: PX1 - PX0, d: PD, floors: [3.6, 3.4, 3.4, 3.3, 3.2, 3.2], bays: 12, wall: marble, trim: HT.ashlar('parkerT', { color: 0xfbfaf8, joint: 0xd4d2ce, bw: 0.9, bh: 0.3, speck: 0.03 }),
        window: sash, ground: 'plain', balcony: [1], railMat: iron, roof: 'mansard', roofMat: slate, roofTop: lead, mansardH: 3.0, dormers: 10, chimneys: [[-14, -8], [0, -8], [14, -8]], chimneyMat: brick, col: false });
      /* tầng trệt: cửa sổ lớn, sảnh chính, cửa bếp mở vào gian bếp bánh */
      const KX0 = -2, KX1 = 4.8;                         // gian bếp (x), sâu từ z −6.5 đến −13
      const ops = [];
      for (let x = PX0 + 2.5; x < PX1 - 1; x += 3.6) { if (x > KX0 - 1.4 && x < KX1 + 1.4) continue; if (Math.abs(x + 18) < 2.2) continue; ops.push({ u: x - PX0, w: 2.0, y: 0.7, h: 2.9, win: true }); }
      ops.push({ u: -18 - PX0, w: 2.6, y: 0, h: 3.5, blocked: true, main: true });
      ops.push({ u: 1.4 - PX0, w: 1.2, y: 0.1, h: 2.5 });
      ops.push({ u: -0.7 - PX0, w: 1.3, y: 1.1, h: 2.0, win: true, kit: true });
      ops.push({ u: 3.5 - PX0, w: 1.3, y: 1.1, h: 2.0, win: true, kit: true });
      A.wall(B, ctx, marble, { x0: PX0, z0: PZ - 0.25, x1: PX1, z1: PZ - 0.25, y0: 0, h: GH, t: 0.5, open: ops });
      for (const o of ops) {
        const x = PX0 + o.u;
        if (o.win) { A.window(B, { x, z: PZ - 0.25, ry: 0, w: o.w, h: o.h, y: o.y, t: 0.5, kind: 'casement', rows: 2, cols: 2, frame: HT.solid(0x2a2420, { rough: 0.45 }), glass, sillMat: marble }); if (!o.kit) B.box(HT.solid(0x241f1a, { rough: 0.95 }), o.w, o.h, 0.1, x, o.y, PZ - 1.1, 0); }
        else if (o.main) A.door(B, { x, z: PZ - 0.25, ry: 0, w: o.w, h: o.h, y: 0, t: 0.5, kind: 'glass', leaves: 2, open: 0, mat: HT.solid(0x2a1e16, { rough: 0.4, env: 0.9 }), glass });
        else A.door(B, { x, z: PZ - 0.25, ry: 0, w: o.w, h: o.h, y: 0.1, t: 0.5, kind: 'panel', leaves: 1, open: 0.9, mat: HT.solid(0x3a2a20, { rough: 0.55 }) });
      }
      /* mái hiên sảnh + biển tên */
      B.box(iron, 4.2, 0.16, 3.2, -18, 3.7, PZ + 1.5, 0);
      for (const dx of [-2, 2]) B.cyl(iron, 0.05, 0.05, 3.7, -18 + dx, 0, PZ + 3.0, 8);
      E.sign(ctx, B, { key: 'parker', text: 'PARKER  HOUSE', x: -18, y: 3.9, z: PZ + 3.12, w: 4.0, h: 0.5, bg: '#1f1a14', ink: '#e8d49a', font: HT.FONT_SERIF });
      /* tường còn lại tầng trệt + phần tối */
      B.box(marble, PX1 - PX0, GH, 0.4, (PX0 + PX1) / 2, 0, PZ - PD + 0.2, 0, { col: true });
      for (const sx of [PX0, PX1]) B.box(marble, 0.4, GH, PD, sx + (sx === PX0 ? 0.2 : -0.2), 0, PZ - PD / 2, 0, { col: true });
      for (const [x0, x1] of [[PX0 + 0.4, KX0 - 0.2], [KX1 + 0.2, PX1 - 0.4]]) B.box(HT.solid(0x1a1714, { rough: 0.95 }), x1 - x0, GH - 0.1, PD - 1.4, (x0 + x1) / 2, 0.02, PZ - PD / 2 - 0.3, 0);
      /* ---------------- gian bếp bánh (dựng lại) ---------------- */
      const KZ0 = PZ - 0.5, KZ1 = -13.2, KH = 4.3;
      const whiteW = HT.mat('plastered_wall', { tile: 2, color: 0xf2eee4 });
      B.box(whiteW, 0.2, KH, KZ0 - KZ1, KX0 - 0.1, 0, (KZ0 + KZ1) / 2, 0, { col: true });
      B.box(whiteW, 0.2, KH, KZ0 - KZ1, KX1 + 0.1, 0, (KZ0 + KZ1) / 2, 0, { col: true });
      B.box(whiteW, KX1 - KX0 + 0.4, KH, 0.2, (KX0 + KX1) / 2, 0, KZ1 - 0.1, 0, { col: true });
      B.box(whiteW, KX1 - KX0, 0.2, KZ0 - KZ1, (KX0 + KX1) / 2, KH, (KZ0 + KZ1) / 2, 0);
      B.box(HT.mat('herringbone_brick', { tile: 1.2, color: 0xe8d8c8 }), KX1 - KX0, 0.1, KZ0 - KZ1, (KX0 + KX1) / 2, 0, (KZ0 + KZ1) / 2, 0);
      ctx.floorRect((KX0 + KX1) / 2, (KZ0 + KZ1) / 2 + 0.2, KX1 - KX0, KZ0 - KZ1 + 0.6, 0.1, 0);
      /* lò nướng gạch âm tường sau */
      const ovB = HT.mat('red_brick', { tile: 1.2, color: 0xe0c8b8 });
      B.box(ovB, 4.6, 2.4, 1.6, (KX0 + KX1) / 2, 0.1, KZ1 + 0.8, 0, { col: true });
      for (const dx of [-1.2, 1.2]) { B.box(iron, 1.0, 0.7, 0.06, (KX0 + KX1) / 2 + dx, 0.8, KZ1 + 1.62, 0); B.box(HT.solid(0xb88a3e, { rough: 0.3, metal: 0.9 }), 0.6, 0.05, 0.05, (KX0 + KX1) / 2 + dx, 1.3, KZ1 + 1.66, 0); }
      B.box(ovB, 1.0, KH - 2.5, 0.8, (KX0 + KX1) / 2, 2.5, KZ1 + 0.4, 0);
      /* bàn nhồi bột, khay bánh Parker House */
      const topM = HT.mat('oak_wood_planks', { tile: 1, color: 0xecd8bc });
      const top = P.table(B, (KX0 + KX1) / 2, 0.1, -9.4, 0, { w: 3.0, d: 1.2, h: 0.9, mat: topM, leg: 0.09, stretcher: true });
      ctx.colBox((KX0 + KX1) / 2, -9.4, 3.0, 1.2, 0, 0, 1);
      const bun = HT.solid(0xd4a060, { rough: 0.65 });
      for (let t = 0; t < 3; t++) { const tx = (KX0 + KX1) / 2 - 1 + t * 1.0; B.box(HT.solid(0x3a3a38, { rough: 0.4, metal: 0.7 }), 0.8, 0.02, 0.5, tx, top, -9.3, 0); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) B.add(bun, new T.SphereGeometry(0.07, 10, 6), { x: tx - 0.3 + i * 0.2, y: top + 0.05, z: -9.45 + j * 0.15, sy: 0.6, sx: 1.2 }); }
      B.cyl(HT.solid(0xece4d0, { rough: 0.9 }), 0.35, 0.38, 0.14, (KX0 + KX1) / 2 + 1.0, top, -9.6, 20);
      HT.model(ctx, 'wooden_bowl_01', { x: (KX0 + KX1) / 2 - 1.25, z: -9.25, y: top, h: 0.14, env: 0.6 });
      /* bao bột, giá khay */
      const sackM = HT.solid(0xe2d8c0, { rough: 0.95 });
      for (let i = 0; i < 4; i++) { const g = new T.SphereGeometry(0.35, 12, 8); g.scale(1, 1.3, 0.8); B.add(sackM, g, { x: KX1 - 0.5, y: 0.5, z: -7.3 - i * 0.62, uv: 'keep' }); }
      ctx.colBox(KX1 - 0.5, -8.2, 0.8, 2.6, 0, 0, 1);
      P.bookshelf(B, KX0 + 0.3, 0.1, -11.4, Math.PI / 2, { w: 1.6, h: 2.0, d: 0.5, books: false, mat: HT.mat('fine_grained_wood', { tile: 0.8, color: 0xe8d4bc }) });
      for (let sh = 1; sh < 5; sh++) B.box(HT.solid(0x3a3a38, { rough: 0.4, metal: 0.7 }), 0.45, 0.02, 1.4, KX0 + 0.35, 0.1 + sh * 0.4 + 0.03, -11.4, 0);
      for (const lz of [-8.2, -11]) { HT.model(ctx, 'caged_hanging_light', { x: (KX0 + KX1) / 2, z: lz, y: 3.3, h: 0.45, env: 0.8 }); const l = new T.PointLight(0xffdcae, 12, 8, 1.4); l.position.set((KX0 + KX1) / 2, 3.2, lz); ctx.add(l); }

      /* ---------------- KING’S CHAPEL (góc đông nam School – Tremont) ---------------- */
      { const cx0 = -18, cx1 = 4, cz0 = 6, cz1 = 26;
        B.box(quincy, cx1 - cx0, 12, cz1 - cz0, (cx0 + cx1) / 2, 0, (cz0 + cz1) / 2, 0, { col: true });
        const winM = HT.solid(0x1a2024, { rough: 0.1, metal: 0.3, env: 1.3 }), sillM = HT.mat('white_sandstone_bricks', { tile: 1, color: 0x9a9894 });
        for (let x = cx0 + 2.5; x < cx1 - 1; x += 4) for (const [y, h] of [[1.2, 3.2], [6.0, 4.4]]) {
          const g = HT.extrude([[-0.8, 0], [0.8, 0], [0.8, h - 0.8], [0, h], [-0.8, h - 0.8]], 0.1); g.translate(0, 0, -0.12);
          B.add(winM, g, { x, y, z: cz0, ry: Math.PI, uv: 'box' });
          B.box(sillM, 2.0, 0.25, 0.2, x, y - 0.25, cz0 - 0.05, 0);
        }
        A.hipRoof(B, slate, { x: (cx0 + cx1) / 2, z: (cz0 + cz1) / 2, w: cx1 - cx0 + 0.8, d: cz1 - cz0 + 0.8, eave: 12, ridge: 16.5, ridgeLen: 8, thick: 0.2, kind: 'plain' });
        /* tháp vuông phía tây (hướng ra phố Tremont) + hiên cột Ionic gỗ sơn giả đá */
        const tx = -24, tz = 16;
        B.box(quincy, 12, 24, 12, tx, 0, tz, 0, { col: true });
        B.box(quincy, 13, 1.2, 13, tx, 24, tz, 0);
        for (let k = 0; k < 3; k++) { const g = HT.extrude([[-0.7, 0], [0.7, 0], [0.7, 2.4], [0, 3.2], [-0.7, 2.4]], 0.1); B.add(winM, g, { x: tx - 6.05, y: 15, z: tz - 3.5 + k * 3.5, ry: -Math.PI / 2, uv: 'box' }); }
        const colM = HT.solid(0xc8c4bc, { rough: 0.6 });
        const colPos = []; for (let k = 0; k < 4; k++) colPos.push([tx - 7.9, tz - 5.4 + k * 3.6]);
        colPos.push([tx - 5.2, tz - 7.6], [tx - 5.2, tz + 7.6], [tx - 2.4, tz - 7.6], [tx - 2.4, tz + 7.6]);
        for (const [x, z] of colPos) { A.column(B, colM, x, 0, z, 0.42, 8.2, { base: colM, baseH: 0.4, seg: 20 }); B.box(colM, 1.3, 0.3, 0.8, x, 8.2, z, 0); ctx.colCircle(x, z, 0.5); }
        B.box(colM, 6.6, 1.2, 16.4, tx - 4.9, 8.5, tz, 0);
        A.railing(B, colM, [[tx - 8.2, tz - 8.2], [tx - 8.2, tz + 8.2]], 9.7, { h: 1.0, spacing: 0.35, r: 0.1, square: true });
        /* nghĩa trang cổ phía nam nhà thờ: bia đá phiến */
        const slateM = HT.mat('granite_tile', { tile: 0.6, color: 0x6a6a6c });
        for (let k = 0; k < 24; k++) { const x = -29 + (k % 6) * 2.0 + r.range(-0.3, 0.3), z = 27 + Math.floor(k / 6) * 2.2 + r.range(-0.3, 0.3); B.box(slateM, 0.7, r.range(0.6, 1.0), 0.08, x, 0, z, r.range(-0.15, 0.15)); }
        A.fence(B, ctx, iron, [[-30, 25], [-30, 36]], { kind: 'sat', h: 1.3 });
      }
      /* ---------------- TÒA THỊ CHÍNH CŨ (phía nam, lùi vào có sân) ---------------- */
      A.block(ctx, B, { x: 26, z: 28, ry: Math.PI, w: 36, d: 20, floors: [4.8, 4.2, 4.0], bays: 11, wall: granL, trim: HT.ashlar('cityhallT', { color: 0xeeece6, joint: 0xb0aea8, bw: 0.9, bh: 0.32, speck: 0.06 }), window: Object.assign({}, sash, { h: 2.4 }), ground: 'door', doorKind: 'panel', doorMat: HT.solid(0x2a1e16, { rough: 0.45 }), roof: 'mansard', roofMat: slate, roofTop: lead, mansardH: 3.6, dormers: 9, chimneys: [[-12, -6], [12, -6]], chimneyMat: granL });
      A.block(ctx, B, { x: 26, z: 17, ry: Math.PI, w: 12, d: 2.4, floors: [4.8, 4.2, 4.0, 3.6], bays: 3, wall: granL, trim: HT.ashlar('cityhallT', { color: 0xeeece6, joint: 0xb0aea8, bw: 0.9, bh: 0.32, speck: 0.06 }), window: Object.assign({}, sash, { h: 2.4 }), ground: 'door', doorKind: 'panel', doorMat: HT.solid(0x2a1e16, { rough: 0.45 }), roof: 'mansard', roofMat: slate, roofTop: lead, mansardH: 3.0, dormers: 2 });
      A.fence(B, ctx, iron, [[8.2, 6.2], [23.5, 6.2]], { kind: 'sat', h: 1.3 });
      A.fence(B, ctx, iron, [[28.5, 6.2], [44, 6.2]], { kind: 'sat', h: 1.3 });
      A.fence(B, ctx, iron, [[8.2, 6.2], [8.2, 17.8]], { kind: 'sat', h: 1.3 });
      N.grass(ctx, { rect: [8.5, 6.5, 44, 15.5], density: 4, kind: 'dry', mask: (x, z) => (Math.abs(x - 26) < 2.5 ? 0 : 0.5), seed: 3, far: 30 });
      N.trees(ctx, 'forest', [{ x: 13, z: 11, s: 0.55 }, { x: 38, z: 11, s: 0.5 }, { x: -25, z: 32, s: 0.5 }], { seed: 9, bare: true });
      /* ---------------- các nhà khác ---------------- */
      A.block(ctx, B, { x: 27, z: -14, ry: 0, w: 34, d: 16, floors: [4.4, 3.6, 3.6, 3.4, 3.2], bays: 9, wall: brick, trim: HT.ashlar('bostonT', { color: 0xe6e0d4, joint: 0xa8a296, bw: 0.9, bh: 0.32, speck: 0.06 }), base: granL, window: sash, ground: 'shop', shopFrame: HT.solid(0x1e2a24, { rough: 0.4 }), roof: 'flat', parapet: 0.9, cornice: true });
      A.block(ctx, B, { x: -53, z: 0, ry: Math.PI / 2, w: 72, d: 18, floors: [4.4, 3.6, 3.6, 3.4, 3.2, 3.0], bays: 18, wall: brickB, trim: HT.ashlar('bostonT', { color: 0xe6e0d4, joint: 0xa8a296, bw: 0.9, bh: 0.32, speck: 0.06 }), base: granL, window: sash, ground: 'shop', shopFrame: HT.solid(0x2a2418, { rough: 0.4 }), roof: 'flat', parapet: 1.0, cornice: true });
      A.block(ctx, B, { x: 50, z: 0, ry: -Math.PI / 2, w: 30, d: 16, floors: [4.4, 3.6, 3.6, 3.4], bays: 8, wall: brick, trim: HT.ashlar('bostonT', { color: 0xe6e0d4, joint: 0xa8a296, bw: 0.9, bh: 0.32, speck: 0.06 }), window: sash, ground: 'shop', roof: 'flat', parapet: 0.9 });
      A.block(ctx, B, { x: -37, z: 46, ry: Math.PI, w: 30, d: 16, floors: [4.4, 3.6, 3.6, 3.4], bays: 8, wall: brickB, trim: HT.ashlar('bostonT', { color: 0xe6e0d4, joint: 0xa8a296, bw: 0.9, bh: 0.32, speck: 0.06 }), window: sash, ground: 'shop', roof: 'flat', parapet: 0.9 });
      /* tuyết trên các mặt mái bằng, gờ cửa sổ */
      snowRoof(27, -14, 33.6, 15.6, 18.2 + 0.9 - 0.05); snowRoof(-53, 0, 17.6, 71.6, 21.2 + 1.0 - 0.05, 0);

      /* ---------------- xe điện, đèn, hòm thư ---------------- */
      VV.tram(ctx, -37.6, 0, 12, Math.PI / 2, { color: 0x6a2a1e, color2: 0xe8dcc0, label: 'TREMONT ST', name: 'BOSTON ELEVATED' });
      VV.car(ctx, 'old1910', 3, 0, 1.8, 0, { color: 0x1a1a1a });
      for (let x = -26; x <= 36; x += 12) { P.gasLamp(B, ctx, x, 0, -5.3, { h: 4.2 }); P.gasLamp(B, ctx, x + 6, 0, 5.3, { h: 4.2 }); }
      { const bx = 30, bz = -5.2; B.box(HT.solid(0x2a4a34, { rough: 0.45, metal: 0.4 }), 0.55, 1.2, 0.45, bx, 0, bz, 0, { col: true }); }

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [30, -4.9, 0.25, 'lectern'],
        stories: [[-10, 5.0, Math.PI], [36.5, 5.0, Math.PI]],
        moc: [-26, -4.9, 0.1],
        quote: [14, -5.0, 0.15],
        photos: [[20, -5.0, 0.1, 1.2], [-3, 5.0, Math.PI - 0.1, 0.9]],
      });
      E.label(ctx, { key: 'parker', x: -12, z: -4.9, ry: 0.3, vi: 'Khách sạn Parker House', en: 'The Parker House hotel',
        text: 'Khách sạn lâu đời ở phố School, Boston (mở năm 1855), nổi tiếng với món bánh mì Parker House. Cuối năm 1912 – 1913, Nguyễn Tất Thành làm thợ phụ làm bánh ở đây; một bức thư Người gửi cụ Phan Châu Trinh ghi địa chỉ Boston.',
        textEn: 'Opened in 1855, famous for its Parker House rolls. In 1912 – 1913 Nguyen Tat Thanh worked here as a baker’s assistant; a letter to Phan Chau Trinh carries a Boston address.' });
      E.label(ctx, { key: 'bepbanh', x: -1.0, z: -8.0, ry: 0.6, vi: 'Gian bếp bánh', en: 'The bakery kitchen',
        text: 'Lò nướng xây gạch, bàn nhồi bột, khay bánh mì vừa ra lò — công việc của người thợ phụ bắt đầu từ trước bình minh giữa mùa đông giá lạnh.',
        textEn: 'Brick ovens, dough tables and trays of fresh rolls: work began before dawn in the winter cold.' });
      E.label(ctx, { key: 'chapel', x: -21, z: 4.9, ry: Math.PI - 0.2, vi: 'Nhà thờ King’s Chapel', en: 'King’s Chapel',
        text: 'Nhà thờ bằng đá granit Quincy (1754) ở góc phố School và Tremont, với tháp vuông và hiên cột — một trong những công trình cổ nhất Boston.',
        textEn: 'Quincy granite church of 1754 at School and Tremont streets.' });
      E.label(ctx, { key: 'newyork', x: -42.6, z: -12, ry: Math.PI / 2 - 0.3, vi: 'New York và Harlem', en: 'New York and Harlem',
        text: 'Ở Mỹ, Người còn sống và làm thuê ở New York, đi thăm khu Harlem của người Mỹ gốc Phi, tìm hiểu cuộc sống của người lao động và nạn phân biệt chủng tộc, điều sau này Người viết trong bài “Hành hình kiểu Linsơ”.',
        textEn: 'He also lived and worked in New York and visited Harlem; he later wrote about racial violence in “Lynching”.' });
      E.stdGates(ctx, { hub: [42.8, -2, Math.PI / 2], prev: [42.8, 2.2, Math.PI / 2], next: [-37, -34.5, 0] });
    },
  };
})();
