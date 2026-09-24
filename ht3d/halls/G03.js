/* GIAN 03 — PHAN THIẾT, TRƯỜNG DỤC THANH (1910).
   Dựng lại: nhà học gỗ năm gian (~17 × 8 m, cao 4,4 m) mái ngói âm dương nâu sẫm, cột gỗ, nền gạch tàu, hồi tường
   gạch có ô thông gió "bông gió" tổ ong, cửa thượng song hạ đố; trong lớp 21 bộ bàn ghế ba dãy, bục giảng, hai tấm bảng đen;
   nhà Ngọa Du Sào ba gian có gác và thang; giếng gạch, cây khế; sông Cà Ty với thuyền nan, thuyền thúng, rặng dừa.
   Trục: +z = nam (phía sông). */
(function () {
  const HT = window.HT;
  HT.halls.G03 = {
    sky: { hdri: 'kloofendal_43d_clear_puresky', sunAz: 115, exposure: 0.92, fog: 0.0015, sat: 1.06, con: 1.05, bloom: 0.12 },
    spawn: { x: 2, z: 19, yaw: -0.15, pitch: -0.03 },
    map: [-38, -30, 42, 30],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      const RIV = 26;                                   // mép sông bờ bắc
      const H = (x, z) => {
        let h = 0.3 + HT.noise(x * 0.06, z * 0.06, 2) * 0.15;
        if (z > RIV - 4) h = HT.lerp(h, -1.6, HT.smooth(RIV - 4, RIV + 2, z));
        if (z > RIV + 34) h = HT.lerp(-1.6, 0.6, HT.smooth(RIV + 34, RIV + 40, z));
        h += HT.fbm(x * 0.004, z * 0.004, 3) * 30 * HT.smooth(300, 800, Math.hypot(x, z));
        return h;
      };
      const W = (x, z, h) => {
        const yard = x > -26 && x < 30 && z > -22 && z < 22 ? 1 : 0;
        const path = Math.abs(x - 2) < 1.4 && z > 6 && z < 25 ? 1 : 0;
        const bank = z > RIV - 5 && z < RIV + 1 ? 1 : 0;
        const bare = HT.smooth(0.2, 0.6, HT.noise(x * 0.09, z * 0.09, 7) + 0.1);
        return [yard * (0.55 + 0.4 * bare) * (1 - path), bank * 0.9, path];
      };
      N.terrain(ctx, { size: 1600, inner: 80, step: 0.5, height: H, weights: W, layers: [
        { slug: 'forrest_ground_01', tile: 2.6, tint: 0xc8c8a0, rough: 0.95 },
        { slug: 'coast_sand_01', tile: 2.4, tint: 0xeee4cc, rough: 0.95 },
        { slug: 'brown_mud_rocks_01', tile: 2.2, rough: 0.8 },
        { slug: 'grass_path_2', tile: 2.2, tint: 0xe0d8c4, rough: 0.9 },
      ] });
      ctx.bounds = [[-36, -28], [40, -28], [40, RIV - 1.2], [-36, RIV - 1.2]];
      N.waterMirror(ctx, { poly: N.rectPoly(-600, RIV - 2, 600, RIV + 38), y: -0.55, color: 0x2c3c30, distortion: 0.45, size: 1.4, speed: 0.4, kind: 'b' });
      N.grass(ctx, { rect: [-36, -28, 40, RIV], density: 7, kind: 'grass', mask: (x, z) => { const [a, b, c] = W(x, z); return a > 0.55 || c > 0.3 || (x > -12 && x < 16 && z > -10 && z < 6) ? 0 : 0.75; }, seed: 3, far: 45 });
      N.grass(ctx, { rect: [-36, -28, 40, RIV], density: 3, kind: 'dry', mask: (x, z) => { const [a, b, c] = W(x, z); return a > 0.7 || c > 0.3 ? 0 : 0.5; }, seed: 9, far: 40 });

      /* ---------------- nhà học (5 gian) ---------------- */
      const tile = HT.mat('roof_07', { tile: 1.3, color: 0x9a6a52 });
      const wood = HT.mat('fine_grained_wood', { tile: 1.1, color: 0xffe6cc, env: 0.6, rot: Math.PI / 2 });
      const plank = HT.mat('weathered_brown_planks', { tile: 1.8, env: 0.6 });
      const brick = HT.mat('red_bricks_04', { tile: 1.4, color: 0xc8a088 });
      const house = A.vnHouse(ctx, B, {
        x: 2, z: -2, ry: 0, gian: 5, gianW: 3.4, depth: 6.2, porch: 1.6, plinth: 0.45, eave: 2.95, ridge: 4.4,
        roof: 'tile', roofMat: tile, back: 'plank', plankMat: plank, ends: 'brick', brickMat: brick, front: 'songdo', openBays: [0, 1, 2, 3, 4], doorOpen: 0.95,
        col: wood, colR: 0.12, base: HT.mat('granite_tile', { tile: 0.8, color: 0x8a8680 }), plinthMat: brick, stepMat: brick,
        floorMat: HT.mat('terracotta_floor_tiles', { tile: 1.2, color: 0xd8a888, env: 0.5 }), overhang: 0.8,
        backOpen: [{ u: 3.4, w: 1.1, y: 1.0, h: 1.2 }, { u: 8.5, w: 1.1, y: 1.0, h: 1.2 }, { u: 13.6, w: 1.1, y: 1.0, h: 1.2 }],
        ridgeMat: HT.solid(0x6a4a3a, { rough: 0.8 }),
      });
      const hy = house.y, hf = house.f;
      /* ô bông gió tổ ong trên hai tường hồi */
      const hc = HT.canvasTex('bonggio', 256, 256, (g, W2, H2) => {
        g.fillStyle = '#b8765a'; g.fillRect(0, 0, W2, H2);
        g.globalCompositeOperation = 'destination-out';
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
          const cx = x * 64 + (y % 2) * 32 + 16, cy = y * 64 + 32;
          g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; g.lineTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24); } g.closePath(); g.fill();
        }
        g.globalCompositeOperation = 'source-over';
      }, { repeat: [4, 2] });
      const hcm = new T.MeshStandardMaterial({ map: hc, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.85 });
      for (const sx of [-1, 1]) {
        const [a, b] = hf(sx * (house.W / 2 + 0.12), -0.3);
        const m = new T.Mesh(new T.PlaneGeometry(3.2, 1.2), hcm); m.position.set(a, hy + 2.2, b); m.rotation.y = Math.PI / 2; m.castShadow = true; ctx.add(m);
      }
      /* lớp học: 21 bộ bàn ghế (3 dãy × 7), bục giảng, 2 bảng đen ở hồi tây */
      for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) {
        const [a, b] = hf(-5.2 + i * 1.45, -2.0 + j * 1.75);
        if (ctx.colliders.some((c) => c.t === 1 && c.r <= 0.35 && Math.abs(c.x - a) < 0.5 && Math.abs(c.z - b) < 0.8)) continue;   /* bỏ bàn trùng cột nhà */
        P.schoolDesk(B, a, hy, b, -Math.PI / 2, { w: 1.4 });
        ctx.colBox(a, b, 0.8, 1.4, 0, hy, hy + 0.9);
      }
      { const [a, b] = hf(-7.4, -0.3); B.box(HT.mat('weathered_brown_planks', { tile: 1.2 }), 1.6, 0.25, 4.6, a, hy, b, 0); ctx.floorRect(a, b, 1.6, 4.6, hy + 0.25, 0);
        const top = P.table(B, a + 0.3, hy + 0.25, b, 0, { w: 0.6, d: 1.2, h: 0.78, mat: wood }); P.chair(B, a - 0.3, hy + 0.25, b, -Math.PI / 2, { mat: wood });
        HT.model(ctx, 'vintage_oil_lamp', { x: a + 0.3, z: b + 0.35, y: top, h: 0.35, env: 0.6 }); }
      for (const dz of [-1.4, 1.4]) { const [a, b] = hf(-8.3 + 0.03, dz); P.blackboard(B, a, hy + 0.95, b, Math.PI / 2, 'ducthanh' + dz, dz < 0 ? [['Quốc văn', 78], ['Học ăn, học nói, học gói, học mở.', 56], ['Thương người như thể thương thân.', 56]] : [['Toán pháp', 78], ['12 + 27 = 39', 60], ['Năm 1910', 54]], { w: 2.2, h: 1.1 }); }
      /* ánh sáng trong lớp (nắng hắt qua cửa, tường vôi) */
      for (const lx of [-4.5, 0, 4.5]) { const [a, b] = hf(lx, -0.6); const pl = new T.PointLight(0xffe2b8, 26, 11, 1.4); pl.position.set(a, hy + 3.0, b); ctx.add(pl); }
      /* ---------------- nhà Ngọa Du Sào (3 gian, có gác) ---------------- */
      const nd = A.vnHouse(ctx, B, {
        x: 25, z: -10, ry: -0.35, gian: 3, gianW: 2.6, depth: 4.4, porch: 1.1, plinth: 0.35, eave: 2.4, ridge: 4.2,
        roof: 'tile', roofMat: tile, back: 'plank', plankMat: plank, ends: 'plank', front: 'songdo', openBays: [1], col: wood, colR: 0.1,
        base: HT.mat('granite_tile', { tile: 0.8, color: 0x8a8680 }), plinthMat: brick, floorMat: HT.mat('terracotta_floor_tiles', { tile: 1.2, color: 0xd0a080, env: 0.5 }), overhang: 0.7,
        ridgeMat: HT.solid(0x6a4a3a, { rough: 0.8 }),
      });
      { const [a, b] = nd.f(0, -0.6); B.box(HT.mat('weathered_brown_planks', { tile: 1 }), 7.6, 0.08, 2.6, a, nd.y + 2.3, b, -0.35);
        HT.model(ctx, 'wooden_ladder', { x: nd.f(1.8, 0.8)[0], z: nd.f(1.8, 0.8)[1], y: nd.y, h: 2.6, ry: -0.35 + Math.PI / 2, env: 0.6 });
        const [c, d] = nd.f(-2.5, -1.2); P.phan(B, c, nd.y, d, -0.35, { w: 1.8, d: 1.2, chieu: true });   /* lùi 0,3 m: tránh cột gian giữa */ ctx.colBox(c, d, 1.8, 1.2, -0.35, nd.y, nd.y + 0.5);
        const [e, g2] = nd.f(0, -1.6); P.table(B, e, nd.y, g2, -0.35, { w: 1.2, d: 0.6, h: 0.8, mat: wood }); }
      /* ---------------- giếng gạch, cây khế, cổng trường ---------------- */
      P.well(B, ctx, -9, H(-9, 10), 10, { r: 0.8, h: 0.8 });
      N.trees(ctx, 'star', [{ x: 12, z: 10.5, s: 1.1 }], { seed: 4 });
      N.trees(ctx, 'mango', [{ x: -20, z: -18, s: 1.0 }, { x: 22, z: 8, s: 0.9 }], { seed: 6 });
      N.palms(ctx, 'coconut', [{ x: -30, z: 20 }, { x: -22, z: 22 }, { x: -12, z: 21 }, { x: 15, z: 22 }, { x: 26, z: 20.5 }, { x: 34, z: 22 }, { x: -34, z: -8 }, { x: 36, z: -20 }], { seed: 8 });
      N.bamboo(ctx, [{ x: -32, z: -24 }, { x: -22, z: -26 }, { x: 10, z: -26 }, { x: 30, z: -25 }], { n: 28, h: 10, r: 1.1, seed: 3 });
      N.banana(ctx, [{ x: -26, z: -12 }, { x: -27, z: -6 }, { x: 34, z: 2 }], { seed: 3 });
      N.trees(ctx, 'mango', [{ x: -30, z: 4, s: 1.05 }, { x: -18, z: 14, s: 0.8 }, { x: 34, z: -14, s: 0.95 }, { x: 8, z: -24, s: 1.1 }, { x: -8, z: -25, s: 0.9 }], { seed: 11 });
      N.trees(ctx, 'guava', [{ x: 14, z: -18 }, { x: -24, z: -20 }], { seed: 5 });
      /* vành cây xa: rặng dừa, rừng dầu, xóm nhà */
      const ring = N.scatter(21, [-260, -260, 260, RIV - 3], 150, 9, (x, z) => Math.hypot(x - 2, z) > 48);
      N.trees(ctx, 'forest', ring.filter((_, i) => i % 3 === 0).map((p) => ({ x: p.x, z: p.z, s: 0.7 + (Math.abs(p.x * 7 + p.z * 3) % 10) / 25 })), { seed: 13, collide: false });
      N.trees(ctx, 'mango', ring.filter((_, i) => i % 3 === 1), { seed: 14, collide: false });
      N.palms(ctx, 'coconut', ring.filter((_, i) => i % 3 === 2), { seed: 15, collide: false });
      /* cổng trường + biển tên */
      const gm = HT.mat('white_plaster_02', { tile: 1.5, color: 0xefe8da });
      for (const sx of [-1.8, 1.8]) { B.box(gm, 0.55, 3.0, 0.55, 2 + sx, H(2, 19), 19, 0, { col: true }); B.box(tile, 0.7, 0.25, 0.7, 2 + sx, H(2, 19) + 3.0, 19, 0); }
      B.box(gm, 4.2, 0.7, 0.3, 2, H(2, 19) + 2.35, 19, 0);
      E.sign(ctx, B, { key: 'ducthanh', text: 'TRƯỜNG DỤC THANH', x: 2, y: H(2, 19) + 2.7, z: 19.17, w: 3.2, h: 0.46, bg: '#1d3b2f', ink: '#e9d9a6', font: HT.FONT_SERIF });
      A.fence(B, ctx, HT.mat('bamboo_veneer', { tile: 0.6, color: 0x9a8a60 }), [[-26, 19], [-0.3, 19]], { kind: 'coc', h: 1.1, seed: 2 });
      A.fence(B, ctx, HT.mat('bamboo_veneer', { tile: 0.6, color: 0x9a8a60 }), [[4.3, 19], [30, 19]], { kind: 'coc', h: 1.1, seed: 3 });
      /* ---------------- sông Cà Ty: thuyền nan, thuyền thúng, bờ bên kia ---------------- */
      VV.sampan(ctx, B, -8, -0.5, RIV + 4, 0.2, {});
      VV.sampan(ctx, B, 12, -0.5, RIV + 7, -0.3, { L: 8 });
      VV.sampan(ctx, B, 30, -0.5, RIV + 14, 0.1, { mui: false });
      for (const [x, z] of [[-18, RIV + 3], [-15, RIV + 3.5], [4, RIV + 2.8]]) {
        const g = new T.SphereGeometry(0.95, 20, 10, 0, 6.283, Math.PI / 2, Math.PI / 2); g.scale(1, 0.45, 1);
        B.add(HT.mat('bamboo_wall_02', { tile: 0.6, color: 0x5a4a38, side: T.DoubleSide }), g, { x, y: -0.35, z, uv: 'box' });
      }
      const opp = [];
      for (let x = -120; x <= 120; x += 7) opp.push({ x: x + r.range(-2, 2), z: RIV + 44 + r.range(-3, 6) });
      N.palms(ctx, 'coconut', opp, { seed: 12, collide: false });
      for (let x = -60; x <= 60; x += 16) A.vnHouse(ctx, B, { x: x + r.range(-3, 3), z: RIV + 52, ry: Math.PI + r.range(-0.2, 0.2), gian: 3, gianW: 2.4, depth: 4, porch: 0.8, plinth: 0.3, eave: 2.2, ridge: 3.9, roof: 'tile', roofMat: tile, back: 'plank', plankMat: plank, ends: 'plank', front: 'mud', col: wood, overhang: 0.5, truss: false, seed: x });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [-2.8, 21.4, Math.PI + 0.25, 'lectern'],
        stories: [[-13, 6.2, 0.6], [-13, -1.8, Math.PI / 2]],
        moc: [16.5, 13.4, -0.5],
        photos: [[-4.4, 13.4, 0.35], [-15.6, 13.2, 0.8], [30.5, -3.4, -0.9], [-5.5, 8.8, 1.1], [8, 23.4, Math.PI - 0.2, 1.3]],
      });
      E.label(ctx, { key: 'lop', x: 8.6, z: 5.8, ry: -0.15, vi: 'Lớp học Trường Dục Thanh', en: 'The Duc Thanh classroom',
        text: 'Trường do Công ty Liên Thành của các sĩ phu yêu nước Phan Thiết lập năm 1907. Năm 1910 thầy giáo Nguyễn Tất Thành dạy chữ quốc ngữ, chữ Hán và thể dục cho học trò, kể chuyện yêu nước, dắt học trò đi dã ngoại.',
        textEn: 'Founded in 1907 by the patriotic Lien Thanh company; in 1910 Nguyen Tat Thanh taught here.' });
      E.label(ctx, { key: 'ngoadu', x: 21, z: -2.4, ry: -0.35, vi: 'Nhà Ngọa Du Sào', en: 'Ngoa Du Sao house',
        text: 'Nhà ba gian của nhà thơ Nguyễn Thông, nơi thầy giáo trẻ ở trong thời gian dạy học tại Dục Thanh. Có gác gỗ, lên bằng thang.',
        textEn: 'The three-room house of poet Nguyen Thong, where the young teacher lodged; it has a wooden loft reached by a ladder.' });
      E.label(ctx, { key: 'gieng', x: -6.8, z: 11.8, ry: -0.8, vi: 'Giếng nước', en: 'The well',
        text: 'Giếng gạch trong sân trường, nguồn nước sinh hoạt của thầy trò ngày ấy.', textEn: 'The brick well in the school yard.' });
      E.stdGates(ctx, { hub: [-32, 16, Math.PI / 2], prev: [-32, -16, Math.PI / 2], next: [37, 16, Math.PI / 2] });
    },
  };
})();
