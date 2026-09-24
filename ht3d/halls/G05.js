/* GIAN 05 — NƯỚC PHÁP: PARIS, NGÕ COMPOINT (1917 – 1923).
   Dựng lại: phố Paris đầu thập niên 1920 (quận 17) — mặt đường lát đá hình quạt, vỉa hè, hàng cây tiêu huyền, cột quảng cáo
   Morris, vòi nước Wallace, ki-ốt báo, quán cà phê có mái bạt sọc, xe taxi, đèn khí; dãy nhà đá vôi kiểu Haussmann mái
   mansard lợp đá đen, ban công sắt. Rẽ vào ngõ cụt Compoint hẹp lát đá, nhà vữa ba bốn tầng cửa chớp; số 9 là căn phòng nhỏ
   Nguyễn Ái Quốc ở năm 1921 – 1923: giường sắt, bàn làm việc sửa ảnh cạnh cửa sổ, bếp lò gang, chậu rửa, giá sách,
   chồng báo Le Paria.
   Trục: phố chạy theo x (z 22 – 40), ngõ chạy vào theo −z (x −2 … 2). */
(function () {
  const HT = window.HT;
  HT.halls.G05 = {
    sky: { hdri: 'kloofendal_38d_partly_cloudy_puresky', sunAz: 18, exposure: 0.95, fog: 0.0022, sat: 0.98, con: 1.05, bloom: 0.1, shadowSize: 60, tint: [1.0, 0.99, 1.02] },
    spawn: { x: 4, z: 36, yaw: 0.1, pitch: -0.02 },
    map: [-48, -44, 48, 52],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      const inR = (x, z, R) => x >= R[0] && x <= R[2] && z >= R[1] && z <= R[3];
      const H = (x, z) => HT.fbm(x * 0.003, z * 0.003, 3) * 20 * HT.smooth(400, 900, Math.hypot(x, z));
      const W = (x, z) => {
        const road = z > 25 && z < 37 ? 1 : 0;
        const walk = (z >= 22 && z <= 25) || (z >= 37 && z <= 40) ? 1 : 0;
        const lane = Math.abs(x) < 2.05 && z < 22.2 ? 1 : 0;
        return [road, walk, lane];
      };
      N.terrain(ctx, { size: 1800, inner: 90, step: 0.6, height: H, weights: W, layers: [
        { slug: 'concrete_pavement', tile: 3, tint: 0xb8bcc0, rough: 0.8 },
        { slug: 'patterned_cobblestone', tile: 3.2, tint: 0xc8c8c4, rough: 0.7 },
        { slug: 'large_floor_tiles_02', tile: 2.2, tint: 0xd8dade, rough: 0.75 },
        { slug: 'cobblestone_05', tile: 1.8, tint: 0xc8c4bc, rough: 0.7 },
      ], macro: 0.08 });
      ctx.bounds = [[-44, 22], [-2, 22], [-2, -35.5], [2, -35.5], [2, 22], [44, 22], [44, 40], [-44, 40]];
      /* bó vỉa */
      const curbM = HT.mat('granite_tile_04', { tile: 1, color: 0xb8b4ae });
      for (const zc of [25, 37]) B.box(curbM, 88, 0.14, 0.3, 0, -0.02, zc, 0);

      /* ---------------- vật liệu nhà Paris ---------------- */
      const stoneW = HT.ashlar('paris', { color: 0xefe6d2, joint: 0xb8ae9c, bw: 1.1, bh: 0.42, speck: 0.05, dirt: true });
      const stoneT = HT.ashlar('parisT', { color: 0xf4ecde, joint: 0xc8bfae, bw: 0.9, bh: 0.32, speck: 0.04 });
      const slate = HT.mat('roof_slates_03', { tile: 1.2, color: 0x9aa0a6 });
      const zinc = HT.solid(0x7e8488, { rough: 0.45, metal: 0.55, env: 1.0 });
      const shutterG = HT.solid(0x8a9490, { rough: 0.6 });
      const shutterB = HT.solid(0x5e6e78, { rough: 0.6 });
      const pl = (c) => HT.mat('plastered_wall', { tile: 2.4, color: c, env: 0.7 });
      const plasters = [0xe6dccb, 0xd8d0c2, 0xeadfc6, 0xd2c8b8, 0xe2d6c0, 0xcfc6b8];
      const iron = HT.solid(0x1d1f1e, { rough: 0.45, metal: 0.7 });

      /* ---------------- dãy nhà Haussmann bên kia phố (mặt quay −z) ---------------- */
      for (let i = 0; i < 6; i++) {
        const x = -37.5 + i * 15;
        A.block(ctx, B, { x, z: 47, ry: Math.PI, w: 14.6, d: 14, floors: [4.4, 3.4, 3.2, 3.2, 3.0], bays: 5, wall: stoneW, trim: stoneT, base: stoneW,
          window: { w: 1.25, h: 2.4, kind: 'french', rows: 4, frame: HT.solid(0xe8e4dc, { rough: 0.5 }) }, ground: 'shop', shopFrame: HT.solid([0x2a3a34, 0x4a1c1c, 0x1e2a3a][i % 3], { rough: 0.45, env: 0.8 }),
          balcony: [2, 4], railMat: iron, roof: 'mansard', roofMat: slate, roofTop: zinc, mansardH: 2.8, chimneys: [[-4, -3], [4, -3]], chimneyMat: stoneW });
      }
      /* ---------------- nhà góc phố hai bên cửa ngõ (mặt quay +z) ---------------- */
      const streetBlocks = [[-8, 12], [-20.5, 13], [-33.5, 13], [8, 12], [20.5, 13], [33.5, 13]];
      streetBlocks.forEach(([x, w], i) => {
        A.block(ctx, B, { x, z: 16, ry: 0, w, d: 12, floors: [4.0, 3.2, 3.1, 3.0], bays: Math.round(w / 2.6), wall: i % 3 === 1 ? stoneW : pl(plasters[i]), trim: stoneT, base: i % 2 ? stoneW : pl(plasters[i + 1] || 0xe0d6c4),
          window: { w: 1.1, h: 2.1, kind: 'french', rows: 3, shutter: i % 2 ? shutterG : shutterB, shutterOpen: 1, frame: HT.solid(0xe8e4dc, { rough: 0.5 }) }, ground: 'shop', shopFrame: HT.solid([0x3a2a1e, 0x1e3a2a, 0x2a2a3a][i % 3], { rough: 0.45, env: 0.8 }),
          balcony: [3], railMat: iron, roof: 'mansard', roofMat: slate, roofTop: zinc, mansardH: 2.4, chimneys: [[-w / 4, -2.5], [w / 4, -2.5]], chimneyMat: pl(0xc8b8a0) });
      });
      /* biển hiệu cửa hàng */
      E.sign(ctx, B, { key: 'cafe', text: 'CAFÉ  DU  COMMERCE', x: 20.5, y: 3.35, z: 22.08, w: 8, h: 0.55, bg: '#1e3a2a', ink: '#f0e2b0', font: HT.FONT_SERIF });
      E.sign(ctx, B, { key: 'boulang', text: 'BOULANGERIE', x: -20.5, y: 3.35, z: 22.08, w: 6, h: 0.55, bg: '#5a1c16', ink: '#f2e4c0', font: HT.FONT_SERIF });
      E.sign(ctx, B, { key: 'vins', text: 'VINS  &  CHARBONS', x: 33.5, y: 3.35, z: 22.08, w: 6.5, h: 0.55, bg: '#2a2a3a', ink: '#efe2c0', font: HT.FONT_SERIF });

      /* ---------------- ngõ Compoint ---------------- */
      /* [tâm z, bề ngang, số tầng trên] — trái (x < −2) và phải (x > 2); số 9 ở bên trái z −13 … 0 */
      const laneL = [[5, 10, 3], [-19.5, 13, 3], [-31, 10, 2]];
      const laneR = [[5, 10, 2], [-8, 16, 3], [-21, 10, 3], [-31, 10, 2]];
      for (const [sd, list] of [[-1, laneL], [1, laneR]]) list.forEach(([zc, w, nf], i) => {
        const d = 10, k = i + (sd > 0 ? 3 : 0);
        A.block(ctx, B, { x: sd * (2 + d / 2), z: zc, ry: -sd * Math.PI / 2, w, d, floors: [3.6, 3.0, 3.0, 2.9].slice(0, nf + 1), bays: Math.max(2, Math.round(w / 3.3)), wall: pl(plasters[k % 6]), trim: pl(0xefe8da), base: pl(0xcfc4b0),
          window: { w: 1.0, h: 1.9, kind: 'casement', rows: 3, shutter: k % 2 ? shutterG : shutterB, shutterOpen: 1, frame: HT.solid(0xe6e0d4, { rough: 0.55 }) }, ground: 'door', doorMat: HT.solid([0x3a2e24, 0x2e3a34, 0x4a3a2a][k % 3], { rough: 0.55 }),
          roof: k % 2 ? 'gable' : 'mansard', roofMat: k % 2 ? HT.mat('clay_roof_tiles_03', { tile: 1.3, color: 0xc88a70 }) : slate, roofTop: zinc, roofH: 2.2, mansardH: 2.2, chimneys: [[0, -2.5]], chimneyMat: pl(0xc8b8a0), cornice: true });
      });
      /* cuối ngõ cụt */
      A.block(ctx, B, { x: 0, z: -41, ry: 0, w: 14, d: 10, floors: [3.6, 3.0, 3.0], bays: 4, wall: pl(0xd8cebe), trim: pl(0xeee6d8), base: pl(0xc4b8a4),
        window: { w: 1.0, h: 1.9, kind: 'casement', rows: 3, shutter: shutterB, shutterOpen: 1, frame: HT.solid(0xe6e0d4, { rough: 0.55 }) }, ground: 'door', roof: 'gable', roofMat: HT.mat('clay_roof_tiles_03', { tile: 1.3, color: 0xc08a72 }), roofH: 2.4, chimneys: [[3, -2]], chimneyMat: pl(0xc8b8a0) });
      /* biển tên ngõ (men xanh, viền xanh lá) */
      const plate = HT.canvasTex('plaque_compoint', 1024, 360, (g, Wd, Hd) => {
        g.fillStyle = '#12356e'; g.fillRect(0, 0, Wd, Hd);
        g.strokeStyle = '#2f7a4a'; g.lineWidth = 22; g.strokeRect(14, 14, Wd - 28, Hd - 28);
        g.strokeStyle = '#f2f2f2'; g.lineWidth = 6; g.strokeRect(34, 34, Wd - 68, Hd - 68);
        g.fillStyle = '#f4f4f4'; g.textAlign = 'center'; g.font = `600 58px ${HT.FONT_SANS}`; g.fillText('17e Arrt', Wd / 2, 118);
        g.font = `bold 108px ${HT.FONT_SANS}`; g.fillText('IMPASSE COMPOINT', Wd / 2, 262);
      });
      { const pm = new T.Mesh(new T.PlaneGeometry(1.1, 0.39), new T.MeshStandardMaterial({ map: plate, roughness: 0.25, envMapIntensity: 1.1 }));
        pm.position.set(-2.03, 3.2, 20.2); pm.rotation.y = Math.PI / 2; ctx.add(pm); }

      /* ---------------- SỐ 9: căn phòng nhỏ (dựng lại) ---------------- */
      const X0 = -2.2, Z0 = -13, Z1 = 0, DEP = 10;                // mặt tiền nhà số 9 tại x = −2.2
      const wall9 = pl(0xdcd0bc), trim9 = pl(0xeee6d6);
      /* tầng trên: khối có cửa sổ chớp */
      A.block(ctx, B, { x: X0 - DEP / 2, z: (Z0 + Z1) / 2, ry: Math.PI / 2, yb: 3.6, w: Z1 - Z0, d: DEP, floors: [3.0, 3.0], bays: 3, wall: wall9, trim: trim9,
        window: { w: 1.0, h: 1.9, kind: 'casement', rows: 3, shutter: shutterB, shutterOpen: 1, frame: HT.solid(0xe6e0d4, { rough: 0.55 }) }, ground: 'plain', roof: 'mansard', roofMat: slate, roofTop: zinc, mansardH: 2.2, chimneys: [[2, -2.5]], chimneyMat: pl(0xc8b8a0), col: false });
      /* tầng trệt: tường mặt tiền có cửa đi mở và cửa sổ */
      const fr = A.wall(B, ctx, wall9, { x0: X0, z0: Z1, x1: X0, z1: Z0, y0: 0, h: 3.6, t: 0.4, open: [{ u: 7.0, w: 1.0, y: 0.12, h: 2.3 }, { u: 10.8, w: 1.3, y: 0.95, h: 1.75 }, { u: 2.5, w: 1.5, y: 0.12, h: 2.8, blocked: true }] });
      A.door(B, { x: X0, z: Z1 - 7.0, ry: Math.PI / 2, w: 1.0, h: 2.3, y: 0.12, t: 0.4, kind: 'panel', leaves: 1, open: 0.85, mat: HT.solid(0x3e3226, { rough: 0.55 }), trim: trim9 });
      A.door(B, { x: X0, z: Z1 - 2.5, ry: Math.PI / 2, w: 1.5, h: 2.8, y: 0.12, t: 0.4, kind: 'panel', leaves: 2, open: 0, mat: HT.solid(0x2e3a34, { rough: 0.55 }), trim: trim9 });
      A.window(B, { x: X0, z: Z1 - 10.8, ry: Math.PI / 2, w: 1.3, h: 1.75, y: 0.95, t: 0.4, kind: 'casement', rows: 3, frame: HT.solid(0xe6e0d4, { rough: 0.55 }), glass: HT.glass(), shutter: shutterB, shutterOpen: 1, sillMat: trim9 });
      B.box(trim9, 0.5, 0.25, Z1 - Z0 + 0.2, X0 - 0.05, 3.45, (Z0 + Z1) / 2, 0);
      /* các tường còn lại của tầng trệt */
      B.box(wall9, 0.4, 3.6, Z1 - Z0, X0 - DEP + 0.2, 0, (Z0 + Z1) / 2, 0, { col: true });
      B.box(wall9, DEP, 3.6, 0.4, X0 - DEP / 2, 0, Z0 + 0.2, 0, { col: true });
      B.box(wall9, DEP, 3.6, 0.4, X0 - DEP / 2, 0, Z1 - 0.2, 0, { col: true });
      /* phòng: x từ −2.4 đến −6.4, z từ −12.8 đến −6.2; vách ngăn phía trong */
      const RX0 = -2.4, RX1 = -6.4, RZ0 = -12.55, RZ1 = -6.1;
      const paper = HT.canvasTex('giay_dan_tuong', 512, 512, (g, Wd, Hd) => {
        g.fillStyle = '#d9ccb0'; g.fillRect(0, 0, Wd, Hd);
        const rr = HT.rng(9);
        for (let y = 0; y < Hd; y += 64) for (let x = 0; x < Wd; x += 64) {
          const ox = (y / 64) % 2 ? 32 : 0;
          g.fillStyle = 'rgba(150,120,90,0.35)'; g.beginPath(); for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.283; g.ellipse(x + ox + 16 + Math.cos(a) * 6, y + 20 + Math.sin(a) * 6, 5, 3, a, 0, 6.283); } g.fill();
          g.strokeStyle = 'rgba(110,120,90,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + ox + 16, y + 26); g.quadraticCurveTo(x + ox + 22, y + 44, x + ox + 14, y + 58); g.stroke();
        }
        for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(90,70,40,${rr.range(0.01, 0.05)})`; g.fillRect(rr() * Wd, rr() * Hd, 2, 2); }
      }, { repeat: [2, 1.5] });
      const paperM = new T.MeshStandardMaterial({ map: paper, roughness: 0.9, envMapIntensity: 0.6 });
      B.box(paperM, 0.12, 3.3, RZ1 - RZ0, RX1 - 0.06, 0.12, (RZ0 + RZ1) / 2, 0, { col: true });
      B.box(paperM, RX0 - RX1, 3.3, 0.12, (RX0 + RX1) / 2, 0.12, RZ1 + 0.06, 0, { col: true });
      B.box(paperM, RX0 - RX1, 3.3, 0.06, (RX0 + RX1) / 2, 0.12, RZ0 - 0.03, 0);
      /* sàn gỗ, trần */
      B.box(HT.mat('old_wood_floor', { tile: 1.2, color: 0xd8c0a0, env: 0.6 }), RX0 - RX1 + 0.2, 0.12, RZ1 - RZ0, (RX0 + RX1) / 2, 0, (RZ0 + RZ1) / 2, 0);
      ctx.floorRect((RX0 + RX1) / 2, (RZ0 + RZ1) / 2, RX0 - RX1 + 0.4, RZ1 - RZ0, 0.12, 0);
      ctx.floorRect(X0 - 0.1, Z1 - 7.0, 0.8, 1.1, 0.12, 0);
      B.box(pl(0xe8e0d0), RX0 - RX1, 0.1, RZ1 - RZ0, (RX0 + RX1) / 2, 3.42, (RZ0 + RZ1) / 2, 0);
      /* phần tối còn lại của tầng trệt */
      B.box(HT.solid(0x1a1714, { rough: 0.95 }), DEP - 0.8, 3.4, Z1 - RZ1 - 0.5, X0 - DEP / 2, 0.02, (RZ1 + Z1) / 2 + 0.1, 0);
      /* đồ đạc */
      const go = P.M.go();
      HT.model(ctx, 'old_bed_frame', { x: RX1 + 0.6, z: RZ0 + 1.6, y: 0.12, w: 1.95, ry: Math.PI / 2, env: 0.6, col: true });
      { const top = P.table(B, RX0 - 0.55, 0.12, RZ0 + 1.6, Math.PI / 2, { w: 1.2, d: 0.7, h: 0.76, mat: go });
        P.chair(B, RX0 - 1.2, 0.12, RZ0 + 1.6, -Math.PI / 2, { mat: go });
        HT.model(ctx, 'vintage_oil_lamp', { x: RX0 - 0.5, z: RZ0 + 1.15, y: top, h: 0.38, env: 0.6 });
        HT.model(ctx, 'fancy_picture_frame_01', { x: RX0 - 0.55, z: RZ0 + 1.9, y: top, h: 0.3, ry: -Math.PI / 2 + 0.3, env: 0.6 });
        /* bàn sửa ảnh: khung kính nghiêng, bút, ảnh */
        B.add(HT.solid(0x3a3026, { rough: 0.6 }), HT.geoBox(0.46, 0.34, 0.02), { x: RX0 - 0.6, y: top + 0.2, z: RZ0 + 1.55, ry: Math.PI / 2, rx: -0.55 });
        B.add(HT.solid(0xe8e4dc, { rough: 0.4, env: 1.2 }), HT.geoBox(0.3, 0.22, 0.004), { x: RX0 - 0.59, y: top + 0.21, z: RZ0 + 1.55, ry: Math.PI / 2, rx: -0.55 });
      }
      /* bếp lò gang có ống khói */
      B.cyl(iron, 0.26, 0.28, 0.75, RX1 + 0.45, 0.12, RZ1 - 0.5, 16); B.cyl(iron, 0.3, 0.3, 0.06, RX1 + 0.45, 0.87, RZ1 - 0.5, 16);
      B.cyl(iron, 0.06, 0.06, 2.5, RX1 + 0.45, 0.93, RZ1 - 0.5, 10); ctx.colCircle(RX1 + 0.45, RZ1 - 0.5, 0.35);
      /* chậu rửa, bình nước, vali, giá sách */
      { const t2 = P.table(B, RX1 + 0.4, 0.12, RZ1 - 1.6, Math.PI / 2, { w: 0.7, d: 0.45, h: 0.8, mat: go });
        HT.model(ctx, 'metal_jug', { x: RX1 + 0.4, z: RZ1 - 1.45, y: t2, h: 0.3, env: 0.7 });
        HT.model(ctx, 'pot_enamel_01', { x: RX1 + 0.4, z: RZ1 - 1.8, y: t2, h: 0.14, env: 0.7 }); }
      HT.model(ctx, 'vintage_suitcase', { x: RX1 + 1.1, z: RZ0 + 2.5, y: 0.12, h: 0.24, ry: 0.2, env: 0.6 });
      P.bookshelf(B, (RX0 + RX1) / 2 + 0.4, 0.12, RZ1 - 0.22, Math.PI, { w: 1.0, h: 1.7, d: 0.3, mat: go });
      ctx.colBox((RX0 + RX1) / 2 + 0.4, RZ1 - 0.22, 1.0, 0.35, 0, 0, 2);
      /* chồng báo Le Paria */
      const paria = HT.canvasTex('le_paria', 512, 720, (g, Wd, Hd) => {
        g.fillStyle = '#ece4d0'; g.fillRect(0, 0, Wd, Hd);
        g.fillStyle = '#1a1a1a'; g.textAlign = 'center'; g.font = `bold 92px ${HT.FONT_SERIF}`; g.fillText('LE PARIA', Wd / 2, 108);
        g.font = `italic 24px ${HT.FONT_SERIF}`; g.fillText('Tribune du prolétariat colonial', Wd / 2, 148);
        g.fillRect(24, 164, Wd - 48, 3); g.fillRect(24, 172, Wd - 48, 1);
        const rr = HT.rng(4);
        for (let c = 0; c < 3; c++) for (let y = 196; y < Hd - 20; y += 13) { if (rr() < 0.06) { y += 18; continue; } g.fillStyle = 'rgba(30,30,30,0.55)'; g.fillRect(28 + c * 158, y, 144 * rr.range(0.7, 1), 5); }
      });
      const pariaM = new T.MeshStandardMaterial({ map: paria, roughness: 0.85 });
      for (let k = 0; k < 9; k++) B.add(pariaM, HT.geoBox(0.32, 0.012, 0.45), { x: RX1 + 0.5 + r.range(-0.02, 0.02), y: 0.14 + k * 0.012, z: RZ0 + 3.3, ry: r.range(-0.12, 0.12), uv: 'box' });
      { const pg = new T.Mesh(new T.PlaneGeometry(0.42, 0.59), pariaM); pg.position.set(RX1 + 0.02, 1.7, RZ0 + 3.0); pg.rotation.y = Math.PI / 2; ctx.add(pg); }
      /* đèn trong phòng */
      { const lp = new T.PointLight(0xffd6a0, 16, 8, 1.4); lp.position.set((RX0 + RX1) / 2, 2.9, (RZ0 + RZ1) / 2); ctx.add(lp);
        const lp2 = new T.PointLight(0xffc680, 4, 3, 1.6); lp2.position.set(RX0 - 0.5, 1.3, RZ0 + 1.15); ctx.add(lp2); }

      /* ---------------- đồ vật trên phố ---------------- */
      /* cột quảng cáo Morris */
      const morris = HT.canvasTex('morris', 1024, 512, (g, Wd, Hd) => {
        const cols = ['#e8d8a8', '#c83a2a', '#f0e8d0', '#2a4a7a', '#e8c040', '#f2ece0'];
        const txt = ['THÉÂTRE', 'CONCERT', 'L’HUMANITÉ', 'CIRQUE', 'EXPOSITION', 'CINÉMA'];
        for (let i = 0; i < 6; i++) { g.fillStyle = cols[i]; g.fillRect(i * 170, 0, 172, Hd); g.fillStyle = i === 1 || i === 3 ? '#f4ecd8' : '#2a2018'; g.textAlign = 'center'; g.font = `bold 34px ${HT.FONT_SERIF}`; g.fillText(txt[i], i * 170 + 86, 110); g.font = `22px ${HT.FONT_SERIF}`; for (let k = 0; k < 8; k++) g.fillRect(i * 170 + 26, 170 + k * 36, 120 - (k % 3) * 18, 6); }
      });
      const morrisAt = (x, z) => {
        const mm = new T.MeshStandardMaterial({ map: morris, roughness: 0.8 });
        const c = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 2.6, 28, 1, true), mm); c.position.set(x, 0.55 + 1.3, z); ctx.add(c);
        const dg = HT.solid(0x274534, { rough: 0.45, metal: 0.4 });
        B.cyl(dg, 0.7, 0.72, 0.55, x, 0, z, 28); B.cyl(dg, 0.7, 0.66, 0.2, x, 3.15, z, 28);
        const dome = new T.SphereGeometry(0.7, 24, 10, 0, 6.283, 0, Math.PI / 2); dome.scale(1, 0.55, 1); B.add(dg, dome, { x, y: 3.35, z, uv: 'keep' });
        B.cyl(dg, 0.02, 0.06, 0.45, x, 3.7, z, 8); ctx.colCircle(x, z, 0.75);
      };
      morrisAt(8.5, 23.6); morrisAt(-27, 38.6);
      /* vòi nước Wallace */
      const wallace = (x, z) => {
        const dg = HT.solid(0x2a4a38, { rough: 0.4, metal: 0.5, env: 1.1 });
        B.cyl(dg, 0.5, 0.58, 0.45, x, 0, z, 8); B.cyl(dg, 0.34, 0.4, 0.5, x, 0.45, z, 8);
        for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.283 + 0.785; B.cyl(dg, 0.07, 0.09, 1.0, x + Math.cos(a) * 0.22, 0.95, z + Math.sin(a) * 0.22, 8); B.add(dg, new T.SphereGeometry(0.08, 10, 8), { x: x + Math.cos(a) * 0.22, y: 2.02, z: z + Math.sin(a) * 0.22, uv: 'keep' }); }
        const dome = new T.SphereGeometry(0.42, 20, 10, 0, 6.283, 0, Math.PI / 2); dome.scale(1, 0.8, 1); B.add(dg, dome, { x, y: 2.12, z, uv: 'keep' });
        B.cyl(dg, 0.02, 0.05, 0.3, x, 2.45, z, 8); ctx.colCircle(x, z, 0.6);
      };
      wallace(-12, 23.4);
      /* ki-ốt báo */
      { const kx = 24, kz = 38.8; const dg = HT.solid(0x2a4636, { rough: 0.45, metal: 0.4 });
        const kg = new T.CylinderGeometry(1.0, 1.0, 2.3, 6); const km = new T.Mesh(kg, new T.MeshStandardMaterial({ map: morris, roughness: 0.8 })); km.position.set(kx, 1.15, kz); ctx.add(km);
        const roof = new T.ConeGeometry(1.35, 0.9, 6); B.add(dg, roof, { x: kx, y: 2.75, z: kz, uv: 'keep' }); B.cyl(dg, 1.3, 1.3, 0.1, kx, 2.3, kz, 6); ctx.colCircle(kx, kz, 1.1); }
      /* quán cà phê: mái bạt sọc, bàn ghế */
      const stripe = HT.canvasTex('bat_soc', 256, 256, (g, Wd, Hd) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f2ece0' : '#a8281e'; g.fillRect(i * 32, 0, 32, Hd); } });
      { const aw = new T.Mesh(new T.PlaneGeometry(9, 2.4), new T.MeshStandardMaterial({ map: stripe, roughness: 0.8, side: T.DoubleSide })); aw.position.set(20.5, 3.05, 23.1); aw.rotation.x = -Math.PI / 2 + 0.45; aw.castShadow = true; ctx.add(aw); }
      for (let i = 0; i < 4; i++) {
        const tx = 17.5 + i * 2.1, tz = 23.6;
        HT.model(ctx, 'round_wooden_table_01', { x: tx, z: tz, y: 0, h: 0.74, env: 0.6, col: true });
        HT.model(ctx, 'painted_wooden_chair_01', { x: tx - 0.82, z: tz + 0.05, y: 0, h: 0.9, ry: Math.PI / 2, env: 0.6 });
        HT.model(ctx, 'painted_wooden_chair_01', { x: tx + 0.82, z: tz - 0.05, y: 0, h: 0.9, ry: -Math.PI / 2, env: 0.6 });
      }
      /* taxi, xe đạp */
      VV.car(ctx, 'old1910', -6, 0, 28.2, 0, { color: 0x5a1a16 });
      VV.car(ctx, 'old1910', 30, 0, 34.2, Math.PI, { color: 0x1d2a22 });
      P.bicycle(B, 1.6, 0, 18, 0.1, {});
      /* đèn đường, cây tiêu huyền */
      for (let x = -40; x <= 40; x += 16) { P.gasLamp(B, ctx, x + 4, 0, 24.6, { h: 4.4 }); P.gasLamp(B, ctx, x - 4, 0, 37.4, { h: 4.4 }); }
      const planes = []; for (let x = -42; x <= 42; x += 8.5) { if (Math.abs(x - 0.5) > 4) planes.push({ x: x + 0.5, z: 24.3, s: 0.5 }); planes.push({ x: x + 4.2, z: 37.8, s: 0.5 }); }
      N.trees(ctx, 'forest', planes.filter((p) => Math.abs(p.x - 8.5) > 1.5 && Math.abs(p.x + 12) > 1.5 && !(p.x > 16 && p.x < 26 && p.z < 30)), { seed: 17 });
      /* vài chậu cây, thùng rác, ghế băng trong ngõ */
      HT.model(ctx, 'planter_pot_clay', { x: 1.5, z: -26, y: 0, h: 0.5, env: 0.6 });
      HT.model(ctx, 'potted_plant_04', { x: -1.5, z: -1.2, y: 0, h: 0.8, env: 0.6 });
      HT.model(ctx, 'wooden_bucket_01', { x: 1.6, z: -15, y: 0, h: 0.35, env: 0.6 });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [7.5, 31.5, -0.66, 'lectern'],
        stories: [[-10, 38.2, Math.PI], [14, 38.2, Math.PI]],
        moc: [-3.5, 24.2, 0.15],
        quote: [0.6, 12, -Math.PI / 2 + 0.2],
        photos: [[1.96, 4, -Math.PI / 2, 1.0, 'wall'], [-1.96, -4.6, Math.PI / 2, 1.1, 'wall'], [1.96, -5, -Math.PI / 2, 1.1, 'wall'], [1.96, -12.5, -Math.PI / 2, 0.8, 'wall'],
          [-1.96, -18, Math.PI / 2, 1.0, 'wall'], [1.96, -19, -Math.PI / 2, 1.0, 'wall'], [-30, 30, 0.6, 1.4], [-1.96, -27, Math.PI / 2, 1.4, 'wall']],
      });
      E.label(ctx, { key: 'so9', x: -1.0, z: -11.2, ry: Math.PI / 2 - 0.3, vi: 'Số 9 ngõ Compoint', en: 'No. 9, Impasse Compoint',
        text: 'Từ tháng 7/1921 đến tháng 6/1923, Nguyễn Ái Quốc thuê một căn phòng nhỏ ở đây. Phòng chỉ có giường sắt, bàn, ghế, bếp lò và chậu rửa. Người sống bằng nghề sửa ảnh, vẽ đồ cổ Trung Hoa thuê, và viết bài cho các báo L’Humanité, La Vie Ouvrière, Le Paria.',
        textEn: 'From July 1921 to June 1923 Nguyen Ai Quoc rented a small room here, earning his living retouching photographs and writing for L’Humanité, La Vie Ouvrière and Le Paria.' });
      E.label(ctx, { key: 'suaanh', x: -4.2, z: -9.8, ry: Math.PI / 4, vi: 'Nghề sửa ảnh', en: 'Photo retoucher',
        text: 'Báo La Vie Ouvrière từng đăng lời rao của Người: nếu muốn giữ kỷ niệm về gia đình, hãy nhờ Nguyễn Ái Quốc phóng ảnh — chân dung đẹp, khung đẹp. Nghề sửa ảnh cho Người thời gian để học, đọc và viết.',
        textEn: 'La Vie Ouvrière carried his advertisement for photo enlargements; retouching left him time to read, study and write.' });
      E.label(ctx, { key: 'paria', x: -5.1, z: -8.0, ry: 1.2, vi: 'Báo Le Paria (Người cùng khổ)', en: 'Le Paria newspaper',
        text: 'Tờ báo của Hội Liên hiệp Thuộc địa, số đầu ra tháng 4/1922; Nguyễn Ái Quốc là một trong những người sáng lập, vừa viết bài, vẽ tranh, vừa lo in ấn và phát hành.',
        textEn: 'The paper of the Intercolonial Union, first issued in April 1922; Nguyen Ai Quoc co-founded it, writing, drawing, printing and selling it.' });
      E.label(ctx, { key: 'yeusach', x: -6, z: 30.2, ry: 0.2, vi: 'Yêu sách của nhân dân An Nam', en: 'Demands of the Annamite People',
        text: 'Tháng 6/1919, bản yêu sách tám điểm ký tên Nguyễn Ái Quấc được gửi tới Hội nghị Versailles, đòi quyền tự do, dân chủ cho người dân Đông Dương. Tháng 12/1920, tại Đại hội Tours, Người bỏ phiếu tán thành Quốc tế Cộng sản, trở thành một trong những người sáng lập Đảng Cộng sản Pháp.',
        textEn: 'June 1919: the eight-point petition signed Nguyen Ai Quac is sent to the Versailles Conference. December 1920: at the Tours Congress he votes to join the Communist International.' });
      E.label(ctx, { key: 'phopari', x: 12, z: 30.2, ry: -0.2, vi: 'Phố Paris thập niên 1920', en: 'A Paris street in the 1920s',
        text: 'Mặt đường lát đá hình quạt, vỉa hè rộng, cột quảng cáo Morris, vòi nước Wallace bằng gang sơn xanh, ki-ốt báo, quán cà phê có mái bạt — khung cảnh quen thuộc của những khu lao động ở quận 17.',
        textEn: 'Fan-patterned setts, Morris columns, Wallace fountains, newspaper kiosks and café awnings of a working-class district.' });
      E.stdGates(ctx, { hub: [-38, 31, Math.PI / 2], prev: [-38, 26.5, Math.PI / 2], next: [38, 31, Math.PI / 2] });
    },
  };
})();
