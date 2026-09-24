/* BẢO TÀNG HÀNH TRÌNH — phương tiện: tàu hơi nước (Amiral Latouche-Tréville, 1911), thuyền nan / thuyền mui,
   thuyền buồm Trung Hoa, ô tô (ZIS-110, Pobeda GAZ-M20, Peugeot 404), xe buýt London B-type, xe kéo tay.
   Vỏ tàu dựng bằng các mặt cắt ngang (siêu elip) nối dọc thân; ô tô đùn từ biên dạng mặt bên có vát cạnh. */
(function () {
  'use strict';
  const T = THREE;
  const HT = window.HT;
  const V = (HT.vehicles = {});

  /* ---------------- vỏ tàu ----------------
     L dài, Bw rộng, D mớn nước (dưới mặt nước), F mạn khô giữa thân; o.sheerBow, o.sheerStern (độ cong boong),
     o.full (độ đầy siêu elip), o.bowRake (mũi xiên), o.counter (đuôi tàu vươn ra sau). Tâm: giữa thân, y=0 là mặt nước,
     trục x dọc thân (+x = mũi). */
  V.hullGeo = function (L, Bw, D, F, o) {
    o = o || {};
    const ns = o.ns || 60, nk = o.nk || 12;
    const full = o.full || 3.2;
    const pos = [], uv = [], idx = [];
    const halfW = (s) => {
      const bowS = o.bowS || 0.72, sternS = o.sternS || 0.2;
      if (s > bowS) { const t = (s - bowS) / (1 - bowS); return Math.max(0.012, Math.pow(1 - Math.pow(t, 1.7), 0.62)); }
      if (s < sternS) { const t = (sternS - s) / sternS; return Math.max(0.35, 1 - 0.55 * Math.pow(t, 1.6)); }
      return 1;
    };
    const sheer = (s) => F + (o.sheerBow || 1.4) * Math.pow(Math.max(0, s - 0.55) / 0.45, 2) + (o.sheerStern || 0.7) * Math.pow(Math.max(0, 0.35 - s) / 0.35, 2);
    const keel = (s) => {
      let d = -D;
      if (s < 0.08) d = -D + D * 0.85 * Math.pow((0.08 - s) / 0.08, 1.3);   // đuôi tàu vươn (counter)
      if (s > 0.94) d = -D + D * 0.9 * Math.pow((s - 0.94) / 0.06, 1.5);
      return d;
    };
    for (const side of [1, -1]) {
      const base = pos.length / 3;
      for (let i = 0; i <= ns; i++) {
        const s = i / ns; const x = (s - 0.5) * L + (s > 0.94 ? (o.bowRake || 0) * (s - 0.94) / 0.06 : 0);
        const hw = (Bw / 2) * halfW(s), top = sheer(s), bot = keel(s);
        for (let k = 0; k <= nk; k++) {
          const th = (k / nk) * (Math.PI / 2);   // 0: đáy giữa, π/2: mạn
          const cx = Math.pow(Math.sin(th), 2 / full), cy = Math.pow(Math.cos(th), 2 / full);
          let y = bot * cy;
          if (k === nk) y = 0;
          const z = side * hw * cx;
          pos.push(x, y, z);
          uv.push(s * L, y);
        }
        // phần mạn thẳng từ mặt nước lên boong
        pos.push(x, top, side * hw * (1 + 0.02));
        uv.push(s * L, top);
      }
      const row = nk + 2;
      for (let i = 0; i < ns; i++) for (let k = 0; k < row - 1; k++) {
        const a = base + i * row + k, b = a + row;
        if (side > 0) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    /* vách đuôi (transom): quạt tam giác nối hai mặt cắt đầu tiên */
    {
      const row = nk + 2, nPer = (ns + 1) * row;
      const c = pos.length / 3; pos.push(-L / 2, sheer(0) * 0.5 + keel(0) * 0.5, 0); uv.push(0, 0);
      for (let k = 0; k < row - 1; k++) { idx.push(c, k + 1, k); idx.push(c, nPer + k, nPer + k + 1); }
      idx.push(c, nPer + row - 1, row - 1);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    /* boong: dải giữa hai mép boong */
    const dp = [], du = [], di = [];
    for (let i = 0; i <= ns; i++) {
      const s = i / ns; const x = (s - 0.5) * L + (s > 0.94 ? (o.bowRake || 0) * (s - 0.94) / 0.06 : 0);
      const hw = (Bw / 2) * halfW(s) * 1.0, top = sheer(s) - (o.bulwark || 1.1);
      dp.push(x, top, -hw, x, top, hw); du.push(s * L, -hw, s * L, hw);
    }
    for (let i = 0; i < ns; i++) { const a = i * 2; di.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const deck = new T.BufferGeometry();
    deck.setAttribute('position', new T.Float32BufferAttribute(dp, 3)); deck.setAttribute('uv', new T.Float32BufferAttribute(du, 2));
    deck.setIndex(di); deck.computeVertexNormals();
    return { hull: g, deck, sheer, halfW: (s) => (Bw / 2) * halfW(s) };
  };

  /* ---------------- tàu Amiral Latouche-Tréville (Chargeurs Réunis, 1903) ----------------
     Dài giữa hai trụ 118,7 m (toàn bộ ~124 m), rộng 15,2 m; một ống khói cao màu đen sau giữa thân, hai cột buồm,
     thượng tầng ba lớp giữa thân, mũi thẳng, đuôi tàu vươn (counter); thân sẫm, thượng tầng sáng. */
  V.hullTex = function (key, L, name, o) {
    o = o || {};
    return HT.canvasTex('hull_' + key, 4096, 256, (g, W, H) => {
      const top = o.top || 7.2, bot = -(o.draft || 7.4);
      const yPx = (y) => ((top - y) / (top - bot)) * H;
      g.fillStyle = o.hull || '#1b1b1d'; g.fillRect(0, 0, W, H);
      g.fillStyle = o.boot || '#7a2a22'; g.fillRect(0, yPx(0.35), W, H - yPx(0.35));
      g.fillStyle = '#e8e2d2'; g.fillRect(0, yPx(0.55), W, yPx(0.35) - yPx(0.55));
      /* mạn trên sơn trắng (thượng tầng mạn) */
      if (o.whiteBand) { g.fillStyle = '#e9e4d6'; g.fillRect(0, 0, W, yPx(top - o.whiteBand)); }
      /* hàng lỗ cửa sổ tròn */
      const r = HT.rng(3);
      for (const [yy, step] of [[4.2, 2.4], [2.2, 3.6]]) {
        for (let x = 0.12; x < 0.88; x += step / L) {
          if (r() < 0.12) continue;
          const px = x * W, py = yPx(yy);
          g.fillStyle = '#c9c1ac'; g.beginPath(); g.arc(px, py, 5, 0, 6.283); g.fill();
          g.fillStyle = '#20282c'; g.beginPath(); g.arc(px, py, 3.3, 0, 6.283); g.fill();
        }
      }
      /* vệt gỉ nhẹ */
      for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(110,60,30,${r.range(0.03, 0.1)})`; g.fillRect(r() * W, yPx(top) + r() * 40, 2, r.range(6, 30)); }
      /* tên tàu ở mũi */
      if (name) {
        g.fillStyle = '#e9e4d6'; g.font = `bold 34px ${HT.FONT_SANS}`; g.textAlign = 'right';
        g.fillText(name, W * 0.985, yPx(5.2)); g.textAlign = 'left';
      }
      /* vạch mớn nước ở mũi, lái */
      g.fillStyle = '#e9e4d6'; g.font = `bold 14px ${HT.FONT_SANS}`;
      for (let m = 1; m <= 7; m++) { g.fillText(String(m * 2) , W * 0.992, yPx(-m + 0.3)); g.fillText(String(m * 2), W * 0.004, yPx(-m + 0.3)); }
    });
  };
  V.steamer = function (ctx, o) {
    const T3 = T;
    const L = o.L || 124, Bw = o.B || 15.2, D = o.draft || 7.4, F = o.freeboard || 6.2;
    const grp = new T3.Group(); grp.position.set(o.x, o.y || 0, o.z); grp.rotation.y = o.ry || 0; ctx.add(grp);
    const B = new HT.Builder(null);
    const H = V.hullGeo(L, Bw, D, F, { sheerBow: 1.8, sheerStern: 0.9, full: 3.4, bowRake: 0.6, bulwark: 1.15 });
    const hullTex = V.hullTex(o.key || 'ship', L, o.name || '', { top: F + 1.8, draft: D });
    /* UV vỏ: u = vị trí dọc (0..1), v = cao độ */
    const huv = H.hull.attributes.uv; const hp = H.hull.attributes.position;
    for (let i = 0; i < huv.count; i++) { const x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i); const u = (x / L) + 0.5; huv.setXY(i, z > 0 ? u : 1 - u, (y + D) / (F + 1.8 + D)); }
    const hullM = new T3.MeshStandardMaterial({ map: hullTex, roughness: 0.55, metalness: 0.25, envMapIntensity: 0.9, side: T3.DoubleSide });
    const hm = new T3.Mesh(H.hull, hullM); hm.castShadow = true; hm.receiveShadow = true; grp.add(hm);
    const deckM = HT.mat('wood_floor_deck', { tile: 1.6, color: 0xc9b89a, env: 0.7 });
    B.add(deckM, H.deck, { uv: 'box' });
    const white = HT.solid(0xece6d6, { rough: 0.5, env: 0.9 });
    const cream = HT.solid(0xd9ccb0, { rough: 0.6 });
    const black = HT.solid(0x141414, { rough: 0.45, metal: 0.3 });
    const wood = HT.mat('dark_wood', { tile: 1, env: 0.7 });
    const deckY = (x) => H.sheer(x / L + 0.5) - 1.15;
    /* be mạn (bulwark) trong */
    /* thượng tầng giữa thân: 3 tầng, có hành lang dạo */
    const sx0 = -18, sx1 = 20;
    const y0 = deckY(0);
    const tiers = [[sx0, sx1, Bw - 2.4, 2.6], [sx0 + 3, sx1 - 4, Bw - 4.2, 2.5], [sx0 + 8, sx1 - 12, 7.5, 2.4]];
    let yy = y0;
    const win = HT.canvasTex('ship_win', 512, 128, (g, W, Hh) => {
      g.fillStyle = '#ece6d6'; g.fillRect(0, 0, W, Hh);
      for (let x = 12; x < W; x += 42) { g.fillStyle = '#23303a'; g.fillRect(x, 34, 24, 44); g.strokeStyle = '#8a8474'; g.lineWidth = 3; g.strokeRect(x, 34, 24, 44); }
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, Hh - 10, W, 10);
    });
    const winM = new T3.MeshStandardMaterial({ map: win, roughness: 0.5, envMapIntensity: 0.9 });
    for (const [a, b, w, h] of tiers) {
      const g = new T3.BoxGeometry(b - a, h, w);
      const uvA = g.attributes.uv; for (let i = 0; i < uvA.count; i++) { const face = Math.floor(i / 4); const L2 = face < 2 ? w : b - a; uvA.setXY(i, uvA.getX(i) * L2 / 12, uvA.getY(i)); }
      const m = new T3.Mesh(g, winM); m.position.set((a + b) / 2, yy + h / 2, 0); m.castShadow = true; m.receiveShadow = true; grp.add(m);
      B.box(white, b - a + 1.2, 0.12, w + 1.0, (a + b) / 2, yy + h, 0, 0);
      /* lan can hành lang tầng */
      for (const sd of [-1, 1]) HT.arch.railing(B, white, [[a - 0.5, sd * (w / 2 + 0.45)], [b + 0.5, sd * (w / 2 + 0.45)]], yy + h + 0.12, { h: 1.0, spacing: 1.2, r: 0.03, mid: true });
      yy += h + 0.12;
    }
    /* buồng lái */
    B.box(white, 4, 2.4, 9.5, sx0 + 13, yy, 0, 0);
    B.box(HT.glass(), 0.05, 0.9, 8.6, sx0 + 15.02, yy + 1.2, 0, 0);
    B.box(white, 5, 0.12, Bw - 0.5, sx0 + 13, yy + 2.4, 0, 0);
    /* ống khói: sau giữa thân, cao, đen */
    const fx = sx1 - 16;
    const fg = new T3.CylinderGeometry(1.55, 1.7, 13, 24); fg.scale(1.25, 1, 1);
    B.add(black, fg, { x: fx, y: yy + 6.5, z: 0, rz: -0.06 });
    B.add(HT.solid(0x0a0a0a, { rough: 0.9 }), new T3.CylinderGeometry(1.45, 1.45, 0.3, 24).scale(1.25, 1, 1), { x: fx + 0.78, y: yy + 13.05, z: 0, rz: -0.06 });
    /* ống thông gió (cổ ngỗng) */
    for (const [vx, vz] of [[sx0 - 2, 3], [sx0 - 2, -3], [sx1 + 3, 3.5], [sx1 + 3, -3.5], [fx - 5, 3], [fx + 4, -3]]) {
      B.cyl(white, 0.35, 0.35, 3.2, vx, y0, vz, 12);
      const cw = new T3.TorusGeometry(0.5, 0.35, 8, 12, Math.PI / 2); cw.rotateY(vz > 0 ? 0 : Math.PI);
      B.add(HT.solid(0xb9322a, { rough: 0.5 }), cw, { x: vx, y: y0 + 3.2, z: vz });
    }
    /* cột buồm trước/sau + cần cẩu hàng + dây chằng */
    const mastM = HT.solid(0xc9a86a, { rough: 0.6 });
    const masts = [[L * 0.3, 32], [-L * 0.3, 29]];
    const lines = [];
    for (const [mx, mh] of masts) {
      const my0 = deckY(mx);
      B.cyl(mastM, 0.22, 0.38, mh, mx, my0, 0, 12);
      B.cyl(mastM, 0.12, 0.2, 8, mx, my0 + mh - 0.5, 0, 8);
      for (const sd of [-1, 1]) {
        B.beam(black, mx, my0 + 1.5, 0, mx + (mx > 0 ? 10 : -10), my0 + 7, sd * 1.5, 0.18, 0.18, { round: true });
        for (let k = 0; k < 3; k++) lines.push([mx, my0 + mh - 2, 0, mx + (k - 1) * 2.2, deckY(mx) + 0.3, sd * (H.halfW(mx / L + 0.5) - 0.2)]);
      }
      lines.push([mx, my0 + mh + 7, 0, mx > 0 ? L * 0.5 + 1 : -L * 0.5, deckY(mx > 0 ? L * 0.49 : -L * 0.49) + 1, 0]);
    }
    lines.push([masts[0][0], deckY(masts[0][0]) + masts[0][1] + 6, 0, masts[1][0], deckY(masts[1][0]) + masts[1][1] + 6, 0]);
    const lp = []; for (const l of lines) lp.push(...l);
    const lg = new T3.BufferGeometry(); lg.setAttribute('position', new T3.Float32BufferAttribute(lp, 3));
    const ls = new T3.LineSegments(lg, new T3.LineBasicMaterial({ color: 0x2a2620 })); grp.add(ls);
    /* xuồng cứu sinh trên giá */
    for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
      const bx = sx0 + 4 + i * 7.5, bz = sd * (tiers[1][2] / 2 + 1.1);
      const bh = V.hullGeo(7, 2.1, 0.7, 0.2, { ns: 16, nk: 6, full: 2.6, sheerBow: 0.25, sheerStern: 0.25, bowS: 0.7, sternS: 0.3, bulwark: 0.3 });
      B.add(white, bh.hull, { x: bx, y: tiers[0][3] + y0 + 2.9, z: bz, uv: 'box' });
      for (const dx of [-3, 3]) B.beam(black, bx + dx, tiers[0][3] + y0 + 0.2, bz - sd * 0.8, bx + dx, tiers[0][3] + y0 + 3.6, bz, 0.08, 0.08, { round: true });
    }
    /* thành mạn phía mũi/lái (khoang hở) */
    B.box(white, 10, 2.2, Bw - 3, L * 0.5 - 16, deckY(L * 0.37), 0, 0);
    B.box(white, 9, 2.0, Bw - 3.5, -L * 0.5 + 12, deckY(-L * 0.4), 0, 0);
    /* nắp hầm hàng */
    for (const hx of [L * 0.22, L * 0.36, -L * 0.22, -L * 0.34]) B.box(HT.mat('weathered_brown_planks', { tile: 1.5 }), 6, 0.6, 5.5, hx, deckY(hx), 0, 0);
    /* neo */
    for (const sd of [-1, 1]) B.add(black, new T3.TorusGeometry(0.4, 0.12, 6, 12), { x: L * 0.5 - 3, y: deckY(L * 0.47) - 0.6, z: sd * (H.halfW(0.97) + 0.1), rx: Math.PI / 2 });
    /* cờ hiệu (Chargeurs Réunis) trên cột trước, quốc kỳ Pháp ở lái */
    B.build(grp);
    const flagAt = (kind, x, y, w) => { const f = HT.props.flag(ctx, 0, 0, 0, { kind, pole: 0, w, amp: 0.1 }); grp.add(f); f.position.set(x, y, 0); };
    flagAt('cr', masts[0][0] + 0.2, deckY(masts[0][0]) + masts[0][1] + 6.5, 2.2);
    flagAt('fr', -L * 0.5 - 0.3, deckY(-L * 0.49) + 4.5, 2.4);
    B.box; // (đã dựng)
    const B2 = new HT.Builder(null); B2.cyl(mastM, 0.06, 0.08, 5, -L * 0.5 + 0.8, deckY(-L * 0.49), 0, 6); B2.build(grp);
    /* va chạm: cả thân tàu */
    const c = Math.cos(o.ry || 0), s = Math.sin(o.ry || 0);
    ctx.colBox(o.x, o.z, L, Bw, o.ry || 0, -10, 40);
    return grp;
  };

  /* ---------------- thuyền nan có mui (sông Hương, sông Sài Gòn) ---------------- */
  V.sampan = function (ctx, B, x, y, z, ry, o) {
    o = o || {};
    const L = o.L || 7, Bw = o.B || 1.6;
    const H = V.hullGeo(L, Bw, 0.35, 0.35, { ns: 20, nk: 6, full: 2.2, sheerBow: 0.35, sheerStern: 0.3, bowS: 0.65, sternS: 0.32, bulwark: 0.3 });
    const wood = HT.mat('weathered_brown_planks', { tile: 1.2, color: 0x8a7458, env: 0.7 });
    B.add(wood, H.hull, { x, y, z, ry, uv: 'box' });
    B.add(HT.mat('bamboo_veneer', { tile: 0.8, color: 0x9a8666 }), H.deck, { x, y: y + 0.02, z, ry, uv: 'box' });
    if (o.mui !== false) {
      const mg = new T.CylinderGeometry(Bw * 0.55, Bw * 0.55, L * 0.38, 16, 1, true, -Math.PI / 2, Math.PI);
      mg.rotateZ(Math.PI / 2);
      const m = HT.mat('bamboo_wall_02', { tile: 0.8, color: 0x7a6448, side: T.DoubleSide });
      B.add(m, mg, { x, y: y + 0.3, z, ry, uv: 'box' });
    }
    const c = Math.cos(ry), s = Math.sin(ry);
    B.beam(HT.props.M.tre(), x + c * L * 0.3, y + 0.4, z - s * L * 0.3, x + c * L * 0.5, y + 2.8, z - s * L * 0.5, 0.03, 0.03, { round: true, seg: 5 });
  };
  /* thuyền buồm Trung Hoa (junk) cho cảng Hồng Kông, Quảng Châu */
  V.junk = function (ctx, x, y, z, ry, o) {
    o = o || {};
    const grp = new T.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; ctx.add(grp);
    const B = new HT.Builder(null);
    const L = o.L || 16;
    const H = V.hullGeo(L, 4.2, 1.2, 1.2, { ns: 24, nk: 8, full: 2.4, sheerBow: 1.0, sheerStern: 2.2, bowS: 0.7, sternS: 0.25, bulwark: 0.5 });
    B.add(HT.mat('weathered_brown_planks', { tile: 1.4, color: 0x6a5238 }), H.hull, { uv: 'box' });
    B.add(HT.mat('weathered_planks', { tile: 1.4 }), H.deck, { uv: 'box' });
    const sail = HT.canvasTex('junk_sail', 256, 512, (g, W, Hh) => {
      g.fillStyle = '#8a4a2a'; g.fillRect(0, 0, W, Hh);
      for (let yy = 0; yy < Hh; yy += 46) { g.fillStyle = '#3a2418'; g.fillRect(0, yy, W, 6); }
      const r = HT.rng(2); for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(0,0,0,${r.range(0.03, 0.08)})`; g.fillRect(r() * W, r() * Hh, 3, 8); }
    });
    const sm = new T.MeshStandardMaterial({ map: sail, side: T.DoubleSide, roughness: 0.9 });
    for (const [mx, mh, sw] of [[L * 0.1, 11, 6], [L * 0.33, 8, 4.2], [-L * 0.3, 7, 3.4]]) {
      B.cyl(HT.props.M.goMoc(), 0.12, 0.18, mh, mx, 1.0, 0, 8);
      const sg = new T.PlaneGeometry(sw, mh * 0.8); sg.translate(-sw * 0.3, mh * 0.5, 0);
      const m = new T.Mesh(sg, sm); m.position.set(mx, 1.0, 0); m.rotation.y = Math.PI / 2 + 0.25; m.castShadow = true; grp.add(m);
    }
    B.build(grp);
    return grp;
  };

  /* ---------------- ô tô: đùn biên dạng mặt bên, vát cạnh ---------------- */
  const CARS = {
    /* ZIS-110 (1946): limousine lớn, dài 6,0 m, rộng 1,96 m, cao 1,73 m, đen */
    zis110: { L: 6.0, W: 1.96, H: 1.73, color: 0x0c0c0e, wheelR: 0.39, wb: 3.76, ov: [0.95, 1.29],
      prof: [[0, 0.42], [0.05, 0.62], [0.2, 0.86], [1.25, 0.96], [2.05, 1.0], [2.3, 1.02], [2.75, 1.62], [3.2, 1.73], [4.2, 1.72], [4.85, 1.45], [5.45, 1.02], [5.95, 0.84], [6.0, 0.55], [5.95, 0.35], [0.05, 0.33]],
      glass: [[2.36, 1.07], [2.78, 1.58], [4.15, 1.66], [4.72, 1.42], [4.8, 1.07]], grille: 'vertical' },
    /* GAZ-M20 Pobeda (1946): lưng xe dốc (fastback), dài 4,66 m, rộng 1,70 m, cao 1,64 m, xám */
    pobeda: { L: 4.66, W: 1.7, H: 1.64, color: 0x6c7074, wheelR: 0.36, wb: 2.7, ov: [0.9, 1.06],
      prof: [[0, 0.46], [0.08, 0.72], [0.35, 0.88], [1.2, 0.96], [1.55, 1.0], [2.0, 1.56], [2.55, 1.64], [3.2, 1.55], [4.05, 1.05], [4.5, 0.8], [4.66, 0.6], [4.62, 0.36], [0.04, 0.34]],
      glass: [[1.62, 1.06], [2.04, 1.5], [2.6, 1.57], [3.15, 1.5], [3.72, 1.08]], grille: 'horizontal' },
    /* Peugeot 404 (1960): ba khoang, đuôi vây nhẹ, dài 4,44 m, rộng 1,62 m, cao 1,45 m, xám bạc */
    p404: { L: 4.44, W: 1.62, H: 1.45, color: 0xa4a8aa, wheelR: 0.33, wb: 2.65, ov: [0.83, 0.96],
      prof: [[0, 0.45], [0.05, 0.74], [0.9, 0.82], [1.35, 0.86], [1.75, 1.36], [2.1, 1.45], [3.05, 1.43], [3.45, 1.0], [4.3, 0.92], [4.44, 0.8], [4.42, 0.38], [0.03, 0.35]],
      glass: [[1.8, 0.92], [2.12, 1.38], [3.0, 1.37], [3.36, 0.98]], grille: 'horizontal' },
    /* Renault / Ford thập niên 1910 (xe mui trần) — cho phố Paris/London */
    old1910: { L: 3.9, W: 1.6, H: 2.0, color: 0x1d2a22, wheelR: 0.45, wb: 2.6, ov: [0.6, 0.7],
      prof: [[0, 0.55], [0.1, 1.05], [1.1, 1.1], [1.25, 1.25], [1.5, 1.3], [1.6, 1.95], [1.7, 1.98], [3.6, 1.98], [3.7, 1.9], [3.85, 1.2], [3.9, 0.6], [3.85, 0.5], [0.05, 0.5]],
      glass: [[1.65, 1.35], [1.72, 1.85], [2.4, 1.85], [2.4, 1.35]], grille: 'vertical' },
  };
  V.CARS = CARS;
  V.car = function (ctx, kind, x, y, z, ry, o) {
    o = o || {};
    const S = CARS[kind];
    const grp = new T.Group(); grp.position.set(x, y, z); grp.rotation.y = ry || 0; ctx.add(grp);
    const B = new HT.Builder(null);
    const paint = HT.solid(o.color != null ? o.color : S.color, { rough: 0.22, metal: 0.55, env: 1.3, physical: true, phys: { clearcoat: 1, clearcoatRoughness: 0.08 } });
    const chrome = HT.solid(0xd9dcdf, { rough: 0.12, metal: 1, env: 1.4 });
    const tire = HT.solid(0x141414, { rough: 0.85 });
    const glass = HT.solid(0x10161a, { rough: 0.05, metal: 0.2, env: 1.5 });
    const inner = HT.solid(0x2a2420, { rough: 0.8 });
    const W = S.W;
    /* thân: đùn biên dạng mặt bên theo bề rộng, vát cạnh */
    const body = HT.extrude(S.prof.map(([a, b]) => [a - S.L / 2, b]), W - 0.12, null, { bevel: 0.06, curve: 8 });
    body.translate(0, 0, -(W - 0.12) / 2);
    B.add(paint, body, { uv: 'box' });
    /* kính: đa giác cửa kính nới ra 8 cm để nổi khỏi thân (kính chắn gió, kính bên) */
    const off = (pts, d) => {
      const n = pts.length; let area = 0; for (let i = 0; i < n; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n]; area += x0 * y1 - x1 * y0; }
      const sg = area > 0 ? 1 : -1;
      return pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], c = pts[(i + 1) % n];
        const e1 = [p[0] - a[0], p[1] - a[1]], e2 = [c[0] - p[0], c[1] - p[1]];
        const n1 = [e1[1] * sg, -e1[0] * sg], n2 = [e2[1] * sg, -e2[0] * sg];
        const l1 = Math.hypot(...n1) || 1, l2 = Math.hypot(...n2) || 1;
        const m = [n1[0] / l1 + n2[0] / l2, n1[1] / l1 + n2[1] / l2]; const lm = Math.hypot(...m) || 1;
        return [p[0] + (m[0] / lm) * d, p[1] + (m[1] / lm) * d];
      });
    };
    const gp = off(S.glass.map(([a, b]) => [a - S.L / 2, b]), 0.08);
    const gl = HT.extrude(gp, W + 0.02, null, {});
    gl.translate(0, 0, -(W + 0.02) / 2);
    B.add(glass, gl, { uv: 'box' });
    /* nẹp trụ kính giữa (trụ B) */
    const gx0 = gp.reduce((m, p) => Math.min(m, p[0]), 1e9), gx1 = gp.reduce((m, p) => Math.max(m, p[0]), -1e9);
    B.box(paint, 0.09, S.glass[1][1] - S.glass[0][1] + 0.1, W + 0.05, (gx0 + gx1) / 2, S.glass[0][1], 0, 0);
    /* vè bánh xe (cho xe 1910 và ZIS): hộp bo */
    /* bánh xe */
    const wx = [-S.L / 2 + S.ov[0], -S.L / 2 + S.ov[0] + S.wb];
    for (const px of wx) for (const sd of [-1, 1]) {
      const tg = new T.TorusGeometry(S.wheelR - 0.09, 0.1, 10, 28);
      B.add(tire, tg, { x: px, y: S.wheelR, z: sd * (W / 2 - 0.13) });
      const hub = new T.CylinderGeometry(S.wheelR - 0.12, S.wheelR - 0.12, 0.16, 24); hub.rotateX(Math.PI / 2);
      B.add(kind === 'old1910' ? HT.props.M.goToi() : chrome, hub, { x: px, y: S.wheelR, z: sd * (W / 2 - 0.13) });
      if (kind === 'old1910') for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.283; B.beam(HT.props.M.goToi(), px, S.wheelR, sd * (W / 2 - 0.13), px + Math.cos(a) * (S.wheelR - 0.1), S.wheelR + Math.sin(a) * (S.wheelR - 0.1), sd * (W / 2 - 0.13), 0.035, 0.035); }
    }
    /* cản trước sau, đèn, lưới tản nhiệt */
    B.box(chrome, 0.12, 0.14, W + 0.04, -S.L / 2 - 0.02, 0.28, 0, 0, { bevel: 0.04 });
    B.box(chrome, 0.12, 0.14, W + 0.04, S.L / 2 + 0.02, 0.28, 0, 0, { bevel: 0.04 });
    for (const sd of [-1, 1]) {
      const hl = new T.SphereGeometry(0.1, 16, 10); B.add(HT.solid(0xfff4dc, { rough: 0.05, emissive: 0xfff0d0, ei: 0.2 }), hl, { x: S.L / 2 - 0.02, y: S.prof[1][1] + 0.02, z: sd * (W / 2 - 0.3), sx: 0.5 });
      B.add(HT.solid(0x8a1810, { rough: 0.3 }), new T.BoxGeometry(0.04, 0.1, 0.16), { x: -S.L / 2 - 0.01, y: S.prof[S.prof.length - 3][1] - 0.05, z: sd * (W / 2 - 0.3) });
    }
    const gy = S.prof[1][1];
    if (S.grille === 'vertical') for (let k = -5; k <= 5; k++) B.box(chrome, 0.05, gy - 0.3, 0.025, S.L / 2 + 0.05, 0.36, k * 0.05, 0);
    else for (let k = 0; k < 4; k++) B.box(chrome, 0.05, 0.025, W * 0.55, S.L / 2 + 0.05, 0.42 + k * 0.07, 0, 0);
    /* nội thất nhìn qua kính */
    B.box(inner, S.L * 0.35, 0.5, W - 0.4, (S.glass[0][0] + S.glass[S.glass.length - 1][0]) / 2 - S.L / 2, 0.55, 0, 0);
    B.build(grp);
    if (o.col !== false) ctx.colBox(x, z, S.L + 0.2, W + 0.2, ry || 0, y - 1, y + S.H);
    if (o.click) ctx.click(grp, o.click);
    return grp;
  };

  /* xe buýt hai tầng mui trần London kiểu B (1910 – 1920): thân dưới đỏ, dải kính, tầng trên để trống có ghế băng,
     cầu thang xoắn phía sau, nắp máy phía trước, bánh nan gỗ, bảng chữ "GENERAL" và biển quảng cáo dọc hông */
  V.bus1914 = function (ctx, x, y, z, ry, o) {
    o = o || {};
    const grp = new T.Group(); grp.position.set(x, y, z); grp.rotation.y = ry || 0; ctx.add(grp);
    const B = new HT.Builder(null);
    const red = HT.solid(0x9c1a14, { rough: 0.35, env: 1.1 });
    const cream = HT.solid(0xe8dcc0, { rough: 0.5 });
    const black = HT.solid(0x141414, { rough: 0.5 });
    const wood = HT.mat('fine_grained_wood', { tile: 0.8, color: 0xd8b890 });
    const glass = HT.solid(0x1a2226, { rough: 0.05, metal: 0.3, env: 1.4 });
    const L = 5.2, W = 2.2, Hs = 2.1, fl = 0.75;         /* thân xe (không kể nắp máy) */
    /* sàn, thân dưới */
    B.box(black, L + 1.6, 0.25, W - 0.4, 0.4, fl - 0.25, 0, 0);
    B.box(red, L, 0.95, W, -0.4, fl, 0, 0, { bevel: 0.04 });
    B.box(cream, L, 0.12, W + 0.02, -0.4, fl + 0.95, 0, 0);
    /* dải cửa kính (6 ô mỗi bên) */
    for (let i = 0; i < 6; i++) { const cx = -0.4 - L / 2 + 0.45 + i * ((L - 0.9) / 5.0); B.box(red, 0.12, 0.85, W + 0.02, cx, fl + 1.07, 0, 0); }
    B.box(glass, L - 0.2, 0.8, W - 0.04, -0.4, fl + 1.07, 0, 0);
    B.box(red, L, 0.28, W + 0.02, -0.4, fl + 1.92, 0, 0);
    /* sàn tầng trên + lan can có biển quảng cáo */
    B.box(wood, L + 0.4, 0.08, W + 0.1, -0.2, fl + 2.2, 0, 0);
    const adv = HT.canvasTex('bus_adv_' + (o.key || 'a'), 1024, 128, (g, Wd, Hd) => {
      g.fillStyle = '#efe6cc'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, Wd, 8); g.fillRect(0, Hd - 8, Wd, 8);
      g.textAlign = 'center'; g.fillStyle = o.advColor || '#1f3a6a'; g.font = `bold 72px ${HT.FONT_SERIF}`; g.fillText(o.adv || 'THEATRE ROYAL · HAYMARKET', Wd / 2, 90);
    });
    const advM = new T.MeshStandardMaterial({ map: adv, roughness: 0.6 });
    for (const sd of [-1, 1]) {
      const pm = new T.Mesh(new T.PlaneGeometry(L + 0.3, 0.55), advM); pm.position.set(-0.2, fl + 2.58, sd * (W / 2 + 0.06)); if (sd < 0) pm.rotation.y = Math.PI; grp.add(pm);
      B.box(red, L + 0.3, 0.6, 0.04, -0.2, fl + 2.28, sd * (W / 2 + 0.03), 0);
    }
    /* ghế băng hai dãy trên tầng thượng */
    for (let i = 0; i < 6; i++) { const cx = -0.4 - L / 2 + 0.6 + i * 0.8; for (const sd of [-1, 1]) { B.box(wood, 0.36, 0.42, 0.9, cx, fl + 2.28, sd * 0.5, 0); B.box(wood, 0.06, 0.45, 0.9, cx - 0.2, fl + 2.7, sd * 0.5, 0); } }
    /* cầu thang sau: bậc xoắn + tay vịn */
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI; B.box(wood, 0.45, 0.05, 0.6, -0.4 - L / 2 - 0.35 + Math.sin(a) * 0.1, fl + k * 0.27, -Math.cos(a) * 0.5, a * 0.3); }
    B.beam(black, -0.4 - L / 2 - 0.6, fl, 0.6, -0.4 - L / 2 - 0.3, fl + 2.6, -0.5, 0.04, 0.04, { round: true });
    /* nắp máy, két nước, ghế lái */
    B.box(red, 1.25, 0.8, 1.2, L / 2 + 0.25, fl - 0.05, 0, 0, { bevel: 0.05 });
    B.box(HT.solid(0x8a8a86, { rough: 0.3, metal: 0.8 }), 0.12, 0.72, 0.95, L / 2 + 0.92, fl - 0.05, 0, 0);
    B.box(black, 0.5, 0.5, 1.1, L / 2 - 0.25, fl + 0.95, 0.3, 0);
    B.box(red, 0.08, 1.2, W, L / 2 - 0.55, fl + 0.95, 0, 0);
    /* bánh nan gỗ */
    for (const px of [L / 2 + 0.25, -0.4 - L / 2 + 1.1]) for (const sd of [-1, 1]) {
      const R = 0.5;
      B.add(black, new T.TorusGeometry(R - 0.05, 0.07, 8, 26), { x: px, y: R, z: sd * (W / 2 - 0.12) });
      for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.283; B.beam(wood, px, R, sd * (W / 2 - 0.12), px + Math.cos(a) * (R - 0.08), R + Math.sin(a) * (R - 0.08), sd * (W / 2 - 0.12), 0.04, 0.04); }
      const hub = new T.CylinderGeometry(0.1, 0.1, 0.2, 12); hub.rotateX(Math.PI / 2); B.add(black, hub, { x: px, y: R, z: sd * (W / 2 - 0.12) });
    }
    /* đèn pha, bảng tuyến */
    for (const sd of [-1, 1]) B.add(HT.solid(0xfff2d8, { rough: 0.1, emissive: 0xfff0d0, ei: 0.25 }), new T.SphereGeometry(0.1, 12, 8), { x: L / 2 + 0.95, y: fl + 0.45, z: sd * 0.45 });
    B.build(grp);
    const nm = HT.canvasTex('bus_name', 512, 128, (g, Wd, Hd) => { g.fillStyle = '#9c1a14'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#e8c860'; g.textAlign = 'center'; g.font = `bold 78px ${HT.FONT_SERIF}`; g.fillText('GENERAL', Wd / 2, 92); });
    for (const sd of [-1, 1]) { const pm = new T.Mesh(new T.PlaneGeometry(1.8, 0.45), new T.MeshStandardMaterial({ map: nm, roughness: 0.4 })); pm.position.set(-0.4, fl + 0.5, sd * (W / 2 + 0.01)); if (sd < 0) pm.rotation.y = Math.PI; grp.add(pm); }
    const route = HT.canvasTex('bus_route_' + (o.key || 'a'), 512, 128, (g, Wd, Hd) => { g.fillStyle = '#111'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#f2f2e8'; g.textAlign = 'center'; g.font = `bold 60px ${HT.FONT_SANS}`; g.fillText(o.route || '24  VICTORIA', Wd / 2, 84); });
    { const pm = new T.Mesh(new T.PlaneGeometry(1.4, 0.35), new T.MeshStandardMaterial({ map: route, roughness: 0.4 })); pm.position.set(L / 2 - 0.5, fl + 2.1, 0); pm.rotation.y = Math.PI / 2; grp.add(pm); }
    const c = Math.cos(ry || 0), s = Math.sin(ry || 0);
    ctx.colBox(x + c * 0.1, z - s * 0.1, L + 2.2, W, ry || 0, y - 1, y + 4);
    return grp;
  };

  /* xe điện bánh sắt (Boston 1912, Mátxcơva 1924, Hồng Kông 1930): thân gỗ sơn hai màu, cửa sổ dày, mái có ô thông gió,
     cần lấy điện; deck: 1 hoặc 2 tầng (Hồng Kông) */
  V.tram = function (ctx, x, y, z, ry, o) {
    o = o || {};
    const grp = new T.Group(); grp.position.set(x, y, z); grp.rotation.y = ry || 0; ctx.add(grp);
    const B = new HT.Builder(null);
    const c1 = HT.solid(o.color || 0x2e4a38, { rough: 0.35, env: 1.1 });
    const c2 = HT.solid(o.color2 || 0xe6dcc0, { rough: 0.45 });
    const black = HT.solid(0x161616, { rough: 0.5, metal: 0.4 });
    const glass = HT.solid(0x1a2226, { rough: 0.05, metal: 0.3, env: 1.4 });
    const L = o.L || 9.6, W = o.W || 2.3, deck = o.deck || 1, fl = 0.85;
    /* khung gầm, bánh */
    B.box(black, L - 1.2, 0.5, W - 0.5, 0, 0.3, 0, 0);
    for (const px of [-L / 2 + 2.2, L / 2 - 2.2]) for (const sd of [-1, 1]) { const wg = new T.CylinderGeometry(0.42, 0.42, 0.12, 20); wg.rotateX(Math.PI / 2); B.add(black, wg, { x: px, y: 0.42, z: sd * 0.72 }); }
    const floors = deck === 2 ? [[fl, 2.3], [fl + 2.45, 2.0]] : [[fl, 2.4]];
    floors.forEach(([y0, h], k) => {
      B.box(c1, L, 0.95, W, 0, y0, 0, 0, { bevel: 0.03 });
      B.box(c2, L, 0.08, W + 0.02, 0, y0 + 0.95, 0, 0);
      const nWin = Math.round((L - 1.4) / 0.9);
      for (let i = 0; i <= nWin; i++) B.box(c2, 0.1, h - 1.25, W + 0.02, -L / 2 + 0.7 + i * ((L - 1.4) / nWin), y0 + 1.03, 0, 0);
      B.box(glass, L - 1.4, h - 1.3, W - 0.06, 0, y0 + 1.05, 0, 0);
      /* hai đầu: buồng lái kính */
      for (const sd of [-1, 1]) { B.box(c1, 0.7, 1.0, W, sd * (L / 2 - 0.35), y0, 0, 0); B.box(glass, 0.06, h - 1.3, W - 0.4, sd * (L / 2 - 0.02), y0 + 1.05, 0, 0); }
      B.box(c1, L + 0.1, 0.22, W + 0.1, 0, y0 + h - 0.22, 0, 0);
    });
    const topY = floors[floors.length - 1][0] + floors[floors.length - 1][1];
    /* mái vòm thấp + ô thông gió dọc giữa */
    const roof = new T.CylinderGeometry(W * 0.62, W * 0.62, L + 0.2, 20, 1, false, -0.7, 1.4); roof.rotateZ(Math.PI / 2); roof.rotateX(Math.PI / 2); roof.scale(1, 0.35, 1);
    B.add(HT.solid(0x3a3a38, { rough: 0.7 }), roof, { x: 0, y: topY - W * 0.62 * 0.35 * Math.cos(0.7) + 0.02, z: 0, uv: 'keep' });
    B.box(c2, L * 0.6, 0.28, 0.9, 0, topY + 0.12, 0, 0);
    /* cần lấy điện */
    B.beam(black, -L * 0.1, topY + 0.3, 0, L * 0.35, topY + 2.3, 0, 0.05, 0.05, { round: true });
    B.build(grp);
    if (o.label) {
      const tx = HT.canvasTex('tram_' + o.label, 512, 128, (g, Wd, Hd) => { g.fillStyle = '#141414'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#f2ecd8'; g.textAlign = 'center'; g.font = `bold 62px ${HT.FONT_SANS}`; g.fillText(o.label, Wd / 2, 86); });
      for (const sd of [-1, 1]) { const pm = new T.Mesh(new T.PlaneGeometry(1.5, 0.36), new T.MeshStandardMaterial({ map: tx, roughness: 0.4 })); pm.position.set(sd * (L / 2 + 0.06), topY - 0.12, 0); pm.rotation.y = sd * Math.PI / 2; grp.add(pm); }
    }
    if (o.name) {
      const tx = HT.canvasTex('tramn_' + o.name, 1024, 128, (g, Wd, Hd) => { g.fillStyle = '#' + new T.Color(o.color || 0x2e4a38).getHexString(); g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#e8d08a'; g.textAlign = 'center'; g.font = `bold 70px ${HT.FONT_SERIF}`; g.fillText(o.name, Wd / 2, 90); });
      for (const sd of [-1, 1]) { const pm = new T.Mesh(new T.PlaneGeometry(4.2, 0.5), new T.MeshStandardMaterial({ map: tx, roughness: 0.4 })); pm.position.set(0, fl + 0.5, sd * (W / 2 + 0.01)); if (sd < 0) pm.rotation.y = Math.PI; grp.add(pm); }
    }
    ctx.colBox(x, z, L, W, ry || 0, y - 1, y + topY + 1);
    return grp;
  };
})();
