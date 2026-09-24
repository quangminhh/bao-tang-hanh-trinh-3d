/* SẢNH HÀNH TRÌNH — nhà tròn (rotunda) đường kính 40 m, 18 mặt; 17 vòm cửa mở vào 17 gian theo thứ tự
   cuộc đời, mặt thứ 18 là tường danh dự (chân dung năm 1946, lời Bác). Mái vòm ô trám có giếng trời,
   hàng cửa sổ vòm lấy nắng; giữa sàn đá cẩm thạch khảm BẢN ĐỒ HÀNH TRÌNH 1911–1941 (phép chiếu
   phương vị lấy Hà Nội làm tâm). Trục: +z = nam (tường danh dự), vòm G01 ở tây nam, đi ngược chiều kim đồng hồ. */
(function () {
  const HT = window.HT;
  const RI = 20;                 // khoảng cách từ tâm tới mặt trong mỗi mặt tường
  const NF = 18;                 // số mặt
  const DA = (2 * Math.PI) / NF;
  const theta = (k) => -DA * k;  // G0k ở góc -20°·k
  const spawnFrom = {};
  for (let k = 1; k <= 17; k++) { const t = theta(k); spawnFrom['G' + String(k).padStart(2, '0')] = { x: (RI - 5) * Math.sin(t), z: (RI - 5) * Math.cos(t), yaw: t }; }
  HT.halls.G00 = {
    sky: { hdri: 'kloofendal_43d_clear_puresky', sunDir: [0.22, 1, 0.3], sunInt: 6, envInt: 1.55, exposure: 1.08, fog: false, sat: 1.04, con: 1.06, vig: 0.22, bloom: 0.1, shadowSize: 30, ao: 1.0, tint: 0xfff8ee },
    spawn: { x: 0, z: 10, yaw: 0, pitch: -0.08 },
    spawnFrom,
    map: [-24, -24, 24, 24],
    tourOrder: 'fixed',
    async build(ctx) {
      const T = THREE, N = HT.nature, A = HT.arch, P = HT.props, E = HT.expo;
      const B = ctx.B;
      const D = HT.DATA;
      const half = RI * Math.tan(DA / 2);            // nửa bề rộng mỗi mặt
      const RV = RI / Math.cos(DA / 2);              // bán kính đỉnh góc
      const WALL_H = 10.6, TH = 0.9, DRUM0 = 11.6, DRUM1 = 16.0;
      const cream = HT.mat('marble_01', { tile: 4.5, color: 0xf8f3ea, rough: 0.32, env: 1.0 });
      const paint = HT.solid(0xf3ebdc, { rough: 0.8, env: 1.0 });
      const marble = HT.mat('marble_01', { tile: 2.2, rough: 0.35, env: 1.0 });
      const marbleFloor = HT.mat('marble_01', { tile: 3.0, rough: 0.14, env: 1.1 });
      const greenM = HT.mat('marble_01', { tile: 1.6, color: 0x2c4a42, rough: 0.2, env: 1.2 });
      const gold = HT.solid(0xc9a24a, { rough: 0.28, metal: 1 });
      const red = HT.mat('velour_velvet', { tile: 0.8, color: 0x8e2420, env: 0.6 });

      /* ---------------- sàn ---------------- */
      const floorG = new T.CircleGeometry(RV + 3, 128); floorG.rotateX(-Math.PI / 2);
      B.add(marbleFloor, floorG, { uv: 'box' });
      /* vành đá xanh sát chân tường + đường chỉ vàng */
      const ring = (r0, r1, y, m) => { const g = new T.RingGeometry(r0, r1, 128); g.rotateX(-Math.PI / 2); B.add(m, g, { y, uv: 'box', noShadow: true }); };
      ring(RI - 2.2, RI + 0.2, 0.004, greenM); ring(RI - 2.35, RI - 2.2, 0.005, gold);
      ring(7.6, 8.3, 0.004, greenM); ring(8.3, 8.42, 0.005, gold); ring(7.5, 7.6, 0.005, gold);
      /* tia khảm từ bản đồ ra các vòm cửa */
      for (let k = 0; k < NF; k++) {
        const t = theta(k); const g = new T.PlaneGeometry(0.16, RI - 2.35 - 8.42); g.rotateX(-Math.PI / 2);
        const rm = (RI - 2.35 + 8.42) / 2; B.add(k === 0 ? gold : greenM, g, { x: rm * Math.sin(t), y: 0.004, z: rm * Math.cos(t), ry: t, uv: 'box', noShadow: true });
      }
      /* bản đồ hành trình khảm giữa sàn */
      const mapTex = HT.tex('ht3d/ban_do_hanh_trinh.jpg', { srgb: true });
      const mapM = new T.MeshStandardMaterial({ map: mapTex, roughness: 0.22, envMapIntensity: 0.9 });
      const mg = new T.CircleGeometry(7.5, 128); mg.rotateX(-Math.PI / 2);
      const mapMesh = new T.Mesh(mg, mapM); mapMesh.position.y = 0.006; mapMesh.receiveShadow = true; ctx.add(mapMesh);
      ctx.groundMeshes.push(mapMesh);
      const fl = new T.Mesh(new T.CircleGeometry(RV + 3, 64).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ visible: false }));
      ctx.add(fl); ctx.groundMeshes.push(fl);
      ctx.click(mapMesh, { kicker: 'Sảnh Hành trình', title: 'Bản đồ hành trình tìm đường cứu nước 1911 – 1941', sub: 'The journey, 1911 – 1941', img: 'ht3d/ban_do_hanh_trinh.jpg', imgW: 4096, imgH: 4096,
        paras: ['Bản đồ dùng phép chiếu phương vị đẳng cự lấy Hà Nội làm tâm: khoảng cách từ tâm ra mọi nơi đúng theo tỉ lệ. Đường vàng nối các nơi Người đã sống và làm việc: Sài Gòn (6/1911), Marseille, Le Havre, New York và Boston (1912–1913), London (1913–1917), Paris (1917–1923), Petrograd và Mátxcơva (1923–1924), Quảng Châu (1924–1927), Thái Lan (1928–1929), Hồng Kông (1930), Mátxcơva (1934–1938), Côn Minh – Quế Lâm (1938–1940), và trở về Pác Bó ngày 28/1/1941.', 'Mỗi địa danh trên bản đồ là một gian của bảo tàng; đi qua các vòm cửa quanh sảnh theo thứ tự là đi lại con đường ấy.'],
        credit: 'Bản đồ nền: Natural Earth (phạm vi công cộng) · vẽ cho bảo tàng', label: 'Bản đồ hành trình 1911 – 1941' });

      /* ---------------- tường 18 mặt, vòm cửa, hốc tường ---------------- */
      const archW = 3.4, spring = 4.8;
      for (let k = 0; k < NF; k++) {
        const t = theta(k);
        const cx = RI * Math.sin(t), cz = RI * Math.cos(t);
        const portal = k >= 1 && k <= 17;
        const outline = [[-half, 0], [half, 0], [half, WALL_H], [-half, WALL_H]];
        const holes = portal ? [HT.archPath(0, 0, archW, spring, 20)] : [];
        const g = HT.extrude(outline, TH, holes, { curve: 20 });
        g.rotateY(Math.PI);  /* mặt đùn nằm ở +z; quay để mặt trong hướng vào tâm */
        g.translate(0, 0, TH);
        B.add(cream, g, { x: cx, z: cz, ry: t, uv: 'box', uvYaw: t });
        /* chân tường đá xanh, gờ chỉ vàng */
        const f = A.frame(cx, cz, t);
        for (const [x0, x1] of portal ? [[-half, -archW / 2 - 0.12], [archW / 2 + 0.12, half]] : [[-half, half]]) {
          const [bx, bz] = f((x0 + x1) / 2, -0.04); B.box(greenM, x1 - x0, 0.55, 0.1, bx, 0, bz, t);
          const [gx, gz] = f((x0 + x1) / 2, -0.09); B.box(gold, x1 - x0, 0.03, 0.03, gx, 0.55, gz, t);
          ctx.colBox(...f((x0 + x1) / 2, TH / 2), x1 - x0, TH, t, -1, 20);
        }
        if (portal) {
          /* khung vòm: trụ áp tường + vành vòm */
          for (const sx of [-1, 1]) { const [px, pz] = f(sx * (archW / 2 + 0.25), -0.08); B.box(marble, 0.4, spring, 0.16, px, 0, pz, t); B.box(gold, 0.5, 0.12, 0.2, px, spring - 0.12, pz, t); }
          const arc = new T.TorusGeometry(archW / 2 + 0.2, 0.14, 8, 32, Math.PI);
          B.add(marble, arc, { x: cx - Math.sin(t) * 0.02, y: spring, z: cz - Math.cos(t) * 0.02, ry: t, uv: 'box' });
          /* hốc sâu phía sau vòm */
          const nd = 1.9, nz0 = TH;
          for (const sx of [-1, 1]) { const [wx, wz] = f(sx * (archW / 2 + 0.1), nz0 + nd / 2); B.box(cream, 0.2, 6.7, nd, wx, 0, wz, t); ctx.colBox(wx, wz, 0.2, nd, t, -1, 20); }
          { const [wx, wz] = f(0, nz0 + nd + 0.1); B.box(greenM, archW + 0.4, 6.7, 0.2, wx, 0, wz, t); ctx.colBox(wx, wz, archW + 0.4, 0.2, t, -1, 20); }
          { const [wx, wz] = f(0, nz0 + nd / 2); B.box(cream, archW + 0.4, 0.2, nd + 0.2, wx, 6.6, wz, t); B.box(marbleFloor, archW + 0.4, 0.02, nd + 0.3, wx, -0.01, wz, t); }
          /* hộp đèn ảnh tư liệu ở đáy hốc */
          const ma = 'G' + String(k).padStart(2, '0');
          const d = D.gian[ma];
          const a = (d.anh || [])[0];
          if (a) {
            const asp = a.w && a.h ? a.w / a.h : 1.4;
            let pw = 2.7, ph = pw / asp; if (ph > 3.1) { ph = 3.1; pw = ph * asp; }
            const tex = HT.tex('textures/ht/' + a.tep, { srgb: true });
            const pm = new T.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.32, roughness: 0.6, envMapIntensity: 0.25 });
            const pg = new T.PlaneGeometry(pw, ph);
            const mesh = new T.Mesh(pg, pm);
            const [px, pz] = f(0, nz0 + nd - 0.05);
            mesh.position.set(px, 3.35, pz); mesh.rotation.y = t + Math.PI;
            ctx.add(mesh);
            const [fx, fz] = f(0, nz0 + nd - 0.01); B.box(gold, pw + 0.12, ph + 0.12, 0.03, fx, 3.35 - ph / 2 - 0.06, fz, t);
            ctx.click(mesh, E.infoPhoto(d, a));
          }
          /* biển tên gian trên đỉnh vòm */
          const pt = HT.canvasTex('hubplq_' + ma, 2048, 400, (g2, W, H) => {
            g2.clearRect(0, 0, W, H);
            g2.fillStyle = 'rgba(18,64,58,0.92)'; g2.fillRect(0, 0, W, H);
            g2.strokeStyle = '#c9a24a'; g2.lineWidth = 8; g2.strokeRect(14, 14, W - 28, H - 28);
            g2.textAlign = 'center'; g2.fillStyle = '#e4c983'; g2.font = `600 64px ${HT.FONT_SANS}`;
            g2.fillText('GIAN ' + ma.slice(1) + '  ·  ' + d.nam, W / 2, 110);
            g2.fillStyle = '#f7efdc'; let sz = 132; g2.font = `bold ${sz}px ${HT.FONT_SERIF}`;
            while (g2.measureText(d.ten.toUpperCase()).width > W - 120 && sz > 50) { sz -= 4; g2.font = `bold ${sz}px ${HT.FONT_SERIF}`; }
            g2.fillText(d.ten.toUpperCase(), W / 2, 265);
            g2.fillStyle = '#bfb6a2'; g2.font = `italic 54px ${HT.FONT_SERIF}`; g2.fillText(d.noi, W / 2, 350);
          });
          const plq = new T.Mesh(new T.PlaneGeometry(5.6, 1.1), new T.MeshStandardMaterial({ map: pt, roughness: 0.4, envMapIntensity: 0.8, emissive: 0xffffff, emissiveMap: pt, emissiveIntensity: 0.12 }));
          const [qx, qz] = f(0, -0.06); plq.position.set(qx, 8.1, qz); plq.rotation.y = t + Math.PI; ctx.add(plq);
          /* cổng đi vào gian */
          const [gx2, gz2] = f(0, nz0 + 0.55);
          E.gate(ctx, { x: gx2, z: gz2, ry: t, to: ma, top: 'GIAN ' + ma.slice(1) + ' · ' + d.nam, main: d.ten, sub: d.ten_en, w: 2.4, key: 'hub' + k, noSign: true, noLight: true, frame: false, veil: 0.45 });
        }
      }
      /* cột ở các góc mặt */
      for (let k = 0; k < NF; k++) {
        const t = theta(k) + DA / 2;
        const r = RV - 0.55;
        A.column(B, marble, r * Math.sin(t), 0, r * Math.cos(t), 0.42, WALL_H, { base: greenM, baseH: 0.5, cap: gold, seg: 24 });
        ctx.colCircle(r * Math.sin(t), r * Math.cos(t), 0.5);
      }
      /* diềm mái (entablature) và chân tường vòng trống */
      const cor = HT.lathe([[RV + 0.1, DRUM0], [RI - 0.7, DRUM0], [RI - 0.7, DRUM0 - 0.2], [RI - 0.5, DRUM0 - 0.35], [RI - 0.35, DRUM0 - 0.55], [RI - 0.25, WALL_H + 0.15], [RI - 0.2, WALL_H], [RV + 0.1, WALL_H]], NF * 4);
      B.add(HT.mat('white_plaster_02', { tile: 2, color: 0xf6f0e4, side: T.DoubleSide }), cor, { uv: 'keep' });
      const gl = new T.TorusGeometry(RI - 0.72, 0.035, 6, 180); gl.rotateX(Math.PI / 2);
      B.add(gold, gl, { y: DRUM0 - 0.02 });
      /* trống tường có cửa sổ vòm */
      for (let k = 0; k < NF; k++) {
        const t = theta(k), cx = (RI - 0.6) * Math.sin(t), cz = (RI - 0.6) * Math.cos(t);
        const hw = (RI - 0.6) * Math.tan(DA / 2);
        const g = HT.extrude([[-hw, 0], [hw, 0], [hw, DRUM1 - DRUM0], [-hw, DRUM1 - DRUM0]], 0.6, [HT.archPath(0, 0.7, 2.3, 2.6, 16)], { curve: 16 });
        g.rotateY(Math.PI); g.translate(0, DRUM0, 0.6);
        B.add(paint, g, { x: cx, z: cz, ry: t, uv: 'box', uvYaw: t });
        const f = A.frame(cx, cz, t);
        const [sx, sz] = f(0, 0.3); B.box(gold, 2.5, 0.08, 0.7, sx, DRUM0 + 0.62, sz, t);
      }
      /* mái vòm ô trám */
      const cof = HT.canvasTex('coffer', 512, 512, (g2, W, H) => {
        g2.fillStyle = '#efe6d4'; g2.fillRect(0, 0, W, H);
        const steps = [[40, '#e6dccb'], [80, '#ddd2bf'], [120, '#d3c7b2']];
        for (const [m, c] of steps) { g2.fillStyle = c; g2.fillRect(m, m, W - 2 * m, H - 2 * m); }
        g2.strokeStyle = '#c9a24a'; g2.lineWidth = 6; g2.strokeRect(120, 120, W - 240, H - 240);
        g2.fillStyle = '#c9a24a'; g2.beginPath();
        for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283; const rr = i % 2 ? 26 : 62; g2.lineTo(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr); }
        g2.closePath(); g2.fill();
      });
      const hcv = HT.canvas(256, 256); { const g2 = hcv.getContext('2d'); g2.fillStyle = '#fff'; g2.fillRect(0, 0, 256, 256); [[20, 200], [40, 150], [60, 100]].forEach(([m, v]) => { g2.fillStyle = `rgb(${v},${v},${v})`; g2.fillRect(m, m, 256 - 2 * m, 256 - 2 * m); }); }
      const cofN = HT.heightToNormal('coffer_n', hcv, 6);
      const RD = RV - 0.6;
      const th0 = Math.asin(3.2 / RD);
      const dome = new T.SphereGeometry(RD, NF * 4, 22, 0, Math.PI * 2, th0, Math.PI / 2 - th0);
      { const p = dome.attributes.position, uv = dome.attributes.uv;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const az = Math.atan2(x, z); const pol = Math.acos(HT.clamp(y / RD, -1, 1)); uv.setXY(i, ((az / (2 * Math.PI)) + 0.5) * NF * 2, ((Math.PI / 2 - pol) / (Math.PI / 2 - th0)) * 10); } }
      const domeM = new T.MeshStandardMaterial({ map: cof, normalMap: cofN, roughness: 0.75, side: T.BackSide, envMapIntensity: 0.9 });
      const dm = new T.Mesh(dome, domeM); dm.position.y = DRUM1; dm.castShadow = true; dm.receiveShadow = true; ctx.add(dm);
      /* vỏ ngoài chắn sáng + vành giếng trời */
      const shell = new T.Mesh(new T.SphereGeometry(RD + 0.5, 48, 16, 0, Math.PI * 2, Math.asin(3.2 / (RD + 0.5)), Math.PI / 2), new T.MeshStandardMaterial({ color: 0x8a8a84, roughness: 0.8 }));
      shell.position.y = DRUM1; shell.castShadow = true; ctx.add(shell);
      const oc = new T.TorusGeometry(3.25, 0.22, 10, 64); oc.rotateX(Math.PI / 2);
      B.add(gold, oc, { y: DRUM1 + RD * Math.cos(th0) });
      /* ---------------- tường danh dự: chữ tiêu đề ---------------- */
      const tt = HT.canvasTex('hub_title', 2048, 560, (g2, W, H) => {
        g2.clearRect(0, 0, W, H); g2.textAlign = 'center';
        g2.shadowColor = 'rgba(80,50,10,0.55)'; g2.shadowBlur = 10; g2.shadowOffsetY = 5;
        g2.fillStyle = '#c9a24a'; g2.font = `bold 170px ${HT.FONT_SERIF}`; g2.fillText('BẢO TÀNG HÀNH TRÌNH', W / 2, 210);
        g2.font = `600 74px ${HT.FONT_SERIF}`; g2.fillText('CUỘC ĐỜI CHỦ TỊCH HỒ CHÍ MINH', W / 2, 340);
        g2.font = `italic 56px ${HT.FONT_SERIF}`; g2.fillStyle = '#9c7a34'; g2.fillText('1890 – 1969', W / 2, 450);
      });
      const tm = new T.Mesh(new T.PlaneGeometry(5.2, 1.42), new T.MeshStandardMaterial({ map: tt, transparent: true, roughness: 0.3, metalness: 0.6, envMapIntensity: 1.4 }));
      tm.position.set(0, 8.3, RI - 0.07); tm.rotation.y = Math.PI; ctx.add(tm);
      B.box(HT.mat('marble_01', { tile: 1.6, color: 0x1d3b35, rough: 0.2, env: 1.2 }), 5.5, 1.75, 0.05, 0, 8.3 - 0.875, RI - 0.03, 0);
      B.box(gold, 5.7, 0.05, 0.07, 0, 8.3 - 0.92, RI - 0.04, 0); B.box(gold, 5.7, 0.05, 0.07, 0, 8.3 + 0.87, RI - 0.04, 0);
      /* thảm đỏ trước tường danh dự */
      B.box(red, 6.2, 0.012, 3.2, 0, 0.004, RI - 3.2, 0, { noShadow: true });

      /* ---------------- trưng bày của sảnh ---------------- */
      E.hallSet(ctx, {
        name: [0, 12.6, Math.PI],
        stories: [[-6.3, 14.6, Math.PI - 0.4], [6.3, 14.6, Math.PI + 0.4]],
        moc: [-10.8, 10.8, Math.PI - 0.8],
        photos: [[0, RI - 0.12, Math.PI, 2.3, 'wall'], [10.8, 10.8, Math.PI + 0.8, 1.2]],
        quote: [0, 16.4, Math.PI],
        y: { photo0: 2.25 },
      });
      /* ghế nghỉ và cây cảnh */
      for (let k = 0; k < 6; k++) {
        const t = theta(k * 3 + 1.5); const r = 12.2;
        HT.model(ctx, 'chinese_sofa', { x: r * Math.sin(t), z: r * Math.cos(t), ry: t + Math.PI, w: 2.0, env: 0.8, col: true });
      }
      for (let k = 0; k < NF; k += 2) {
        const t = theta(k) + DA / 2; const r = RV - 1.6;
        HT.model(ctx, 'potted_plant_01', { x: r * Math.sin(t), z: r * Math.cos(t), h: 1.9, env: 0.8, col: 'circle' });
      }
      /* đèn ấm treo dọc tường (không đổ bóng) */
      for (let k = 0; k < NF; k += 3) {
        const t = theta(k) + DA / 2; const r = RI - 3;
        const l = new T.PointLight(0xffd6a0, 22, 16, 2); l.position.set(r * Math.sin(t), 7.5, r * Math.cos(t)); ctx.add(l);
      }
      ctx.bounds = []; for (let i = 0; i < 72; i++) { const a = (i / 72) * 6.283; ctx.bounds.push([(RV + 2.4) * Math.sin(a), (RV + 2.4) * Math.cos(a)]); }
    },
  };
})();
