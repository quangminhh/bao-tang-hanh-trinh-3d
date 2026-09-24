/* GIAN 13 — TÂN TRÀO, SƠN DƯƠNG, TUYÊN QUANG (tháng 5 – 8/1945).
   Dựng lại: thung lũng Tân Trào — cây đa cổ thụ bên đường đất đầu làng (nơi Giải phóng quân làm lễ xuất quân 16/8/1945);
   đình Tân Trào ba gian bằng gỗ, sàn gỗ, mái lợp lá cọ, nơi họp Quốc dân Đại hội 16 – 17/8/1945; xóm nhà sàn Tày mái lá,
   ruộng lúa bậc thấp ven suối; đồi cọ, rừng nứa; trên sườn đồi Nà Nưa là lán nứa hai gian mái lá cọ nơi Người ở và làm
   việc; lá cờ đỏ sao vàng.
   Trục: thung lũng mở về phía nam (+z), đồi Nà Nưa phía bắc – đông bắc. */
(function () {
  const HT = window.HT;
  HT.halls.G13 = {
    sky: { hdri: 'kloofendal_48d_partly_cloudy_puresky', sunAz: 160, exposure: 0.95, fog: 0.0024, sat: 1.07, con: 1.05, bloom: 0.13 },
    spawn: { x: 12, z: 30, yaw: 0.25, pitch: 0.03 },
    map: [-50, -66, 50, 44],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo;
      const B = ctx.B, r = ctx.rng;
      const inR = (x, z, R) => x >= R[0] && x <= R[2] && z >= R[1] && z <= R[3];
      const PAD = [-60, 38, 90, 160];
      const LX = 28, LZ = -50;                                     // lán Nà Nưa trên sườn đồi
      const H = (x, z) => {
        let h = 0.4 + HT.noise(x * 0.05, z * 0.05, 3) * 0.2;
        h += Math.max(0, -z - 12) * 0.32 * (0.8 + 0.2 * HT.noise(x * 0.03, z * 0.03, 1));          // sườn đồi phía bắc
        h += HT.smooth(40, 80, Math.abs(x - 10)) * 12;
        if (inR(x, z, PAD)) { const gx = ((x + 1000) % 13), gz = ((z - 38) % 10 + 10) % 10; const d = Math.min(gx, 13 - gx, gz, 10 - gz); h = (d < 0.3 ? 0.1 : d < 0.7 ? HT.lerp(0.1, -0.25, (d - 0.3) / 0.4) : -0.25) - (z - 38) * 0.02; }
        const dl = Math.hypot(x - LX, z - LZ); if (dl < 7) h = HT.lerp(H0(LX, LZ), h, HT.smooth(4.5, 7, dl));
        h += HT.fbm(x * 0.004, z * 0.004, 4) * 70 * HT.smooth(200, 700, Math.hypot(x, z + 100));
        return h;
      };
      function H0(x, z) { return 0.4 + Math.max(0, -z - 12) * 0.32 * (0.8 + 0.2 * HT.noise(x * 0.03, z * 0.03, 1)); }
      const path = (x, z) => Math.abs(z - 8 - Math.sin(x * 0.05) * 3) < 1.3 || (Math.abs(x - LX + (z - LZ) * 0.3) < 1.0 && z > LZ && z < 8);
      const W = (x, z) => [path(x, z) ? 1 : 0, inR(x, z, PAD) ? 1 : 0, z < -14 ? 0.3 + 0.25 * HT.noise(x * 0.05, z * 0.05, 9) : 0];
      N.terrain(ctx, { size: 2200, inner: 120, step: 0.55, height: H, weights: W, layers: [
        { slug: 'leafy_grass', tile: 2.6, tint: 0xb4cc8c, rough: 0.95 },
        { slug: 'stony_dirt_path', tile: 2.0, tint: 0xd8c8b0, rough: 0.9 },
        { slug: 'farm_soil', tile: 2.4, tint: 0xd0c0a8, rough: 0.85 },
        { slug: 'forest_leaves_02', tile: 3 },
      ] });
      ctx.bounds = [[-44, 37], [44, 37], [44, -62], [10, -62], [-44, -20]];
      /* ruộng lúa */
      const plots = [];
      for (let gx = -52; gx < 88; gx += 13) for (let gz = 38; gz < 150; gz += 10) {
        const rect = [gx + 0.6, gz + 0.6, gx + 12.4, gz + 9.4];
        const y = -0.25 - (gz + 5 - 38) * 0.02;
        N.paddy(ctx, { rect, y, stage: 'green', seed: gx * 5 + gz, lod: 'water' });
        plots.push({ rect, stage: (gx + gz) % 4 ? 'green' : 'ripe', y });
      }
      N.riceCards(ctx, plots, { seed: 17 });
      N.grass(ctx, { rect: [-44, -62, 44, 37], density: 7, kind: 'grass', mask: (x, z) => (path(x, z) ? 0 : 0.75), seed: 4, far: 44 });

      /* ---------------- CÂY ĐA TÂN TRÀO ---------------- */
      N.trees(ctx, 'banyan', [{ x: 2, z: 12.5, s: 1.05, ry: 0.4 }], { seed: 21 });
      B.box(HT.mat('mossy_rock', { tile: 1.2, color: 0xe0e0d8 }), 3.2, 0.25, 0.8, 4.5, H(4.5, 16.5), 16.5, 0.2);

      /* ---------------- ĐÌNH TÂN TRÀO ---------------- */
      const post = HT.mat('rough_wood', { tile: 1.0, color: 0xd8c8b0 });
      const plank = HT.mat('weathered_brown_planks', { tile: 1.3, color: 0xf6e6d0, env: 0.6 });
      const coLeaf = HT.mat('reed_roof_03', { tile: 1.4, color: 0xa89c78 });
      const dinh = A.stiltHouse(ctx, B, { x: -18, z: -6, ry: 0.1, w: 12, d: 6.5, floorY: 0.8, eave: 2.3, ridge: 5.6, veranda: 1.8, wall: 'plank', wallMat: plank, postMat: post, posts: 2.4, postR: 0.14, roof: 'palm', roofMat: coLeaf, overhang: 1.2, stairSide: 'front', stairW: 2.0, seed: 41,
        frontOpen: [{ u: 2.4, w: 2.0, y: 0, h: 2.0 }, { u: 6.0, w: 2.2, y: 0, h: 2.0 }, { u: 9.6, w: 2.0, y: 0, h: 2.0 }], leftOpen: [{ u: 3.2, w: 1.0, y: 0.7, h: 0.9 }], rightOpen: [{ u: 3.2, w: 1.0, y: 0.7, h: 0.9 }] });
      { /* trong đình: bàn dài, ghế băng, cờ, khẩu hiệu */
        const go = P.M.go();
        const [tx, tz] = dinh.f(0, -1.4); const top = P.table(B, tx, dinh.fy, tz, 0.1, { w: 2.0, d: 0.9, h: 0.78, mat: go }); ctx.colBox(tx, tz, 2.0, 0.9, 0.1, dinh.fy, dinh.fy + 1);   /* 2,0 m: vừa lọt giữa hai cột đình */
        for (const dz of [0.2, 1.4]) { const [bx, bz] = dinh.f(0, dz); P.bench(B, bx, dinh.fy, bz, 0.1, { w: 5, mat: go }); ctx.colBox(bx, bz, 5, 0.4, 0.1, dinh.fy, dinh.fy + 0.6); }
        { const [ox, oz] = dinh.f(0.75, -1.4); HT.model(ctx, 'vintage_oil_lamp', { x: ox, z: oz, y: top, h: 0.34, env: 0.6 }); }
        { const [ax, az] = dinh.f(-0.9, -1.45); HT.model(ctx, 'tea_set_01', { x: ax, z: az, y: top, w: 0.42, ry: 0.1, env: 0.6 }); }
        { const [ax, az] = dinh.f(-4.8, -2.3); HT.model(ctx, 'wicker_basket_01', { x: ax, z: az, y: dinh.fy, h: 0.38, ry: 0.4, env: 0.6 }); }
        { const [ax, az] = dinh.f(4.9, -2.4); HT.model(ctx, 'wooden_bucket_02', { x: ax, z: az, y: dinh.fy, h: 0.42, env: 0.6 }); }
        const [fx, fz] = dinh.f(0, -3.15); const fl = new T.Mesh(new T.PlaneGeometry(1.8, 1.2), new T.MeshStandardMaterial({ map: P.flagTex('vn'), roughness: 0.85, side: T.DoubleSide })); fl.position.set(fx, dinh.fy + 1.6, fz); fl.rotation.y = 0.1; ctx.add(fl);
        const l = new T.PointLight(0xffd8a8, 8, 9, 1.4); const [lx, lz] = dinh.f(0, -0.6); l.position.set(lx, dinh.fy + 2.1, lz); ctx.add(l); }
      P.flag(ctx, -18 + 8.2, H(-9.8, 0.5), 0.5, { kind: 'vn', pole: 9, w: 2.2, amp: 0.14, poleMat: HT.mat('bamboo_veneer', { tile: 0.6 }) });

      /* ---------------- LÁN NÀ NƯA (sườn đồi) ---------------- */
      const gy = H0(LX, LZ);
      const lan = A.stiltHouse(ctx, B, { x: LX, z: LZ, ry: 0.35, yb: gy, w: 5.6, d: 3.4, floorY: 0.9, eave: 1.9, ridge: 3.5, veranda: 1.0, wall: 'bamboo', floorKind: 'slat', postMat: HT.mat('bamboo_veneer', { tile: 0.8, color: 0xc0b080 }), roof: 'palm', roofMat: coLeaf, overhang: 0.8, stairSide: 'front', seed: 51,
        frontOpen: [{ u: 1.6, w: 0.9, y: 0, h: 1.7 }, { u: 4.2, w: 0.8, y: 0.7, h: 0.6 }] });
      { const [tx, tz] = lan.f(-1.2, -0.5); P.table(B, tx, lan.fy, tz, 0.35, { w: 0.9, d: 0.55, h: 0.62, mat: P.M.tre() }); HT.model(ctx, 'vintage_oil_lamp', { x: tx, z: tz, y: lan.fy + 0.62, h: 0.3, env: 0.6 });
        const [bx, bz] = lan.f(1.6, -0.75); B.box(P.M.tre(), 1.8, 0.35, 0.9, bx, lan.fy, bz, 0.35); ctx.colBox(bx, bz, 1.8, 0.9, 0.35, lan.fy, lan.fy + 0.5);   /* giường tre sát vách sau, tránh cột giữa lán */
        { const [nx, nz] = lan.f(-1.45, -0.55); HT.model(ctx, 'binder_notebook', { x: nx, z: nz, y: lan.fy + 0.62, w: 0.26, ry: 0.35, tint: 0xe0d8c0, env: 0.5 }); }
        { const [kx, kz] = lan.f(2.2, 1.05); HT.model(ctx, 'wicker_basket_02', { x: kx, z: kz, y: lan.fy, h: 0.3, ry: 0.8, env: 0.6 }); }
        { const [kx, kz] = lan.f(-2.3, 1.15); HT.model(ctx, 'wooden_bucket_01', { x: kx, z: kz, y: lan.fy, h: 0.36, env: 0.6 }); } }
      /* bậc đất lên đồi */
      for (let k = 0; k < 18; k++) { const t = k / 18, z = HT.lerp(LZ + 5, 6, t); B.box(HT.mat('rough_wood', { tile: 0.6 }), 1.4, 0.08, 0.12, LX - (z - LZ) * 0.3, H(LX - (z - LZ) * 0.3, z) - 0.02, z, 0.3); }

      /* ---------------- xóm nhà sàn Tày ---------------- */
      const houses = [[-36, 22, 0.2], [30, 20, -0.3], [40, -4, -1.2], [-34, -16, 0.4], [16, -12, 0.1]];
      houses.forEach(([x, z, ry], i) => A.stiltHouse(ctx, B, { x, z, ry, w: 8, d: 5.4, floorY: 1.8, eave: 2.1, ridge: 4.6, veranda: 1.6, wall: i % 2 ? 'plank' : 'bamboo', wallMat: i % 2 ? plank : null, postMat: post, roof: 'palm', roofMat: coLeaf, overhang: 0.9, stairSide: i % 2 ? 'left' : 'front', seed: 60 + i,
        frontOpen: [{ u: 2.2, w: 0.9, y: 0, h: 1.8 }], rightOpen: [{ u: 2.7, w: 0.8, y: 0.8, h: 0.7 }] }));

      /* ---------------- cây: cọ, nứa, chuối, rừng ---------------- */
      const coP = N.scatter(71, [-44, -62, 44, 10], 90, 4.5, (x, z) => !path(x, z) && Math.hypot(x - LX, z - LZ) > 7 && Math.hypot(x + 18, z + 6) > 10 && Math.hypot(x - 2, z - 12) > 9 && !houses.some(([hx, hz]) => Math.hypot(x - hx, z - hz) < 7));
      N.palms(ctx, 'co', coP.filter((_, i) => i % 2 === 0), { seed: 9 });
      N.trees(ctx, 'forest', coP.filter((_, i) => i % 4 === 1).map((p) => ({ x: p.x, z: p.z, s: 0.6 })), { seed: 10 });
      N.bamboo(ctx, coP.filter((_, i) => i % 4 === 3).slice(0, 12), { n: 24, h: 11, r: 1.1, seed: 11 });
      N.banana(ctx, [{ x: -30, z: 26 }, { x: 34, z: 25 }, { x: -12, z: 4 }, { x: 22, z: -18 }], { seed: 12 });
      const outer = N.scatter(72, [-400, -500, 400, 300], 560, 9, (x, z) => Math.abs(x) > 50 || z < -70 || z > 160);
      N.palms(ctx, 'co', outer.filter((_, i) => i % 2 === 0).map((p) => ({ x: p.x, z: p.z })), { seed: 13, collide: false });
      N.trees(ctx, 'forest', outer.filter((_, i) => i % 2 === 1).map((p) => ({ x: p.x, z: p.z, s: 0.7 })), { seed: 14, collide: false });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [15, 26, -0.55, 'lectern'],
        stories: [[-6, 24, Math.PI + 0.2], [10, 3, Math.PI - 0.2]],
        moc: [-2, 26, Math.PI - 0.3],
        photos: [[LX - 4.5, LZ + 6, 0.3, 1.3], [-10, 6, Math.PI - 0.2, 1.3], [8, 18, -0.6, 1.3], [22, 8, Math.PI - 0.4, 1.3]],
      });
      E.label(ctx, { key: 'cayda', x: 5.8, z: 16, ry: 0.4, vi: 'Cây đa Tân Trào', en: 'The Tan Trao banyan',
        text: 'Chiều 16/8/1945, dưới gốc đa này, đơn vị Giải phóng quân do Võ Nguyên Giáp chỉ huy làm lễ xuất quân, tiến về giải phóng thị xã Thái Nguyên, mở đầu Tổng khởi nghĩa.',
        textEn: 'On 16 August 1945 the Liberation Army unit led by Vo Nguyen Giap paraded here before marching on Thai Nguyen.' });
      E.label(ctx, { key: 'dinh', x: -14, z: 1.2, ry: 0.3, vi: 'Đình Tân Trào', en: 'Tan Trao communal house',
        text: 'Ngày 16 – 17/8/1945, Quốc dân Đại hội họp tại đình, tán thành chủ trương Tổng khởi nghĩa, thông qua Mười chính sách lớn của Việt Minh, cử ra Ủy ban Dân tộc giải phóng Việt Nam do Hồ Chí Minh làm Chủ tịch; quyết định Quốc kỳ nền đỏ sao vàng và Quốc ca Tiến quân ca.',
        textEn: 'The National Congress met here on 16 – 17 August 1945, endorsed the general uprising, chose the red flag with a yellow star and the anthem Tien quan ca, and elected a National Liberation Committee chaired by Ho Chi Minh.' });
      E.label(ctx, { key: 'nanua', x: LX - 3, z: LZ + 5.5, ry: 0.5, vi: 'Lán Nà Nưa', en: 'Na Nua hut',
        text: 'Từ tháng 5/1945, Người ở và làm việc trong chiếc lán nứa hai gian trên sườn đồi Nà Nưa. Tại đây, dù đang ốm nặng, Người vẫn chỉ đạo chuẩn bị Tổng khởi nghĩa, nói: dù có phải đốt cháy cả dãy Trường Sơn cũng phải kiên quyết giành cho được độc lập.',
        textEn: 'From May 1945 he lived in this bamboo hut on Na Nua hill, directing preparations for the uprising even while gravely ill.' });
      E.stdGates(ctx, { hub: [-40, 32, Math.PI / 2], prev: [-40, 27.5, Math.PI / 2], next: [40, 32, Math.PI / 2] });
    },
  };
})();
