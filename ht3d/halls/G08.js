/* GIAN 08 — LIÊN XÔ: MÁTXCƠVA, QUẢNG TRƯỜNG ĐỎ (tháng 1/1924).
   Dựng lại: Quảng trường Đỏ giữa mùa đông giá — mặt đá lát phủ tuyết, lối đi giẫm nát; tường Kremli gạch đỏ với răng cưa
   hình đuôi én; tháp Spasskaya (đồng hồ bốn mặt, mái chóp xanh), tháp Thượng viện, tháp Nikolskaya; lăng gỗ tạm đầu tiên
   của Lênin (dựng ngày 27/1/1924: khối lập phương gỗ với mái bậc); nhà thờ Thánh Basil với chín mái vòm củ hành nhiều màu;
   dãy cửa hàng GUM mái phủ tuyết; Bảo tàng Lịch sử gạch đỏ nhiều tháp; bục đá Lobnoye Mesto. Đống lửa sưởi dọc hàng người
   xếp hàng viếng, cờ đỏ viền tang.
   Trục: quảng trường chạy theo z; tường Kremli ở x ≈ −36; GUM ở phía +x. */
(function () {
  const HT = window.HT;
  HT.halls.G08 = {
    sky: { hdri: 'kloofendal_misty_morning_puresky', sunAz: 200, exposure: 0.92, fog: 0.0032, sat: 0.9, con: 1.06, bloom: 0.16, shadowSize: 80, tint: [0.96, 0.99, 1.05] },
    spawn: { x: 18, z: 40, yaw: 0.58, pitch: 0.06 },
    map: [-60, -175, 70, 175],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      const H = (x, z) => 0.0 + HT.fbm(x * 0.003, z * 0.003, 3) * 12 * HT.smooth(450, 900, Math.hypot(x, z));
      const W = (x, z) => {
        const paved = x > -34 && x < 42 && z > -140 && z < 135 ? 1 : 0;
        const lane = (x > -21 && x < -11 && Math.abs(z) < 64) || Math.abs(x - 2) < 5 || Math.abs(x - 26 - z * 0.05) < 3 ? 0.55 : 0;
        const trod = paved * HT.clamp(lane + HT.smooth(0.3, 0.75, HT.noise(x * 0.09, z * 0.04, 2) + 0.1) * 0.6, 0, 1);
        return [paved * 0.25, trod * 0.8, 0];
      };
      N.terrain(ctx, { size: 1800, inner: 180, step: 0.8, height: H, weights: W, layers: [
        { slug: 'snow_02', tile: 3.2, tint: 0xf4f6fa, rough: 0.7 },
        { slug: 'cobblestone_05', tile: 2.2, tint: 0xb8b8b8, rough: 0.55 },
        { slug: 'patterned_cobblestone', tile: 2.8, tint: 0x9a9a9c, rough: 0.5 },
        { slug: 'snow_02', tile: 2, rough: 0.7 },
      ], macro: 0.05 });
      ctx.bounds = [[-31, -126], [36, -126], [36, 122], [-31, 122]];
      const snowM = HT.mat('snow_02', { tile: 1.6, color: 0xf6f8fc, rough: 0.72 });
      const brickK = HT.mat('medieval_red_brick', { tile: 1.6, color: 0xd8a898 });
      const whiteS = HT.ashlar('kremlinW', { color: 0xf2eee6, joint: 0xc0bab0, bw: 0.8, bh: 0.35, speck: 0.05 });
      const greenT = HT.solid(0x2e5a48, { rough: 0.45, metal: 0.2, env: 1.0 });
      const gold = HT.solid(0xd8ae52, { rough: 0.25, metal: 1, env: 1.4 });

      /* ---------------- TƯỜNG KREMLI ---------------- */
      const KX = -38, KT = 4, KH = 12;
      B.box(brickK, KT, KH, 330, KX, 0, 0, 0, { col: true });
      B.box(snowM, KT + 0.1, 0.1, 330, KX, KH, 0, 0);
      const merlon = HT.extrude([[-0.95, 0], [0.95, 0], [0.95, 1.5], [0.42, 2.25], [0, 1.75], [-0.42, 2.25], [-0.95, 1.5]], 0.9);
      merlon.translate(0, 0, -0.45);
      for (let z = -163; z < 163; z += 3.2) { B.add(brickK, merlon, { x: KX + KT / 2 - 0.45, y: KH, z, ry: Math.PI / 2, uv: 'box' }); B.add(snowM, HT.geoBox(0.95, 0.06, 1.8), { x: KX + KT / 2 - 0.45, y: KH + 1.52, z }); }
      /* tháp: vuông gạch + tầng trên + mái chóp xanh + chóp vàng */
      const tower = (tz, o) => {
        const w = o.w, h0 = o.h0;
        B.box(brickK, w, h0, w, KX - 1, 0, tz, 0, { col: true });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(whiteS, 0.5, h0, 0.5, KX - 1 + sx * (w / 2 - 0.1), 0, tz + sz * (w / 2 - 0.1), 0);
        B.box(whiteS, w + 0.8, 0.8, w + 0.8, KX - 1, h0, tz, 0);
        let y = h0 + 0.8;
        if (o.h1) { B.box(brickK, w - 2, o.h1, w - 2, KX - 1, y, tz, 0); B.box(whiteS, w - 1.2, 0.6, w - 1.2, KX - 1, y + o.h1, tz, 0); y += o.h1 + 0.6; }
        if (o.oct) { B.cyl(brickK, o.oct, o.oct, o.octH, KX - 1, y, tz, 8); B.cyl(whiteS, o.oct + 0.4, o.oct + 0.4, 0.5, KX - 1, y + o.octH, tz, 8); y += o.octH + 0.5; }
        const cone = new T.ConeGeometry(o.tentR, o.tentH, 8, 6); cone.translate(0, o.tentH / 2, 0);
        B.add(greenT, cone, { x: KX - 1, y, z: tz, ry: Math.PI / 8, uv: 'box' });
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; B.beam(whiteS, KX - 1 + Math.cos(a) * o.tentR, y, tz + Math.sin(a) * o.tentR, KX - 1, y + o.tentH, tz, 0.12, 0.12); }
        y += o.tentH;
        B.add(gold, new T.SphereGeometry(0.5, 14, 10), { x: KX - 1, y: y + 0.4, z: tz, uv: 'keep' });
        B.cyl(gold, 0.06, 0.12, 3.0, KX - 1, y + 0.8, tz, 8);
        return { top: y };
      };
      tower(0, { w: 8, h0: 18, tentR: 4.4, tentH: 12 });                                          // tháp Thượng viện
      const sp = tower(-95, { w: 13, h0: 28, h1: 10, oct: 5.2, octH: 9, tentR: 4.6, tentH: 15 });   // Spasskaya
      tower(95, { w: 10, h0: 26, h1: 0, oct: 4.4, octH: 10, tentR: 4.0, tentH: 20 });              // Nikolskaya
      tower(-160, { w: 12, h0: 26, tentR: 6.6, tentH: 14 });
      tower(160, { w: 12, h0: 26, tentR: 6.6, tentH: 14 });
      /* cổng vòm Spasskaya và mặt đồng hồ */
      { const g = HT.extrude(HT.archPath(0, 0, 4.2, 5.5, 18).getPoints(12).map((p) => [p.x, p.y]), 0.2); B.add(HT.solid(0x141210, { rough: 0.9 }), g, { x: KX - 1 + 6.52, y: 0, z: -95, ry: Math.PI / 2, uv: 'box' }); }
      const clock = HT.canvasTex('spasskaya_clock', 512, 512, (g, Wd, Hd) => {
        g.fillStyle = '#e8e2d2'; g.fillRect(0, 0, Wd, Hd);
        const c = Wd / 2; g.fillStyle = '#12181e'; g.beginPath(); g.arc(c, c, 238, 0, 6.283); g.fill();
        g.strokeStyle = '#d8ae52'; g.lineWidth = 10; g.beginPath(); g.arc(c, c, 232, 0, 6.283); g.stroke();
        g.fillStyle = '#d8ae52'; g.font = `bold 44px ${HT.FONT_SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
        R.forEach((t, i) => { const a = (i / 12) * 6.283 - Math.PI / 2; g.fillText(t, c + Math.cos(a) * 185, c + Math.sin(a) * 185); });
        g.lineCap = 'round'; g.lineWidth = 14; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(-2.4) * 110, c + Math.sin(-2.4) * 110); g.stroke();
        g.lineWidth = 9; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(-1.2) * 160, c + Math.sin(-1.2) * 160); g.stroke();
      });
      for (const [dx, dz, ryc] of [[5.52, 0, Math.PI / 2], [-5.52, 0, -Math.PI / 2], [0, 5.52, 0], [0, -5.52, Math.PI]]) {
        const pm = new T.Mesh(new T.PlaneGeometry(5.2, 5.2), new T.MeshStandardMaterial({ map: clock, roughness: 0.35, envMapIntensity: 1.1 }));
        pm.position.set(KX - 1 + dx, 28.8 + 5.4, -95 + dz); pm.rotation.y = ryc; ctx.add(pm);
      }

      /* ---------------- LĂNG GỖ TẠM ĐẦU TIÊN (27/1/1924) ---------------- */
      const MX = -27, MZ = 0;
      const woodG = HT.mat('weathered_planks', { tile: 1.2, color: 0x8a8480 });
      const woodD = HT.mat('weathered_planks', { tile: 1.2, color: 0x5a5452 });
      B.box(woodD, 10, 0.6, 10, MX, 0, MZ, 0, { col: true });
      B.box(woodG, 8.2, 3.0, 8.2, MX, 0.6, MZ, 0, { col: true });
      for (let k = 0; k < 3; k++) B.box(k % 2 ? woodG : woodD, 7.0 - k * 1.8, 0.55, 7.0 - k * 1.8, MX, 3.6 + k * 0.55, MZ, 0);
      B.box(woodD, 1.0, 0.8, 1.0, MX, 5.25, MZ, 0);
      /* cửa vào, chữ ЛЕНИН */
      B.box(HT.solid(0x141210, { rough: 0.9 }), 0.1, 2.2, 1.6, MX + 4.12, 0.6, MZ, 0);
      E.sign(ctx, B, { key: 'lenin', text: 'ЛЕНИН', x: MX + 4.16, y: 3.0, z: MZ, ry: Math.PI / 2, w: 3.2, h: 0.62, bg: '#1a1614', ink: '#c01c16', font: HT.FONT_SERIF });
      B.box(snowM, 10.1, 0.08, 10.1, MX, 0.6, MZ, 0, { noShadow: true });
      /* vòng hoa, hàng rào gỗ xếp hàng viếng */
      for (const dz of [-3.2, 3.2]) { const wr = new T.TorusGeometry(0.6, 0.18, 8, 20); B.add(HT.solid(0x2a4a2a, { rough: 0.8 }), wr, { x: MX + 4.4, y: 1.2, z: MZ + dz, ry: Math.PI / 2, uv: 'keep' }); B.add(HT.solid(0xa01814, { rough: 0.6 }), new T.TorusGeometry(0.6, 0.05, 6, 20), { x: MX + 4.5, y: 1.2, z: MZ + dz, ry: Math.PI / 2, uv: 'keep' }); }
      const railW = HT.mat('weathered_planks', { tile: 0.8, color: 0x7a7470 });
      A.fence(B, ctx, railW, [[-20, -60], [-20, -6]], { kind: 'go', h: 1.0 });
      A.fence(B, ctx, railW, [[-16, -60], [-16, -6]], { kind: 'go', h: 1.0 });
      A.fence(B, ctx, railW, [[-20, 6], [-20, 60]], { kind: 'go', h: 1.0 });
      /* cờ tang dọc tường Kremli */
      for (let z = -70; z <= 70; z += 14) if (Math.abs(z) > 8) P.flag(ctx, -33.5, 0, z, { kind: 'tang', pole: 9, w: 2.2, amp: 0.1 });
      /* đống lửa sưởi dọc hàng người */
      for (const [x, z] of [[-10, -48], [-10, -30], [-10, -14], [-10, 16], [-10, 34], [2, -60], [2, 52]]) P.fire(ctx, x, 0, z, { s: 1.0, power: 16 });

      /* ---------------- NHÀ THỜ THÁNH BASIL (đầu nam) ---------------- */
      const domeTex = (key, draw) => HT.canvasTex('dome_' + key, 512, 512, draw);
      const pats = {
        spiralRW: (g, Wd, Hd) => { g.fillStyle = '#f2ece0'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#b0241c'; for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64 + 32, 0); g.lineTo(i * 64 + 32 + 256, Hd); g.lineTo(i * 64 + 256, Hd); g.closePath(); g.fill(); } },
        spiralGY: (g, Wd, Hd) => { g.fillStyle = '#e8c850'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#2e7a3e'; for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64 + 32, 0); g.lineTo(i * 64 - 224, Hd); g.lineTo(i * 64 - 256, Hd); g.closePath(); g.fill(); } },
        spiralBW: (g, Wd, Hd) => { g.fillStyle = '#f0f0ea'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#2a5a9a'; for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64 + 28, 0); g.lineTo(i * 64 + 28 + 200, Hd); g.lineTo(i * 64 + 200, Hd); g.closePath(); g.fill(); } },
        zigzag: (g, Wd, Hd) => { g.fillStyle = '#2e7a3e'; g.fillRect(0, 0, Wd, Hd); g.strokeStyle = '#f2d04a'; g.lineWidth = 16; for (let y = 16; y < Hd; y += 40) { g.beginPath(); for (let x = 0; x <= Wd; x += 32) g.lineTo(x, y + ((x / 32) % 2 ? 14 : -14)); g.stroke(); } },
        scales: (g, Wd, Hd) => { g.fillStyle = '#c8a040'; g.fillRect(0, 0, Wd, Hd); for (let y = 0; y < Hd + 32; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < Wd + 32; x += 32) { g.fillStyle = (x + y) % 64 ? '#e8c860' : '#b88a30'; g.beginPath(); g.arc(x, y, 17, 0, Math.PI); g.fill(); } },
        diamond: (g, Wd, Hd) => { g.fillStyle = '#b0241c'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#2e7a3e'; for (let y = 0; y < Hd; y += 64) for (let x = 0; x < Wd; x += 64) { g.beginPath(); g.moveTo(x + 32, y); g.lineTo(x + 64, y + 32); g.lineTo(x + 32, y + 64); g.lineTo(x, y + 32); g.closePath(); g.fill(); } },
        ribsGW: (g, Wd, Hd) => { g.fillStyle = '#f2ece0'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#2e7a3e'; for (let x = 0; x < Wd; x += 42) g.fillRect(x, 0, 20, Hd); },
        checkRY: (g, Wd, Hd) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#b0241c' : '#e8c850'; g.fillRect(x * 64, y * 64, 64, 64); } },
      };
      const onion = (R, Hh) => { const prof = [[R * 0.72, 0], [R * 0.95, Hh * 0.1], [R * 1.05, Hh * 0.28], [R * 0.97, Hh * 0.46], [R * 0.72, Hh * 0.64], [R * 0.38, Hh * 0.8], [R * 0.14, Hh * 0.92], [0.02, Hh]]; return new T.LatheGeometry(prof.map((p) => new T.Vector2(p[0], p[1])), 32); };
      const SBX = 22, SBZ = -150;
      const brickB = HT.mat('red_brick', { tile: 1.4, color: 0xd09078 });
      B.box(brickB, 38, 6, 38, SBX, 0, SBZ, 0, { col: true });
      B.box(whiteS, 38.6, 0.5, 38.6, SBX, 6, SBZ, 0);
      /* tháp giữa: thân bát giác + chóp lều + củ hành nhỏ */
      B.cyl(brickB, 6.4, 6.8, 14, SBX, 6.5, SBZ, 8); B.cyl(whiteS, 6.9, 6.9, 0.6, SBX, 20.5, SBZ, 8);
      { const cone = new T.ConeGeometry(5.8, 20, 8, 1); cone.translate(0, 10, 0); const m = new T.MeshStandardMaterial({ map: domeTex('tent', (g, Wd, Hd) => { g.fillStyle = '#f0ece2'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#2e7a3e'; for (let y = 0; y < Hd; y += 48) for (let x = (y / 48) % 2 ? 24 : 0; x < Wd; x += 48) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 12, y + 24); g.lineTo(x, y + 48); g.lineTo(x - 12, y + 24); g.fill(); } }), roughness: 0.5 }); const c = new T.Mesh(cone, m); c.position.set(SBX, 21.1, SBZ); c.castShadow = true; ctx.add(c); }
      { const d = new T.Mesh(onion(1.6, 3.4), new T.MeshStandardMaterial({ color: 0xd8ae52, metalness: 1, roughness: 0.25 })); d.position.set(SBX, 41, SBZ); ctx.add(d); B.cyl(gold, 0.05, 0.08, 2.4, SBX, 44.3, SBZ, 6); }
      const chap = [['spiralRW', 0, 1, 4.4], ['spiralGY', Math.PI / 2, 1, 4.4], ['zigzag', Math.PI, 1, 4.4], ['diamond', -Math.PI / 2, 1, 4.4], ['spiralBW', Math.PI / 4, 0, 3.0], ['scales', 3 * Math.PI / 4, 0, 3.0], ['ribsGW', -Math.PI / 4, 0, 3.0], ['checkRY', -3 * Math.PI / 4, 0, 3.0]];
      for (const [pk, a, big, R] of chap) {
        const dx = SBX + Math.sin(a) * 13, dz = SBZ + Math.cos(a) * 13;
        const dh = big ? 12 : 8.5;
        B.cyl(brickB, R * 0.82, R * 0.9, dh, dx, 6.5, dz, 8); B.cyl(whiteS, R * 0.95, R * 0.95, 0.5, dx, 6.5 + dh, dz, 8);
        for (let k = 0; k < 8; k++) { const aa = (k / 8) * 6.283; const g = HT.extrude(HT.archPath(0, 0, 0.9, 1.6, 10).getPoints(12).map((p) => [p.x, p.y]), 0.06); B.add(HT.solid(0x1a1e22, { rough: 0.2 }), g, { x: dx + Math.sin(aa) * (R * 0.86), y: 6.5 + dh * 0.45, z: dz + Math.cos(aa) * (R * 0.86), ry: aa, uv: 'box' }); }
        const drumY = 7 + dh;
        B.cyl(brickB, R * 0.55, R * 0.6, 2.2, dx, drumY, dz, 16);
        const mm = new T.MeshStandardMaterial({ map: domeTex(pk, pats[pk]), roughness: 0.4, envMapIntensity: 1.0 });
        const d = new T.Mesh(onion(R, R * 1.7), mm); d.position.set(dx, drumY + 2.1, dz); d.castShadow = true; ctx.add(d);
        B.cyl(gold, 0.06, 0.09, 2.2, dx, drumY + 2.1 + R * 1.7, dz, 6);
      }
      /* bục Lobnoye Mesto */
      B.cyl(whiteS, 6.5, 6.6, 1.3, 14, 0, -118, 32); B.cyl(snowM, 6.1, 6.1, 0.06, 14, 1.3, -118, 32);
      { const ring = new T.LatheGeometry([[6.15, 0], [6.55, 0], [6.55, 0.9], [6.15, 0.9], [6.15, 0]].map((p) => new T.Vector2(p[0], p[1])), 48); B.add(whiteS, ring, { x: 14, y: 1.3, z: -118, uv: 'box' }); ctx.colCircle(14, -118, 6.6); }

      /* ---------------- GUM (phía đông) ---------------- */
      const gumW = HT.ashlar('gum', { color: 0xeae4da, joint: 0xb0a898, bw: 1.0, bh: 0.4, speck: 0.06, dirt: true });
      const gumT = HT.mat('marble_01', { tile: 2, color: 0xf0ece4 });
      A.block(ctx, B, { x: 52, z: 0, ry: -Math.PI / 2, w: 230, d: 20, floors: [6.5, 5.6, 5.4], bays: 46, wall: gumW, trim: gumT, window: { w: 1.6, h: 2.8, kind: 'casement', rows: 3, frame: HT.solid(0xe8e4dc, { rough: 0.5 }) }, ground: 'shop', shopFrame: HT.solid(0x2a2a28, { rough: 0.4 }), roof: 'gable', roofMat: snowM, roofH: 3.2, cornice: true });
      for (const gz of [-70, 0, 70]) { B.box(gumW, 3, 22, 12, 42.5, 0, gz, 0); const c = new T.ConeGeometry(3.4, 8, 4); c.translate(0, 4, 0); B.add(greenT, c, { x: 42.5, y: 22, z: gz, ry: Math.PI / 4, uv: 'box' }); B.add(gold, new T.SphereGeometry(0.4, 12, 8), { x: 42.5, y: 30.3, z: gz }); }
      /* ---------------- BẢO TÀNG LỊCH SỬ (đầu bắc) ---------------- */
      const brickH = HT.mat('red_brick_03', { tile: 1.5, color: 0xe8a898 });
      A.block(ctx, B, { x: 2, z: 152, ry: Math.PI, w: 64, d: 30, floors: [9, 8], bays: 12, wall: brickH, trim: whiteS, window: { w: 1.4, h: 3.0, kind: 'casement', rows: 3, frame: HT.solid(0xe8e4dc, { rough: 0.5 }) }, ground: 'plain', roof: 'hip', roofMat: snowM, roofH: 5, cornice: true });
      for (const [tx, th] of [[-8, 34], [12, 34], [-28, 26], [32, 26]]) {
        B.box(brickH, 6, th, 6, tx, 0, 138, 0);
        const c = new T.ConeGeometry(4.2, 12, 8); c.translate(0, 6, 0); B.add(greenT, c, { x: tx, y: th, z: 138, ry: Math.PI / 8, uv: 'box' });
        B.add(gold, new T.SphereGeometry(0.4, 12, 8), { x: tx, y: th + 12.3, z: 138 });
      }
      /* xe điện phía bắc quảng trường */
      VV.tram(ctx, 20, 0, 105, 0, { color: 0x8a2a1e, color2: 0xe8dcc0, label: 'Б' });
      /* đèn đường */
      for (let z = -100; z <= 100; z += 20) { P.gasLamp(B, ctx, 30, 0, z, { h: 5 }); }

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [22, 34, -0.59, 'lectern'],
        stories: [[6, -8, Math.PI / 2 + 0.3], [6, 8, Math.PI / 2 - 0.3]],
        moc: [14, -20, -0.6],
        photos: [[-6, 24, Math.PI / 2 + 0.6, 0.9], [18, 16, -Math.PI / 2 + 0.4, 1.1], [18, 4, -Math.PI / 2, 1.1], [18, -8, -Math.PI / 2 - 0.2, 1.3], [-6, -24, Math.PI / 2 - 0.6, 1.0]],
      });
      E.label(ctx, { key: 'lang', x: -18.5, z: 3, ry: Math.PI / 2 + 0.4, vi: 'Lăng gỗ tạm của Lênin (1/1924)', en: 'Lenin’s first wooden mausoleum',
        text: 'Lênin mất ngày 21/1/1924. Nguyễn Ái Quốc vừa đến Mátxcơva, đã đội rét dưới 30 độ âm đến viếng, bị cóng ngón tay và tai. Ngày 27/1/1924, báo Sự thật (Pravda) đăng bài “Lênin và các dân tộc thuộc địa” của Người. Lăng gỗ tạm dựng ngay trong ngày lễ tang, trước tháp Thượng viện.',
        textEn: 'Lenin died on 21 January 1924. Nguyen Ai Quoc queued in −30 °C cold to pay his respects and got frostbite; on 27 January Pravda printed his article. The temporary wooden mausoleum was built for the funeral, in front of the Senate Tower.' });
      E.label(ctx, { key: 'spass', x: -24, z: -86, ry: Math.PI / 2, vi: 'Tháp Spasskaya', en: 'Spasskaya Tower',
        text: 'Tháp cổng chính của Điện Kremli trông ra Quảng trường Đỏ, xây năm 1491, mái chóp thế kỷ XVII, mặt đồng hồ lớn bốn phía.',
        textEn: 'The main gate tower of the Kremlin (1491), with its 17th-century tent roof and great clock.' });
      E.label(ctx, { key: 'basil', x: 12, z: -108, ry: Math.PI - 0.4, vi: 'Nhà thờ Thánh Basil', en: 'St Basil’s Cathedral',
        text: 'Xây năm 1555 – 1561, chín nhà nguyện trên một nền chung, mỗi mái vòm củ hành một màu, một hoa văn.',
        textEn: 'Built 1555 – 1561: nine chapels on one base, each onion dome with its own colours and pattern.' });
      E.label(ctx, { key: 'qtcs', x: 26, z: 60, ry: -Math.PI / 2 - 0.3, vi: 'Quốc tế Cộng sản', en: 'The Communist International',
        text: 'Ngày 30/6/1923, Người đến Petrograd trên tàu Các Líp-nếch (Karl Liebknecht), rồi về Mátxcơva học tại Trường Đại học Phương Đông, dự Đại hội V Quốc tế Cộng sản (6 – 7/1924), phát biểu về vấn đề thuộc địa. Những năm 1934 – 1938, Người trở lại học và làm việc tại Mátxcơva.',
        textEn: 'He reached Petrograd in June 1923, studied at the University of the Toilers of the East and addressed the Fifth Comintern Congress in 1924; he returned to Moscow in 1934 – 1938.' });
      E.stdGates(ctx, { hub: [-4, 120, 0], prev: [6, 120, 0], next: [6, -124, 0] });
    },
  };
})();
