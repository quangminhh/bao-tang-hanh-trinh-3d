/* GIAN 14 — HÀ NỘI 1945: PHỐ HÀNG NGANG VÀ QUẢNG TRƯỜNG BA ĐÌNH.
   Dựng lại hai địa điểm (thực tế cách nhau khoảng 2 km, ở đây nối bằng một đại lộ cây xà cừ để tiện tham quan):
   1) Phố Hàng Ngang trong khu phố cổ — dãy nhà ống hai ba tầng mặt phố hẹp, mái ngói âm dương, mặt tiền vữa vàng, cửa
      chớp, ban công sắt, biển hiệu; nhà số 48 (cửa hàng Phúc Lợi của gia đình ông Trịnh Văn Bô), nơi Chủ tịch Hồ Chí Minh
      soạn thảo bản Tuyên ngôn Độc lập cuối tháng 8/1945 — căn phòng được dựng lại ở tầng trệt: bàn viết, ghế, đèn, bản thảo.
   2) Quảng trường Ba Đình chiều 2/9/1945 — lễ đài khung gỗ bọc vải vàng nhạt, phông đỏ ôm phía sau, cột Tuscan, bình hương, cột cờ, loa phóng
      thanh, khẩu hiệu căng ngang; bãi cỏ tròn giữa quảng trường, hàng cây; phía bắc là Phủ Toàn quyền cũ tường vàng.
   Trục: phố Hàng Ngang theo z (40 … 100), đại lộ z −10 … 40, quảng trường z −120 … −10. */
