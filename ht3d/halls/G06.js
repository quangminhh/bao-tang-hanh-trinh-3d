/* GIAN 06 — NƯỚC ANH: LONDON, PHỐ HAYMARKET (1913 – 1917).
   Dựng lại: phố Haymarket buổi sáng sương mù — mặt đường nhựa ướt, vỉa hè lát đá phiến York, bó vỉa đá granit;
   bên tây là khách sạn Carlton (đá Portland, sáu tầng, mái mansard có cửa sổ mái, tháp góc mái vòm đồng xanh ở góc
   Pall Mall, mái hiên kính trước sảnh); bên đông là Nhà hát Hoàng gia Haymarket với hiên sáu cột Corinth và trán tường
   tam giác; dãy nhà gạch đỏ viền đá, cửa sổ kéo kiểu Anh. Xe buýt hai tầng mui trần kiểu B màu đỏ, taxi, hòm thư đỏ,
   đèn khí. Cửa bếp phía đường dẫn vào gian bếp khách sạn (dựng lại): lò gang dài, chụp hút khói, nồi đồng, bàn nhồi bột.
   Trục: phố chạy theo z; khách sạn Carlton ở phía −x. */
(function () {
  const HT = window.HT;
  HT.halls.G06 = {
    sky: { hdri: 'kloofendal_misty_morning_puresky', sunAz: 150, exposure: 1.0, fog: 0.0045, sat: 0.92, con: 1.04, bloom: 0.12, shadowSize: 60, tint: [0.98, 1.0, 1.03] },
    spawn: { x: 5, z: 32, yaw: 0.28, pitch: 0.02 },
    map: [-30, -56, 36, 48],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      const H = (x, z) => HT.fbm(x * 0.003, z * 0.003, 3) * 16 * HT.smooth(400, 900, Math.hypot(x, z));
      const W = (x, z) => {
        const road = Math.abs(x) < 8 || (z < -41 && z > -53) ? 1 : 0;
        const walk = road ? 0 : 1;
        return [road, walk, 0];
      };
      N.terrain(ctx, { size: 1600, inner: 90, step: 0.6, height: H, weights: W, layers: [
        { slug: 'large_floor_tiles_02', tile: 2.4, tint: 0xd8d4cc, rough: 0.6 },
        { slug: 'worn_asphalt', tile: 3, tint: 0x5e5c5a, rough: 0.3 },
        { slug: 'large_floor_tiles_02', tile: 1.8, tint: 0xd8d2c6, rough: 0.55 },
        { slug: 'cobblestone_05', tile: 2, rough: 0.5 },
      ], macro: 0.08 });
      ctx.bounds = [[-11.9, 44], [-11.9, 6.6], [-21.6, 6.6], [-21.6, -6.6], [-11.9, -6.6], [-11.9, -53], [11.9, -53], [11.9, -6.4], [15.8, -6.4], [15.8, 8.4], [11.9, 8.4], [11.9, 44]];
      const curb = HT.mat('granite_tile', { tile: 1, color: 0xa8a8a6 });
      for (const sx of [-8, 8]) B.box(curb, 0.3, 0.14, 82, sx, -0.02, 2, 0);
      for (const sz of [-41, -53]) for (const sx of [-1, 1]) B.box(curb, 20, 0.14, 0.3, sx * 18, -0.02, sz, 0);

      /* ---------------- vật liệu ---------------- */
      const portland = HT.ashlar('portland', { color: 0xe6e4de, joint: 0xa8a6a0, bw: 1.2, bh: 0.5, dirt: true, speck: 0.07 });
      const portT = HT.ashlar('portlandT', { color: 0xefede8, joint: 0xb8b6b0, bw: 0.9, bh: 0.35, speck: 0.05 });
      const slate = HT.mat('grey_roof_tiles_02', { tile: 1.2, color: 0xb0b4b8 });
      const lead = HT.solid(0x6e7478, { rough: 0.45, metal: 0.5 });
      const brickR = HT.mat('brick_wall_006', { tile: 1.6, color: 0xd8b8a8 });
      const brickD = HT.mat('red_brick_03', { tile: 1.5, color: 0xe0c0b0 });
      const glass = HT.glass();
      const iron = HT.solid(0x1a1c1c, { rough: 0.45, metal: 0.7 });
      const sash = { w: 1.2, h: 2.2, kind: 'sash', rows: 2, cols: 2, frame: HT.solid(0xeeeae2, { rough: 0.5 }) };

      /* ---------------- KHÁCH SẠN CARLTON (phía tây) ---------------- */
      const CX = -12.2, CZ0 = -40, CZ1 = 14, CD = 20, GH = 5.2;
      A.block(ctx, B, { x: CX - CD / 2, z: (CZ0 + CZ1) / 2, ry: Math.PI / 2, yb: GH, w: CZ1 - CZ0, d: CD, floors: [4.2, 3.8, 3.6, 3.4, 3.2], bays: 14, wall: portland, trim: portT,
        window: Object.assign({}, sash, { w: 1.3, h: 2.4 }), ground: 'plain', balcony: [1, 4], railMat: iron, roof: 'mansard', roofMat: slate, roofTop: lead, mansardH: 3.2, dormers: 12, chimneys: [[-18, -6], [0, -6], [18, -6]], chimneyMat: portland, col: false });
      /* tầng trệt: tường đá có cửa hàng, sảnh, cửa bếp mở */
      const gOps = [];
      const kZ = 0;                                        // cửa bếp
      for (let z = CZ1 - 3; z > CZ0 + 1; z -= 4.6) { if (Math.abs(z - kZ) < 8.8 || Math.abs(z + 20) < 2.5) continue; gOps.push({ u: CZ1 - z, w: 2.2, y: 0.6, h: 3.4, win: true }); }
      gOps.push({ u: CZ1 - (-20), w: 2.6, y: 0, h: 3.8, blocked: true, main: true });
      gOps.push({ u: CZ1 - kZ, w: 1.3, y: 0.1, h: 2.6 });
      for (const wz of [-4, 4]) gOps.push({ u: CZ1 - wz, w: 1.8, y: 1.2, h: 2.2, win: true, kit: true });
      A.wall(B, ctx, portland, { x0: CX, z0: CZ1, x1: CX, z1: CZ0, y0: 0, h: GH, t: 0.5, open: gOps });
      for (const o of gOps) {
        const z = CZ1 - o.u;
        if (o.win) { A.window(B, { x: CX, z, ry: Math.PI / 2, w: o.w, h: o.h, y: o.y, t: 0.5, kind: 'casement', rows: 2, cols: 3, frame: HT.solid(0x2a3a34, { rough: 0.45 }), glass, sillMat: portT }); if (!o.kit) B.box(HT.solid(0x241f1a, { rough: 0.95 }), 0.1, o.h, o.w, CX - 0.9, o.y, z, 0); }
        else if (o.main) A.door(B, { x: CX, z, ry: Math.PI / 2, w: o.w, h: o.h, y: 0, t: 0.5, kind: 'glass', leaves: 2, open: 0, mat: HT.solid(0x2a1e16, { rough: 0.4, env: 0.9 }), glass });
        else A.door(B, { x: CX, z, ry: Math.PI / 2, w: o.w, h: o.h, y: 0.1, t: 0.5, kind: 'panel', leaves: 1, open: 0.9, mat: HT.solid(0x2a3a30, { rough: 0.55 }) });
        /* khung đá quanh ô cửa */
        B.box(portT, 0.12, 0.3, o.w + 0.5, CX + 0.28, o.y + o.h, z, 0);
      }
      B.box(portT, 0.4, 0.4, CZ1 - CZ0 + 0.4, CX + 0.2, GH - 0.4, (CZ0 + CZ1) / 2, 0);
      B.box(HT.mat('granite_tile', { tile: 1, color: 0x8a8a88 }), 0.3, 0.5, CZ1 - CZ0, CX + 0.3, 0, (CZ0 + CZ1) / 2, 0);
      /* mái hiên kính trước sảnh chính */
      B.box(iron, 3.8, 0.14, 4.2, CX + 1.9, 3.95, -20, 0);
      B.box(HT.solid(0xd8e0e0, { rough: 0.1, transparent: true, opacity: 0.45, env: 1.2 }), 3.7, 0.04, 4.1, CX + 1.9, 4.09, -20, 0);
      for (const dz of [-1.9, 1.9]) B.beam(iron, CX + 0.3, 5.0, -20 + dz, CX + 3.7, 4.05, -20 + dz, 0.06, 0.06, { round: true });
      /* các tường còn lại của tầng trệt */
      B.box(portland, 0.4, GH, CZ1 - CZ0, CX - CD + 0.2, 0, (CZ0 + CZ1) / 2, 0, { col: true });
      B.box(portland, CD, GH, 0.4, CX - CD / 2, 0, CZ0 + 0.2, 0, { col: true });
      B.box(portland, CD, GH, 0.4, CX - CD / 2, 0, CZ1 - 0.2, 0, { col: true });
      /* tháp góc Pall Mall, mái vòm đồng xanh */
      { const tx = CX - 3.6, tz = CZ0 + 0.2;
        B.cyl(portland, 3.9, 3.9, GH + 18.2, tx, 0, tz, 32);
        B.cyl(portT, 4.2, 4.2, 0.5, tx, GH + 18.2, tz, 32);
        const dome = new T.SphereGeometry(4.0, 32, 14, 0, 6.283, 0, Math.PI / 2); dome.scale(1, 1.15, 1);
        B.add(HT.solid(0x6f9c88, { rough: 0.5, metal: 0.4, env: 1.1 }), dome, { x: tx, y: GH + 18.7, z: tz, uv: 'keep' });
        B.cyl(HT.solid(0x6f9c88, { rough: 0.5, metal: 0.4 }), 0.25, 0.6, 2.4, tx, GH + 23.2, tz, 12);
        for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283; A.window(B, { x: tx + Math.cos(a) * 3.9, z: tz + Math.sin(a) * 3.9, ry: Math.atan2(Math.cos(a), Math.sin(a)), w: 1.1, h: 2.2, y: GH + 5, t: 0.3, kind: 'sash', rows: 2, frame: HT.solid(0xeeeae2, { rough: 0.5 }), glass, sill: false }); }
        ctx.colCircle(tx, tz, 4.0); }
      /* biển tên phố */
      const sign = HT.canvasTex('haymarket_sign', 1024, 256, (g, Wd, Hd) => {
        g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, Wd, Hd); g.strokeStyle = '#1a1a1a'; g.lineWidth = 14; g.strokeRect(14, 14, Wd - 28, Hd - 28);
        g.fillStyle = '#141414'; g.textAlign = 'center'; g.font = `bold 118px ${HT.FONT_SANS}`; g.fillText('HAYMARKET', Wd / 2 - 70, 170);
        g.fillStyle = '#b01e1e'; g.font = `bold 84px ${HT.FONT_SANS}`; g.fillText('S.W.', Wd - 150, 168);
      });
      { const pm = new T.Mesh(new T.PlaneGeometry(1.6, 0.4), new T.MeshStandardMaterial({ map: sign, roughness: 0.3, envMapIntensity: 1 })); pm.position.set(CX + 0.27, 3.0, 11.6); pm.rotation.y = Math.PI / 2; ctx.add(pm); }
      E.sign(ctx, B, { key: 'carlton', text: 'CARLTON  HOTEL', x: CX + 0.26, y: 4.25, z: -20, ry: Math.PI / 2, w: 4.6, h: 0.5, bg: '#1f2a24', ink: '#e8d49a', font: HT.FONT_SERIF });

      /* ---------------- GIAN BẾP KHÁCH SẠN (dựng lại) ---------------- */
      const KX0 = -12.45, KX1 = -21.5, KZ0 = -6.5, KZ1 = 6.5, KH = 4.7;
      const tileTex = HT.canvasTex('gach_men_trang', 512, 512, (g, Wd, Hd) => {
        g.fillStyle = '#b8b4aa'; g.fillRect(0, 0, Wd, Hd);
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const gr = g.createLinearGradient(x * 64, y * 64, x * 64 + 64, y * 64 + 64); gr.addColorStop(0, '#f6f4ee'); gr.addColorStop(1, '#e4e0d6'); g.fillStyle = gr; g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); }
      }, { repeat: [1, 1] });
      const tileM = new T.MeshStandardMaterial({ map: tileTex, roughness: 0.18, envMapIntensity: 1.0 });
      const tileWall = (w, h, x, y, z, ry) => { const g = new T.PlaneGeometry(w, h); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 1.2, uv.getY(i) * h / 1.2); const m = new T.Mesh(g, tileM); m.position.set(x, y + h / 2, z); m.rotation.y = ry; m.receiveShadow = true; ctx.add(m); };
      const cream = HT.mat('plastered_wall', { tile: 2.4, color: 0xeee6d2 });
      /* tường trong: gạch men trắng tới 2,1 m, trên quét vôi kem */
      tileWall(KZ1 - KZ0, 2.1, KX1 + 0.21, 0, 0, Math.PI / 2);
      tileWall(KX0 - KX1, 2.1, (KX0 + KX1) / 2, 0, KZ0 + 0.01, 0);
      tileWall(KX0 - KX1, 2.1, (KX0 + KX1) / 2, 0, KZ1 - 0.01, Math.PI);
      B.box(cream, 0.2, KH, KZ1 - KZ0, KX1 + 0.1, 0, 0, 0, { col: true });
      B.box(cream, KX0 - KX1, KH, 0.2, (KX0 + KX1) / 2, 0, KZ0 - 0.1, 0, { col: true });
      B.box(cream, KX0 - KX1, KH, 0.2, (KX0 + KX1) / 2, 0, KZ1 + 0.1, 0, { col: true });
      B.box(cream, KX0 - KX1, 0.2, KZ1 - KZ0, (KX0 + KX1) / 2, KH, 0, 0);
      B.box(HT.mat('floor_tiles_06', { tile: 0.8, color: 0xe8e0d4, env: 0.5 }), KX0 - KX1, 0.1, KZ1 - KZ0, (KX0 + KX1) / 2, 0, 0, 0);
      ctx.floorRect((KX0 + KX1) / 2 + 0.2, 0, KX0 - KX1 + 0.6, KZ1 - KZ0, 0.1, 0);
      /* phần tối còn lại của tầng trệt */
      for (const [z0, z1] of [[CZ0 + 0.4, KZ0 - 0.2], [KZ1 + 0.2, CZ1 - 0.4]]) B.box(HT.solid(0x1a1714, { rough: 0.95 }), CD - 1.2, GH - 0.1, z1 - z0, CX - CD / 2 - 0.1, 0.02, (z0 + z1) / 2, 0);
      /* lò gang dài dọc tường sau + chụp hút khói */
      const castI = HT.solid(0x1e1d1c, { rough: 0.55, metal: 0.6, env: 0.8 });
      const brass = HT.solid(0xb88a3e, { rough: 0.3, metal: 0.9, env: 1.2 });
      const RX = KX1 + 0.9;
      B.box(castI, 1.3, 0.92, 8.4, RX, 0.1, 0, 0, { col: true });
      B.box(HT.solid(0x3a3836, { rough: 0.35, metal: 0.8 }), 1.34, 0.05, 8.44, RX, 1.02, 0, 0);
      B.box(brass, 0.04, 0.04, 8.2, RX + 0.72, 0.85, 0, 0);
      for (let k = 0; k < 5; k++) { const z = -3.3 + k * 1.65; B.box(castI, 0.04, 0.5, 0.9, RX + 0.66, 0.25, z, 0); B.box(brass, 0.05, 0.05, 0.3, RX + 0.7, 0.6, z, 0); }
      for (let k = 0; k < 6; k++) { const z = -3.5 + k * 1.4; B.cyl(HT.solid(0x2a2826, { rough: 0.4, metal: 0.7 }), 0.2, 0.2, 0.02, RX + 0.1, 1.07, z, 16); }
      const hood = new T.CylinderGeometry(0.6, 1.2, 1.1, 4, 1, true); hood.rotateY(Math.PI / 4); hood.scale(1.1, 1, 5.2);
      B.add(HT.solid(0x8a8a86, { rough: 0.35, metal: 0.8, side: T.DoubleSide }), hood, { x: RX + 0.1, y: 3.05, z: 0, uv: 'keep' });
      /* nồi xoong đồng trên lò, giá treo */
      [['brass_pot_01', -2.8, 0.36], ['brass_pot_02', -1.2, 0.3], ['brass_pan_01', 0.6, 0.1], ['brass_pot_01', 2.4, 0.32], ['metal_jug', 3.6, 0.3]].forEach(([m, z, h]) => HT.model(ctx, m, { x: RX + 0.1, z, y: 1.07, h, env: 1.0 }));
      B.beam(iron, KX1 + 2.6, 2.6, -3.6, KX1 + 2.6, 2.6, 3.6, 0.04, 0.04, { round: true });
      for (let k = 0; k < 7; k++) { const z = -3 + k; B.beam(iron, KX1 + 2.6, 2.6, z, KX1 + 2.6, 4.7, z, 0.015, 0.015); HT.model(ctx, k % 2 ? 'brass_pan_01' : 'brass_pot_02', { x: KX1 + 2.6, z, y: 2.3, w: k % 2 ? 0.5 : 0.34, ry: Math.PI / 2, env: 1.0 }); B.beam(iron, KX1 + 2.6, 2.36, z, KX1 + 2.6, 2.62, z, 0.007, 0.007); }
      /* bàn gỗ giữa bếp: nhồi bột, làm bánh */
      const topM = HT.mat('oak_wood_planks', { tile: 1, color: 0xe8d4b8 });
      for (const tz of [-2.6, 2.6]) {
        const top = P.table(B, -16.4, 0.1, tz, 0, { w: 3.2, d: 1.1, h: 0.9, mat: topM, leg: 0.09, stretcher: true });
        ctx.colBox(-16.4, tz, 3.2, 1.1, 0, 0, 1);
        HT.model(ctx, 'wooden_bowl_01', { x: -17.3, z: tz - 0.2, y: top, h: 0.14, env: 0.6 });
        HT.model(ctx, 'jug_01', { x: -15.2, z: tz + 0.25, y: top, h: 0.26, env: 0.7 });
        B.cyl(HT.solid(0xe8dcc0, { rough: 0.9 }), 0.28, 0.3, 0.12, -16.2, top, tz, 20);
        B.beam(HT.mat('fine_grained_wood', { tile: 0.3, color: 0xf0d8b8 }), -16.6, top + 0.05, tz + 0.25, -15.9, top + 0.05, tz + 0.3, 0.05, 0.05, { round: true });
        for (let k = 0; k < 6; k++) B.add(HT.solid(0xd8a868, { rough: 0.7 }), new T.SphereGeometry(0.06, 10, 6), { x: -17.8 + k * 0.14, y: top + 0.03, z: tz + 0.3, sy: 0.5 });
      }
      /* chậu rửa đá dưới cửa sổ, giá bát đĩa */
      B.box(HT.mat('granite_tile_04', { tile: 0.8, color: 0xd8d4cc }), 0.7, 0.85, 2.2, KX0 - 0.5, 0.1, -4, 0, { col: true });
      { const shelfX = (KX0 + KX1) / 2, shelfZ = KZ1 - 0.25;
        P.bookshelf(B, shelfX, 0.1, shelfZ, Math.PI, { w: 2.6, h: 2.0, d: 0.35, books: false, mat: HT.mat('fine_grained_wood', { tile: 0.8, color: 0xe8d4bc }) });
        for (let s2 = 1; s2 < 5; s2++) for (let k = 0; k < 10; k++) { const pl2 = new T.CylinderGeometry(0.11, 0.09, 0.02, 16); pl2.rotateX(Math.PI / 2 - 0.25); B.add(HT.solid(0xf4f2ec, { rough: 0.2, env: 1.2 }), pl2, { x: shelfX - 1.1 + k * 0.24, y: 0.1 + s2 * 0.4 + 0.12, z: shelfZ - 0.02, uv: 'keep' }); }
        ctx.colBox(shelfX, shelfZ, 2.6, 0.4, 0, 0, 2); }
      HT.model(ctx, 'wooden_barrels_01', { x: KX1 + 1.0, z: KZ1 - 1.0, y: 0.1, h: 1.0, col: true });
      HT.model(ctx, 'wicker_basket_01', { x: -14.2, z: KZ0 + 0.6, y: 0.1, h: 0.4, env: 0.6 });
      /* đèn */
      for (const lz of [-3, 3]) { HT.model(ctx, 'caged_hanging_light', { x: -16.4, z: lz, y: 3.6, h: 0.5, env: 0.8 }); const l = new T.PointLight(0xffe0b0, 14, 9, 1.4); l.position.set(-16.4, 3.4, lz); ctx.add(l); }

      /* ---------------- NHÀ HÁT HOÀNG GIA HAYMARKET (phía đông) ---------------- */
      const TX = 16, TZ0 = -8, TZ1 = 10;
      A.block(ctx, B, { x: TX + 9, z: 1, ry: -Math.PI / 2, w: 30, d: 18, floors: [6.5, 5.5, 4.5], bays: 5, wall: portland, trim: portT, window: Object.assign({}, sash, { w: 1.2, h: 2.4 }), ground: 'door', doorKind: 'panel', doorMat: HT.solid(0x3a2418, { rough: 0.45 }), roof: 'flat', cornice: true, parapet: 1.0 });
      /* hiên sáu cột Corinth */
      const colX = 9.2, colH = 12.4;
      for (let k = 0; k < 6; k++) {
        const z = TZ0 + 1 + k * ((TZ1 - TZ0 - 2) / 5);
        A.column(B, portT, colX, 0, z, 0.52, colH, { base: portT, baseH: 0.5, seg: 24 });
        /* đầu cột Corinth giản lược: loe + lá */
        B.cyl(portT, 0.72, 0.5, 0.9, colX, colH - 0.9, z, 24);
        B.box(portT, 1.5, 0.22, 1.5, colX, colH, z, 0);
        ctx.colCircle(colX, z, 0.6);
      }
      /* dầm đỉnh, trán tường tam giác */
      B.box(portT, TX - colX + 1.0, 1.4, TZ1 - TZ0 + 0.6, (TX + colX) / 2 - 0.3, colH + 0.22, (TZ0 + TZ1) / 2, 0);
      A.cornice(B, portT, colX - 0.8, colH + 1.62, (TZ0 + TZ1) / 2, TZ1 - TZ0 + 0.9, -Math.PI / 2, 0.4);
      { const pts = [[-(TZ1 - TZ0) / 2 - 0.3, 0], [(TZ1 - TZ0) / 2 + 0.3, 0], [0, 3.4]];
        const g = HT.extrude(pts, 1.2); g.translate(0, 0, -0.6); B.add(portT, g, { x: colX - 0.1, y: colH + 2.1, z: (TZ0 + TZ1) / 2, ry: Math.PI / 2, uv: 'box' }); }
      /* trần hiên */
      B.box(portT, TX - colX, 0.3, TZ1 - TZ0, (TX + colX) / 2, colH - 0.1, (TZ0 + TZ1) / 2, 0);
      E.sign(ctx, B, { key: 'theatre', text: 'THEATRE  ROYAL', x: TX - 0.02, y: 7.2, z: (TZ0 + TZ1) / 2, ry: -Math.PI / 2, w: 6.5, h: 0.8, bg: '#2a1a14', ink: '#e8c878', font: HT.FONT_SERIF });
      /* ---------------- các dãy nhà khác ---------------- */
      const east = [[27, 22, brickR], [45, 14, portland], [-24, 20, portland], [-38, 8, brickD]];
      for (const [zc, w, m] of east) A.block(ctx, B, { x: 12 + 8, z: zc, ry: -Math.PI / 2, w, d: 16, floors: [4.6, 3.8, 3.6, 3.4], bays: Math.round(w / 3), wall: m, trim: portT, base: portland, window: sash, ground: 'shop', shopFrame: HT.solid([0x1f2a3a, 0x3a1f1a, 0x1e3a2a][Math.abs(zc) % 3], { rough: 0.4 }), roof: m === portland ? 'mansard' : 'gable', roofMat: slate, roofTop: lead, roofH: 3.0, mansardH: 2.6, chimneys: [[-w / 3, -4], [w / 3, -4]], chimneyMat: brickR, cornice: true });
      A.block(ctx, B, { x: -22, z: 30, ry: Math.PI / 2, w: 32, d: 20, floors: [4.6, 3.8, 3.6, 3.4], bays: 10, wall: brickD, trim: portT, base: portland, window: sash, ground: 'shop', shopFrame: HT.solid(0x2a2418, { rough: 0.4 }), roof: 'gable', roofMat: slate, roofH: 3.2, chimneys: [[-8, -6], [8, -6]], chimneyMat: brickR });
      /* đóng hai đầu phố */
      A.block(ctx, B, { x: 0, z: 58, ry: Math.PI, w: 44, d: 12, floors: [4.6, 3.8, 3.6, 3.4, 3.0], bays: 12, wall: portland, trim: portT, window: sash, ground: 'shop', roof: 'mansard', roofMat: slate, roofTop: lead, mansardH: 2.6 });
      A.block(ctx, B, { x: 0, z: -64, ry: 0, w: 60, d: 14, floors: [5, 4.2, 4, 3.6], bays: 14, wall: portland, trim: portT, window: sash, ground: 'plain', roof: 'flat', parapet: 1.1, cornice: true });

      /* ---------------- xe cộ, đồ vật đường phố ---------------- */
      VV.bus1914(ctx, 3.6, 0, 6, Math.PI / 2, { key: 'a', route: '24  VICTORIA' });
      VV.bus1914(ctx, -3.8, 0, -24, -Math.PI / 2, { key: 'b', route: '3  CRYSTAL PALACE', adv: 'CARLTON HOTEL · PALM COURT', advColor: '#6a1a14' });
      VV.car(ctx, 'old1910', -5.4, 0, 22, -Math.PI / 2, { color: 0x1e3a2a });
      VV.car(ctx, 'old1910', 5.2, 0, -14, Math.PI / 2, { color: 0x2a2a2a });
      /* hòm thư đỏ */
      const pillar = (x, z) => {
        const red = HT.solid(0xb01c16, { rough: 0.35, env: 1.1 });
        B.cyl(red, 0.3, 0.32, 1.35, x, 0, z, 24); B.cyl(HT.solid(0x141414, { rough: 0.5 }), 0.34, 0.34, 0.1, x, 0, z, 24);
        const cap = new T.SphereGeometry(0.34, 24, 8, 0, 6.283, 0, Math.PI / 2); cap.scale(1, 0.4, 1); B.add(red, cap, { x, y: 1.35, z, uv: 'keep' });
        B.box(HT.solid(0x141414, { rough: 0.4 }), 0.26, 0.04, 0.05, x + 0.29, 1.08, z, 0);
        ctx.colCircle(x, z, 0.4);
      };
      pillar(-9.3, 18); pillar(9.4, -20);
      for (let z = -48; z <= 40; z += 14) { P.gasLamp(B, ctx, -8.6, 0, z, { h: 4.3 }); P.gasLamp(B, ctx, 8.6, 0, z + 7, { h: 4.3 }); }

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [9.8, 26, -Math.PI / 2 + 0.3, 'lectern'],
        stories: [[-10.8, 30, Math.PI / 2], [10.8, -26, -Math.PI / 2]],
        moc: [10.4, 16, -Math.PI / 2 - 0.2],
        photos: [[-10.9, 9.5, Math.PI / 2, 1.3], [-10.9, -11.5, Math.PI / 2, 0.9], [10.9, -34, -Math.PI / 2, 1.3]],
      });
      E.label(ctx, { key: 'carlton', x: -10.6, z: 3.2, ry: Math.PI / 2 + 0.2, vi: 'Khách sạn Carlton', en: 'The Carlton Hotel',
        text: 'Khách sạn sang trọng bậc nhất London đầu thế kỷ XX, ở góc phố Haymarket và Pall Mall. Theo nhiều hồi ký, Nguyễn Tất Thành làm ở bếp khách sạn, từ rửa bát đến phụ làm bánh, dưới sự điều hành của vua bếp Auguste Escoffier. Nay nơi đây là tòa New Zealand House, có biển đồng ghi dấu Người từng làm việc.',
        textEn: 'London’s grand hotel at Haymarket and Pall Mall. Memoirs say Nguyen Tat Thanh worked in its kitchen under chef Auguste Escoffier. New Zealand House now stands on the site, with a plaque recording his work here.' });
      E.label(ctx, { key: 'bep', x: -14.2, z: -1.2, ry: Math.PI / 2 + 0.8, vi: 'Gian bếp khách sạn', en: 'The hotel kitchen',
        text: 'Bếp khách sạn lớn thời ấy: lò gang dài đốt than, chụp hút khói, nồi xoong đồng, tường gạch men trắng, bàn gỗ nhồi bột. Công việc nặng từ sáng sớm đến khuya; lúc rảnh Người tự học tiếng Anh, đọc báo, theo dõi thời sự thế giới.',
        textEn: 'Coal-fired iron ranges, copper pans and tiled walls; long hours of work, with spare time spent learning English and reading the papers.' });
      E.label(ctx, { key: 'nhahat', x: 10.6, z: 9.6, ry: -Math.PI / 2 - 0.3, vi: 'Nhà hát Hoàng gia Haymarket', en: 'Theatre Royal Haymarket',
        text: 'Nhà hát có hiên sáu cột Corinth do kiến trúc sư John Nash thiết kế năm 1821, nằm đối diện khách sạn Carlton — hình ảnh quen thuộc của phố Haymarket.',
        textEn: 'John Nash’s 1821 portico of six Corinthian columns faces the Carlton across Haymarket.' });
      E.label(ctx, { key: 'thu', x: -10.6, z: 24, ry: Math.PI / 2 + 0.3, vi: 'Thư gửi Phan Châu Trinh', en: 'Letters to Phan Chau Trinh',
        text: 'Từ London, Người viết thư cho cụ Phan Châu Trinh ở Paris, kể về công việc, việc học tiếng Anh và nhận định về cuộc chiến tranh thế giới đang diễn ra ở châu Âu.',
        textEn: 'From London he wrote to Phan Chau Trinh in Paris about his work, his English studies and the world war.' });
      E.stdGates(ctx, { hub: [-4, 42.5, 0], prev: [4, 42.5, 0], next: [0, -51.5, 0] });
    },
  };
})();
