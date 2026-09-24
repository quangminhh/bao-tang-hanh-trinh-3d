/* GIAN 10 — THÁI LAN: BẢN MẠY (NA CHOK), NAKHON PHANOM (1928 – 1929).
   Dựng lại: xóm Việt kiều ven sông Mê Kông vùng Đông Bắc Thái Lan — ngôi nhà gỗ nhỏ sàn thấp, vách ván, mái lá, hiên có bậc
   (theo nhà lưu niệm được phục dựng ở bản Mạy), giường tre, bàn viết, đèn dầu; vườn rau, giếng đào, rặng dừa, xoài, chuối,
   tre, hàng rào tre; nhà sàn gỗ kiểu Isan của bà con trong xóm; ruộng lúa; bờ sông Mê Kông và dãy núi đá vôi Khăm Muộn
   (Lào) ở bờ bên kia.
   Trục: sông Mê Kông ở phía −z (bắc), bờ Lào xa hơn nữa. */
(function () {
  const HT = window.HT;
  HT.halls.G10 = {
    sky: { hdri: 'qwantani_afternoon_puresky', sunAz: 250, exposure: 0.95, fog: 0.00055, sat: 1.07, con: 1.05, bloom: 0.13 },
    spawn: { x: 6, z: 22, yaw: -0.25, pitch: 0.0 },
    map: [-50, -60, 50, 44],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      const BANK = -62, RW = 900;
      const inR = (x, z, R) => x >= R[0] && x <= R[2] && z >= R[1] && z <= R[3];
      const PAD = [-126, 44, 126, 132];
      const H = (x, z) => {
        let h = 0.3 + HT.noise(x * 0.05, z * 0.05, 3) * 0.12;
        if (z < BANK + 8) h = HT.lerp(-3.2, h, HT.smooth(BANK - 4, BANK + 8, z));
        if (z < BANK - RW + 20) h = HT.lerp(0.5, -3.2, HT.smooth(BANK - RW, BANK - RW + 20, z));
        if (inR(x, z, PAD)) { const gx = ((x + 1000) % 14), gz = ((z - 44) % 11 + 11) % 11; const d = Math.min(gx, 14 - gx, gz, 11 - gz); h = d < 0.3 ? 0.05 : d < 0.7 ? HT.lerp(0.05, -0.3, (d - 0.3) / 0.4) : -0.3; }
        h += HT.fbm(x * 0.004, z * 0.004, 3) * 22 * HT.smooth(300, 800, Math.hypot(x, z + 200));
        return h;
      };
      const W = (x, z) => {
        const yard = inR(x, z, [-16, -14, 18, 16]) ? 0.85 : 0;
        const path = Math.abs(x - 6 - (z - 10) * 0.1) < 1.1 && z > 8 && z < 44 ? 1 : 0;
        const bank = z < BANK + 9 && z > BANK - 4 ? 1 : 0;
        const soil = inR(x, z, PAD) || inR(x, z, [22, -10, 36, 6]) ? 1 : 0;
        return [Math.max(yard * (0.6 + 0.4 * HT.noise(x * 0.3, z * 0.3, 1)), path), bank, soil];
      };
      N.terrain(ctx, { size: 3400, inner: 100, step: 0.55, height: H, weights: W, layers: [
        { slug: 'leafy_grass', tile: 2.6, tint: 0xb8cc90, rough: 0.95 },
        { slug: 'dirt_floor', tile: 2.2, tint: 0xe0c8a8, rough: 0.9 },
        { slug: 'brown_mud_rocks_01', tile: 2.2, rough: 0.85 },
        { slug: 'farm_soil', tile: 2.4, tint: 0xd8c8b0, rough: 0.85 },
      ] });
      ctx.bounds = [[-46, BANK + 5], [46, BANK + 5], [46, 42], [-46, 42]];
      N.waterMirror(ctx, { poly: N.rectPoly(-2000, BANK - RW + 4, 2000, BANK + 2), y: -1.2, color: 0x4a4a30, distortion: 0.6, size: 1.0, speed: 0.5 });
      N.grass(ctx, { rect: [-46, BANK + 4, 46, 42], density: 7, kind: 'grass', mask: (x, z) => { const w = W(x, z); return w[0] > 0.4 || w[2] > 0.5 ? 0 : 0.8; }, seed: 4, far: 42 });
      N.grass(ctx, { rect: [-60, BANK - 2, 60, BANK + 9], density: 8, kind: 'tall', mask: () => 0.7, seed: 7, far: 40 });
      /* ruộng lúa phía nam */
      const plots = [];
      for (let gx = -126; gx < 126; gx += 14) for (let gz = 44; gz < 132; gz += 11) {
        const rect = [gx + 0.6, gz + 0.6, gx + 13.4, gz + 10.4];
        N.paddy(ctx, { rect, y: -0.28, stage: 'green', seed: gx * 3 + gz, lod: 'water' });
        plots.push({ rect, stage: (gx + gz) % 3 ? 'green' : 'young', y: -0.28 });
      }
      N.riceCards(ctx, plots, { seed: 11 });

      /* ---------------- NHÀ THẦU CHÍN (dựng theo nhà lưu niệm bản Mạy) ---------------- */
      const plank = HT.mat('weathered_brown_planks', { tile: 1.4, color: 0xfff0e0, env: 0.6 });
      const post = HT.mat('rough_wood', { tile: 1.0, color: 0xe0d0c0 });
      const leaf = HT.mat('reed_roof_03', { tile: 1.6, color: 0xb8a882 });
      const h = A.stiltHouse(ctx, B, { x: 0, z: 0, ry: 0, w: 6.2, d: 4.2, floorY: 0.9, eave: 2.1, ridge: 3.9, veranda: 1.6, wall: 'plank', wallMat: plank, postMat: post, roof: 'palm', roofMat: leaf, overhang: 0.9, stairSide: 'front', stairW: 1.1, seed: 11,
        frontOpen: [{ u: 3.1, w: 1.0, y: 0, h: 1.9 }, { u: 1.2, w: 0.9, y: 0.8, h: 0.8 }, { u: 5.0, w: 0.9, y: 0.8, h: 0.8 }], leftOpen: [{ u: 2.1, w: 0.9, y: 0.8, h: 0.8 }], rightOpen: [{ u: 2.1, w: 0.9, y: 0.8, h: 0.8 }] });
      const fy = h.fy;
      /* cánh cửa sổ chống, giường tre, bàn viết, đèn dầu, rương */
      const go = P.M.go();
      for (const lx of [-1.9, 2.0]) { const [wx, wz] = h.f(lx, 2.1); B.add(plank, HT.geoBox(0.9, 0.8, 0.03), { x: wx, y: fy + 1.6 + 0.3, z: wz + 0.3, rx: -1.0 }); }
      { const [bx, bz] = h.f(-1.6, -0.9); P.phan(B, bx, fy, bz, 0, { w: 2.0, d: 1.2, chieu: true }); ctx.colBox(bx, bz, 2.0, 1.2, 0, fy, fy + 0.5);
        const [tx, tz] = h.f(1.8, -1.3); const top = P.table(B, tx, fy, tz, 0, { w: 1.1, d: 0.6, h: 0.72, mat: go }); P.stool(B, tx, fy, tz + 0.55, 0, { mat: go });
        HT.model(ctx, 'vintage_oil_lamp', { x: tx + 0.35, z: tz - 0.1, y: top, h: 0.34, env: 0.6 });
        HT.model(ctx, 'binder_notebook', { x: tx - 0.2, z: tz, y: top, h: 0.03, env: 0.6 });
        const [cx2, cz2] = h.f(2.3, 0.6); HT.model(ctx, 'treasure_chest', { x: cx2, z: cz2, y: fy, h: 0.45, ry: -Math.PI / 2, env: 0.6 }); }
      { const l = new T.PointLight(0xffd8a0, 7, 6, 1.5); const [lx, lz] = h.f(0, -0.5); l.position.set(lx, fy + 2.0, lz); ctx.add(l); }
      /* chum nước, cối, nông cụ dưới gầm sàn */
      P.jar(B, 3.8, 0.3, 1.8, { r: 0.35, h: 0.7 });
      HT.model(ctx, 'wooden_bucket_02', { x: 3.6, z: 2.6, y: 0.3, h: 0.3, env: 0.6 });
      HT.model(ctx, 'rusted_spade_01', { x: -2.4, z: -1.9, y: 0.3, h: 1.0, ry: 0.4, env: 0.6 });

      /* ---------------- giếng, vườn rau, hàng rào tre ---------------- */
      P.well(B, ctx, 9, H(9, 6), 6, { r: 0.75, h: 0.7 });
      const bedM = HT.mat('farm_soil', { tile: 1.5, color: 0xc8b8a0 });
      for (let k = 0; k < 6; k++) { B.box(bedM, 1.1, 0.18, 9, 24 + k * 1.8, 0.25, -2, 0); }
      N.grass(ctx, { rect: [23.4, -6.5, 34.6, 2.5], density: 18, kind: 'lawn', mask: (x) => (((x - 23.4) % 1.8) < 1.1 ? 0.9 : 0), seed: 12, far: 30 });
      const tre = HT.mat('bamboo_veneer', { tile: 0.6, color: 0x9a8a60 });
      A.fence(B, ctx, tre, [[-16, 16], [4.4, 16]], { kind: 'coc', h: 1.1, seed: 2 });
      A.fence(B, ctx, tre, [[7.8, 16], [18, 16], [18, -14], [-16, -14], [-16, 16]], { kind: 'coc', h: 1.1, seed: 3 });
      A.fence(B, ctx, tre, [[22, -10], [36, -10], [36, 6], [22, 6], [22, -10]], { kind: 'tre', h: 0.9, seed: 4 });

      /* ---------------- xóm: nhà sàn gỗ Isan, nhà lá ---------------- */
      const iroof = HT.mat('reed_roof_04', { tile: 1.6, color: 0xb09c76 });
      const houses = [[-30, -8, 0.3], [-28, 22, -0.2], [30, 24, 0.4], [-38, -36, 0.1], [26, -34, -0.3], [40, -12, 1.4], [-8, -40, 0.2]];
      houses.forEach(([x, z, ry], i) => A.stiltHouse(ctx, B, { x, z, ry, w: 7 + (i % 3), d: 5, floorY: 1.8 + (i % 2) * 0.4, eave: 2.1, ridge: 4.4, veranda: 1.8, wall: i % 2 ? 'plank' : 'bamboo', wallMat: i % 2 ? plank : null, postMat: post, roof: 'palm', roofMat: iroof, overhang: 0.9, stairSide: i % 2 ? 'left' : 'front', seed: 20 + i,
        frontOpen: [{ u: 2.0, w: 0.9, y: 0, h: 1.8 }], rightOpen: [{ u: 2.5, w: 0.8, y: 0.8, h: 0.7 }] }));

      /* ---------------- cây: dừa, xoài, me, chuối, tre ---------------- */
      N.palms(ctx, 'coconut', [{ x: -6, z: 8 }, { x: -10, z: -4 }, { x: 12, z: -8 }, { x: 14, z: 12 }, { x: -12, z: 12 }, { x: 4, z: -11 }, { x: -18, z: 30 }, { x: 20, z: 34 }, { x: -24, z: -20 }, { x: 34, z: 14 }, { x: -40, z: 8 }, { x: 42, z: -26 }], { seed: 5 });
      N.trees(ctx, 'mango', [{ x: -12, z: -10, s: 1.0 }, { x: 16, z: 2, s: 0.85 }, { x: -34, z: 10, s: 1.1 }, { x: 36, z: -2, s: 0.9 }, { x: 6, z: -30, s: 1.05 }], { seed: 7 });
      N.banana(ctx, [{ x: -4, z: -9 }, { x: -7, z: -12 }, { x: 10, z: 13 }, { x: 16, z: -12 }], { seed: 4 });
      N.bamboo(ctx, [{ x: -44, z: -20 }, { x: 44, z: 36 }, { x: -44, z: 36 }, { x: 20, z: -48 }], { n: 26, h: 11, r: 1.2, seed: 5 });
      const bankT = N.along(9, [[-400, BANK + 7], [400, BANK + 7]], 9, 2.5);
      N.trees(ctx, 'forest', bankT.filter((_, i) => i % 3 === 0).map((p) => ({ x: p.x, z: p.z, s: 0.6 })), { seed: 13, collide: false });
      N.palms(ctx, 'coconut', bankT.filter((_, i) => i % 3 === 1), { seed: 14, collide: false });
      /* bờ Lào: rặng cây và núi đá vôi Khăm Muộn */
      const far = BANK - RW;
      N.trees(ctx, 'forest', N.along(15, [[-1500, far - 12], [1500, far - 12]], 18, 8).map((p) => ({ x: p.x, z: p.z, s: 0.7 })), { seed: 15, collide: false });
      const ks = []; for (let i = 0; i < 16; i++) ks.push({ x: -1400 + i * 190 + r.range(-60, 60), z: far - 200 - r.range(0, 420), r: r.range(90, 180), h: r.range(120, 300), seed: i + 3, rings: 20, seg: 36 });
      N.karst(ctx, ks, { slug: 'marble_cliff_03', tile: 16, veg: 1.0, vegBias: 0.55, patch: 0.75, jag: 0.16, ridges: 0.12, streak: 0.35, color: 0x94b0ec, greenHex: 0x3e5c2c, rock: [0.92, 0.92, 0.9] });
      /* thuyền độc mộc trên sông */
      VV.sampan(ctx, B, -10, -1.2, BANK - 10, 0.2, { mui: false, L: 7 });
      VV.sampan(ctx, B, 40, -1.2, BANK - 30, -0.4, { L: 9 });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [9, 19, -0.5, 'lectern'],
        stories: [[-8, 18, Math.PI + 0.3], [18, 8, -Math.PI / 2 - 0.3]],
        moc: [-6, 3, -0.3],
        photos: [[12, 20, -0.2, 1.3], [-2, 20.5, 0.2, 1.3], [16, -6, -Math.PI / 2 + 0.3, 1.3]],
      });
      E.label(ctx, { key: 'thauchin', x: 3.6, z: 5.6, ry: 0.2, vi: 'Ngôi nhà của “Thầu Chín”', en: 'The house of “Thau Chin”',
        text: 'Tháng 7/1928, Nguyễn Ái Quốc từ châu Âu sang Thái Lan, lấy tên Thầu Chín (ông già Chín), sống cùng bà con Việt kiều ở Phichit, Udon Thani rồi bản Mạy (Nakhon Phanom). Người cùng bà con làm ruộng, đào giếng, dựng nhà, mở lớp dạy chữ quốc ngữ, ra báo Thân Ái, vận động kiều bào hướng về Tổ quốc.',
        textEn: 'From July 1928 he lived among Vietnamese settlers in Phichit, Udon Thani and Ban Mai (Nakhon Phanom) as “Thau Chin”, farming, digging wells, teaching the national script and publishing the paper Than Ai.' });
      E.label(ctx, { key: 'dibo', x: 6.5, z: 30, ry: Math.PI + 0.1, vi: 'Những chặng đường đi bộ', en: 'Journeys on foot',
        text: 'Người đi bộ hàng trăm cây số qua các tỉnh Đông Bắc Thái Lan, nhiều đêm ngủ trong rừng, giữ nếp sống giản dị, tự làm mọi việc như người lao động.',
        textEn: 'He walked hundreds of kilometres across north-eastern Thailand, often sleeping in the forest.' });
      E.label(ctx, { key: 'mekong', x: -4, z: BANK + 8, ry: Math.PI, vi: 'Sông Mê Kông', en: 'The Mekong',
        text: 'Từ bờ Nakhon Phanom nhìn sang bên kia sông là đất Lào (Thà Khẹt), dãy núi đá vôi Khăm Muộn. Cuối năm 1929 Người rời Thái Lan sang Trung Quốc để chuẩn bị hợp nhất các tổ chức cộng sản.',
        textEn: 'Across the river lies Laos (Thakhek). Late in 1929 he left for China to prepare the unification of the communist groups.' });
      E.stdGates(ctx, { hub: [-44, 30, Math.PI / 2], prev: [-44, 25.5, Math.PI / 2], next: [44, 8, Math.PI / 2] });
    },
  };
})();
