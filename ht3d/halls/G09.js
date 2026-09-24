/* GIAN 09 — TRUNG QUỐC: QUẢNG CHÂU, ĐƯỜNG VĂN MINH (1924 – 1927).
   Dựng lại: phố Văn Minh (文明路) với dãy nhà "kỵ lâu" (骑楼) ba bốn tầng kiểu Lĩnh Nam — tầng trệt lùi vào thành hiên vòm
   che nắng mưa cho người đi bộ, các tầng trên nhô ra sát mép đường, tường vữa màu nhạt, cửa chớp, lan can, đầu hồi có
   bảng hiệu; biển hiệu dọc chữ Hán, đèn lồng giấy đỏ, xe kéo tay, cây đa lớn ở đầu phố. Nhà số 248 – 250 là nơi Nguyễn Ái
   Quốc mở các lớp huấn luyện cán bộ của Hội Việt Nam Cách mạng Thanh niên (1925 – 1927) và in báo Thanh Niên; gian lớp học
   ở tầng trệt được dựng lại: ghế băng, bàn giảng, bảng đen, chồng báo Thanh Niên và sách Đường Kách mệnh.
   Trục: phố chạy theo x (mặt đường z −4 … 4); dãy nhà phía bắc (−z) và nam (+z). */
(function () {
  const HT = window.HT;
  HT.halls.G09 = {
    sky: { hdri: 'qwantani_mid_morning_puresky', sunAz: 100, exposure: 1.02, fog: 0.003, sat: 1.04, con: 1.04, bloom: 0.14, shadowSize: 60, tint: [1.02, 1.0, 0.97] },
    spawn: { x: 30, z: 1.5, yaw: 1.62, pitch: 0.04 },
    map: [-60, -30, 60, 30],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      const H = (x, z) => HT.fbm(x * 0.003, z * 0.003, 3) * 16 * HT.smooth(350, 900, Math.hypot(x, z));
      const W = (x, z) => [Math.abs(z) < 4 ? 1 : 0, 0, Math.abs(z) >= 4 && Math.abs(z) < 7.6 ? 1 : 0];
      N.terrain(ctx, { size: 1600, inner: 90, step: 0.5, height: H, weights: W, layers: [
        { slug: 'concrete_pavement', tile: 2.6, tint: 0xc8c0b0, rough: 0.8 },
        { slug: 'rock_path', tile: 2.4, tint: 0xd8d0c4, rough: 0.8 },
        { slug: 'forest_leaves_02', tile: 3 },
        { slug: 'square_brick_floor', tile: 1.4, tint: 0xd8c0a8, rough: 0.75 },
      ], macro: 0.08 });
      ctx.bounds = [[-54, -7.2], [54, -7.2], [54, 7.2], [-54, 7.2]];
      const curb = HT.mat('granite_tile_04', { tile: 1, color: 0xb0aca4 });
      for (const sz of [-4, 4]) B.box(curb, 112, 0.12, 0.25, 0, -0.02, sz, 0);

      /* ---------------- dãy kỵ lâu ---------------- */
      const pl = (c) => HT.mat('plastered_wall', { tile: 2.4, color: c, env: 0.7 });
      const cols = [0xf2e2c2, 0xeed6a6, 0xe8dcc2, 0xf0d4c0, 0xe6e0cc, 0xf4e6c8, 0xe8cca2, 0xeee2d0];
      const shutters = [HT.solid(0x3a5a44, { rough: 0.55 }), HT.solid(0x5a3a2a, { rough: 0.55 }), HT.solid(0x2e4a5a, { rough: 0.55 })];
      const woodDoor = HT.mat('weathered_brown_planks', { tile: 1.2, color: 0xb89878 });
      const signTex = (key, txt, bg, ink) => HT.canvasTex('hanzi_' + key, 160, 640, (g, Wd, Hd) => {
        g.fillStyle = bg; g.fillRect(0, 0, Wd, Hd); g.strokeStyle = ink; g.lineWidth = 8; g.strokeRect(10, 10, Wd - 20, Hd - 20);
        g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold 108px ${HT.FONT_HAN || 'KaiTi, STKaiti, serif'}`;
        const ch = [...txt]; ch.forEach((c, i) => g.fillText(c, Wd / 2, Hd * (i + 0.5) / ch.length));
      });
      const names = [['茶樓', '#7a1c14', '#f0d890'], ['藥材', '#1c2a1e', '#e8d8a0'], ['書局', '#2a2018', '#f2e6c8'], ['布莊', '#12304a', '#f0e0b0'], ['米舖', '#5a2a14', '#f4e2b8'], ['當', '#1a1a1a', '#e8c860'], ['金鋪', '#7a1c14', '#f2d070'], ['洋貨', '#1c3a2a', '#f0e2b0']];
      const qilou = (x, side, w, nf, i, o) => {
        o = o || {};
        const d = 14, z = side * (4 + d / 2);
        const b = A.colonial(ctx, B, { x, z, ry: side > 0 ? Math.PI : 0, w, d, floors: [4.6, 3.6, 3.5, 3.4].slice(0, nf), bays: w > 7 ? 3 : 2, veranda: 3.6, plinth: 0.14, wall: pl(o.color || cols[i % cols.length]), trim: pl(0xf6f0e2),
          window: { w: 1.05, h: 2.1, kind: 'casement', rows: 3, shutter: shutters[i % 3], frame: HT.solid(0xece6d8, { rough: 0.55 }) }, doorKind: 'plank', doorMat: woodDoor, doorBays: o.doorBays, pier: 0.62,
          floorMat: HT.mat('terracotta_floor_tiles', { tile: 1, color: 0xe0b8a0, env: 0.5 }), roof: 'flat', steps: [], backWin: false, sideWin: 0 });
        /* đầu hồi trang trí + bảng tên trên mái bằng */
        const [px, pz] = b.f(0, d / 2 - 0.15);
        const ped = HT.extrude([[-w / 2 + 0.4, 0], [w / 2 - 0.4, 0], [w / 2 - 0.4, 1.0], [w * 0.22, 1.0], [w * 0.12, 1.9], [-w * 0.12, 1.9], [-w * 0.22, 1.0], [-w / 2 + 0.4, 1.0]], 0.3);
        ped.translate(0, 0, -0.15);
        B.add(pl(0xf6f0e2), ped, { x: px, y: b.top + 0.5, z: pz, ry: side > 0 ? Math.PI : 0, uv: 'box' });
        /* biển hiệu dọc treo ở cột hiên */
        const [n0, bg, ink] = names[i % names.length];
        const [sx, sz] = b.f(-w / 2 + 0.9, d / 2 + 0.06);
        const sm = new T.Mesh(new T.PlaneGeometry(0.55, 2.2), new T.MeshStandardMaterial({ map: signTex(n0 + i, n0, bg, ink), roughness: 0.4 }));
        sm.position.set(sx, 2.0 + 1.1, sz); sm.rotation.y = side > 0 ? Math.PI : 0; ctx.add(sm);
        /* đèn lồng giấy đỏ dưới hiên */
        for (let k = 0; k < 2; k++) { const [lx, lz] = b.f(-w / 4 + k * w / 2, d / 2 - 1.6); lantern(lx, 3.6, lz); }
        return b;
      };
      const lanternM = new T.MeshStandardMaterial({ color: 0xc01c14, roughness: 0.7, emissive: 0xff3a18, emissiveIntensity: 0.35, side: T.DoubleSide });
      const lantern = (x, y, z) => {
        const g = new T.SphereGeometry(0.26, 16, 12); g.scale(1, 1.2, 1); B.add(lanternM, g, { x, y, z, uv: 'keep' });
        B.cyl(HT.solid(0x1a1a1a, { rough: 0.5 }), 0.12, 0.12, 0.05, x, y + 0.28, z, 10); B.cyl(HT.solid(0x1a1a1a, { rough: 0.5 }), 0.12, 0.12, 0.05, x, y - 0.33, z, 10);
        B.beam(HT.solid(0x1a1a1a), x, y + 0.33, z, x, y + 0.9, z, 0.012, 0.012);
        B.add(HT.solid(0xd8a830, { rough: 0.6 }), new T.CylinderGeometry(0.02, 0.05, 0.25, 6), { x, y: y - 0.5, z });
      };
      /* phía bắc (−z): số 248 – 250 ở giữa */
      const north = [[-46, 9, 3], [-37, 9, 4], [-28, 9, 3], [-19, 9, 3], [-9.5, 10, 3], [0, 9, 3], [9, 9, 4], [18, 9, 3], [27, 9, 3], [36, 9, 4], [45, 9, 3]];
      let no248 = null;
      north.forEach(([x, w, nf], i) => { if (x === -9.5) return; qilou(x, -1, w, nf, i); });
      /* số 248 – 250: nhà ba tầng, tầng trệt mở cửa vào gian lớp học (dựng lại) */
      { const x = -9.5, w = 10, side = -1, d = 14;
        no248 = A.colonial(ctx, B, { x, z: side * (4 + d / 2), ry: 0, w, d, floors: [4.6, 3.6, 3.5], bays: 3, veranda: 3.6, plinth: 0.14, wall: pl(0xe8dcc4), trim: pl(0xf6f0e2),
          window: { w: 1.05, h: 2.1, kind: 'casement', rows: 3, shutter: shutters[0], frame: HT.solid(0xece6d8, { rough: 0.55 }) }, doorKind: 'plank', doorMat: woodDoor, doorBays: [1], pier: 0.62,
          floorMat: HT.mat('terracotta_floor_tiles', { tile: 1, color: 0xe0b8a0, env: 0.5 }), roof: 'flat', steps: [], backWin: false, sideWin: 0, openBay: 1, noDark0: true });
        const [px, pz] = no248.f(0, d / 2 - 0.15);
        const ped = HT.extrude([[-w / 2 + 0.4, 0], [w / 2 - 0.4, 0], [w / 2 - 0.4, 1.0], [w * 0.22, 1.0], [w * 0.12, 1.9], [-w * 0.12, 1.9], [-w * 0.22, 1.0], [-w / 2 + 0.4, 1.0]], 0.3); ped.translate(0, 0, -0.15);
        B.add(pl(0xf6f0e2), ped, { x: px, y: no248.top + 0.5, z: pz, uv: 'box' });
        for (let k = 0; k < 2; k++) { const [lx, lz] = no248.f(-w / 4 + k * w / 2, d / 2 - 1.6); lantern(lx, 3.6, lz); }
      }
      north.forEach(() => {});
      /* phía nam (+z) */
      const south = [[-45, 10, 3], [-35, 10, 3], [-25.5, 9, 4], [-16.5, 9, 3], [-7.5, 9, 3], [1.5, 9, 3], [10.5, 9, 4], [19.5, 9, 3], [28.5, 9, 3], [38, 10, 3], [47, 8, 3]];
      south.forEach(([x, w, nf], i) => qilou(x, 1, w, nf, i + 3));

      /* ---------------- gian lớp học trong số 248 (dựng lại, tầng trệt) ---------------- */
      /* mở một ô cửa lớn ở giữa mặt lõi, bên trong là phòng học có ánh đèn */
      const CZ = -4 - 3.6;                 // mặt lõi nhà (z) sau hiên
      const RX0 = -14.05, RX1 = -4.95, RZ0 = CZ - 0.4, RZ1 = -17.55;
      const roomWall = pl(0xe4d8c0);
      

      B.box(pl(0xf0e8d8), RX1 - RX0, 0.15, RZ0 - RZ1, (RX0 + RX1) / 2, 4.44, (RZ0 + RZ1) / 2, 0);
      B.box(HT.mat('old_wood_floor', { tile: 1.2, color: 0xd8c0a0, env: 0.6 }), RX1 - RX0, 0.06, RZ0 - RZ1, (RX0 + RX1) / 2, 0.14, (RZ0 + RZ1) / 2, 0);
      ctx.floorRect((RX0 + RX1) / 2, (RZ0 + RZ1) / 2, RX1 - RX0, RZ0 - RZ1, 0.2, 0);
      const go = P.M.go();
      for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) { const bx = (RX0 + RX1) / 2 + sx * 1.9, bz = RZ0 - 2.6 - i * 1.35; P.bench(B, bx, 0.2, bz, 0, { w: 2.4, mat: go }); P.table(B, bx, 0.2, bz - 0.5, 0, { w: 2.4, d: 0.45, h: 0.74, mat: go }); ctx.colBox(bx, bz - 0.25, 2.4, 1.0, 0, 0, 1); }
      { const top = P.table(B, (RX0 + RX1) / 2, 0.2, RZ1 + 1.4, 0, { w: 1.6, d: 0.8, h: 0.8, mat: go });
        P.blackboard(B, (RX0 + RX1) / 2, 1.0, RZ1 + 0.06, 0, 'quangchau', [['Đường Kách mệnh', 76], ['— Cách mệnh là gì?', 54], ['— Tư cách một người cách mệnh', 54]], { w: 3.0, h: 1.4 });
        const bao = HT.canvasTex('bao_thanh_nien', 512, 700, (g, Wd, Hd) => {
          g.fillStyle = '#ece2c8'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#1a1a1a'; g.textAlign = 'center'; g.font = `bold 96px ${HT.FONT_SERIF}`; g.fillText('THANH NIÊN', Wd / 2, 110);
          g.font = `26px ${HT.FONT_SERIF}`; g.fillText('Quảng Châu · 1925', Wd / 2, 150); g.fillRect(24, 170, Wd - 48, 3);
          const rr = HT.rng(6); for (let c = 0; c < 2; c++) for (let y = 196; y < Hd - 24; y += 14) { g.fillStyle = 'rgba(20,20,20,0.5)'; g.fillRect(30 + c * 236, y, 214 * rr.range(0.6, 1), 5); }
        });
        const baoM = new T.MeshStandardMaterial({ map: bao, roughness: 0.85 });
        for (let k = 0; k < 7; k++) B.add(baoM, HT.geoBox(0.3, 0.012, 0.42), { x: (RX0 + RX1) / 2 - 0.4, y: top + k * 0.012, z: RZ1 + 1.4, ry: r.range(-0.15, 0.15) });
        const sach = HT.canvasTex('duong_kach_menh', 360, 520, (g, Wd, Hd) => { g.fillStyle = '#b8a888'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#2a1a10'; g.textAlign = 'center'; g.font = `bold 50px ${HT.FONT_SERIF}`; g.fillText('ĐƯỜNG', Wd / 2, 190); g.fillText('KÁCH MỆNH', Wd / 2, 260); g.font = `24px ${HT.FONT_SERIF}`; g.fillText('1927', Wd / 2, 440); });
        B.add(new T.MeshStandardMaterial({ map: sach, roughness: 0.8 }), HT.geoBox(0.18, 0.03, 0.26), { x: (RX0 + RX1) / 2 + 0.4, y: top, z: RZ1 + 1.4, ry: 0.2, uv: 'keep' });
        HT.model(ctx, 'vintage_oil_lamp', { x: (RX0 + RX1) / 2 + 0.65, z: RZ1 + 1.5, y: top, h: 0.36, env: 0.6 }); }
      for (const lz of [RZ0 - 3, RZ0 - 6.5]) { const l = new T.PointLight(0xffdcae, 14, 9, 1.4); l.position.set((RX0 + RX1) / 2, 3.9, lz); ctx.add(l); HT.model(ctx, 'caged_hanging_light', { x: (RX0 + RX1) / 2, z: lz, y: 3.8, h: 0.45, env: 0.8 }); }
      /* biển số nhà 248 */
      E.sign(ctx, B, { key: 'so248', text: '248', x: -9.5 - 3.2, y: 3.4, z: -4.2, w: 0.6, h: 0.32, bg: '#1d3b2f', ink: '#f0e2b0', font: HT.FONT_SERIF });

      /* ---------------- đồ vật phố, cây ---------------- */
      P.rickshaw(B, 12, 0, -2.2, 0.1, {});
      P.rickshaw(B, -30, 0, 2.4, Math.PI + 0.2, { cushion: 0x2a3a5a });
      P.rickshaw(B, 40, 0, 2.2, Math.PI - 0.1, {});
      ctx.colBox(12, -1.2, 2.4, 1.6, 0.1, 0, 2); ctx.colBox(-30, 1.4, 2.4, 1.6, 0.2, 0, 2); ctx.colBox(40, 1.2, 2.4, 1.6, -0.1, 0, 2);
      for (const [x, z] of [[20, -5.2], [-38, 5.4], [3, 5.3]]) HT.model(ctx, 'wicker_basket_02', { x, z, y: 0.14, h: 0.45, env: 0.6 });
      N.trees(ctx, 'banyan', [{ x: 62, z: -2, s: 0.8 }, { x: -63, z: 3, s: 0.85 }], { seed: 8, collide: false });
      N.trees(ctx, 'banyan', N.scatter(31, [-200, -120, 200, 120], 28, 22, (x, z) => Math.abs(z) > 30 || Math.abs(x) > 70).map((p) => ({ x: p.x, z: p.z, s: 0.7 })), { seed: 9, collide: false });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [34, -3.3, -0.3, 'lectern'],
        stories: [[-26, -5.6, 0], [22, 5.6, Math.PI]],
        moc: [-20, 3.4, Math.PI + 0.2],
        quote: [-2.5, -5.4, 0.1],
        photos: [[8, -5.6, 0, 0.9], [-34, 5.6, Math.PI, 1.2], [-44, -5.6, 0, 1.2], [14, 5.6, Math.PI, 1.3], [-17, -5.6, 0, 0.9], [44, 5.6, Math.PI, 1.3]],
      });
      E.label(ctx, { key: 'so248', x: -6.2, z: -3.4, ry: 0.35, vi: 'Nhà số 248 – 250 đường Văn Minh', en: 'Nos. 248 – 250 Wenming Road',
        text: 'Năm 1925, Nguyễn Ái Quốc (lấy tên Lý Thụy) thành lập Hội Việt Nam Cách mạng Thanh niên, mở các lớp huấn luyện cán bộ tại đây; ngày 21/6/1925 báo Thanh Niên ra số đầu. Các bài giảng được in thành sách Đường Kách mệnh năm 1927.',
        textEn: 'In 1925 Nguyen Ai Quoc, as Ly Thuy, founded the Vietnamese Revolutionary Youth League and ran training classes here; the paper Thanh Nien first appeared on 21 June 1925, and the lectures became the book “The Revolutionary Path” (1927).' });
      E.label(ctx, { key: 'kylau', x: 26, z: -3.5, ry: 0.2, vi: 'Nhà kỵ lâu (骑楼)', en: 'Qilou arcade houses',
        text: 'Kiểu nhà phố đặc trưng của Quảng Châu đầu thế kỷ XX: tầng trệt lùi vào tạo thành hiên đi bộ có mái che, các tầng trên nhô ra sát mặt đường.',
        textEn: 'Guangzhou’s arcade shophouses: upper floors project over a covered pavement.' });
      E.label(ctx, { key: 'hoangpho', x: -40, z: 3.4, ry: Math.PI - 0.2, vi: 'Trường Quân sự Hoàng Phố', en: 'Whampoa Military Academy',
        text: 'Nhiều học viên các lớp huấn luyện của Người được gửi vào học Trường Quân sự Hoàng Phố trên đảo Trường Châu. Những năm 1938 – 1940, Người hoạt động ở Côn Minh, Quế Lâm; năm 1942 – 1943 bị giam ở Quảng Tây, viết tập thơ Nhật ký trong tù.',
        textEn: 'Several of his students went on to the Whampoa Military Academy. In 1938 – 1940 he worked in Kunming and Guilin; imprisoned in Guangxi in 1942 – 1943, he wrote the Prison Diary.' });
      E.stdGates(ctx, { hub: [52.5, -2, Math.PI / 2], prev: [52.5, 2.2, Math.PI / 2], next: [-52.5, 0, Math.PI / 2] });
    },
  };
})();
