/* GIAN 11 — HỒNG KÔNG: CỬU LONG (1930 – 1933).
   Dựng lại: một phố Cửu Long đầu thập niên 1930 với dãy "đường lâu" (唐樓) bốn tầng — tầng trệt có hiên cột trên vỉa hè,
   các tầng trên có ban công lan can, sào tre phơi quần áo, biển hiệu chữ Hán ngang dọc, xe kéo tay, xe đẩy hàng; căn phòng
   nhỏ ở tầng trệt một ngôi nhà trong xóm lao động — nơi họp Hội nghị hợp nhất các tổ chức cộng sản (6/1 – 7/2/1930): bàn
   gỗ, ghế đẩu, đèn dầu, giấy tờ. Cuối phố là bến Tiêm Sa Chủy bên cảng Victoria: tháp đồng hồ ga Cửu Long – Quảng Châu
   (1915) bằng gạch đỏ và đá granit, thuyền buồm mành, tàu thủy; bên kia cảng là đảo Hồng Kông với núi Thái Bình.
   Trục: phố chạy theo z, cảng ở phía −z. */
(function () {
  const HT = window.HT;
  HT.halls.G11 = {
    sky: { hdri: 'kloofendal_28d_misty_puresky', sunAz: 250, exposure: 0.98, fog: 0.0009, sat: 1.0, con: 1.05, bloom: 0.13, shadowSize: 60 },
    spawn: { x: 1.5, z: 34, yaw: 0.0, pitch: 0.02 },
    map: [-40, -90, 40, 44],
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo, VV = HT.vehicles;
      const B = ctx.B, r = ctx.rng;
      const QZ = -56;                                           // mép bến
      const H = (x, z) => {
        if (z < QZ - 0.4) {
          if (z > -1168) return -6;
          const d = Math.hypot(x * 0.6, z + 1900);
          const m = Math.max(0, 560 * Math.exp(-((d / 700) ** 2)) + HT.fbm(x * 0.002, z * 0.002, 4) * 110) * HT.smooth(1200, 1420, -z);
          return 1.5 + m;
        }
        return 0.2 + HT.fbm(x * 0.004, z * 0.004, 3) * 14 * HT.smooth(300, 900, Math.hypot(x, z));
      };
      const W = (x, z) => [Math.abs(x) < 4 && z > QZ + 4 ? 1 : 0, z < QZ + 14 && z > QZ - 1 ? 1 : 0, 0];
      N.terrain(ctx, { size: 5200, inner: 110, step: 0.6, height: H, weights: W, layers: [
        { slug: 'concrete_pavement', tile: 2.6, tint: 0xd0ccc4, rough: 0.75 },
        { slug: 'worn_asphalt', tile: 3, tint: 0x8a8886, rough: 0.55 },
        { slug: 'large_floor_tiles_02', tile: 2.2, tint: 0xd8d4cc, rough: 0.7 },
        { slug: 'forest_leaves_02', tile: 3 },
      ], macro: 0.06 });
      ctx.bounds = [[-9, 42], [-9, QZ + 13], [-34, QZ + 13], [-34, QZ + 1.2], [34, QZ + 1.2], [34, QZ + 13], [9, QZ + 13], [9, 2.9], [16.5, 2.9], [16.5, 11.1], [9, 11.1], [9, 42]];
      N.waterMirror(ctx, { poly: N.rectPoly(-3000, -1200, 3000, QZ), y: -1.1, color: 0x2a3a3c, distortion: 0.9, size: 1.1, speed: 0.45 });
      const stone = HT.ashlar('hkquay', { color: 0xb8b4ac, joint: 0x7a7670, bw: 1.2, bh: 0.5, rustic: true, speck: 0.12 });
      B.box(stone, 80, 5.4, 1.2, 0, -5.2, QZ - 0.2, 0);
      for (const sz of [-4, 4]) B.box(HT.mat('granite_tile_04', { tile: 1, color: 0xb0aca4 }), 0.25, 0.12, 100, sz, 0.18, -5, 0);

      /* ---------------- dãy đường lâu ---------------- */
      const pl = (c) => HT.mat('plastered_wall', { tile: 2.4, color: c, env: 0.7 });
      const cols = [0xd8d4c4, 0xe4dcc4, 0xc8d0c4, 0xe0d0c0, 0xd4d4cc, 0xe8e0cc, 0xd0c8b4];
      const iron = HT.solid(0x2a2e2c, { rough: 0.5, metal: 0.5 });
      const clothCols = [0xe8e4dc, 0x3a5a8a, 0x8a2a24, 0xd8c8a0, 0x2a2a2a, 0x6a8a5a, 0xf0ece4];
      const hanzi = (key, txt, bg, ink, vertical) => HT.canvasTex('hk_' + key, vertical ? 160 : 640, vertical ? 640 : 160, (g, Wd, Hd) => {
        g.fillStyle = bg; g.fillRect(0, 0, Wd, Hd); g.strokeStyle = ink; g.lineWidth = 7; g.strokeRect(9, 9, Wd - 18, Hd - 18);
        g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold 104px ${HT.FONT_HAN || 'KaiTi, STKaiti, serif'}`;
        const ch = [...txt]; ch.forEach((c, i) => vertical ? g.fillText(c, Wd / 2, Hd * (i + 0.5) / ch.length) : g.fillText(c, Wd * (i + 0.5) / ch.length, Hd / 2));
      });
      const shop = [['茶居', '#6a1a12', '#f2d890'], ['當舖', '#141414', '#e8c860'], ['雜貨', '#1a2e44', '#f0e0b0'], ['米行', '#4a2a14', '#f4e2b8'], ['藥行', '#1c2a1e', '#e8d8a0'], ['裁縫', '#2a1a3a', '#f0e2c8'], ['書館', '#2a2018', '#f2e6c8']];
      const tonglau = (x, zc, w, side, i, o) => {
        o = o || {};
        const d = 13;
        const b = A.colonial(ctx, B, { x: side * (4 + d / 2), z: zc, ry: -side * Math.PI / 2, w, d, floors: [4.2, 3.3, 3.3, 3.2], bays: w > 7 ? 3 : 2, veranda: 3.0, plinth: 0.2, wall: pl(cols[i % cols.length]), trim: pl(0xeee8dc),
          window: { w: 1.1, h: 2.0, kind: 'casement', rows: 3, frame: HT.solid(0x3a4a3e, { rough: 0.55 }) }, doorKind: 'plank', doorMat: HT.mat('weathered_brown_planks', { tile: 1.2, color: 0xa88868 }), pier: 0.5,
          floorMat: HT.mat('floor_tiles_06', { tile: 0.7, color: 0xd8c8b8, env: 0.5 }), roof: 'flat', steps: [], backWin: false, sideWin: 0, openBay: o.openBay, noDark0: o.noDark0, doorBays: o.doorBays });
        /* ban công các tầng trên: sàn đua + lan can sắt, sào phơi quần áo */
        let y = b.y0 + 4.2;
        for (let k = 1; k < 4; k++) {
          const [bx, bz] = b.f(0, d / 2 + 0.6);
          B.box(pl(0xeee8dc), w - 0.2, 0.16, 1.2, bx, y - 0.08, bz, -side * Math.PI / 2);
          A.railing(B, iron, [b.f(-w / 2 + 0.2, d / 2 + 1.15), b.f(w / 2 - 0.2, d / 2 + 1.15)], y + 0.08, { h: 1.0, spacing: 0.14, r: 0.012 });
          if (r() < 0.7) {
            const [p0x, p0z] = b.f(-w / 2 + 0.6 + r() * (w - 2), d / 2 + 1.2), [p1x, p1z] = b.f(-w / 2 + 0.6 + r() * (w - 2), d / 2 + 3.2);
            B.beam(HT.props.M.tre(), p0x, y + 2.2, p0z, p1x, y + 2.35, p1z, 0.035, 0.035, { round: true, seg: 5 });
            for (let c = 0; c < 3; c++) { const t = 0.25 + c * 0.25; const cx = HT.lerp(p0x, p1x, t), cz = HT.lerp(p0z, p1z, t); B.add(HT.solid(r.pick(clothCols), { rough: 0.9, side: T.DoubleSide }), new T.PlaneGeometry(0.55, 0.8), { x: cx, y: y + 1.8, z: cz, ry: side > 0 ? 0 : Math.PI, noShadow: false, uv: 'keep' }); }
          }
          y += [3.3, 3.3, 3.2][k - 1];
        }
        /* biển hiệu ngang trên diềm hiên + biển dọc */
        const [n0, bg, ink] = shop[i % shop.length];
        const [hx, hz] = b.f(0, d / 2 + 0.03);
        const hm = new T.Mesh(new T.PlaneGeometry(Math.min(w - 1.2, 4.2), 0.9), new T.MeshStandardMaterial({ map: hanzi(n0 + 'h' + i, n0, bg, ink, false), roughness: 0.4 }));
        hm.position.set(hx, 3.5, hz); hm.rotation.y = -side * Math.PI / 2; ctx.add(hm);
        const [vx, vz] = b.f(w / 2 - 0.7, d / 2 + 0.9);
        const vm = new T.Mesh(new T.PlaneGeometry(0.6, 2.4), new T.MeshStandardMaterial({ map: hanzi(n0 + 'v' + i, n0, bg, ink, true), roughness: 0.4, side: T.DoubleSide }));
        vm.position.set(vx, 5.9, vz); vm.rotation.y = -side * Math.PI / 2 + Math.PI / 2; ctx.add(vm);
        return b;
      };
      const rowZ = [[34, 9], [25, 9], [16, 9], [7, 9], [-2, 9], [-11, 9], [-20, 9], [-29, 9], [-38, 8]];
      rowZ.forEach(([zc, w], i) => tonglau(-1, zc, w, -1, i));
      let meet = null;
      rowZ.forEach(([zc, w], i) => { if (zc === 7) meet = tonglau(1, zc, w, 1, i + 3, { openBay: 1, noDark0: true, doorBays: [1] }); else tonglau(1, zc, w, 1, i + 3); });

      /* ---------------- căn phòng họp (6/1 – 7/2/1930) ---------------- */
      { /* nhà phía đông (x > 0), mặt lõi ở x = 7.0; phòng từ x 7.45 đến 16.55, z 2.9 … 11.1.
           Kiểu nhà lao động Hồng Kông: gian ngoài làm chỗ ngồi, vách ván gỗ ngăn buồng ngủ phía trong (板間房),
           tường dán giấy báo, chân tường ốp ván, dầm gỗ trần, cửa sổ sau có song sắt nhìn ra giếng trời. */
        const X0 = 7.45, X1 = 16.55, Z0 = 2.9, Z1 = 11.1, y0 = (meet && meet.y0 != null ? meet.y0 : 0.4) + 0.001, XP = 13.7, DZ0 = 9.2, DZ1 = 10.3;
        const floorW = HT.mat('old_wood_floor', { tile: 1.2, color: 0xc8b090, env: 0.6 });
        const wd = HT.mat('fine_grained_wood', { tile: 1.1, color: 0xa88868, rough: 0.7, env: 0.5 });
        const wdD = HT.mat('fine_grained_wood', { tile: 1.1, color: 0x7a5c42, rough: 0.6, env: 0.5 });
        B.box(floorW, X1 - X0, 0.05, Z1 - Z0, (X0 + X1) / 2, y0, (Z0 + Z1) / 2, 0);
        B.box(pl(0xe8e0cc), X1 - X0, 0.15, Z1 - Z0, (X0 + X1) / 2, 4.2 + y0 - 0.15, (Z0 + Z1) / 2, 0);
        ctx.floorRect((X0 + X1) / 2, (Z0 + Z1) / 2, X1 - X0, Z1 - Z0, y0 + 0.05, 0);
        /* dầm trần gỗ */
        for (let x = X0 + 0.9; x < X1; x += 1.5) B.box(wdD, 0.14, 0.22, Z1 - Z0, x, y0 + 3.83, (Z0 + Z1) / 2, 0);
        /* chân tường ốp ván + nẹp */
        const yW = y0 + 0.05;
        B.box(wd, X1 - X0, 1.0, 0.03, (X0 + X1) / 2, yW, Z0 + 0.015, 0); B.box(wd, X1 - X0, 1.0, 0.03, (X0 + X1) / 2, yW, Z1 - 0.015, 0);
        B.box(wd, 0.03, 1.0, Z1 - Z0, X1 - 0.015, yW, (Z0 + Z1) / 2, 0);
        B.box(wdD, X1 - X0, 0.05, 0.06, (X0 + X1) / 2, yW + 1.0, Z0 + 0.03, 0); B.box(wdD, X1 - X0, 0.05, 0.06, (X0 + X1) / 2, yW + 1.0, Z1 - 0.03, 0);
        /* vách ván ngăn buồng trong: ván đứng cao 2.3 m, phía trên là song gỗ thoáng; cửa buồng có rèm vải */
        const plank = (z0, z1) => { for (let z = z0; z < z1 - 0.01; z += 0.2) B.box(r() < 0.5 ? wd : wdD, 0.035, 2.3, Math.min(0.195, z1 - z), XP, yW, z + Math.min(0.195, z1 - z) / 2, 0); };
        plank(Z0, DZ0); plank(DZ1, Z1);
        B.box(wdD, 0.08, 0.1, Z1 - Z0, XP, yW + 2.3, (Z0 + Z1) / 2, 0);
        B.box(wdD, 0.08, 0.08, Z1 - Z0, XP, yW + 2.95, (Z0 + Z1) / 2, 0);
        for (let z = Z0 + 0.12; z < Z1; z += 0.16) B.box(wdD, 0.04, 0.55, 0.035, XP, yW + 2.4, z, 0);
        for (const z of [DZ0, DZ1]) B.box(wdD, 0.09, 2.3, 0.08, XP, yW, z, 0);
        ctx.colBox(XP, (Z0 + DZ0) / 2, 0.12, DZ0 - Z0, 0, -1, 5); ctx.colBox(XP, (DZ1 + Z1) / 2, 0.12, Z1 - DZ1, 0, -1, 5);
        const cur = new T.PlaneGeometry(0.62, 1.95, 12, 1); { const pp = cur.attributes.position; for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.sin(pp.getX(i) * 26) * 0.035); cur.computeVertexNormals(); }
        B.add(HT.solid(0x8a3a2c, { rough: 0.92, side: T.DoubleSide }), cur, { x: XP - 0.05, y: yW + 1.25, z: DZ0 + 0.33, ry: Math.PI / 2, uv: 'keep' });
        B.cyl(iron, 0.012, 0.012, 1.2, XP - 0.05, yW + 2.25, (DZ0 + DZ1) / 2, 6, { rx: Math.PI / 2 });
        /* giấy báo dán trên vách (tờ Công Thương nhật báo, chữ Hán dọc) */
        const paper = HT.canvasTex('hk_bao_1930', 512, 700, (g, Wd, Hd) => {
          g.fillStyle = '#e2d6b8'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#2a2420'; g.textAlign = 'center';
          g.font = `bold 64px ${HT.FONT_HAN || 'KaiTi, serif'}`; g.fillText('工商日報', Wd / 2, 78); g.fillRect(24, 100, Wd - 48, 4);
          g.font = `22px ${HT.FONT_HAN || 'KaiTi, serif'}`; const rr = HT.rng(11); const txt = '香港九龍新聞本港消息商業行情船期廣告民國十九年';
          for (let x = Wd - 36; x > 20; x -= 28) for (let y = 130; y < Hd - 20; y += 26) { if (rr() < 0.08) continue; g.fillText(txt[(rr() * txt.length) | 0], x, y); }
          g.fillStyle = 'rgba(120,90,40,0.18)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(rr() * Wd, rr() * Hd, 20 + rr() * 60, 0, 6.283); g.fill(); }
        });
        const paperM = new T.MeshStandardMaterial({ map: paper, roughness: 0.9 });
        [[4.4, 1.9, 0.02], [5.35, 1.75, -0.03], [6.2, 2.0, 0.04], [3.55, 1.65, -0.02]].forEach(([z, y, rz]) => { const m = new T.Mesh(new T.PlaneGeometry(0.62, 0.85), paperM); m.position.set(XP - 0.025, y0 + y, z); m.rotation.set(0, -Math.PI / 2, rz); ctx.add(m); });
        /* lịch treo (mồng 3 tháng Hai – ngày được chọn làm ngày thành lập Đảng) */
        const cal = HT.canvasTex('lich_1930', 256, 360, (g, Wd, Hd) => { g.fillStyle = '#f2ece0'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#b01c16'; g.fillRect(0, 0, Wd, 80); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `bold 44px ${HT.FONT_SANS}`; g.fillText('1930', Wd / 2, 56); g.fillStyle = '#222'; g.font = `bold 150px ${HT.FONT_SANS}`; g.fillText('3', Wd / 2, 250); g.font = `28px ${HT.FONT_SANS}`; g.fillText('tháng Hai', Wd / 2, 320); });
        const cm = new T.Mesh(new T.PlaneGeometry(0.34, 0.48), new T.MeshStandardMaterial({ map: cal, roughness: 0.8 })); cm.position.set(XP - 0.03, y0 + 1.75, 7.6); cm.rotation.y = -Math.PI / 2; ctx.add(cm);
        /* bàn họp, ghế đẩu, đèn dầu, ấm chén, văn kiện */
        const go = P.M.go();
        const tx = 10.6, tz = 6.6;
        const top = P.table(B, tx, y0, tz, Math.PI / 2, { w: 2.2, d: 1.1, h: 0.78, mat: go });
        ctx.colBox(tx, tz, 1.1, 2.2, 0, 0, 1);
        for (const [dx, dz] of [[-0.85, -0.6], [-0.85, 0.6], [0.85, -0.6], [0.85, 0.6], [0, -1.4], [0, 1.4]]) P.stool(B, tx + dx, y0, tz + dz, 0, { mat: go });
        HT.model(ctx, 'vintage_oil_lamp', { x: tx, z: tz + 0.3, y: top, h: 0.36, env: 0.6 });
        HT.model(ctx, 'tea_set_01', { x: tx + 0.2, z: tz - 0.55, y: top, h: 0.14, env: 0.7 });
        const doc = HT.canvasTex('van_kien_1930', 512, 700, (g, Wd, Hd) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#222'; g.textAlign = 'center'; g.font = `bold 34px ${HT.FONT_SERIF}`; g.fillText('CHÁNH CƯƠNG VẮN TẮT', Wd / 2, 90); g.font = `26px ${HT.FONT_SERIF}`; g.fillText('của Đảng', Wd / 2, 130); const rr = HT.rng(3); for (let y = 180; y < Hd - 30; y += 22) { g.fillStyle = 'rgba(30,30,30,0.5)'; g.fillRect(40, y, (Wd - 80) * rr.range(0.6, 1), 6); } });
        const docM = new T.MeshStandardMaterial({ map: doc, roughness: 0.85 });
        for (let k = 0; k < 4; k++) B.add(docM, HT.geoBox(0.22, 0.004, 0.3), { x: tx - 0.3 + k * 0.18, y: top + 0.002, z: tz - 0.1 + (k % 2) * 0.2, ry: r.range(-0.3, 0.3) });
        /* nghiên mực, bút lông */
        B.box(HT.solid(0x1a1a1c, { rough: 0.4 }), 0.12, 0.025, 0.18, tx - 0.35, top, tz + 0.55, 0.2);
        B.cyl(HT.props.M.tre(), 0.006, 0.006, 0.24, tx - 0.2, top + 0.01, tz + 0.5, 6, { rz: Math.PI / 2 });
        /* kệ gỗ trên tường với sách, lọ, đồng hồ báo thức */
        B.box(wdD, 2.0, 0.04, 0.28, 9.6, y0 + 1.72, Z0 + 0.16, 0);
        for (const x of [8.8, 10.4]) B.box(wdD, 0.04, 0.18, 0.26, x, y0 + 1.54, Z0 + 0.15, 0);
        HT.model(ctx, 'book_encyclopedia_set_01', { x: 9.2, z: Z0 + 0.16, y: y0 + 1.76, h: 0.22, env: 0.6 });
        HT.model(ctx, 'alarm_clock_01', { x: 10.2, z: Z0 + 0.16, y: y0 + 1.76, h: 0.14, env: 0.6 });
        HT.model(ctx, 'jug_01', { x: 9.9, z: Z0 + 0.16, y: y0 + 1.76, h: 0.2, env: 0.6 });
        /* móc treo áo, chậu rửa, thùng nước, giỏ */
        for (const [z, c] of [[3.5, 0x3a4a64], [4.05, 0xd8d0bc]]) { const cg = new T.PlaneGeometry(0.5, 0.78, 6, 1); B.add(HT.solid(c, { rough: 0.95, side: T.DoubleSide }), cg, { x: X0 + 0.25, y: y0 + 1.5, z, ry: Math.PI / 2, uv: 'keep' }); }
        HT.model(ctx, 'wooden_bucket_01', { x: X0 + 0.6, z: Z1 - 0.5, y: y0 + 0.05, h: 0.4, env: 0.6 });
        HT.model(ctx, 'pot_enamel_01', { x: X0 + 1.2, z: Z1 - 0.45, y: y0 + 0.05, h: 0.22, env: 0.6 });
        HT.model(ctx, 'wicker_basket_02', { x: 12.9, z: Z0 + 0.5, y: y0 + 0.05, h: 0.35, env: 0.6 });
        /* buồng trong: giường, va li, cửa sổ song sắt ra giếng trời */
        HT.model(ctx, 'old_bed_frame', { x: X1 - 1.1, z: Z1 - 1.3, y: y0, w: 1.95, ry: 0, env: 0.6, col: true });
        HT.model(ctx, 'vintage_suitcase', { x: X1 - 0.8, z: Z0 + 0.8, y: y0, h: 0.25, env: 0.6 });
        const wz = 6.4, wy = y0 + 1.1, ww = 1.1, wh = 1.4;
        B.add(new T.MeshBasicMaterial({ color: 0xe6ecee }), new T.PlaneGeometry(ww, wh), { x: X1 - 0.01, y: wy + wh / 2, z: wz, ry: -Math.PI / 2, noShadow: true, uv: 'keep' });
        for (const dz of [-ww / 2, ww / 2]) B.box(wdD, 0.1, wh + 0.1, 0.08, X1 - 0.05, wy - 0.05, wz + dz, 0);
        for (const yy of [wy - 0.06, wy + wh]) B.box(wdD, 0.14, 0.08, ww + 0.16, X1 - 0.07, yy, wz, 0);
        for (let k = 1; k < 6; k++) B.cyl(iron, 0.011, 0.011, wh, X1 - 0.06, wy + wh / 2, wz - ww / 2 + (k * ww) / 6, 6);
        for (const sgn of [-1, 1]) B.box(wd, 0.03, wh, ww / 2, X1 - 0.35, wy, wz + sgn * (ww / 2 + 0.22), sgn * 0.9);
        const wl = new T.PointLight(0xdfe8f4, 5, 6, 1.6); wl.position.set(X1 - 0.6, wy + 0.9, wz); ctx.add(wl);
        const l = new T.PointLight(0xffd6a0, 12, 9, 1.4); l.position.set(tx, 3.4, tz); ctx.add(l);
      }

      /* ---------------- đồ vật phố ---------------- */
      P.rickshaw(B, -2.2, 0.2, 18, Math.PI + 0.1, {});
      P.rickshaw(B, 2.4, 0.2, -6, -0.1, { cushion: 0x2a3a5a });
      ctx.colBox(-2.2, 17, 1.6, 2.6, 0, 0, 2); ctx.colBox(2.4, -5, 1.6, 2.6, 0, 0, 2);
      for (let z = -44; z <= 38; z += 14) { P.gasLamp(B, ctx, -3.7, 0.2, z, { h: 4.2 }); P.gasLamp(B, ctx, 3.7, 0.2, z + 7, { h: 4.2 }); }
      for (const [x, z] of [[-6, 30], [6, 12], [-6, -16]]) HT.model(ctx, 'wicker_basket_01', { x, z, y: ctx.height(x, z) + 0.2, h: 0.4, env: 0.6 });

      /* ---------------- bến Tiêm Sa Chủy, tháp đồng hồ ---------------- */
      const brickR = HT.mat('red_brick_03', { tile: 1.5, color: 0xf0c8b0 });
      const granB = HT.ashlar('kcrGranite', { color: 0xd8d4cc, joint: 0x9a968e, bw: 0.9, bh: 0.45, speck: 0.1 });
      { const cx = 22, cz = QZ + 6.5;
        B.box(granB, 8.4, 3.0, 8.4, cx, 0.2, cz, 0, { col: true });
        B.box(brickR, 7.6, 30, 7.6, cx, 3.2, cz, 0);
        for (let k = 1; k < 5; k++) B.box(granB, 7.9, 0.5, 7.9, cx, 3.2 + k * 6.4, cz, 0);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(granB, 0.9, 30, 0.9, cx + sx * 3.5, 3.2, cz + sz * 3.5, 0);
        const clock = HT.canvasTex('kcr_clock', 512, 512, (g, Wd, Hd) => { const c = Wd / 2; g.fillStyle = '#f4f0e6'; g.beginPath(); g.arc(c, c, 240, 0, 6.283); g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 12; g.stroke(); g.fillStyle = '#1a1a1a'; g.font = `bold 44px ${HT.FONT_SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; ['XII', 'III', 'VI', 'IX'].forEach((t, i) => { const a = (i / 4) * 6.283 - Math.PI / 2; g.fillText(t, c + Math.cos(a) * 190, c + Math.sin(a) * 190); }); for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; g.fillRect(c + Math.cos(a) * 205 - 4, c + Math.sin(a) * 205 - 4, 8, 8); } g.lineCap = 'round'; g.lineWidth = 14; g.beginPath(); g.moveTo(c, c); g.lineTo(c + 100, c - 40); g.stroke(); g.lineWidth = 9; g.beginPath(); g.moveTo(c, c); g.lineTo(c - 20, c - 170); g.stroke(); }, { clamp: true });
        for (const [dx, dz, ryc] of [[3.82, 0, Math.PI / 2], [-3.82, 0, -Math.PI / 2], [0, 3.82, 0], [0, -3.82, Math.PI]]) { const pm = new T.Mesh(new T.CircleGeometry(1.6, 40), new T.MeshStandardMaterial({ map: clock, roughness: 0.3, envMapIntensity: 1.1 })); pm.position.set(cx + dx, 28.5, cz + dz); pm.rotation.y = ryc; ctx.add(pm); }
        B.box(granB, 8.4, 1.0, 8.4, cx, 33.2, cz, 0);
        B.cyl(brickR, 2.6, 2.6, 5.2, cx, 34.2, cz, 8);
        for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283 + 0.39; B.box(granB, 0.5, 5.2, 0.5, cx + Math.cos(a) * 2.7, 34.2, cz + Math.sin(a) * 2.7, -a); }
        const dome = new T.SphereGeometry(2.9, 24, 10, 0, 6.283, 0, Math.PI / 2); dome.scale(1, 0.8, 1); B.add(HT.solid(0x4a5a58, { rough: 0.5, metal: 0.4 }), dome, { x: cx, y: 39.4, z: cz, uv: 'keep' });
        B.cyl(iron, 0.05, 0.1, 4.0, cx, 41.6, cz, 8);
        ctx.colBox(cx, cz, 8.4, 8.4, 0, -1, 40);
      }
      /* bến tàu gỗ, thuyền mành, tàu thủy */
      HT.model(ctx, 'modular_wooden_pier', { x: -12, z: QZ - 6, y: -0.2, w: 12, ry: Math.PI / 2, env: 0.6 });
      VV.junk(ctx, -40, -1.1, QZ - 60, 0.6, { L: 18 });
      VV.junk(ctx, 30, -1.1, QZ - 120, -0.4, { L: 20 });
      VV.junk(ctx, -90, -1.1, QZ - 240, 0.2, { L: 16 });
      VV.junk(ctx, 140, -1.1, QZ - 300, 1.2, { L: 22 });
      VV.sampan(ctx, B, 6, -1.1, QZ - 14, 0.4, { L: 8 });
      VV.sampan(ctx, B, -22, -1.1, QZ - 22, -0.8, {});
      VV.steamer(ctx, { x: 260, y: -1.1, z: QZ - 420, ry: 0.3, L: 90, B: 12, key: 'hkship', name: 'KWONG TUNG' });
      /* bờ đảo Hồng Kông: dãy nhà thuộc địa ven cảng */
      const pier = HT.ashlar('hkisland', { color: 0xe8e2d4, joint: 0xa8a294, bw: 1.2, bh: 0.5 });
      for (let x = -600; x <= 600; x += 34) A.block(ctx, B, { x: x + r.range(-4, 4), z: -1185, yb: 1.5, ry: 0, w: 28, d: 18, floors: [5, 4.4, 4.2, 4], bays: 6, wall: pier, trim: pl(0xf0ece4), ground: 'arcade', roof: r() < 0.4 ? 'hip' : 'flat', roofMat: HT.mat('clay_roof_tiles_02', { tile: 1.3, color: 0xc88a70 }), col: false, cornice: true });
      N.trees(ctx, 'forest', N.scatter(41, [-1400, -1700, 1400, -1210], 260, 36, (x, z) => H(x, z) > 20).map((p) => ({ x: p.x, z: p.z, s: 0.9 })), { seed: 41, collide: false });

      /* ---------------- trưng bày ---------------- */
      E.hallSet(ctx, {
        name: [-3.4, 30, Math.PI / 2 - 0.5, 'lectern'],
        stories: [[-6.4, 20, Math.PI / 2], [6.4, -14, -Math.PI / 2]],
        moc: [3.4, 24, -Math.PI / 2 - 0.3],
        photos: [[-6.4, 11, Math.PI / 2, 0.9], [-6.4, 2, Math.PI / 2, 0.9], [6.4, -22, -Math.PI / 2, 0.6], [-6.4, -6, Math.PI / 2, 1.3], [6.4, -30, -Math.PI / 2, 1.3]],
      });
      E.label(ctx, { key: 'hoinghi', x: 5.6, z: 4.2, ry: -Math.PI / 2 - 0.4, vi: 'Hội nghị hợp nhất (6/1 – 7/2/1930)', en: 'The unification conference, February 1930',
        text: 'Trong một căn nhà nhỏ ở khu lao động nghèo Cửu Long, Nguyễn Ái Quốc chủ trì Hội nghị hợp nhất các tổ chức cộng sản (từ 6/1 đến 7/2/1930), thành lập Đảng Cộng sản Việt Nam — ngày 3/2 được chọn làm ngày thành lập Đảng; hội nghị thông qua Chánh cương vắn tắt, Sách lược vắn tắt và Điều lệ vắn tắt của Đảng.',
        textEn: 'In a small house in a working-class quarter of Kowloon, Nguyen Ai Quoc chaired the conference that founded the Communist Party of Vietnam and adopted its brief Political Platform and Strategy.' });
      E.label(ctx, { key: 'tongvanso', x: -5.8, z: -24, ry: Math.PI / 2 + 0.3, vi: 'Vụ án Tống Văn Sơ', en: 'The Sung Man Cho case',
        text: 'Ngày 6/6/1931, Người (tên Tống Văn Sơ) bị cảnh sát Anh bắt ở Cửu Long, giam tại nhà tù Victoria. Nhờ luật sư Frank Loseby bào chữa, vụ án được đưa ra Hội đồng Cơ mật ở London; đầu năm 1933 Người được trả tự do và bí mật rời Hồng Kông.',
        textEn: 'Arrested on 6 June 1931 as Sung Man Cho and held in Victoria Prison; defended by Frank Loseby up to the Privy Council in London, he was freed early in 1933.' });
      E.label(ctx, { key: 'thap', x: 14.5, z: QZ + 6, ry: -Math.PI / 2, vi: 'Tháp đồng hồ Tiêm Sa Chủy', en: 'Tsim Sha Tsui clock tower',
        text: 'Tháp đồng hồ gạch đỏ viền đá granit của ga cuối tuyến đường sắt Cửu Long – Quảng Châu, hoàn thành năm 1915, bên bến phà sang đảo Hồng Kông.',
        textEn: 'The red-brick and granite clock tower of the Kowloon–Canton Railway terminus (1915), beside the ferry pier.' });
      E.stdGates(ctx, { hub: [-3, 41.2, 0], prev: [3, 41.2, 0], next: [-24, QZ + 3, Math.PI / 2] });
    },
  };
})();
