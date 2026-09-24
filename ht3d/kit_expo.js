/* BẢO TÀNG HÀNH TRÌNH — lớp trưng bày: bảng tên gian, bảng chuyện, bảng mốc thời gian, khung ảnh tư liệu
   kèm chú thích và giấy phép, bảng trích dẫn, nhãn hiện vật, cổng chuyển gian. Chữ vẽ bằng canvas
   (Palatino / Segoe UI có đủ dấu tiếng Việt). Bấm vào bảng -> mở tờ thông tin chi tiết. */
(function () {
  'use strict';
  const T = THREE;
  const HT = window.HT;
  const E = (HT.expo = {});

  const SERIF = () => HT.FONT_SERIF, SANS = () => HT.FONT_SANS;
  function fit(g, text, font, maxW, size, min) {
    let s = size; g.font = font.replace('#', s);
    while (g.measureText(text).width > maxW && s > (min || 10)) { s -= 2; g.font = font.replace('#', s); }
    return s;
  }
  function para(g, text, x, y, maxW, lh, maxLines) {
    const lines = HT.wrapText(g, text, maxW);
    const n = maxLines ? Math.min(maxLines, lines.length) : lines.length;
    for (let i = 0; i < n; i++) {
      let t = lines[i]; if (maxLines && i === n - 1 && lines.length > n) t = t.replace(/\s*\S*$/, '') + ' …';
      g.fillText(t, x, y + i * lh);
    }
    return y + n * lh;
  }
  function paper(g, W, H, col, seed) {
    g.fillStyle = col; g.fillRect(0, 0, W, H);
    const r = HT.rng(seed || 3);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r.range(0.008, 0.025)})`; g.beginPath(); g.arc(r() * W, r() * H, r.range(2, 40), 0, 6.283); g.fill(); }
  }
  const hallNo = (ma) => 'GIAN ' + ma.slice(1);
  const colOf = (d, k, def) => (d && d.mau && d.mau[k]) || def;
  function darker(hex, k) { const c = new T.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); }

  /* ---------------- vẽ bảng ---------------- */
  E.paintName = function (d) {
    return HT.canvasTex('pn_' + d.ma, 2400, 1350, (g, W, H) => {
      const dark = darker(colOf(d, 'op', '#243a33'), 0.62), acc = colOf(d, 'diem', '#c9a24a');
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, darker(dark, 1.25)); gr.addColorStop(1, darker(dark, 0.8));
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = acc; g.lineWidth = 6; g.strokeRect(40, 40, W - 80, H - 80);
      g.lineWidth = 2; g.strokeRect(58, 58, W - 116, H - 116);
      g.fillStyle = acc; g.font = `600 58px ${SANS()}`; g.textBaseline = 'alphabetic';
      g.fillText(d.ma === 'G00' ? 'BẢO TÀNG HÀNH TRÌNH' : hallNo(d.ma), 130, 190);
      g.textAlign = 'right'; g.fillText(d.nam || '', W - 130, 190); g.textAlign = 'left';
      g.fillStyle = '#f4ecd8';
      fit(g, (d.ten || '').toUpperCase(), `bold #px ${SERIF()}`, W - 260, 150, 60);
      g.fillText((d.ten || '').toUpperCase(), 130, 390);
      g.fillStyle = '#cfc4ad'; fit(g, d.ten_en || '', `italic #px ${SERIF()}`, W - 260, 76, 30); g.fillText(d.ten_en || '', 130, 485);
      g.fillStyle = acc; g.fillRect(130, 540, W - 260, 4);
      g.font = `600 50px ${SANS()}`; g.fillText((d.noi || '').toUpperCase(), 130, 640);
      g.fillStyle = '#efe6d2'; g.font = `italic 66px ${SERIF()}`;
      let y = para(g, d.loi || '', 130, 760, W - 260, 84, 3);
      g.fillStyle = '#b8b0a0'; g.font = `42px ${SANS()}`;
      para(g, d.loi_en || '', 130, y + 20, W - 260, 58, 2);
      g.fillStyle = 'rgba(244,236,216,0.55)'; g.font = `34px ${SANS()}`;
      g.fillText('Bảo tàng Hành trình — Cuộc đời Chủ tịch Hồ Chí Minh', 130, H - 110);
      g.textAlign = 'right'; g.fillText('Bấm vào bảng để đọc thêm · Click for details', W - 130, H - 110); g.textAlign = 'left';
    });
  };
  E.paintStory = function (d, i) {
    return HT.canvasTex('ps_' + d.ma + '_' + i, 1300, 1900, (g, W, H) => {
      const band = colOf(d, 'op', '#3b4a40'), acc = colOf(d, 'diem', '#b08d46');
      paper(g, W, H, '#f6f0e3', 11 + i);
      g.fillStyle = band; g.fillRect(0, 0, W, 34);
      g.fillStyle = darker(acc, 0.8); g.font = `bold 38px ${SANS()}`;
      g.fillText(hallNo(d.ma) + '  ·  ' + (d.ten || '').toUpperCase(), 80, 110);
      /* tên riêng của câu chuyện (chuyên đề đã kiểm chứng) thay cho “Câu chuyện 1, 2” */
      const ten = (d.chuyen_tieu_de || [])[i], sapo = (d.chuyen_sapo || [])[i];
      g.fillStyle = darker(acc, 0.8); g.font = `600 30px ${SANS()}`; g.fillText('CÂU CHUYỆN ' + (i + 1), 80, 170);
      g.fillStyle = '#1b2320';
      let y = 250;
      if (ten) { g.font = `bold 76px ${SERIF()}`; y = para(g, ten, 80, 250, W - 160, 88, 3); }
      else { g.font = `bold 84px ${SERIF()}`; g.fillText('Câu chuyện ' + (i + 1), 80, 250); y = 290; }
      g.fillStyle = acc; g.fillRect(80, y - 40, W - 160, 5);
      g.fillStyle = '#1e2522'; g.font = sapo ? `italic 46px ${SERIF()}` : `44px ${SANS()}`;
      y = para(g, sapo || (d.chuyen || [])[i] || '', 80, y + 50, W - 160, 66);
      g.fillStyle = acc; g.fillRect(80, y + 10, 280, 4);
      if (!sapo) { g.fillStyle = '#5e6863'; g.font = `italic 36px ${SERIF()}`; para(g, (d.chuyen_en || [])[i] || '', 80, y + 80, W - 160, 50); }
      else { g.fillStyle = darker(acc, 0.75); g.font = `600 34px ${SANS()}`; g.fillText('Bấm vào bảng để đọc bài chuyên sâu, có ảnh tư liệu ›', 80, y + 80); }
      g.fillStyle = '#6d6a60'; g.font = `26px ${SANS()}`;
      g.fillText('Nguồn: Hồ Chí Minh — Tiểu sử · Bảo tàng Hồ Chí Minh · Khu Di tích Phủ Chủ tịch', 80, H - 60);
    });
  };
  E.paintTimeline = function (d) {
    const n = (d.moc || []).length;
    return HT.canvasTex('pt_' + d.ma, 3200, 1200, (g, W, H) => {
      const band = colOf(d, 'op', '#3b4a40'), acc = colOf(d, 'diem', '#b08d46');
      paper(g, W, H, '#f3ecdd', 21);
      g.fillStyle = band; g.fillRect(0, 0, 24, H);
      g.fillStyle = darker(acc, 0.75); g.font = `bold 48px ${SANS()}`; g.fillText('MỐC THỜI GIAN  ·  TIMELINE', 90, 110);
      g.fillStyle = '#1b2320'; g.font = `bold 60px ${SERIF()}`; g.fillText(d.ten || '', 90, 190);
      const x0 = 150, x1 = W - 150, ly = 560;
      g.strokeStyle = acc; g.lineWidth = 8; g.beginPath(); g.moveTo(x0 - 40, ly); g.lineTo(x1 + 40, ly); g.stroke();
      const colW = (x1 - x0) / Math.max(1, n);
      (d.moc || []).forEach(([date, txt], i) => {
        const cx = x0 + colW * (i + 0.5);
        const up = n > 4 && i % 2 === 1;
        g.fillStyle = band; g.beginPath(); g.arc(cx, ly, 22, 0, 6.283); g.fill();
        g.strokeStyle = acc; g.lineWidth = 6; g.stroke();
        g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, ly + (up ? -30 : 30)); g.lineTo(cx, ly + (up ? -80 : 80)); g.stroke();
        g.textAlign = 'center';
        const cw = Math.min(colW * (n > 4 ? 1.8 : 0.94), 900);
        g.fillStyle = '#1b2320'; fit(g, date, `bold #px ${SERIF()}`, cw, 64, 30);
        const dy = up ? ly - 330 : ly + 150;
        g.fillText(date, cx, dy);
        g.fillStyle = '#3c4642'; g.font = `38px ${SANS()}`;
        const lines = HT.wrapText(g, txt, cw - 20).slice(0, 4);
        lines.forEach((l, k) => g.fillText(l, cx, dy + 62 + k * 50));
        g.textAlign = 'left';
      });
    });
  };
  E.paintQuote = function (d) {
    const q = d.trich || ['', ''];
    return HT.canvasTex('pq_' + d.ma, 2400, 1200, (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#7e1d17'); gr.addColorStop(1, '#5a120e');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#d6ae52'; g.lineWidth = 8; g.strokeRect(40, 40, W - 80, H - 80);
      g.fillStyle = 'rgba(214,174,82,0.35)'; g.font = `bold 420px ${SERIF()}`; g.fillText('“', 90, 400);
      g.fillStyle = '#f7ecd2';
      let size = 84; let lines;
      do { g.font = `italic ${size}px ${SERIF()}`; lines = HT.wrapText(g, q[0], W - 420); size -= 4; } while (lines.length * size * 1.35 > H - 420 && size > 40);
      size += 4; g.font = `italic ${size}px ${SERIF()}`;
      const y0 = (H - lines.length * size * 1.35) / 2 + size * 0.4;
      lines.forEach((l, i) => g.fillText(l, 240, y0 + i * size * 1.35));
      g.fillStyle = '#e2bf6a'; g.font = `600 46px ${SANS()}`; g.textAlign = 'right';
      const by = /Chỉ thị|Nghị quyết/.test(q[1] || '') ? '' : 'Hồ Chí Minh';
      g.fillText('— ' + [by, q[1]].filter(Boolean).join(', '), W - 160, H - 120);
    });
  };
  E.paintCaption = function (key, vi, en, credit) {
    return HT.canvasTex('pc_' + key, 1600, 440, (g, W, H) => {
      g.fillStyle = '#1d1c19'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#a8864a'; g.lineWidth = 4; g.strokeRect(14, 14, W - 28, H - 28);
      g.fillStyle = '#f2ead8'; g.font = `600 46px ${SANS()}`;
      let y = para(g, vi || '', 60, 95, W - 120, 58, 2);
      g.fillStyle = '#bdb4a2'; g.font = `italic 36px ${SERIF()}`;
      y = para(g, en || '', 60, y + 10, W - 120, 46, 2);
      g.fillStyle = '#8f8a7e'; g.font = `26px ${SANS()}`;
      fit(g, credit || '', `#px ${SANS()}`, W - 120, 26, 16);
      g.fillText(credit || '', 60, H - 40);
    });
  };
  E.paintLabel = function (key, o) {
    return HT.canvasTex('pl_' + key, 1400, 800, (g, W, H) => {
      paper(g, W, H, '#f4eee2', 31);
      g.fillStyle = o.band || '#5a3b22'; g.fillRect(0, 0, W, 22);
      g.fillStyle = '#1c2320'; fit(g, o.vi || '', `bold #px ${SERIF()}`, W - 120, 76, 36); g.fillText(o.vi || '', 60, 130);
      g.fillStyle = '#6a6458'; fit(g, o.en || '', `italic #px ${SERIF()}`, W - 120, 46, 24); g.fillText(o.en || '', 60, 195);
      g.fillStyle = o.acc || '#b08d46'; g.fillRect(60, 225, 220, 4);
      g.fillStyle = '#2a302d'; g.font = `38px ${SANS()}`;
      let y = para(g, o.text || '', 60, 295, W - 120, 52, o.textEn ? 5 : 8);
      if (o.textEn) { g.fillStyle = '#6a6e68'; g.font = `italic 32px ${SERIF()}`; para(g, o.textEn, 60, y + 20, W - 120, 44, 3); }
    });
  };
  E.paintSign = function (key, text, o) {
    o = o || {};
    return HT.canvasTex('sg_' + key, o.W || 1600, o.H || 400, (g, W, H) => {
      g.fillStyle = o.bg || '#1f3b5a'; g.fillRect(0, 0, W, H);
      if (o.border !== false) { g.strokeStyle = o.ink || '#f3f0e6'; g.lineWidth = Math.max(4, H * 0.03); g.strokeRect(H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12); }
      g.fillStyle = o.ink || '#f3f0e6'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const lines = String(text).split('\n');
      const sz = (H * 0.62) / lines.length;
      lines.forEach((l, i) => { fit(g, l, `${o.weight || 'bold'} #px ${o.font || SANS()}`, W * 0.88, sz, 10); g.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * sz * 1.15); });
    });
  };

  /* ---------------- vật liệu ---------------- */
  const bronze = () => HT.solid(0x4a3a26, { rough: 0.38, metal: 0.9 });
  const blackStone = () => HT.mat('granite_tile', { tile: 1.0, color: 0x3a3836, rough: 0.5 });
  /* mặt sau bảng: gỗ sơn then nâu ấm (tránh mảng đen khi nhìn từ phía sau trong bóng râm) */
  const backWood = () => HT.mat('fine_grained_wood', { tile: 0.8, color: 0xc8a888, rough: 0.6, env: 1.0 });
  const faceMat = (key, tex, o) => HT.canvasMat('face_' + key, tex, Object.assign({ rough: 0.62, env: 0.55 }, o || {}));

  /* mặt bảng: hộp mỏng, chỉ mặt trước mang ảnh */
  function panelMesh(ctx, key, tex, w, h, o) {
    o = o || {};
    const g = new T.BoxGeometry(w, h, o.th || 0.04);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) if (i < 16 || i >= 20) uv.setXY(i, 0.002, 0.002);
    const m = new T.Mesh(g, faceMat(key, tex, o.mat));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  /* dựng một giá trưng bày; o: {x,z,ry,kind:'lectern'|'totem'|'wall'|'easel', w,h,y, key, tex, info, tilt} */
  E.stand = function (ctx, o) {
    const grp = new T.Group(); grp.position.set(o.x, o.y != null ? o.y : ctx.height(o.x, o.z), o.z); grp.rotation.y = o.ry || 0;
    ctx.add(grp);
    const w = o.w, h = o.h;
    const kind = o.kind || 'totem';
    const B = new HT.Builder(null);
    const br = bronze();
    let panelY, tilt = 0;
    if (kind === 'lectern') {
      tilt = o.tilt != null ? o.tilt : 0.42;
      panelY = 0.95 + Math.sin(tilt) * 0;
      B.box(blackStone(), w * 0.7, 0.1, 0.55, 0, 0, 0.05, 0, { bevel: 0.02 });
      for (const sx of [-1, 1]) B.box(br, 0.06, 0.95, 0.06, sx * w * 0.3, 0.1, 0.05, 0);
      panelY = 1.0 + (h / 2) * Math.cos(tilt) * 0.5;
    } else if (kind === 'totem') {
      B.box(blackStone(), w + 0.2, 0.12, 0.42, 0, 0, 0, 0, { bevel: 0.02 });
      for (const sx of [-1, 1]) B.box(br, 0.05, h + 0.45, 0.05, sx * (w / 2 + 0.04), 0.12, -0.03, 0);
      B.box(br, w + 0.14, 0.05, 0.08, 0, h + 0.5, -0.03, 0);
      panelY = 0.45 + h / 2;
    } else if (kind === 'easel') {
      B.box(blackStone(), w * 0.6, 0.1, 0.5, 0, 0, 0, 0, { bevel: 0.02 });
      B.box(br, 0.07, 1.1 + h * 0.3, 0.07, 0, 0.1, -0.06, 0);
      panelY = 1.25 + h / 2 - 0.2;
    } else {
      panelY = o.panelY != null ? o.panelY : 1.55;
    }
    /* khung đồng quanh bảng */
    const fr = o.frame !== false ? 0.035 : 0;
    if (fr) {
      const fB = new HT.Builder(null);
      fB.box(br, w + fr * 2, fr, 0.06, 0, -h / 2 - fr, 0, 0); fB.box(br, w + fr * 2, fr, 0.06, 0, h / 2, 0, 0);
      fB.box(br, fr, h, 0.06, -w / 2 - fr / 2, -h / 2, 0, 0); fB.box(br, fr, h, 0.06, w / 2 + fr / 2, -h / 2, 0, 0);
      fB.box(backWood(), w, h, 0.02, 0, -h / 2, -0.035, 0);
      const fg = new T.Group(); fB.build(fg);
      fg.position.set(0, panelY, 0.0); fg.rotation.x = -tilt;
      grp.add(fg);
    }
    const pm = panelMesh(ctx, o.key, o.tex, w, h, o);
    pm.position.set(0, panelY, 0.005); pm.rotation.x = -tilt;
    grp.add(pm);
    if (o.photo) {
      /* ảnh tư liệu thật đặt trong khung, chú thích ở dưới */
      pm.material = new T.MeshStandardMaterial({ map: o.photo, roughness: 0.55, envMapIntensity: 0.5 });
      pm.material.userData.shared = false;
    }
    B.build(grp);
    if (o.caption) {
      const cw = w, ch = (w * 440) / 1600;
      const cm = panelMesh(ctx, o.key + '_c', o.caption, cw, ch, {});
      cm.position.set(0, panelY - h / 2 - ch / 2 - 0.06, 0.02); cm.rotation.x = -tilt - 0.05;
      grp.add(cm);
    }
    ctx.colBox(o.x, o.z, Math.max(0.5, w * 0.7), 0.5, o.ry || 0, -5, 50);
    if (o.info) ctx.click(grp, o.info);
    return grp;
  };

  /* ---------------- thông tin cho tờ chi tiết ---------------- */
  E.infoName = (d) => ({ kicker: d.ma === 'G00' ? 'Bảo tàng Hành trình' : 'Gian ' + d.ma.slice(1) + ' · ' + (d.nam || ''), title: d.ten, sub: d.ten_en, place: d.noi, paras: [d.loi].concat(d.chuyen || []), parasEn: [d.loi_en].concat(d.chuyen_en || []), moc: d.moc, label: 'Bảng giới thiệu gian' });
  E.infoStory = (d, i) => { const t = (d.chuyen_tieu_de || [])[i], sp = (d.chuyen_sapo || [])[i]; return { kicker: 'Gian ' + d.ma.slice(1) + ' · ' + d.ten, title: t || 'Câu chuyện ' + (i + 1), paras: [sp || (d.chuyen || [])[i]], parasEn: sp ? [] : [(d.chuyen_en || [])[i]], label: 'Câu chuyện ' + (i + 1) + (t ? ': ' + t : '') }; };
  E.infoTimeline = (d) => ({ kicker: 'Gian ' + d.ma.slice(1) + ' · ' + d.ten, title: 'Mốc thời gian', moc: d.moc, label: 'Mốc thời gian' });
  E.infoQuote = (d) => { const by = /Chỉ thị|Nghị quyết/.test(d.trich[1] || '') ? '' : 'Hồ Chí Minh'; return { kicker: by ? 'Lời Bác' : 'Trích dẫn', title: '“' + d.trich[0] + '”', paras: ['— ' + [by, d.trich[1]].filter(Boolean).join(', ')], label: by ? 'Lời Bác' : 'Trích dẫn' }; };
  E.infoPhoto = (d, a) => ({ kicker: 'Ảnh tư liệu · Gian ' + d.ma.slice(1), title: a.vi, sub: a.en, img: 'textures/ht/' + a.tep, imgW: a.w, imgH: a.h, credit: [a.tacgia, a.ngay, a.lic].filter(Boolean).join(' · '), link: a.trang, label: a.vi });

  /* ---------------- bộ trưng bày chuẩn của một gian ----------------
     L: {name:[x,z,ry], stories:[[x,z,ry],...], moc:[x,z,ry], photos:[[x,z,ry,(w)],...], quote:[x,z,ry], y: {…ghi đè cao độ}, kinds} */
  E.hallSet = function (ctx, L) {
    const d = ctx.data;
    const out = {};
    const Y = (k, x, z) => (L.y && L.y[k] != null ? L.y[k] : undefined);
    if (L.name) {
      const [x, z, ry, kind] = L.name;
      out.name = E.stand(ctx, { x, z, ry, y: Y('name'), kind: kind || 'lectern', w: 1.9, h: 1.07, key: 'name_' + d.ma, tex: E.paintName(d), info: E.infoName(d) });
      ctx.tourStop({ x: x + Math.sin(ry) * 1.9, z: z + Math.cos(ry) * 1.9, look: [x, 1.2 + (Y('name') || ctx.height(x, z)), z], wait: 7, info: E.infoName(d) });
    }
    (L.stories || []).forEach(([x, z, ry, kind], i) => {
      if (!(d.chuyen || [])[i]) return;
      E.stand(ctx, { x, z, ry, y: Y('story' + i), kind: kind || 'totem', w: 1.0, h: 1.46, key: 'story_' + d.ma + i, tex: E.paintStory(d, i), info: E.infoStory(d, i) });
      ctx.tourStop({ x: x + Math.sin(ry) * 1.8, z: z + Math.cos(ry) * 1.8, look: [x, 1.25 + (Y('story' + i) || ctx.height(x, z)), z], wait: 9, info: E.infoStory(d, i) });
    });
    if (L.moc && (d.moc || []).length) {
      const [x, z, ry, kind] = L.moc;
      E.stand(ctx, { x, z, ry, y: Y('moc'), kind: kind || 'lectern', w: 2.4, h: 0.9, key: 'moc_' + d.ma, tex: E.paintTimeline(d), info: E.infoTimeline(d), tilt: 0.38 });
      ctx.tourStop({ x: x + Math.sin(ry) * 2.0, z: z + Math.cos(ry) * 2.0, look: [x, 1.1 + (Y('moc') || ctx.height(x, z)), z], wait: 7, info: E.infoTimeline(d) });
    }
    (L.photos || []).forEach((p, i) => {
      const a = (d.anh || [])[i]; if (!a) return;
      const [x, z, ry, wOpt, kind] = p;
      const asp = a.w && a.h ? a.w / a.h : 1.4;
      let w = wOpt || (asp >= 1 ? 1.25 : 0.85); let h = w / asp;
      if (!wOpt && h > 1.3) { h = 1.3; w = h * asp; }
      if (wOpt && h > 3.2) { h = 3.2; w = h * asp; }
      const tex = HT.tex('textures/ht/' + a.tep, { srgb: true });
      const credit = 'Ảnh: ' + [a.tacgia || 'Wikimedia Commons', a.lic].filter(Boolean).join(' · ');
      E.stand(ctx, { x, z, ry, y: Y('photo' + i), kind: kind || 'easel', w, h, key: 'photo_' + d.ma + i, tex, photo: tex, caption: E.paintCaption(d.ma + '_' + i, a.vi, a.en, credit), info: E.infoPhoto(d, a) });
      ctx.tourStop({ x: x + Math.sin(ry) * 1.7, z: z + Math.cos(ry) * 1.7, look: [x, 1.35 + (Y('photo' + i) || ctx.height(x, z)), z], wait: 6, info: E.infoPhoto(d, a) });
    });
    if (L.quote && d.trich) {
      const [x, z, ry, kind] = L.quote;
      E.stand(ctx, { x, z, ry, y: Y('quote'), kind: kind || 'lectern', w: 2.0, h: 1.0, key: 'quote_' + d.ma, tex: E.paintQuote(d), info: E.infoQuote(d), tilt: 0.3 });
      ctx.tourStop({ x: x + Math.sin(ry) * 2.0, z: z + Math.cos(ry) * 2.0, look: [x, 1.1 + (Y('quote') || ctx.height(x, z)), z], wait: 8, info: E.infoQuote(d) });
    }
    return out;
  };

  /* ---------------- nhãn hiện vật (cọc thấp, bảng nghiêng) ---------------- */
  E.label = function (ctx, o) {
    const tex = E.paintLabel(ctx.ma + '_' + o.key, o);
    const info = { kicker: 'Hiện vật · Gian ' + ctx.ma.slice(1), title: o.vi, sub: o.en, paras: [o.text].concat(o.more || []), parasEn: o.textEn ? [o.textEn] : null, label: o.vi, img: o.img, imgW: o.imgW, imgH: o.imgH, credit: o.credit };
    E.stand(ctx, { x: o.x, z: o.z, ry: o.ry || 0, y: o.y, kind: o.kind || 'lectern', w: o.w || 0.62, h: (o.w || 0.62) * 0.571, key: 'label_' + ctx.ma + o.key, tex, info, tilt: o.tilt != null ? o.tilt : 0.6 });
    if (o.tour !== false) ctx.tourStop({ x: o.x + Math.sin(o.ry || 0) * 1.3, z: o.z + Math.cos(o.ry || 0) * 1.3, look: o.look || [o.x, (o.y != null ? o.y : ctx.height(o.x, o.z)) + 0.9, o.z], wait: o.wait || 6, info });
    return info;
  };
  /* biển tên đường / biển hiệu phẳng */
  E.sign = function (ctx, B, o) {
    const tex = E.paintSign(o.key, o.text, o);
    const m = HT.canvasMat('sign_' + o.key, tex, { rough: o.rough || 0.5, env: 0.8, emissive: o.glow ? 0xffffff : null, ei: o.glow || 0 });
    const g = new T.PlaneGeometry(o.w, o.h);
    B.add(m, g, { x: o.x, y: o.y, z: o.z, ry: o.ry || 0, uv: 'keep', noShadow: true });
  };

  /* ---------------- CỔNG CHUYỂN GIAN ---------------- */
  E.gateTex = function (key, top, main, sub, arrow) {
    return HT.canvasTex('gate_' + key, 1600, 520, (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a2319'); gr.addColorStop(1, '#17130d');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.strokeRect(18, 18, W - 36, H - 36);
      g.textAlign = 'center';
      g.fillStyle = '#c9a24a'; g.font = `600 56px ${HT.FONT_SANS}`; g.fillText(top, W / 2, 120);
      g.fillStyle = '#f4ecd8'; fit(g, main, `bold #px ${HT.FONT_SERIF}`, W - 160, 120, 40); g.fillText(main, W / 2, 275);
      g.fillStyle = '#bcb3a0'; fit(g, sub || '', `italic #px ${HT.FONT_SERIF}`, W - 160, 56, 24); g.fillText(sub || '', W / 2, 370);
      if (arrow) { g.fillStyle = '#c9a24a'; g.font = `bold 70px ${HT.FONT_SANS}`; g.fillText(arrow, W / 2, 470); }
    });
  };
  const veilMat = (k) => {
    const m = new T.ShaderMaterial({
      uniforms: { uTime: HT.uTime, uCol: { value: new T.Color(1.0, 0.82, 0.5).multiplyScalar(k != null ? k : 1) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform float uTime; uniform vec3 uCol; varying vec2 vUv;
        void main(){ float e = smoothstep(0.0,0.12,vUv.x)*smoothstep(1.0,0.88,vUv.x)*smoothstep(0.0,0.04,vUv.y)*smoothstep(1.0,0.75,vUv.y);
          float n = sin(vUv.y*11.0 - uTime*1.3 + sin(vUv.x*7.0 + uTime*0.7)*1.4)*0.5+0.5;
          float a = e*(0.07 + 0.13*n);
          gl_FragColor = vec4(uCol*(0.8+0.6*n), a); }`,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
    });
    return m;
  };
  /* o: {x,z,ry, to, top, main, sub, arrow, w, spawn} — đi xuyên qua khung để sang gian khác */
  E.gate = function (ctx, o) {
    const y = o.y != null ? o.y : ctx.height(o.x, o.z);
    const grp = new T.Group(); grp.position.set(o.x, y, o.z); grp.rotation.y = o.ry || 0; ctx.add(grp);
    const B = new HT.Builder(null);
    const w = o.w || 2.4, h = 3.2;
    const br = bronze();
    if (o.frame !== false) {
      for (const sx of [-1, 1]) {
        B.box(blackStone(), 0.5, 0.25, 0.5, sx * (w / 2 + 0.2), 0, 0, 0, { bevel: 0.03 });
        B.box(br, 0.26, h, 0.26, sx * (w / 2 + 0.2), 0.25, 0, 0, { bevel: 0.02 });
      }
      B.box(br, w + 0.9, 0.7, 0.36, 0, h + 0.25, 0, 0, { bevel: 0.03 });
      B.box(blackStone(), w, 0.04, 0.9, 0, 0, 0, 0);
      B.build(grp);
    }
    const tex = E.gateTex(ctx.ma + '_' + o.to + (o.key || ''), o.top || '', o.main || '', o.sub || '', o.arrow || '');
    if (!o.noSign) for (const side of [1, -1]) {
      const pm = new T.Mesh(new T.PlaneGeometry(w + 0.7, (w + 0.7) * 520 / 1600 * 0.9), HT.canvasMat('gatef_' + ctx.ma + o.to + (o.key || ''), tex, { rough: 0.5, env: 0.6, emissive: 0xffffff, ei: 0.25 }));
      pm.position.set(0, h + 0.6, side * 0.185); if (side < 0) pm.rotation.y = Math.PI;
      grp.add(pm);
    }
    const veil = new T.Mesh(new T.PlaneGeometry(w, h), veilMat(o.veil));
    veil.position.set(0, 0.25 + h / 2, 0); veil.userData.noAO = true; veil.userData.noMap = true; veil.renderOrder = 5;
    grp.add(veil);
    if (!o.noLight) { const light = new T.PointLight(0xffd9a0, 3, 6, 2); light.position.set(0, 2.2, 0.6); grp.add(light); }
    if (o.frame !== false) for (const sx of [-1, 1]) ctx.colBox(o.x + Math.cos(o.ry || 0) * sx * (w / 2 + 0.2), o.z - Math.sin(o.ry || 0) * sx * (w / 2 + 0.2), 0.4, 0.4, o.ry || 0, -5, 50);
    ctx.gate({ x: o.x, z: o.z, r: 0.75, to: o.to, spawn: o.spawn });
    const go = function () { HT.core.walkTo(o.x, o.z); };
    go.label = (o.top ? o.top + ' — ' : '') + (o.main || '');
    ctx.click(veil, go);
    return grp;
  };
  /* cổng tiêu chuẩn: về Sảnh / gian trước / gian sau */
  E.stdGates = function (ctx, G) {
    const L = HT.DATA.thu_tu, i = L.indexOf(ctx.ma);
    const gi = (ma) => HT.DATA.gian[ma];
    if (G.hub) E.gate(ctx, { x: G.hub[0], z: G.hub[1], ry: G.hub[2], to: 'G00', top: 'TRỞ VỀ', main: 'Sảnh Hành trình', sub: 'Journey Hall', arrow: '↩', key: 'h' });
    if (G.next && i < L.length - 1) { const n = gi(L[i + 1]); E.gate(ctx, { x: G.next[0], z: G.next[1], ry: G.next[2], to: L[i + 1], top: 'GIAN ' + L[i + 1].slice(1) + ' · ' + n.nam, main: n.ten, sub: n.ten_en, arrow: '→', key: 'n' }); }
    if (G.prev && i > 1) { const p = gi(L[i - 1]); E.gate(ctx, { x: G.prev[0], z: G.prev[1], ry: G.prev[2], to: L[i - 1], top: 'GIAN ' + L[i - 1].slice(1) + ' · ' + p.nam, main: p.ten, sub: p.ten_en, arrow: '←', key: 'p' }); }
  };
})();