(function () {
  const HT = window.HT;
  HT.halls.G14 = {
    sky: { hdri: 'qwantani_afternoon_puresky', sunAz: 315, exposure: 0.96, fog: 0.0016, sat: 1.06, con: 1.05, bloom: 0.13, shadowSize: 70 },
    spawn: { x: 1.2, z: 96, yaw: 0.0, pitch: 0.02 },
    map: [-70, -130, 70, 104],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      const inR = (x, z, R) => x >= R[0] && x <= R[2] && z >= R[1] && z <= R[3];
      const H = (x, z) => 0.1 + HT.fbm(x * 0.004, z * 0.004, 3) * 16 * HT.smooth(350, 900, Math.hypot(x, z + 20));
      const lawn = (x, z) => { const d = Math.hypot(x, z + 64); return d < 38 && d > 8 && Math.abs(x) > 2.5 && Math.abs(z + 64) > 2.5; };
      const W = (x, z) => {
        const road = (Math.abs(x) < 3.4 && z > 38) || (Math.abs(x) < 6 && z > -12 && z <= 38) ? 1 : 0;
        const walk = (Math.abs(x) >= 3.4 && Math.abs(x) < 5 && z > 38) ? 1 : 0;
        return [road, walk, lawn(x, z) ? 0 : (z < -8 ? 0.85 : 0)];
      };
      N.terrain(ctx, { size: 2000, inner: 140, step: 0.6, height: H, weights: W, layers: [
        { slug: 'leafy_grass', tile: 2.6, tint: 0xb0c888, rough: 0.95 },
        { slug: 'worn_asphalt', tile: 3, tint: 0x9a9690, rough: 0.7 },
        { slug: 'square_brick_floor', tile: 1.3, tint: 0xe0c8b0, rough: 0.8 },
        { slug: 'gravel_road', tile: 2.6, tint: 0xd8ccb8, rough: 0.9 },
      ], macro: 0.08 });
      ctx.bounds = [[-4.9, 101], [-4.9, 38], [-9, 38], [-9, -10], [-62, -10], [-62, -118], [62, -118], [62, -10], [9, -10], [9, 38], [4.9, 38], [4.9, 66.4], [11.2, 66.4], [11.2, 71.6], [4.9, 71.6], [4.9, 101]];
      N.grass(ctx, { rect: [-40, -104, 40, -24], density: 10, kind: 'lawn', mask: (x, z) => (lawn(x, z) ? 0.95 : 0), seed: 4, far: 40 });
      for (const sx of [-3.4, 3.4]) B.box(HT.mat('granite_tile_04', { tile: 1, color: 0xb8b0a4 }), 0.22, 0.12, 62, sx, 0.02, 70, 0);

      /* ---------------- PHỐ HÀNG NGANG: nhà ống ---------------- */
      const pl = (c) => HT.mat('plastered_wall', { tile: 2.4, color: c, env: 0.7 });
      const tone = [0xf0d890, 0xe8dcc0, 0xe4c890, 0xd8d8c8, 0xf0e0b0, 0xe0c8a8, 0xf2e6c8];
      const ngoi = HT.mat('roof_09', { tile: 1.2, color: 0xe0b8a0 });
      const iron = HT.solid(0x2a2c2a, { rough: 0.5, metal: 0.6 });
      const shutters = [HT.solid(0x3a6a4a, { rough: 0.55 }), HT.solid(0x6a4a2a, { rough: 0.55 }), HT.solid(0x3a4a5a, { rough: 0.55 })];
      const signs = ['HIỆU VẢI', 'TẠP HÓA', 'HIỆU THUỐC BẮC', 'HIỆU GIÀY', 'KIM HOÀN', 'HIỆU SÁCH', 'HÀNG TƠ LỤA', 'HIỆU MŨ'];
      const tube = (x, zc, w, side, i, nf) => {
        const d = 16;
        const b = A.block(ctx, B, { x: side * (5 + d / 2), z: zc, ry: -side * Math.PI / 2, w, d, floors: [4.0, 3.4, 3.2].slice(0, nf), bays: w > 5 ? 2 : 1, wall: pl(tone[i % tone.length]), trim: pl(0xf6f0e2), base: pl(tone[(i + 3) % tone.length]),
          window: { w: 1.2, h: 2.2, kind: 'french', rows: 3, shutter: shutters[i % 3], shutterOpen: 1, frame: HT.solid(0xece6d8, { rough: 0.55 }) }, ground: 'shop', shopFrame: HT.solid([0x3a2a1e, 0x2a3a2a, 0x4a2a1a][i % 3], { rough: 0.5 }),
          balcony: nf > 1 ? [1] : [], railMat: iron, roof: 'gable', roofMat: ngoi, roofKind: 'tile', roofH: 2.0, cornice: true, parapet: i % 3 === 0 ? 0.8 : 0 });
        const [sx2, sz2] = b.f(0, d / 2 + 0.05);
        E.sign(ctx, B, { key: 'hn' + i + side, text: signs[i % signs.length], x: sx2, y: 3.35, z: sz2, ry: -side * Math.PI / 2, w: Math.min(w - 0.6, 4), h: 0.45, bg: ['#7a1c14', '#1c3a2a', '#2a2018', '#12304a'][i % 4], ink: '#f2e0b0', font: HT.FONT_SERIF });
        return b;
      };
      let z = 99, i = 0;
      while (z > 40) { const w = 4.4 + (i % 3) * 0.8; tube(0, z - w / 2, w, -1, i, 2 + (i % 2)); z -= w; i++; }
      z = 99; i = 3;
      while (z > 40) {
        const w = 4.4 + (i % 3) * 0.8;
        if (z - w < 72 && z > 66) { z = 66; continue; }       /* chừa chỗ nhà số 48 (z 66 … 72) */
        tube(0, z - w / 2, w, 1, i, 2 + (i % 2)); z -= w; i++;
      }
      /* ---------------- NHÀ SỐ 48 HÀNG NGANG ---------------- */
      const n48 = A.colonial(ctx, B, { x: 5 + 8, z: 69, ry: -Math.PI / 2, w: 6, d: 16, floors: [4.0, 3.6], bays: 2, veranda: 0, plinth: 0.12, wall: pl(0xf2d890), trim: pl(0xf6f0e2),
        window: { w: 1.2, h: 2.3, kind: 'french', rows: 3, shutter: shutters[0], frame: HT.solid(0xece6d8, { rough: 0.55 }) }, doorKind: 'panel', doorMat: HT.solid(0x3a2a1e, { rough: 0.5 }), roof: 'none', steps: [], backWin: false, sideWin: 0, openBay: 1, noDark0: true, doorBays: [0, 1] });
      A.gableRoof(B, ngoi, { x: 13, z: 69, ry: -Math.PI / 2, w: 6.4, d: 16.6, eave: n48.top, ridge: n48.top + 2.2, kind: 'tile', thick: 0.12, gable: pl(0xf2d890), gableInset: 0.2 });
      { const [bx, bz] = n48.f(0, 8.45); B.box(pl(0xf6f0e2), 5.8, 0.14, 0.9, bx, n48.y0 + 4.0 - 0.07, bz, -Math.PI / 2); A.railing(B, iron, [n48.f(-2.8, 8.85), n48.f(2.8, 8.85)], n48.y0 + 4.07, { h: 1.0, spacing: 0.12, r: 0.012 }); }
      E.sign(ctx, B, { key: 'phucloi', text: 'PHÚC LỢI', x: 4.94, y: 3.55, z: 69, ry: -Math.PI / 2, w: 3.6, h: 0.55, bg: '#7a1c14', ink: '#f2d890', font: HT.FONT_SERIF });
      E.sign(ctx, B, { key: 'so48', text: '48', x: 4.93, y: 2.6, z: 71.2, ry: -Math.PI / 2, w: 0.4, h: 0.26, bg: '#1d3b2f', ink: '#f0e2b0', font: HT.FONT_SANS });
      { /* căn phòng soạn thảo Tuyên ngôn Độc lập (dựng lại) */
        const X0 = 5.45, X1 = 20.55, Z0 = 66.4, Z1 = 71.6, y0 = n48.y0;
        /* sàn gạch bông (gạch xi măng hoa văn) kiểu nhà phố Hà Nội thập niên 1930 – 1940 */
        const bong = HT.canvasTex('gach_bong_hn', 512, 512, (g, Wd, Hd) => {
          const t = Wd / 2;
          for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
            const ox = i * t, oy = j * t, c = t / 2;
            g.fillStyle = '#e8dcc4'; g.fillRect(ox, oy, t, t);
            g.fillStyle = '#9a3a2a'; for (const [cx, cy] of [[0, 0], [t, 0], [0, t], [t, t]]) { g.beginPath(); g.arc(ox + cx, oy + cy, t * 0.22, 0, 6.283); g.fill(); }
            g.fillStyle = '#e8dcc4'; for (const [cx, cy] of [[0, 0], [t, 0], [0, t], [t, t]]) { g.beginPath(); g.arc(ox + cx, oy + cy, t * 0.12, 0, 6.283); g.fill(); }
            g.fillStyle = '#2e5a4a'; for (let k = 0; k < 4; k++) { g.save(); g.translate(ox + c, oy + c); g.rotate(k * Math.PI / 2 + Math.PI / 4); g.beginPath(); g.ellipse(0, -t * 0.2, t * 0.08, t * 0.19, 0, 0, 6.283); g.fill(); g.restore(); }
            g.fillStyle = '#c89a3a'; g.beginPath(); g.arc(ox + c, oy + c, t * 0.07, 0, 6.283); g.fill();
            g.strokeStyle = 'rgba(60,40,30,0.35)'; g.lineWidth = 2; g.strokeRect(ox + 1, oy + 1, t - 2, t - 2);
          }
        }, { repeat: [(X1 - X0) / 0.4, (Z1 - Z0) / 0.4] });
        { const fm = new T.MeshStandardMaterial({ map: bong, roughness: 0.42, envMapIntensity: 0.7 }); const fg = new T.Mesh(new T.PlaneGeometry(12.5 - X0, Z1 - Z0), fm); fg.rotation.x = -Math.PI / 2; fg.position.set((X0 + 12.5) / 2, y0 + 0.041, (Z0 + Z1) / 2); fg.receiveShadow = true; ctx.add(fg); }
        B.box(HT.mat('floor_tiles_06', { tile: 0.8, color: 0xe8dcd0, env: 0.5 }), X1 - X0, 0.04, Z1 - Z0, (X0 + X1) / 2, y0, (Z0 + Z1) / 2, 0);
        B.box(pl(0xf0e8d8), X1 - X0, 0.15, Z1 - Z0, (X0 + X1) / 2, 4.0 + y0 - 0.15, (Z0 + Z1) / 2, 0);
        B.box(pl(0xf0e4c8), 0.12, 4.0, Z1 - Z0, 12.5, y0, (Z0 + Z1) / 2, 0, { col: true });
        ctx.floorRect(9, 69, 7.2, 5.2, y0 + 0.04, 0);
        const go = HT.mat('lacquered_cherry_wood', { tile: 0.8, color: 0xd8b8a0, rough: 0.6, env: 0.6 });
        const top = P.table(B, 10.4, y0, 69.6, -Math.PI / 2, { w: 1.4, d: 0.8, h: 0.78, mat: go, curved: true });
        P.chair(B, 9.6, y0, 69.6, Math.PI / 2, { mat: go });
        ctx.colBox(10.4, 69.6, 0.8, 1.4, 0, 0, 1);
        HT.model(ctx, 'desk_lamp_arm_01', { x: 10.6, z: 70.1, y: top, h: 0.45, ry: -Math.PI / 2, env: 0.7 });
        const tn = HT.canvasTex('ban_thao_tuyen_ngon', 512, 720, (g, Wd, Hd) => { g.fillStyle = '#f2ead8'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#1a1a1a'; g.textAlign = 'center'; g.font = `bold 36px ${HT.FONT_SERIF}`; g.fillText('TUYÊN NGÔN ĐỘC LẬP', Wd / 2, 80); g.font = `italic 22px ${HT.FONT_SERIF}`; g.fillText('bản thảo', Wd / 2, 112); const rr = HT.rng(45); g.strokeStyle = 'rgba(30,30,60,0.6)'; g.lineWidth = 2; for (let y = 150; y < Hd - 40; y += 22) { g.beginPath(); let x = 40; g.moveTo(x, y); while (x < Wd - 50 - rr() * 60) { x += rr.range(8, 22); g.lineTo(x, y + rr.range(-2, 2)); } g.stroke(); } });
        B.add(new T.MeshStandardMaterial({ map: tn, roughness: 0.85 }), HT.geoBox(0.21, 0.004, 0.3), { x: 10.4, y: top + 0.002, z: 69.5, ry: -Math.PI / 2 + 0.1, uv: 'keep' });
        HT.model(ctx, 'mantel_clock_01', { x: 12.2, z: 70.9, y: y0 + 1.8, h: 0.3, ry: -Math.PI / 2, env: 0.6 });
        P.bookshelf(B, 12.2, y0, 67.2, -Math.PI / 2, { w: 1.1, h: 1.8, d: 0.3 });
        P.cabinet(B, 12.2, y0, 70.9, -Math.PI / 2, { w: 1.0, h: 1.8, d: 0.45 });
        /* ốp chân tường gỗ, phào trần, đèn thả, giường, bộ ghế bành, đồng hồ, khung ảnh */
        const wdD = HT.mat('fine_grained_wood', { tile: 1.1, color: 0xa88462, rough: 0.6, env: 0.7 });
        B.box(wdD, 12.5 - X0, 1.05, 0.03, (X0 + 12.5) / 2, y0 + 0.04, Z0 + 0.015, 0); B.box(wdD, 12.5 - X0, 1.05, 0.03, (X0 + 12.5) / 2, y0 + 0.04, Z1 - 0.015, 0);
        B.box(wdD, 0.03, 1.05, Z1 - Z0, 12.5 - 0.075, y0 + 0.04, (Z0 + Z1) / 2, 0);
        for (const zz of [Z0 + 0.04, Z1 - 0.04]) B.box(pl(0xf6f0e2), 12.5 - X0, 0.14, 0.08, (X0 + 12.5) / 2, y0 + 3.71, zz, 0);
        /* đèn thả chụp tráng men (kiểu thập niên 1930 – 1940) */
        { const lx = 9.2, lz = 69, ly = y0 + 2.75;
          B.cyl(iron, 0.005, 0.005, 3.85 - 2.75, lx, ly + 0.1, lz, 5);
          B.add(HT.solid(0x2e4a3c, { rough: 0.35, side: T.DoubleSide }), new T.ConeGeometry(0.24, 0.13, 28, 1, true), { x: lx, y: ly + 0.02, z: lz, uv: 'keep' });
          B.add(HT.solid(0xf4f0e6, { rough: 0.3 }), new T.CylinderGeometry(0.03, 0.03, 0.06, 12), { x: lx, y: ly + 0.1, z: lz, uv: 'keep' });
          B.add(HT.solid(0xfff2d0, { emissive: 0xffe2a8, ei: 3 }), new T.SphereGeometry(0.045, 14, 10), { x: lx, y: ly - 0.02, z: lz, noShadow: true }); }
        HT.model(ctx, 'vintage_day_bed', { x: 7.9, z: Z0 + 0.55, y: y0 + 0.04, w: 1.9, ry: 0, env: 0.6, col: true });
        HT.model(ctx, 'ArmChair_01', { x: 8.7, z: 70.95, y: y0 + 0.04, h: 0.9, ry: Math.PI, env: 0.6, col: true });
        HT.model(ctx, 'side_table_01', { x: 9.65, z: 71.1, y: y0 + 0.04, h: 0.55, env: 0.6 });
        HT.model(ctx, 'vintage_grandfather_clock_01', { x: 12.22, z: 68.45, y: y0 + 0.04, h: 2.1, ry: -Math.PI / 2, env: 0.6, col: true });
        HT.model(ctx, 'hanging_picture_frame_01', { x: 8.3, z: Z0 + 0.05, y: y0 + 1.8, h: 0.6, ry: 0, env: 0.6 });
        HT.model(ctx, 'vintage_suitcase', { x: 6.2, z: Z0 + 0.45, y: y0 + 0.04, h: 0.22, ry: 0.2, env: 0.6 });
        const l = new T.PointLight(0xffe0b0, 10, 8, 1.4); l.position.set(9.2, 2.6, 69); ctx.add(l); }

      /* ---------------- ĐẠI LỘ XÀ CỪ ---------------- */
      N.trees(ctx, 'forest', N.along(8, [[-8.2, -8], [-8.2, 38]], 7, 0.3).concat(N.along(9, [[8.2, -8], [8.2, 38]], 7, 0.3)).map((p) => ({ x: p.x, z: p.z, s: 0.62 })), { seed: 15 });
      for (let zz = -4; zz <= 36; zz += 10) { P.gasLamp(B, ctx, -6.6, 0.1, zz, { h: 4.4 }); P.gasLamp(B, ctx, 6.6, 0.1, zz + 5, { h: 4.4 }); }

      /* ---------------- QUẢNG TRƯỜNG BA ĐÌNH, 2/9/1945 ---------------- */
      const LZ = -94;
      const woodR = HT.mat('weathered_brown_planks', { tile: 1.2, color: 0xe8d8c0 });
      const redCloth = HT.solid(0xb81c16, { rough: 0.85 });
      /* lễ đài (KTS Ngô Huy Quỳnh thiết kế, dựng trong một ngày đêm): khung gỗ đóng đinh bọc vải màu vàng nhạt,
         phía sau là tấm phông đỏ uốn cong "vòng hai tay ôm lấy" lễ đài, cột kiểu Tuscan hài hòa với kiến trúc quanh vườn hoa,
         hai bình hương lớn hai bên, cột cờ trên lễ đài treo cờ đỏ sao vàng. */
      const vang = HT.mat('plastered_wall', { tile: 2.0, color: 0xf2dc9a, env: 0.6 });
      const vangV = HT.solid(0xecd694, { rough: 0.85, side: T.DoubleSide });
      B.box(woodR, 14, 1.8, 7, 0, 0.1, LZ, 0, { col: true });
      /* bọc vải vàng nhạt ba mặt, xếp nếp nhẹ */
      { const cg = new T.PlaneGeometry(14.1, 1.8, 70, 1); const pp = cg.attributes.position; for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.sin(pp.getX(i) * 9) * 0.025); cg.computeVertexNormals();
        B.add(vangV, cg, { x: 0, y: 1.0, z: LZ + 3.54, uv: 'keep' });
        for (const sx of [-1, 1]) { const sg = new T.PlaneGeometry(7.1, 1.8, 36, 1); const q = sg.attributes.position; for (let i = 0; i < q.count; i++) q.setZ(i, Math.sin(q.getX(i) * 9) * 0.025); sg.computeVertexNormals(); B.add(vangV, sg, { x: sx * 7.04, y: 1.0, z: LZ, ry: sx * Math.PI / 2, uv: 'keep' }); } }
      B.box(HT.solid(0xb81c16, { rough: 0.85 }), 14.2, 0.18, 0.06, 0, 1.72, LZ + 3.56, 0);
      ctx.floorRect(0, LZ, 14, 7, 1.9, 0);
      A.stairs(B, ctx, woodR, { x: 0, z: LZ + 3.5 + 2.4, ry: 0, n: 9, rise: 1.8, run: 2.4, w: 3.0, y0: 0.1 });
      A.railing(B, woodR, [[-7, LZ + 3.4], [-1.6, LZ + 3.4]], 1.9, { h: 0.95, spacing: 0.3, r: 0.035, square: true, post: true });
      A.railing(B, woodR, [[1.6, LZ + 3.4], [7, LZ + 3.4]], 1.9, { h: 0.95, spacing: 0.3, r: 0.035, square: true, post: true });
      /* bốn cột Tuscan vàng nhạt (thân tròn, đế vuông, mũ cột tròn + tấm vuông) */
      const tusc = (x, zz) => {
        B.box(vang, 0.72, 0.28, 0.72, x, 1.9, zz, 0);
        B.cyl(vang, 0.26, 0.3, 3.1, x, 2.18, zz, 20);
        B.cyl(vang, 0.34, 0.27, 0.2, x, 5.28, zz, 20);
        B.box(vang, 0.78, 0.16, 0.78, x, 5.48, zz, 0);
      };
      for (const x of [-5.0, -2.0, 2.0, 5.0]) { tusc(x, LZ - 1.6); ctx.colCircle(x, LZ - 1.6, 0.34, 1.9, 6); }
      B.box(vang, 10.9, 0.5, 0.8, 0, 5.64, LZ - 1.6, 0);
      B.box(HT.solid(0xf6e4a8, { rough: 0.7 }), 11.1, 0.1, 0.9, 0, 6.14, LZ - 1.6, 0);
      /* phông vải đỏ uốn cong phía sau, hai cánh ôm về phía trước */
      { const R = 7.6, th = Math.PI * 1.08; const g = new T.CylinderGeometry(R, R, 4.2, 64, 1, true, Math.PI - th / 2, th);
        const pp = g.attributes.position; for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), zq = pp.getZ(i); const a = Math.atan2(zq, x); const k = 1 + Math.sin(a * 40) * 0.004; pp.setX(i, x * k); pp.setZ(i, zq * k); } g.computeVertexNormals();
        B.add(HT.solid(0xb41a14, { rough: 0.88, side: T.DoubleSide }), g, { x: 0, y: 1.9 + 2.1, z: LZ + 0.2, sz: 0.513, uv: 'keep' });
        for (let k = 0; k < 10; k++) { const a0 = Math.PI - th / 2 + (k / 10) * th, a1 = Math.PI - th / 2 + ((k + 1) / 10) * th; ctx.colSeg(R * Math.sin(a0), LZ + 0.2 + R * 0.513 * Math.cos(a0), R * Math.sin(a1), LZ + 0.2 + R * 0.513 * Math.cos(a1), 0.2, 1.9, 8); } }
      /* bình hương lớn hai bên lễ đài */
      const dongDo = HT.solid(0x6a4a24, { rough: 0.35, metal: 0.85 });
      for (const sx of [-1, 1]) {
        const bx = sx * 9.6, bz = LZ + 4.2;
        B.box(vang, 1.3, 0.9, 1.3, bx, 0.1, bz, 0, { col: true });
        B.add(dongDo, HT.lathe([[0, 0], [0.34, 0], [0.3, 0.08], [0.5, 0.3], [0.56, 0.55], [0.46, 0.78], [0.5, 0.84], [0.52, 0.9], [0, 0.9]], 28), { x: bx, y: 1.0, z: bz, uv: 'keep' });
        for (const a of [0, 2.09, 4.19]) B.beam(dongDo, bx + Math.cos(a) * 0.3, 1.0, bz + Math.sin(a) * 0.3, bx + Math.cos(a) * 0.36, 0.95, bz + Math.sin(a) * 0.36, 0.08, 0.08, {});
        for (const e of [-1, 1]) B.add(dongDo, new T.TorusGeometry(0.12, 0.03, 8, 16), { x: bx + e * 0.56, y: 1.62, z: bz, ry: Math.PI / 2 });
        for (let k = 0; k < 5; k++) B.cyl(HT.solid(0x8a2a18, { rough: 0.8 }), 0.006, 0.006, 0.35, bx - 0.12 + k * 0.06, 1.9, bz + (k % 2) * 0.05, 5);
      }
      /* bàn, micrô trên lễ đài */
      P.table(B, 0, 1.9, LZ + 1.8, 0, { w: 1.6, d: 0.7, h: 0.95, mat: woodR });
      B.cyl(iron, 0.012, 0.02, 0.45, 0, 2.85, LZ + 2.0, 8); B.add(HT.solid(0x444444, { rough: 0.3, metal: 0.8 }), new T.SphereGeometry(0.06, 12, 8), { x: 0, y: 3.33, z: LZ + 2.0 });
      /* cột cờ trên lễ đài, sau hàng cột */
      P.flag(ctx, 0, 1.9, LZ - 2.6, { kind: 'vn', pole: 17, w: 4.2, amp: 0.16, base: false });
      /* loa phóng thanh */
      for (const [lx, lz] of [[-12, LZ + 6], [12, LZ + 6], [-20, LZ + 24], [20, LZ + 24]]) {
        B.cyl(woodR, 0.1, 0.12, 7, lx, 0.1, lz, 8); ctx.colCircle(lx, lz, 0.2);
        for (const a of [-0.5, 0.5]) { const g = new T.CylinderGeometry(0.28, 0.06, 0.7, 12, 1, true); g.rotateX(Math.PI / 2 - 0.25); g.rotateY(a); B.add(HT.solid(0xd8d4c8, { rough: 0.5, metal: 0.6, side: T.DoubleSide }), g, { x: lx, y: 6.6, z: lz, uv: 'keep' }); }
      }
      /* khẩu hiệu căng ngang */
      for (const [x0, x1, zz, txt] of [[-20, -8, LZ + 24, 'ĐỘC LẬP HAY LÀ CHẾT'], [8, 20, LZ + 24, 'NƯỚC VIỆT NAM CỦA NGƯỜI VIỆT NAM']]) P.banner(ctx, B, x0, 6.2, zz, x1, 6.2, zz, 1.1, txt, { key: 'bd' + x0, bg: '#b81c16', ink: '#f6e27a' });
      /* cờ đỏ sao vàng quanh quảng trường */
      for (let k = 0; k < 14; k++) { const a = Math.PI * (0.15 + 0.7 * (k / 13)); P.flag(ctx, Math.cos(a) * 44, 0.1, -64 + Math.sin(a) * 44, { kind: 'vn', pole: 7, w: 1.6, amp: 0.12 }); }
      /* bãi cỏ tròn, lối đi, cây */
      N.hedge(ctx, (() => { const pts = []; for (let k = 0; k <= 40; k++) { const a = (k / 40) * 6.283; pts.push([Math.cos(a) * 38.4, -64 + Math.sin(a) * 38.4]); } return pts.filter(([x, zz]) => !(Math.abs(x) < 3.5 && zz > -64) && !(Math.abs(x) < 3.5 && zz < -64)); })(), { h: 0.7, w: 0.6, kind: 'hedge', seed: 6, col: false });
      N.trees(ctx, 'forest', N.scatter(19, [-62, -118, 62, -10], 40, 9, (x, zz) => Math.hypot(x, zz + 64) > 42).map((p) => ({ x: p.x, z: p.z, s: 0.66 })), { seed: 19 });
      /* Phủ Toàn quyền cũ phía bắc */
      const yel = HT.mat('plastered_wall', { tile: 2.4, color: 0xf6d880, env: 0.7 });
      A.block(ctx, B, { x: 0, z: -175, ry: 0, w: 60, d: 22, floors: [5, 4.6, 4.2], bays: 13, wall: yel, trim: pl(0xfaf4e6), window: { w: 1.3, h: 2.6, kind: 'french', rows: 4, shutter: HT.solid(0x3d6a4a, { rough: 0.6 }), shutterOpen: 1, frame: pl(0xfaf4e6) }, ground: 'door', balcony: [1], roof: 'mansard', roofMat: HT.mat('roof_slates_03', { tile: 1.2 }), roofTop: HT.solid(0x4c5256, { rough: 0.5, metal: 0.5 }), mansardH: 3.2, col: false });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [3.6, 92, -Math.PI / 2 + 0.4, 'lectern'],
        stories: [[-3.9, 80, Math.PI / 2], [-3.9, 56, Math.PI / 2]],
        moc: [-5.2, 20, Math.PI / 2 + 0.2],
        quote: [3.2, -20, -0.4],
        photos: [[-10, -40, 0.5, 1.2], [3.2, -42, -0.3, 0.8], [-24, -30, 0.6, 1.0], [24, -30, -0.6, 1.3], [-40, -52, 1.0, 1.3], [34, -44, -0.8, 1.0], [40, -72, -1.3, 1.3], [-6.5, 30, Math.PI / 2, 1.3], [-18, -24, 0.3, 1.4], [16, -22, -0.3, 1.4], [3.8, 48, -Math.PI / 2, 1.3], [3.8, 60, -Math.PI / 2, 0.8]],
      });
      E.label(ctx, { key: 'so48', x: 3.9, z: 74, ry: -Math.PI / 2 + 0.2, vi: 'Nhà số 48 Hàng Ngang', en: '48 Hang Ngang Street',
        text: 'Ngày 25/8/1945, Chủ tịch Hồ Chí Minh về Hà Nội, ở tại căn gác nhà số 48 Hàng Ngang của gia đình ông Trịnh Văn Bô. Tại đây, từ ngày 28 đến 29/8/1945, Người soạn thảo bản Tuyên ngôn Độc lập.',
        textEn: 'Ho Chi Minh arrived in Hanoi on 25 August 1945 and stayed in the upstairs room of No. 48, home of the Trinh Van Bo family, where he drafted the Declaration of Independence.' });
      E.label(ctx, { key: 'phong', x: 8.2, z: 67.2, ry: Math.PI / 2 + 0.5, vi: 'Căn phòng soạn thảo Tuyên ngôn', en: 'The drafting room',
        text: 'Căn phòng nhỏ trên tầng hai được dựng lại ở tầng trệt để tiện tham quan: bàn viết, ghế tựa, đèn bàn, tủ sách. Người viết bản thảo bằng tay rồi đưa đánh máy.',
        textEn: 'The small upstairs room, reconstructed here at street level: desk, chair, lamp and bookcase.' });
      E.label(ctx, { key: 'ledai', x: -4.2, z: LZ + 8.5, ry: 0.3, vi: 'Lễ đài Ba Đình, 2/9/1945', en: 'The Ba Dinh rostrum, 2 September 1945',
        text: 'Chiều 2/9/1945, trước hàng chục vạn đồng bào, Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập trên lễ đài dựng giữa vườn hoa Ba Đình, khai sinh nước Việt Nam Dân chủ Cộng hòa. Lễ đài do kiến trúc sư Ngô Huy Quỳnh thiết kế, dựng trong một ngày đêm: khung gỗ bọc vải vàng nhạt, phông đỏ ôm phía sau, hai bình hương hai bên.',
        textEn: 'On the afternoon of 2 September 1945, before hundreds of thousands, Ho Chi Minh read the Declaration of Independence from this rostrum, founding the Democratic Republic of Vietnam. Designed by architect Ngo Huy Quynh and built overnight: a wooden frame wrapped in pale-yellow cloth, a red backdrop and two incense urns.' });
      E.label(ctx, { key: 'hainoi', x: 6.4, z: 36, ry: -Math.PI / 2 - 0.3, vi: 'Hai địa điểm', en: 'Two places',
        text: 'Phố Hàng Ngang (khu phố cổ) và quảng trường Ba Đình cách nhau khoảng 2 km; trong gian này được nối bằng một đoạn đại lộ để tiện đi bộ tham quan.',
        textEn: 'Hang Ngang Street and Ba Dinh Square are about 2 km apart; here they are joined by an avenue.' });
      E.stdGates(ctx, { hub: [-3.2, 100.6, 0], prev: [1.6, 100.6, 0], next: [0, -116, 0] });
    },
  };
})();
