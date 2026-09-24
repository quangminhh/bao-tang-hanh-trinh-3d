/* BẢO TÀNG HÀNH TRÌNH — kiến trúc: mái (chái, hồi, mansard, chóp), tường có lỗ cửa, cửa sổ, cửa đi
   (kể cả cửa "thượng song hạ đố"), cột, bậc, lan can, hàng rào, dãy vòm, nhà Việt truyền thống theo gian,
   nhà sàn, khối nhà phố Âu/Á theo tầng và gian. Tọa độ cục bộ của một công trình: x dọc mặt tiền,
   z theo chiều sâu, mặt tiền ở +z; đặt vào thế giới bằng (x, z, ry). */
(function () {
  'use strict';
  const T = THREE;
  const HT = window.HT;
  const A = (HT.arch = {});

  /* đổi tọa độ cục bộ -> thế giới */
  A.frame = function (x, z, ry) {
    const c = Math.cos(ry || 0), s = Math.sin(ry || 0);
    const f = (ox, oz) => [x + ox * c + oz * s, z - ox * s + oz * c];
    f.x = x; f.z = z; f.ry = ry || 0;
    return f;
  };

  /* ---------------- lưới mặt phẳng tứ giác chia ô (để uốn sóng ngói, gợn rơm) ---------------- */
  function gridFace(p00, p10, p11, p01, nu, nv, disp) {
    const pos = [], uv = [], idx = [];
    const eu = new T.Vector3().subVectors(p10, p00); const eaveLen = eu.length(); eu.normalize();
    const nrm = new T.Vector3().subVectors(p10, p00).cross(new T.Vector3().subVectors(p01, p00)).normalize();
    const ev = new T.Vector3().crossVectors(nrm, eu).normalize();
    const tmp = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3();
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const s = i / nu, t = j / nv;
      a.lerpVectors(p00, p10, s); b.lerpVectors(p01, p11, s); tmp.lerpVectors(a, b, t);
      const rel = tmp.clone().sub(p00);
      const u = rel.dot(eu), v = rel.dot(ev);
      if (disp) tmp.addScaledVector(nrm, disp(u, v, s, t));
      pos.push(tmp.x, tmp.y, tmp.z); uv.push(u, v);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const k = j * (nu + 1) + i;
      idx.push(k, k + 1, k + nu + 1, k + 1, k + nu + 2, k + nu + 1);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  A.gridFace = gridFace;
  const V3 = (x, y, z) => new T.Vector3(x, y, z);

  /* ---------------- MÁI ---------------- */
  /* dịch chuyển mặt mái theo kiểu vật liệu */
  function roofDisp(kind, o) {
    if (kind === 'tile') { const p = o.pitch || 0.22, a = o.amp || 0.035; return (u) => a * Math.cos((2 * Math.PI * u) / p); }
    if (kind === 'thatch') { const sd = o.seed || 1; return (u, v, s, t) => 0.05 * HT.noise(u * 0.8 + sd, v * 0.8, 0.5) + 0.02 * HT.noise(u * 3, v * 3, sd) - 0.06 * Math.sin(Math.PI * s) * Math.sin(Math.PI * Math.min(1, t * 1.3)); }
    if (kind === 'corr') { const p = o.pitch || 0.076, a = o.amp || 0.009; return (u) => a * Math.sin((2 * Math.PI * u) / p); }
    return null;
  }
  /* mái chái 4 mái (nhà tranh, nhà ngói); o: {w, d, eave, ridge, ridgeLen, thick, kind, pitch, amp, x,z,ry, cz(lệch tâm z)} */
  A.hipRoof = function (B, mat, o, edgeMat) {
    const W = o.w, D = o.d, e = o.eave, r = o.ridge, th = o.thick != null ? o.thick : 0.12;
    const R = o.ridgeLen != null ? o.ridgeLen : Math.max(0, W - D);
    const kind = o.kind || 'plain';
    const disp = roofDisp(kind, o);
    const res = kind === 'tile' ? (o.pitch || 0.22) / 4 : kind === 'corr' ? (o.pitch || 0.076) / 3 : kind === 'thatch' ? 0.4 : 1e9;
    const hw = W / 2, hd = D / 2, hr = R / 2;
    const faces = [
      [V3(-hw, e, hd), V3(hw, e, hd), V3(hr, r, 0), V3(-hr, r, 0)],
      [V3(hw, e, -hd), V3(-hw, e, -hd), V3(-hr, r, 0), V3(hr, r, 0)],
      [V3(hw, e, hd), V3(hw, e, -hd), V3(hr, r, 0), V3(hr, r, 0)],
      [V3(-hw, e, -hd), V3(-hw, e, hd), V3(-hr, r, 0), V3(-hr, r, 0)],
    ];
    const tf = { x: o.x || 0, y: o.y || 0, z: o.z || 0, ry: o.ry || 0, uv: 'keep' };
    for (const f of faces) {
      const eaveL = f[0].distanceTo(f[1]); const slope = f[0].distanceTo(f[3]);
      const nu = Math.max(1, Math.min(400, Math.ceil(eaveL / res))), nv = Math.max(1, Math.ceil(slope / (kind === 'thatch' ? 0.4 : 1.5)));
      const g = gridFace(f[0], f[1], f[2], f[3], nu, nv, disp);
      if (o.cz) g.translate(0, 0, o.cz);
      B.add(mat, g, tf);
      /* mặt dưới */
      const gb = gridFace(f[1].clone().add(V3(0, -th, 0)), f[0].clone().add(V3(0, -th, 0)), f[3].clone().add(V3(0, -th, 0)), f[2].clone().add(V3(0, -th, 0)), 1, 1);
      if (o.cz) gb.translate(0, 0, o.cz);
      B.add(o.underMat || edgeMat || mat, gb, tf);
      /* diềm mái */
      const ge = gridFace(f[0].clone().add(V3(0, -th, 0)), f[1].clone().add(V3(0, -th, 0)), f[1], f[0], 1, 1);
      if (o.cz) ge.translate(0, 0, o.cz);
      B.add(edgeMat || mat, ge, tf);
    }
    if (kind === 'thatch' && o.eaveRoll !== false) {
      /* mép rơm dày tròn */
      const rr = th * 0.9;
      const segs = [[V3(-hw, e - th / 2, hd), V3(hw, e - th / 2, hd)], [V3(hw, e - th / 2, -hd), V3(-hw, e - th / 2, -hd)], [V3(hw, e - th / 2, hd), V3(hw, e - th / 2, -hd)], [V3(-hw, e - th / 2, -hd), V3(-hw, e - th / 2, hd)]];
      for (const [a, b] of segs) {
        const g = HT.taperTube([a, b], [rr, rr], 8); if (o.cz) g.translate(0, 0, o.cz);
        B.add(mat, g, tf);
      }
    }
    if (o.ridgeMat && R > 0) {
      const rg = new T.CylinderGeometry(o.ridgeR || 0.12, o.ridgeR || 0.12, R + 0.3, 8); rg.rotateZ(Math.PI / 2); rg.translate(0, r + 0.02, o.cz || 0);
      HT.scaleUV(rg, 1, R);
      B.add(o.ridgeMat, rg, tf);
    }
  };
  /* mái hồi 2 mái; o: {w (dọc nóc), d (ngang), eave, ridge, thick, kind, x,z,ry, gable: vật liệu tường hồi tam giác, gableInset} */
  A.gableRoof = function (B, mat, o, edgeMat) {
    const W = o.w, D = o.d, e = o.eave, r = o.ridge, th = o.thick != null ? o.thick : 0.1;
    const hw = W / 2, hd = D / 2;
    const kind = o.kind || 'plain';
    const disp = roofDisp(kind, o);
    const res = kind === 'tile' ? (o.pitch || 0.22) / 4 : kind === 'corr' ? (o.pitch || 0.076) / 3 : kind === 'thatch' ? 0.4 : 1e9;
    const tf = { x: o.x || 0, y: o.y || 0, z: o.z || 0, ry: o.ry || 0, uv: 'keep' };
    const faces = [[V3(-hw, e, hd), V3(hw, e, hd), V3(hw, r, 0), V3(-hw, r, 0)], [V3(hw, e, -hd), V3(-hw, e, -hd), V3(-hw, r, 0), V3(hw, r, 0)]];
    for (const f of faces) {
      const nu = Math.max(1, Math.min(500, Math.ceil(W / res))), nv = Math.max(1, Math.ceil(f[0].distanceTo(f[3]) / (kind === 'thatch' ? 0.4 : 1.5)));
      B.add(mat, gridFace(f[0], f[1], f[2], f[3], nu, nv, disp), tf);
      B.add(o.underMat || edgeMat || mat, gridFace(f[1].clone().add(V3(0, -th, 0)), f[0].clone().add(V3(0, -th, 0)), f[3].clone().add(V3(0, -th, 0)), f[2].clone().add(V3(0, -th, 0)), 1, 1), tf);
      B.add(edgeMat || mat, gridFace(f[0].clone().add(V3(0, -th, 0)), f[1].clone().add(V3(0, -th, 0)), f[1], f[0], 1, 1), tf);
      /* mép hồi */
      for (const sx of [-1, 1]) {
        const a = V3(sx * hw, f[0].y, f[0].z), b = V3(sx * hw, r, 0);
        const g = gridFace(a.clone().add(V3(0, -th, 0)), b.clone().add(V3(0, -th, 0)), b, a, 1, 1);
        if (sx < 0) g.scale(1, 1, 1);
        B.add(edgeMat || mat, g, tf);
      }
    }
    if (o.gable) {
      const inset = o.gableInset != null ? o.gableInset : 0.3;
      const gd = D / 2 - (o.gableD != null ? o.gableD : inset);
      const gy0 = o.gableY0 != null ? o.gableY0 : e;
      const slopeY = (z) => e + (r - e) * (1 - Math.abs(z) / hd);
      for (const sx of [-1, 1]) {
        const x = sx * (hw - inset);
        const pts = [[-gd, gy0], [gd, gy0], [gd, slopeY(gd) - th - 0.02], [0, r - th - 0.02], [-gd, slopeY(-gd) - th - 0.02]];
        const g = HT.extrude(pts, o.gableT || 0.2);
        g.translate(0, 0, -(o.gableT || 0.2) / 2);
        g.rotateY(Math.PI / 2);
        g.translate(x, 0, 0);
        B.add(o.gable, g, Object.assign({}, tf, { uv: 'box', uvYaw: (o.ry || 0) + Math.PI / 2 }));
      }
    }
    if (o.ridgeMat) {
      const rg = HT.geoBox(W + 0.1, o.ridgeH || 0.18, o.ridgeW || 0.24);
      rg.translate(0, r + (o.ridgeH || 0.18) / 2 - 0.04, 0);
      B.add(o.ridgeMat, rg, Object.assign({}, tf, { uv: 'box' }));
    }
  };
  /* mái mansard kiểu Paris: dốc dưới gần đứng + dốc trên thoải; o: {w,d,y (chân mái), h1 (cao dốc dưới), inset1, h2, x,z,ry} */
  A.mansard = function (B, mat, topMat, o) {
    const W = o.w, D = o.d, y = o.y, h1 = o.h1 || 2.6, i1 = o.inset1 || 0.55, h2 = o.h2 || 1.0;
    const hw = W / 2, hd = D / 2;
    const tf = { x: o.x || 0, z: o.z || 0, ry: o.ry || 0, uv: 'keep' };
    const lo = [V3(-hw, y, hd), V3(hw, y, hd), V3(hw, y, -hd), V3(-hw, y, -hd)];
    const mid = [V3(-hw + i1, y + h1, hd - i1), V3(hw - i1, y + h1, hd - i1), V3(hw - i1, y + h1, -hd + i1), V3(-hw + i1, y + h1, -hd + i1)];
    const R = Math.max(0.1, W - 2 * i1 - (D - 2 * i1));
    const top = [V3(-R / 2, y + h1 + h2, 0), V3(R / 2, y + h1 + h2, 0)];
    for (let k = 0; k < 4; k++) {
      const a = lo[k], b = lo[(k + 1) % 4], c = mid[(k + 1) % 4], d = mid[k];
      const L = a.distanceTo(b);
      B.add(mat, gridFace(a, b, c, d, Math.max(1, Math.ceil(L / 0.3)), 2), tf);
    }
    const faces = [[mid[0], mid[1], top[1], top[0]], [mid[2], mid[3], top[0], top[1]], [mid[1], mid[2], top[1], top[1]], [mid[3], mid[0], top[0], top[0]]];
    for (const f of faces) B.add(topMat || mat, gridFace(f[0], f[1], f[2], f[3], 1, 1), tf);
    return { topY: y + h1 + h2, midY: y + h1, inset: i1 };
  };

  /* ---------------- TƯỜNG CÓ LỖ CỬA ---------------- */
  /* o: {x0,z0,x1,z1, y0, h, t, open:[{u,w,y,h}] (u: tâm lỗ tính từ đầu tường), col, colOpen (cửa đi cho qua)} */
  A.wall = function (B, ctx, mat, o) {
    const dx = o.x1 - o.x0, dz = o.z1 - o.z0, L = Math.hypot(dx, dz);
    const ux = dx / L, uz = dz / L;
    const ry = Math.atan2(-dz, dx);
    const t = o.t || 0.2, y0 = o.y0 || 0, H = o.h;
    const ops = (o.open || []).slice().sort((a, b) => a.u - b.u);
    const piece = (u0, u1, ya, yb) => {
      if (u1 - u0 < 0.005 || yb - ya < 0.005) return;
      const cu = (u0 + u1) / 2;
      B.box(mat, u1 - u0, yb - ya, t, o.x0 + ux * cu, ya, o.z0 + uz * cu, ry, { uvYaw: ry });
    };
    let cur = 0;
    for (const p of ops) {
      const a = p.u - p.w / 2, b = p.u + p.w / 2;
      piece(cur, a, y0, y0 + H);
      piece(a, b, y0, y0 + (p.y || 0));
      piece(a, b, y0 + (p.y || 0) + p.h, y0 + H);
      cur = b;
    }
    piece(cur, L, y0, y0 + H);
    if (ctx && o.col !== false) {
      /* va chạm: cả đoạn tường trừ các cửa đi (ngưỡng thấp) */
      let c0 = 0;
      const doors = ops.filter((p) => (p.y || 0) < 0.35 && p.h > 1.7 && !p.blocked);
      for (const p of doors) { const a = p.u - p.w / 2; if (a - c0 > 0.02) { const cu = (c0 + a) / 2; ctx.colBox(o.x0 + ux * cu, o.z0 + uz * cu, a - c0, t, ry, y0, y0 + H); } c0 = p.u + p.w / 2; }
      if (L - c0 > 0.02) { const cu = (c0 + L) / 2; ctx.colBox(o.x0 + ux * cu, o.z0 + uz * cu, L - c0, t, ry, y0, y0 + H); }
    }
    return { ux, uz, ry, L, at: (u, n) => [o.x0 + ux * u - uz * (n || 0), o.z0 + uz * u + ux * (n || 0)] };
  };

  /* ---------------- CỬA SỔ ---------------- */
  /* đặt tại (x,z) trên mặt tường hướng ry (pháp tuyến ngoài = +z cục bộ). o: {w,h,y (bậu), t (dày tường), kind, frame, glass, shutter, shutterOpen, bars, sill} */
  A.window = function (B, o) {
    const f = A.frame(o.x, o.z, o.ry);
    const w = o.w, h = o.h, y = o.y, t = o.t || 0.25;
    const fm = o.frame, fw = o.fw || 0.06;
    const recess = o.recess != null ? o.recess : t * 0.35;
    const zF = t / 2 - recess;
    const P = (lx, lz) => f(lx, lz);
    /* khung */
    const box = (bw, bh, bd, lx, ly, lz, m) => { const [wx, wz] = P(lx, lz); B.box(m || fm, bw, bh, bd, wx, ly, wz, o.ry); };
    box(w, fw, 0.08, 0, y, zF); box(w, fw, 0.08, 0, y + h - fw, zF);
    box(fw, h, 0.08, -w / 2 + fw / 2, y, zF); box(fw, h, 0.08, w / 2 - fw / 2, y, zF);
    const kind = o.kind || 'casement';
    if (kind !== 'open' && kind !== 'hole') {
      box(w - fw * 2, h - fw * 2, 0.012, 0, y + fw, zF - 0.02, o.glass);
    }
    if (kind === 'casement' || kind === 'sash' || kind === 'french') {
      box(0.04, h - 2 * fw, 0.06, 0, y + fw, zF + 0.01);
      const rows = o.rows || (kind === 'sash' ? 2 : 3);
      for (let i = 1; i < rows; i++) box(w - 2 * fw, 0.03, 0.05, 0, y + fw + ((h - 2 * fw) * i) / rows - 0.015, zF + 0.01);
      if (o.cols) for (let i = 1; i < o.cols; i++) { if (Math.abs(i / o.cols - 0.5) < 1e-3) continue; box(0.025, h - 2 * fw, 0.05, -w / 2 + (w * i) / o.cols, y + fw, zF + 0.01); }
    }
    if (kind === 'bars' || o.bars) {
      const n = o.nBars || Math.max(3, Math.round(w / 0.1));
      for (let i = 1; i < n; i++) { const [wx, wz] = P(-w / 2 + (w * i) / n, zF + 0.05); B.cyl(o.barMat || fm, 0.012, 0.012, h - 2 * fw, wx, y + fw, wz, 6); }
    }
    if (kind === 'song') {
      /* chấn song gỗ tiện */
      const n = o.nBars || Math.max(4, Math.round(w / 0.12));
      for (let i = 1; i < n; i++) { const [wx, wz] = P(-w / 2 + (w * i) / n, zF + 0.02); B.box(fm, 0.04, h - 2 * fw, 0.04, wx, y + fw, wz, o.ry + Math.PI / 4); }
    }
    if (kind === 'louver') {
      const n = Math.round((h - 2 * fw) / 0.07);
      for (let i = 0; i < n; i++) { const [wx, wz] = P(0, zF + 0.01); B.add(fm, HT.geoBox(w - 2 * fw, 0.012, 0.07), { x: wx, y: y + fw + 0.04 + i * 0.07, z: wz, ry: o.ry, rx: -0.6 }); }
    }
    if (o.sill !== false) box(w + 0.14, 0.05, t * 0.45 + 0.06, 0, y - 0.05, t / 2 - t * 0.2 + 0.03, o.sillMat || fm);
    if (o.lintel) box(w + 0.2, o.lintelH || 0.12, 0.06, 0, y + h, t / 2 + 0.02, o.lintel);
    if (o.shutter) {
      const sw = w / 2, open = o.shutterOpen != null ? o.shutterOpen : 1;
      for (const sd of [-1, 1]) {
        const hx = sd * (w / 2 + 0.01), hz = t / 2 + 0.02;
        const ang = sd * (Math.PI / 2) * open;
        const cx = hx - sd * Math.cos(ang) * sw / 2 * 1, cz = hz + Math.abs(Math.sin(ang)) * sw / 2;
        const lx = open >= 0.99 ? hx + sd * sw / 2 : cx, lz = open >= 0.99 ? hz + 0.02 : cz;
        const [wx, wz] = P(lx, lz);
        const rr = open >= 0.99 ? o.ry : o.ry - ang;
        B.box(o.shutter, sw, h, 0.035, wx, y, wz, rr);
        /* nan chớp */
        const n = Math.floor(h / 0.09);
        for (let i = 1; i < n; i++) { const [sx, sz] = P(lx, lz + 0.022); B.box(o.shutter, sw - 0.08, 0.018, 0.012, sx, y + i * 0.09, sz, rr); }
      }
    }
  };
  /* ---------------- CỬA ĐI ---------------- */
  /* o: {x,z,ry, w, h, y, t, kind:'plank'|'panel'|'songdo'|'glass', leaves:1|2|4, open (0..1), mat, frame, glass} */
  A.door = function (B, o) {
    const f = A.frame(o.x, o.z, o.ry);
    const w = o.w, h = o.h, y = o.y || 0, t = o.t || 0.2, m = o.mat, fm = o.frame || m;
    const P = (lx, lz) => f(lx, lz);
    const box = (bw, bh, bd, lx, ly, lz, mm, ry) => { const [wx, wz] = P(lx, lz); B.box(mm || m, bw, bh, bd, wx, ly, wz, ry != null ? ry : o.ry); };
    if (o.frameOn !== false) { box(0.08, h, t + 0.02, -w / 2 - 0.04, y, 0, fm); box(0.08, h, t + 0.02, w / 2 + 0.04, y, 0, fm); box(w + 0.16, 0.1, t + 0.02, 0, y + h, 0, fm); }
    if (o.threshold) box(w, 0.08, t + 0.04, 0, y, 0, o.threshold);
    const n = o.leaves || 2, lw = w / n, open = o.open || 0;
    for (let i = 0; i < n; i++) {
      const left = i < n / 2;
      const hingeX = left ? -w / 2 + (i === 0 ? 0 : lw * i) : w / 2 - (n - 1 - i) * lw;
      const sd = left ? 1 : -1;
      const ang = open * (Math.PI / 2) * (n > 2 ? 0.95 : 1);
      const inward = o.inward !== false;
      const cz = (inward ? -1 : 1) * Math.sin(ang) * lw / 2;
      const cx = hingeX + sd * Math.cos(ang) * lw / 2;
      const rr = o.ry + (inward ? -1 : 1) * sd * -ang;
      const leafT = 0.045;
      const [wx, wz] = P(cx, cz + (inward ? -t / 2 + 0.03 : t / 2 - 0.03) * (open > 0 ? 1 : 0));
      const kind = o.kind || 'plank';
      if (kind === 'songdo') {
        /* thượng song (nửa trên chấn song) hạ đố (nửa dưới ván bưng) */
        const hs = h * 0.5;
        const lf = new HT.Builder();
        lf.box(m, lw - 0.01, 0.07, leafT, 0, 0, 0); lf.box(m, lw - 0.01, 0.07, leafT, 0, h - 0.07, 0); lf.box(m, lw - 0.01, 0.07, leafT, 0, hs - 0.035, 0);
        lf.box(m, 0.07, h, leafT, -lw / 2 + 0.035, 0, 0); lf.box(m, 0.07, h, leafT, lw / 2 - 0.035, 0, 0);
        lf.box(m, lw - 0.14, hs - 0.1, 0.022, 0, 0.07, 0);
        const nb = Math.max(3, Math.round(lw / 0.09));
        for (let k = 1; k < nb; k++) lf.box(m, 0.03, h - hs - 0.1, 0.03, -lw / 2 + 0.035 + ((lw - 0.07) * k) / nb, hs + 0.035, 0, Math.PI / 4);
        for (const s of lf.parts.values()) for (const g of s.geos) B.add(s.mat, g, { x: wx, y, z: wz, ry: rr, uv: 'keep' });
      } else if (kind === 'glass') {
        box(lw - 0.01, h, leafT, 0, 0, 0);
        const [gx, gz] = [wx, wz];
        B.box(m, lw - 0.01, 0.1, leafT, gx, y, gz, rr); B.box(m, lw - 0.01, 0.1, leafT, gx, y + h - 0.1, gz, rr);
        B.box(m, 0.08, h, leafT, ...P(cx - (lw / 2 - 0.04) * Math.cos(ang) * sd, cz), rr);
        B.box(o.glass || m, lw - 0.16, h * 0.62, 0.01, gx, y + h * 0.3, gz, rr);
        B.box(m, lw - 0.16, h * 0.28, leafT, gx, y + 0.1, gz, rr);
      } else if (kind === 'panel') {
        B.box(m, lw - 0.01, h, leafT, wx, y, wz, rr);
        for (const py of [0.15, h * 0.55]) { const [px, pz] = P(cx, cz + 0.03); B.box(o.trim || m, lw * 0.7, h * 0.3, 0.012, wx, y + py, wz, rr); }
      } else {
        B.box(m, lw - 0.01, h, leafT, wx, y, wz, rr);
        const np = Math.max(2, Math.round(lw / 0.18));
        for (let k = 1; k < np; k++) { /* khe ván */ }
      }
    }
  };

  /* ---------------- CỘT, BẬC, LAN CAN, HÀNG RÀO ---------------- */
  A.column = function (B, mat, x, y, z, r, h, o) {
    o = o || {};
    if (o.base) B.box(o.base, r * 3.2, o.baseH || 0.15, r * 3.2, x, y, z, o.ry || 0, { bevel: 0.02 });
    const y0 = y + (o.base ? o.baseH || 0.15 : 0);
    if (o.square) B.box(mat, r * 2, h - (y0 - y), r * 2, x, y0, z, o.ry || 0);
    else B.cyl(mat, r * (o.taper || 0.92), r, h - (y0 - y), x, y0, z, o.seg || 14);
    if (o.cap) B.box(o.cap, r * 2.6, 0.12, r * 2.6, x, y + h - 0.12, z, o.ry || 0);
  };
  /* bậc thang: từ (x,z) đi theo hướng ry (tiến = -z cục bộ... dùng hướng (dx,dz)); n bậc, tổng cao rise, tổng dài run */
  A.stairs = function (B, ctx, mat, o) {
    const n = o.n, rise = o.rise, run = o.run, w = o.w, y0 = o.y0 || 0;
    const ang = o.ry || 0; const ux = -Math.sin(ang), uz = -Math.cos(ang);
    const sr = rise / n, sd = run / n;
    for (let i = 0; i < n; i++) {
      const cx = o.x + ux * (sd * (i + 0.5)), cz = o.z + uz * (sd * (i + 0.5));
      if (o.solid !== false) B.box(mat, w, sr * (i + 1) + (o.base || 0), sd + 0.005, cx, y0 - (o.base || 0), cz, ang);
      else B.box(mat, w, 0.05, sd + 0.04, cx, y0 + sr * (i + 1) - 0.05, cz, ang);
    }
    if (o.stringer) for (const sdn of [-1, 1]) {
      const ox = Math.cos(ang) * sdn * (w / 2 + 0.03), oz = -Math.sin(ang) * sdn * (w / 2 + 0.03);
      B.beam(o.stringer, o.x + ox, y0, o.z + oz, o.x + ox + ux * run, y0 + rise, o.z + oz + uz * run, 0.05, 0.2);
    }
    if (ctx) ctx.ramp(o.x - ux * 0.1, o.z - uz * 0.1, o.x + ux * (run + 0.15), o.z + uz * (run + 0.15), w, y0, y0 + rise);
    return [o.x + ux * run, o.z + uz * run];
  };
  /* lan can dọc đường gấp khúc pts [[x,z],...] ở cao độ y */
  A.railing = function (B, mat, pts, y, o) {
    o = o || {};
    const h = o.h || 0.9, sp = o.spacing || 0.12, r = o.r || 0.02, rail = o.rail || 0.06;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(-(bz - az), bx - ax);
      B.box(mat, L + rail, rail, rail, (ax + bx) / 2, y + h - rail, (az + bz) / 2, ry);
      if (o.mid) B.box(mat, L, rail * 0.7, rail * 0.7, (ax + bx) / 2, y + 0.12, (az + bz) / 2, ry);
      const n = Math.max(1, Math.round(L / sp));
      for (let k = 0; k <= n; k++) {
        const t = k / n; const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        if (o.square) B.box(mat, r * 2, h - rail, r * 2, x, y, z, ry); else B.cyl(mat, r, r, h - rail, x, y, z, 6);
      }
      if (o.post) { B.box(o.postMat || mat, 0.1, h + 0.05, 0.1, ax, y, az, ry); B.box(o.postMat || mat, 0.1, h + 0.05, 0.1, bx, y, bz, ry); }
    }
  };
  /* hàng rào tre / gỗ / sắt dọc pts; o.kind: 'tre' (phên tre đan), 'coc' (cọc tre), 'go', 'sat' */
  A.fence = function (B, ctx, mat, pts, o) {
    o = o || {};
    const h = o.h || 1.2, kind = o.kind || 'coc';
    const r = HT.rng(o.seed || 3);
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(-(bz - az), bx - ax);
      const Y = (x, z) => (ctx ? ctx.height(x, z) : 0) + (o.y || 0);
      if (kind === 'coc') {
        const n = Math.round(L / 0.09);
        for (let k = 0; k <= n; k++) { const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t; B.cyl(mat, 0.022, 0.026, h * r.range(0.85, 1.1), x, Y(x, z) - 0.05, z, 6); }
        for (const yy of [0.35, h * 0.8]) B.beam(mat, ax, Y(ax, az) + yy, az, bx, Y(bx, bz) + yy, bz, 0.03, 0.03, { round: true, seg: 6 });
      } else if (kind === 'tre') {
        const mx = (ax + bx) / 2, mz = (az + bz) / 2;
        B.box(mat, L, h, 0.04, mx, Y(mx, mz), mz, ry);
        const n = Math.round(L / 1.6);
        for (let k = 0; k <= n; k++) { const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t; B.cyl(o.post || mat, 0.04, 0.045, h + 0.2, x, Y(x, z) - 0.05, z, 7); }
      } else if (kind === 'go') {
        const n = Math.round(L / 0.16);
        for (let k = 0; k <= n; k++) { const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t; B.box(mat, 0.09, h, 0.025, x, Y(x, z), z, ry); }
        for (const yy of [0.25, h - 0.25]) { const mx = (ax + bx) / 2, mz = (az + bz) / 2; B.box(mat, L, 0.08, 0.03, mx, Y(mx, mz) + yy, mz, ry); }
      } else if (kind === 'sat') {
        const n = Math.round(L / 0.13);
        for (let k = 0; k <= n; k++) { const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t; B.cyl(mat, 0.012, 0.012, h, x, Y(x, z), z, 6); B.cyl(mat, 0.0, 0.025, 0.08, x, Y(x, z) + h, z, 6); }
        for (const yy of [0.12, h - 0.1]) { const mx = (ax + bx) / 2, mz = (az + bz) / 2; B.box(mat, L, 0.03, 0.02, mx, Y(mx, mz) + yy, mz, ry); }
      }
      if (ctx && o.col !== false) ctx.colSeg(ax, az, bx, bz, 0.12, -5, 50);
    }
  };
  /* dãy vòm (hiên có vòm): dọc trục x cục bộ, n vòm rộng span, cột vuông pier, cao h, vòm bán nguyệt từ springY */
  A.arcadeWall = function (B, mat, o) {
    const n = o.n, span = o.span, pier = o.pier || 0.5, h = o.h, sy = o.spring, t = o.t || 0.4;
    const L = n * span + (n + 1) * pier;
    const pts = [[-L / 2, 0], [L / 2, 0], [L / 2, h], [-L / 2, h]];
    const holes = [];
    for (let i = 0; i < n; i++) { const cx = -L / 2 + pier + span / 2 + i * (span + pier); holes.push(HT.archPath(cx, 0, span, sy, 16, o.pointed)); }
    const g = HT.extrude(pts, t, holes);
    g.translate(0, 0, -t / 2);
    B.add(mat, g, { x: o.x, y: o.y || 0, z: o.z, ry: o.ry || 0, uv: 'box', uvYaw: o.ry || 0 });
    return L;
  };
  /* gờ phào (cornice) chạy dọc cạnh: hình chữ nhật chồng lớp */
  A.cornice = function (B, mat, x, y, z, L, ry, depth, o) {
    o = o || {};
    const f = A.frame(x, z, ry);
    const steps = o.steps || [[0.06, 0.05], [0.1, 0.08], [0.16, 0.06], [0.22, 0.1]];
    let yy = y;
    for (const [dd, hh] of steps) { const [wx, wz] = f(0, dd * (depth / 0.22) / 2); B.box(mat, L + dd * 2, hh, dd * (depth / 0.22), wx, yy, wz, ry); yy += hh; }
    return yy;
  };

  /* ================================================================================================
     NHÀ VIỆT TRUYỀN THỐNG THEO GIAN (nhà tranh vách đất, nhà gỗ ngói, đình)
     o: {x,z,ry, gian, gianW, chai (số chái), chaiW, depth, porch, plinth, eave, ridge, roof:'thatch'|'tile'|'palm',
         roofMat, wallMat, back:'mud'|'plank'|'brick'|'bamboo'|'none', ends: như back, front:'liep'|'bucban'|'songdo'|'open'|'mud',
         col (vật liệu cột), colR, base (chân tảng), floorMat, openBays:[chỉ số gian mở], doorOpen}
     Trả về: {f, bays:[[x,z]], y (cao độ sàn), W, D} ================================================================================================ */
  A.vnHouse = function (ctx, B, o) {
    const f = A.frame(o.x, o.z, o.ry || 0);
    const ry = o.ry || 0;
    const nG = o.gian || 3, gw = o.gianW || 2.4, nC = o.chai || 0, cw = o.chaiW || 1.8;
    const W = nG * gw + nC * 2 * cw;
    const D = o.depth || 4.4, P = o.porch != null ? o.porch : 1.2;
    const py = o.plinth != null ? o.plinth : 0.3;
    const yb = o.yb != null ? o.yb : ctx.height(o.x, o.z);
    const y = yb + py;
    const eave = o.eave || 2.0, ridge = o.ridge || 4.4;
    const zb = -D / 2, zf = D / 2, zp = D / 2 + P;
    const colM = o.col || HT.mat('fine_grained_wood', { tile: 1.2, color: 0xecd4bc, rot: Math.PI / 2 });
    const r = HT.rng(o.seed || 7);
    /* nền */
    const plM = o.plinthMat || HT.mat('dirt_floor', { tile: 2 });
    const [px, pz] = f(0, P / 2);
    B.box(plM, W + 0.8, py + 0.3, D + P + 0.7, px, yb - 0.3, pz, ry);
    if (o.floorMat) B.box(o.floorMat, W + 0.2, 0.02, D + P + 0.1, px, y - 0.01, pz, ry, { noShadow: true });
    ctx.floorRect(px, pz, W + 0.8, D + P + 0.7, y, ry);
    /* bậc lên nền */
    if (py > 0.12) {
      const nS = Math.max(1, Math.round(py / 0.16));
      const [sx, sz] = f(0, zp + 0.35 + (nS * 0.3) / 2);
      const stepW = o.stepW || Math.min(W * 0.4, 3);
      for (let i = 0; i < nS; i++) {
        const [ax, az] = f(0, zp + 0.35 + (nS - i - 0.5) * 0.3);
        B.box(o.stepMat || plM, stepW, (py * (i + 1)) / nS, 0.31, ax, yb, az, ry);
      }
      const [r0x, r0z] = f(0, zp + 0.35 + nS * 0.3 + 0.1), [r1x, r1z] = f(0, zp + 0.3);
      ctx.ramp(r0x, r0z, r1x, r1z, stepW, yb, y);
    }
    /* vị trí vì cột */
    const xs = []; let xx = -W / 2;
    xs.push(xx); for (let i = 0; i < nC; i++) { xx += cw; xs.push(xx); } for (let i = 0; i < nG; i++) { xx += gw; xs.push(xx); } for (let i = 0; i < nC; i++) { xx += cw; xs.push(xx); }
    const rowsZ = o.rows || [zb, zb + D * 0.33, zb + D * 0.67, zf, zp];
    const colR = o.colR || 0.1;
    const under = (o.roof === 'tile' ? 0.14 : (o.roofThick || 0.3)) + 0.08;
    const roofAt = (z) => { /* cao độ mặt dưới mái tại z (mái 2 phía) */
      const zc = P / 2; const halfD = (D + P) / 2 + (o.overhang || 0.6);
      return y + eave - (o.roof === 'tile' ? 0.05 : 0.15) + (ridge - eave) * (1 - Math.min(1, Math.abs(z - zc) / halfD)) - under;
    };
    const hipRoof = o.roof !== 'tile' || o.roofType === 'hip';
    for (const cx of xs) for (const cz of rowsZ) {
      const top = roofAt(cz) - 0.04;
      const [wx, wz] = f(cx, cz);
      if (o.skipCol && o.skipCol(cx, cz)) continue;
      A.column(B, colM, wx, y, wz, cz === zp ? colR * 0.85 : colR, top - y, { base: o.base, baseH: 0.12, seg: 10 });
      ctx.colCircle(wx, wz, colR + 0.02, y, top);
    }
    /* xà dọc, kèo ngang */
    for (const cz of rowsZ) {
      const top = roofAt(cz) - 0.12;
      const [wx, wz] = f(0, cz);
      B.box(colM, W + (hipRoof ? -0.1 : 0.3), 0.14, 0.12, wx, top, wz, ry);
    }
    xs.forEach((cx, i) => {
      const end = i === 0 || i === xs.length - 1;
      const [ax, az] = f(cx, rowsZ[0]), [bx, bz] = f(cx, rowsZ[rowsZ.length - 1]);
      const lo = Math.min(roofAt(rowsZ[0]), roofAt(rowsZ[rowsZ.length - 1])) - 0.12;
      B.beam(colM, ax, lo, az, bx, lo, bz, 0.12, 0.14);
      if (end && hipRoof) return;
      const [mx, mz] = f(cx, P / 2);
      const top = roofAt(P / 2) - 0.08;
      B.beam(colM, ax, roofAt(rowsZ[0]) - 0.06, az, mx, top, mz, 0.1, 0.12);
      B.beam(colM, bx, roofAt(rowsZ[rowsZ.length - 1]) - 0.06, bz, mx, top, mz, 0.1, 0.12);
      if (o.truss !== false) B.beam(colM, mx, lo, mz, mx, top, mz, 0.1, 0.1);
    });
    /* tường sau và hồi */
    const wallMat = (k) => k === 'mud' ? (o.wallMat || HT.mat('clay_plaster', { tile: 2.5, color: 0xd8c4a2, env: 0.7 })) : k === 'plank' ? (o.plankMat || HT.mat('weathered_brown_planks', { tile: 2, env: 0.6 })) : k === 'brick' ? (o.brickMat || HT.mat('red_brick', { tile: 1.5 })) : k === 'bamboo' ? (o.bambooMat || HT.mat('bamboo_wall', { tile: 1.6, env: 0.7 })) : null;
    const wt = o.wallT || 0.22;
    const topBack = roofAt(zb) - 0.02;
    const back = o.back || 'mud';
    if (back !== 'none') {
      const [ax, az] = f(-W / 2, zb), [bx, bz] = f(W / 2, zb);
      A.wall(B, ctx, wallMat(back), { x0: ax, z0: az, x1: bx, z1: bz, y0: y, h: topBack - y, t: wt, open: o.backOpen || [] });
    }
    const ends = o.ends || back;
    if (ends !== 'none') for (const sx of [-1, 1]) {
      /* tường hồi: đa giác theo dốc mái (thêm tam giác hồi nếu mái ngói 2 mái) */
      const hb = roofAt(zb) - 0.02 - y, hf = roofAt(zf) - 0.02 - y;
      const pts = (o.roof === 'tile' && o.roofType !== 'hip')
        ? [[zb, 0], [zf, 0], [zf, hf], [P / 2, roofAt(P / 2) - y], [zb, hb]]
        : [[zb, 0], [zf, 0], [zf, hf], [zb, hb]];
      const ops = (sx < 0 ? o.leftOpen : o.rightOpen) || [];
      const holes = ops.map((p) => HT.rectPath(zb + p.u - p.w / 2, p.y, zb + p.u + p.w / 2, p.y + p.h));
      const g = HT.extrude(pts, wt, holes);
      g.translate(0, 0, -wt / 2); g.rotateY(-Math.PI / 2); g.translate(sx * W / 2, y, 0);
      B.add(wallMat(ends), g, { x: o.x, z: o.z, ry, uv: 'box', uvYaw: ry });
      const [ex, ez] = f(sx * W / 2, 0);
      ctx.colBox(ex, ez, wt, D, ry, y, y + Math.max(hb, hf));
    }
    /* mặt trước từng gian */
    const front = o.front || 'bucban';
    const frontTop = roofAt(zf) - 0.04;
    const bays = [];
    for (let i = 0; i < xs.length - 1; i++) {
      const x0 = xs[i], x1 = xs[i + 1], cx = (x0 + x1) / 2, bw = x1 - x0 - colR * 1.6;
      bays.push(f(cx, 0));
      const [wx, wz] = f(cx, zf);
      const isChai = i < nC || i >= nC + nG;
      const open = (o.openBays || []).includes(i);
      if (front === 'mud' || (isChai && o.chaiFront === 'mud')) {
        const [ax, az] = f(x0 + colR, zf), [bx, bz] = f(x1 - colR, zf);
        A.wall(B, ctx, wallMat('mud'), { x0: ax, z0: az, x1: bx, z1: bz, y0: y, h: frontTop - y, t: wt, open: open ? [{ u: bw / 2 + colR * 0.2, w: Math.min(1.1, bw * 0.6), y: 0, h: 1.75 }] : [] });
        if (open) { const [dx2, dz2] = f(cx, zf - 0.02); }
        continue;
      }
      if (front === 'open') continue;
      if (front === 'liep') {
        /* liếp tre treo phía trên, chống lên bằng sào */
        const lm = o.liepMat || HT.mat('bamboo_wall_02', { tile: 1.2, env: 0.6, color: 0xa89274 });
        const lh = frontTop - y - 0.05;
        if (open) {
          const ang = 0.72;
          const [lx, lz] = f(cx, zf + Math.sin(ang) * lh / 2);
          B.add(lm, HT.geoBox(bw, lh, 0.035), { x: lx, y: frontTop - Math.cos(ang) * lh / 2, z: lz, ry, rx: -ang });
          const [s0x, s0z] = f(cx - bw * 0.3, zf + Math.sin(ang) * lh + 0.05), [s1x, s1z] = f(cx - bw * 0.3, zf + Math.sin(ang) * lh * 1.1);
          B.beam(o.poleMat || colM, s0x, y, s0z, s1x, frontTop - Math.cos(ang) * lh, s1z, 0.025, 0.025, { round: true, seg: 6 });
        } else {
          B.add(lm, HT.geoBox(bw, lh, 0.035), { x: wx, y: y + lh / 2, z: wz, ry });
          ctx.colBox(wx, wz, bw, 0.1, ry, y, y + lh);
        }
        continue;
      }
      /* cửa bức bàn / thượng song hạ đố: 4 cánh mỗi gian */
      const dm = o.doorMat || HT.mat('fine_grained_wood', { tile: 1.2, color: 0xa88e76, env: 0.7, rot: Math.PI / 2 });
      A.door(B, { x: wx, z: wz, ry, w: bw, h: frontTop - y - 0.3, y: y + 0.12, t: 0.06, leaves: 4, kind: front === 'songdo' ? 'songdo' : 'plank', open: open ? (o.doorOpen != null ? o.doorOpen : 0.92) : 0, mat: dm, frameOn: false, threshold: colM });
      B.box(colM, bw, 0.12, 0.1, wx, y, wz, ry);
      B.box(colM, bw, 0.12, 0.1, wx, frontTop - 0.18, wz, ry);
      B.box(colM, bw, frontTop - 0.06 - (frontTop - 0.18), 0.06, wx, frontTop - 0.18, wz, ry);
      if (!open) ctx.colBox(wx, wz, bw, 0.12, ry, y, frontTop);
    }
    /* mái */
    const ov = o.overhang || 0.6;
    const [rx, rz] = f(0, P / 2);
    const roofW = W + ov * 2 + (o.roofExtraW || 0), roofD = D + P + ov * 2;
    if (o.roof === 'tile') {
      const rm = o.roofMat || HT.mat('clay_roof_tiles', { tile: 1.6 });
      const under = o.underMat || HT.mat('fine_grained_wood', { tile: 1.2, env: 0.5 });
      if (o.roofType === 'hip') A.hipRoof(B, rm, { x: rx, z: rz, ry, w: roofW, d: roofD, eave: y + eave - 0.05, ridge: y + ridge, thick: 0.12, kind: 'tile', pitch: 0.22, amp: 0.03, underMat: under, ridgeLen: roofW - roofD * 0.8 }, under);
      else A.gableRoof(B, rm, { x: rx, z: rz, ry, w: roofW, d: roofD, eave: y + eave - 0.05, ridge: y + ridge, thick: 0.12, kind: 'tile', pitch: 0.22, amp: 0.03, underMat: under, ridgeMat: o.ridgeMat || HT.mat('white_plaster_02', { tile: 1, color: 0x9a8c7a }), ridgeH: 0.26, ridgeW: 0.3 }, under);
    } else {
      const rm = o.roofMat || (o.roof === 'palm' ? HT.mat('reed_roof_04', { tile: 1.6, color: 0xb9a57c }) : HT.mat('thatch_roof_angled', { tile: 2.0, color: 0xd6c3a0 }));
      const under = o.underMat || HT.mat('bamboo_veneer', { tile: 0.8, env: 0.4, color: 0xb09a70 });
      A.hipRoof(B, rm, { x: rx, z: rz, ry, w: roofW, d: roofD, eave: y + eave - 0.15, ridge: y + ridge, thick: o.roofThick || 0.3, kind: 'thatch', seed: o.seed || 3, underMat: under, ridgeLen: roofW - roofD * (o.hipK || 0.7), ridgeMat: o.ridgeMat || rm, ridgeR: 0.16 }, rm);
    }
    return { f, bays, y, W, D, P, xs, zf, zb, zp, eave: y + eave, ridge: y + ridge };
  };

  /* ================================================================================================
     NHÀ SÀN / LÁN (Pác Bó, Tân Trào, ATK, Thái): cột, sàn, vách, mái, thang
     o: {x,z,ry, w, d, floorY (cao sàn), wallH, eave, ridge, roof:'thatch'|'palm'|'tile', wall:'nua'|'plank'|'bamboo'|'open',
         stairSide: 'front'|'left'|'right', stairW, veranda (sâu hàng hiên), posts (khoảng cách cột), openings}
     ================================================================================================ */
  A.stiltHouse = function (ctx, B, o) {
    const f = A.frame(o.x, o.z, o.ry || 0), ry = o.ry || 0;
    const W = o.w, D = o.d, fy = (o.yb != null ? o.yb : ctx.height(o.x, o.z)) + o.floorY;
    const yb = o.yb != null ? o.yb : ctx.height(o.x, o.z);
    const postM = o.postMat || HT.mat('rough_wood', { tile: 1.2 });
    const floorM = o.floorMat || HT.mat('old_wooden_floor_02', { tile: 1.5, env: 0.6 });
    const nx = Math.max(2, Math.round(W / (o.posts || 2.0))), nz = Math.max(2, Math.round(D / (o.posts || 2.0)));
    const ver = o.veranda || 0;
    const eave = fy + (o.eave || 1.9), ridge = fy + (o.ridge || 3.6);
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
      const lx = -W / 2 + (W * i) / nx, lz = -D / 2 + (D * j) / nz;
      const [wx, wz] = f(lx, lz);
      const g = ctx.height(wx, wz);
      if (o.stone !== false) B.box(o.stoneMat || HT.mat('mossy_rock', { tile: 1, color: 0xd8d8d0 }), 0.35, 0.18, 0.35, wx, g - 0.05, wz, ry, { bevel: 0.04 });
      const top = eave - 0.1 + (j === nz / 2 ? 0 : 0);
      B.cyl(postM, o.postR || 0.09, (o.postR || 0.09) * 1.1, top - g, wx, g + 0.1, wz, 9);
      ctx.colCircle(wx, wz, (o.postR || 0.09) + 0.03, g, top);
    }
    /* dầm sàn và sàn */
    for (let j = 0; j <= nz; j++) { const [wx, wz] = f(0, -D / 2 + (D * j) / nz); B.box(postM, W + 0.3, 0.14, 0.14, wx, fy - 0.2, wz, ry); }
    const [cx, cz] = f(0, ver / 2);
    if (o.floorKind === 'slat') {
      const n = Math.round(W / 0.09);
      for (let i = 0; i <= n; i++) { const [sx, sz] = f(-W / 2 + (W * i) / n, ver / 2); B.box(o.slatMat || HT.mat('bamboo_veneer', { tile: 1 }), 0.06, 0.05, D + ver, sx, fy - 0.06, sz, ry); }
    } else B.box(floorM, W + 0.1, 0.06, D + ver + 0.1, cx, fy - 0.06, cz, ry);
    ctx.floorRect(cx, cz, W + 0.1, D + ver + 0.1, fy, ry);
    /* vách */
    const wallM = o.wallMat || (o.wall === 'plank' ? HT.mat('raw_plank_wall', { tile: 2, env: 0.6 }) : o.wall === 'bamboo' ? HT.mat('bamboo_wall', { tile: 1.5, env: 0.65 }) : HT.mat('bamboo_wall_02', { tile: 1.2, env: 0.65 }));
    const wh = o.wallH || (eave - fy - 0.15);
    const walls = [[[-W / 2, -D / 2], [W / 2, -D / 2], o.backOpen], [[W / 2, -D / 2], [W / 2, D / 2], o.rightOpen], [[W / 2, D / 2], [-W / 2, D / 2], o.frontOpen], [[-W / 2, D / 2], [-W / 2, -D / 2], o.leftOpen]];
    if (o.wall !== 'open') for (const [a, b, op] of walls) {
      const [ax, az] = f(a[0], a[1]), [bx, bz] = f(b[0], b[1]);
      A.wall(B, ctx, wallM, { x0: ax, z0: az, x1: bx, z1: bz, y0: fy, h: wh, t: 0.05, open: op || [] });
    }
    /* hiên + lan can */
    if (ver > 0 && o.rail !== false) {
      const pts = [f(-W / 2, D / 2 + ver), f(W / 2, D / 2 + ver)];
      A.railing(B, o.railMat || postM, pts, fy, { h: 0.8, spacing: 0.25, r: 0.025, square: true });
      ctx.colSeg(pts[0][0], pts[0][1], pts[1][0], pts[1][1], 0.1, fy, fy + 1);
    }
    /* mái */
    const ov = o.overhang || 0.7;
    const [rx, rz] = f(0, ver / 2);
    const rW = W + ov * 2, rD = D + ver + ov * 2;
    if (o.roof === 'tile') A.gableRoof(B, o.roofMat || HT.mat('clay_roof_tiles', { tile: 1.5 }), { x: rx, z: rz, ry, w: rW, d: rD, eave, ridge, kind: 'tile', thick: 0.1, underMat: o.underMat || HT.mat('fine_grained_wood', { tile: 1, env: 0.5 }) });
    else A.hipRoof(B, o.roofMat || (o.roof === 'palm' ? HT.mat('reed_roof_04', { tile: 1.5, color: 0xa99a70 }) : HT.mat('thatch_roof_angled', { tile: 2, color: 0xc8b48c })), { x: rx, z: rz, ry, w: rW, d: rD, eave, ridge, thick: 0.25, kind: 'thatch', seed: o.seed || 5, ridgeLen: rW - rD * 0.6, underMat: o.underMat || HT.mat('bamboo_veneer', { tile: 0.8, env: 0.4 }) });
    /* thang */
    if (o.stair !== false) {
      const side = o.stairSide || 'front';
      const sw = o.stairW || 0.8;
      let sx, sz, sry;
      if (side === 'front') { [sx, sz] = f(o.stairX || 0, D / 2 + ver + (fy - yb) * 0.75 + 0.1); sry = ry; }
      else if (side === 'left') { [sx, sz] = f(-W / 2 - (fy - yb) * 0.75 - 0.1, o.stairZ || 0); sry = ry - Math.PI / 2; }
      else { [sx, sz] = f(W / 2 + (fy - yb) * 0.75 + 0.1, o.stairZ || 0); sry = ry + Math.PI / 2; }
      const n = Math.max(3, Math.round((fy - yb) / 0.2));
      A.stairs(B, ctx, o.stairMat || postM, { x: sx, z: sz, ry: sry, w: sw, n, rise: fy - yb, run: (fy - yb) * 0.75, y0: yb, solid: false, stringer: postM });
    }
    return { f, fy, W, D, eave, ridge };
  };

  /* ================================================================================================
     KHỐI NHÀ THEO TẦNG (phố Paris, London, Boston, Mátxcơva, Quảng Châu, Hồng Kông, phố cổ Hà Nội)
     o: {x,z,ry, w, d, floors:[chiều cao từng tầng], bays, wall, trim, base (tầng trệt), window:{w,h,kind,shutter...},
         ground:'shop'|'door'|'arcade'|'plain', cornice, roof:'mansard'|'flat'|'gable'|'hip'|'none', roofMat,
         balcony:[chỉ số tầng], sign:{text,...}, chimneys, parapet}
     Mặt tiền ở +z cục bộ. ================================================================================================ */
  A.block = function (ctx, B, o) {
    const f = A.frame(o.x, o.z, o.ry || 0), ry = o.ry || 0;
    const W = o.w, D = o.d, yb = o.yb != null ? o.yb : (ctx ? ctx.height(o.x, o.z) : 0);
    const fl = o.floors || [4, 3.4, 3.4, 3.2];
    const H = fl.reduce((a, b) => a + b, 0);
    const wallM = o.wall, trimM = o.trim || o.wall, baseM = o.base || wallM;
    const glass = o.glass || HT.glass();
    const bays = o.bays || Math.max(1, Math.round(W / 3.2));
    const bw = W / bays;
    const t = o.t || 0.45;
    /* thân nhà phía sau mặt tiền (hộp đặc) */
    const [bx, bz] = f(0, -t / 2);
    B.box(o.bodyMat || wallM, W - 0.04, H, D - t, bx, yb, bz, ry);
    if (ctx && o.col !== false) { const [qx, qz] = f(0, 0); ctx.colBox(qx, qz, W, D, ry, yb - 1, yb + H); }
    /* mặt tiền theo tầng */
    let y = yb;
    fl.forEach((fh, k) => {
      const isG = k === 0;
      const openings = [];
      for (let i = 0; i < bays; i++) {
        const u = bw * (i + 0.5);
        if (isG) {
          const g = o.ground || 'door';
          if (g === 'shop') openings.push({ u, w: bw * 0.78, y: 0.35, h: fh - 0.95, shop: true });
          else if (g === 'door') openings.push(i === Math.floor(bays / 2) ? { u, w: Math.min(1.5, bw * 0.55), y: 0, h: Math.min(fh - 0.6, 2.9), door: true } : { u, w: Math.min(o.window ? o.window.w : 1.1, bw * 0.5), y: 0.9, h: fh - 1.6 });
          else if (g === 'plain') openings.push({ u, w: Math.min(1.1, bw * 0.45), y: 0.9, h: fh - 1.7 });
        } else {
          const wd = o.window || {};
          openings.push({ u, w: Math.min(wd.w || 1.1, bw * 0.6), y: wd.y != null ? wd.y : (k === fl.length - 1 && o.attic ? 0.5 : 0.75), h: Math.min(wd.h || 2.0, fh - 1.1) });
        }
      }
      if (!(isG && o.ground === 'arcade')) {
        const [ax, az] = f(-W / 2, D / 2 - t / 2), [ex, ez] = f(W / 2, D / 2 - t / 2);
        A.wall(B, null, isG ? baseM : wallM, { x0: ax, z0: az, x1: ex, z1: ez, y0: y, h: fh, t, open: openings.map((p) => ({ u: p.u, w: p.w, y: p.y, h: p.h })) });
        for (const p of openings) {
          const [wx, wz] = f(-W / 2 + p.u, D / 2 - t / 2);
          if (p.door) {
            A.door(B, { x: wx, z: wz, ry, w: p.w, h: p.h, y, t, kind: o.doorKind || 'panel', leaves: 2, open: o.doorOpen || 0, mat: o.doorMat || HT.mat('fine_grained_wood', { tile: 1, color: 0xa08870 }), trim: trimM });
          } else if (p.shop) {
            A.window(B, { x: wx, z: wz, ry, w: p.w, h: p.h, y: y + p.y, t, kind: 'casement', rows: 2, cols: 3, frame: o.shopFrame || o.doorMat || HT.mat('fine_grained_wood', { tile: 1, color: 0xa08870 }), glass, sill: false });
          } else {
            const wd = o.window || {};
            A.window(B, Object.assign({ x: wx, z: wz, ry, w: p.w, h: p.h, y: y + p.y, t, kind: wd.kind || 'casement', frame: wd.frame || trimM, glass, shutter: wd.shutter, shutterOpen: wd.shutterOpen, lintel: wd.lintel, sillMat: wd.sillMat || trimM, rows: wd.rows, cols: wd.cols }, {}));
          }
        }
      } else {
        const n = bays;
        A.arcadeWall(B, baseM, { x: f(0, D / 2 - t / 2)[0], z: f(0, D / 2 - t / 2)[1], y, ry, n, span: bw - 0.55, pier: 0.55, h: fh, spring: fh - 0.2 - (bw - 0.55) / 2, t });
      }
      /* ban công */
      if ((o.balcony || []).includes(k)) {
        const [mx, mz] = f(0, D / 2 + 0.45);
        B.box(o.balconyFloor || trimM, W - 0.2, 0.14, 0.95, mx, y - 0.06, mz, ry);
        A.railing(B, o.railMat || HT.solid(0x1b1b1b, { rough: 0.5, metal: 0.6 }), [f(-W / 2 + 0.1, D / 2 + 0.9), f(W / 2 - 0.1, D / 2 + 0.9)], y + 0.08, { h: 0.95, spacing: 0.11, r: 0.012 });
      }
      /* gờ tầng */
      if (k > 0 && o.band !== false) { const [gx, gz] = f(0, D / 2 + 0.03); B.box(trimM, W + 0.06, 0.16, 0.12, gx, y - 0.08, gz, ry); }
      y += fh;
    });
    /* phào đỉnh */
    let top = yb + H;
    if (o.cornice !== false) {
      const [gx, gz] = f(0, D / 2);
      top = A.cornice(B, trimM, gx, top, gz, W, ry, o.corniceD || 0.3);
    }
    if (o.parapet) { const [gx, gz] = f(0, D / 2 - 0.15); B.box(trimM, W, o.parapet, 0.25, gx, top, gz, ry); }
    const roof = o.roof || 'flat';
    const [rx, rz] = f(0, 0);
    if (roof === 'mansard') {
      A.mansard(B, o.roofMat || HT.mat('roof_slates_02', { tile: 1.2 }), o.roofTop || HT.solid(0x4c5256, { rough: 0.5, metal: 0.5 }), { x: rx, z: rz, ry, w: W, d: D, y: top, h1: o.mansardH || 2.6, inset1: 0.6, h2: 1.0 });
      /* cửa sổ mái */
      const nd = o.dormers || bays;
      for (let i = 0; i < nd; i++) {
        const lx = -W / 2 + (W * (i + 0.5)) / nd;
        const [dx, dz] = f(lx, D / 2 - 0.35);
        B.box(o.dormerMat || trimM, 0.95, 1.5, 0.7, dx, top + 0.3, dz, ry);
        const [wx2, wz2] = f(lx, D / 2 - 0.05);
        A.window(B, { x: wx2, z: wz2, ry, w: 0.62, h: 1.1, y: top + 0.45, t: 0.1, kind: 'casement', rows: 2, frame: HT.solid(0xe8e4dc, { rough: 0.6 }), glass, sill: false });
        const rg = new T.CylinderGeometry(0.55, 0.55, 0.8, 12, 1, false, 0, Math.PI); rg.rotateX(Math.PI / 2); rg.rotateZ(Math.PI / 2); rg.scale(1, 0.55, 1);
        const [ex2, ez2] = f(lx, D / 2 - 0.35);
        B.add(o.roofTop || HT.solid(0x4c5256, { rough: 0.5, metal: 0.5 }), rg, { x: ex2, y: top + 1.8, z: ez2, ry: ry + Math.PI / 2 });
      }
    } else if (roof === 'gable') {
      A.gableRoof(B, o.roofMat || HT.mat('clay_roof_tiles', { tile: 1.5 }), { x: rx, z: rz, ry: ry + (o.ridgeAlong === 'depth' ? Math.PI / 2 : 0), w: (o.ridgeAlong === 'depth' ? D : W) + 0.4, d: (o.ridgeAlong === 'depth' ? W : D) + 0.6, eave: top, ridge: top + (o.roofH || 2.2), thick: 0.12, kind: o.roofKind || 'tile', gable: wallM, gableInset: 0.3 });
    } else if (roof === 'hip') {
      A.hipRoof(B, o.roofMat || HT.mat('clay_roof_tiles', { tile: 1.5 }), { x: rx, z: rz, ry, w: W + 0.6, d: D + 0.6, eave: top, ridge: top + (o.roofH || 2.5), thick: 0.12, kind: o.roofKind || 'tile' });
    } else if (roof === 'flat') {
      B.box(o.roofMat || HT.mat('concrete_pavement', { tile: 3 }), W, 0.2, D, rx, top - 0.2, rz, ry);
    }
    /* ống khói */
    if (o.chimneys) for (const [lx, lz] of o.chimneys) {
      const [cx2, cz2] = f(lx, lz);
      B.box(o.chimneyMat || HT.mat('red_brick', { tile: 1 }), 0.7, 2.2, 0.5, cx2, top + (roof === 'mansard' ? 2.6 : 0.4), cz2, ry);
      for (let k = 0; k < 3; k++) { const [px2, pz2] = f(lx - 0.2 + k * 0.2, lz); B.cyl(HT.solid(0xa0522d, { rough: 0.8 }), 0.06, 0.07, 0.35, px2, top + (roof === 'mansard' ? 4.8 : 2.6), pz2, 8); }
    }
    return { f, H, top, W, D };
  };

  /* ================================================================================================
     NHÀ THUỘC ĐỊA CÓ HIÊN VÒM (Nhà Rồng, Bắc Bộ phủ, nhà hàng Hà Nội, trường Pháp...)
     o: {x,z,ry, w, d, floors:[cao từng tầng], bays, veranda (sâu hiên tầng trệt, 0 = không), t, plinth, wall, trim,
         window:{w,h,kind,shutter,rows}, doorKind, doorMat, floorMat, pier, roof:'hip'|'none', roofMat, roofH, ridgeLen,
         steps:[chỉ số gian có bậc], sideWin (số cửa sổ mỗi hồi), backWin (true)}
     Mặt tiền ở +z cục bộ. Trả về {f, y0, top, ridge, W, D}. ================================================================================================ */
  A.colonial = function (ctx, B, o) {
    const ry = o.ry || 0, f = A.frame(o.x, o.z, ry);
    const W = o.w, D = o.d, V = o.veranda || 0, t = o.t || 0.4;
    const yb = o.yb != null ? o.yb : ctx.height(o.x, o.z);
    const py = o.plinth != null ? o.plinth : 0.6;
    const y0 = yb + py;
    const fl = o.floors || [5, 4.4];
    const bays = o.bays || Math.max(3, Math.round(W / 3.3));
    const bw = W / bays;
    const wall = o.wall, trim = o.trim || wall;
    const dark = HT.solid(0x191613, { rough: 0.95, env: 0.2 });
    const glass = o.glass || HT.glass();
    const plM = o.plinthMat || trim;
    const win = o.window || {};
    const doorM = o.doorMat || HT.solid(0x33483c, { rough: 0.6, env: 0.6 });
    /* nền + bậc */
    { const [cx, cz] = f(0, 0); B.box(plM, W + 0.6, py + 0.4, D + 0.6, cx, yb - 0.4, cz, ry); ctx.floorRect(cx, cz, W + 0.6, D + 0.6, y0, ry); }
    if (py > 0.15) for (const i of (o.steps || [Math.floor(bays / 2)])) {
      const n = Math.max(2, Math.round(py / 0.16)), run = n * 0.32;
      const [sx, sz] = f(-W / 2 + bw * (i + 0.5), D / 2 + 0.3 + run);
      A.stairs(B, ctx, plM, { x: sx, z: sz, ry, n, rise: py, run, w: Math.min(bw * 0.85, 3.2), y0: yb, base: 0.3 });
    }
    if (o.floorMat && V > 0) { const [cx, cz] = f(0, D / 2 - V / 2); B.box(o.floorMat, W - 0.2, 0.02, V - 0.1, cx, y0, cz, ry, { noShadow: true }); }
    const sideWall = (sd, zA, zB, y, fh, nWin, col) => {
      const [ax, az] = f(sd * (W / 2 - t / 2), zA), [ex, ez] = f(sd * (W / 2 - t / 2), zB);
      const L = zB - zA, ops = [];
      for (let k = 0; k < nWin; k++) ops.push({ u: (L * (k + 0.5)) / nWin, w: Math.min(win.w || 1.15, 1.2), y: 0.85, h: Math.min(win.h || 2.3, fh - 1.4) });
      A.wall(B, col ? ctx : null, wall, { x0: ax, z0: az, x1: ex, z1: ez, y0: y, h: fh, t, open: ops });
      for (const p of ops) {
        const [wx, wz] = f(sd * (W / 2 - t / 2), zA + p.u);
        A.window(B, { x: wx, z: wz, ry: ry + sd * Math.PI / 2, w: p.w, h: p.h, y: y + p.y, t, kind: win.kind || 'casement', rows: win.rows || 3, frame: win.frame || trim, glass, shutter: win.shutter, shutterOpen: 1, sillMat: trim });
      }
    };
    let y = y0;
    fl.forEach((fh, k) => {
      const ground = k === 0;
      const zf = ground && V > 0 ? D / 2 - V : D / 2;
      /* tường trước có cửa */
      const ops = [];
      for (let i = 0; i < bays; i++) {
        const u = bw * (i + 0.5);
        const isOpen = ground && o.openBay === i;
        const isDoor = isOpen || (ground && (o.doorBays ? o.doorBays.includes(i) : (V > 0 ? i % 2 === 0 : i === Math.floor(bays / 2))));
        ops.push(isDoor ? { u, w: Math.min(isOpen ? 2.2 : 1.7, bw * 0.5), y: 0, h: Math.min(fh - 1.0, 3.3), door: true, blocked: !isOpen, open: isOpen }
          : { u, w: Math.min(win.w || 1.15, bw * 0.45), y: ground ? 0.9 : (win.y != null ? win.y : 0.75), h: Math.min(win.h || 2.3, fh - 1.4) });
      }
      { const [ax, az] = f(-W / 2, zf - t / 2), [ex, ez] = f(W / 2, zf - t / 2);
        A.wall(B, ctx, wall, { x0: ax, z0: az, x1: ex, z1: ez, y0: y, h: fh, t, open: ops }); }
      for (const p of ops) {
        const [wx, wz] = f(-W / 2 + p.u, zf - t / 2);
        if (p.door) A.door(B, { x: wx, z: wz, ry, w: p.w, h: p.h, y, t, kind: o.doorKind || 'glass', leaves: 2, open: p.open ? 0.92 : 0, mat: doorM, glass, trim });
        else A.window(B, { x: wx, z: wz, ry, w: p.w, h: p.h, y: y + p.y, t, kind: win.kind || 'casement', rows: win.rows || 3, frame: win.frame || trim, glass, shutter: ground && V > 0 ? null : win.shutter, shutterOpen: 1, sillMat: trim, lintel: win.lintel ? trim : null });
      }
      /* tường sau */
      if (o.backWin !== false) {
        const bo = []; for (let i = 0; i < bays; i += 2) bo.push({ u: bw * (i + 0.5), w: Math.min(win.w || 1.15, bw * 0.45), y: 0.9, h: Math.min(win.h || 2.3, fh - 1.4) });
        const [ax, az] = f(W / 2, -D / 2 + t / 2), [ex, ez] = f(-W / 2, -D / 2 + t / 2);
        A.wall(B, ctx, wall, { x0: ax, z0: az, x1: ex, z1: ez, y0: y, h: fh, t, open: bo });
        for (const p of bo) { const [wx, wz] = f(W / 2 - p.u, -D / 2 + t / 2); A.window(B, { x: wx, z: wz, ry: ry + Math.PI, w: p.w, h: p.h, y: y + p.y, t, kind: win.kind || 'casement', rows: win.rows || 3, frame: win.frame || trim, glass, shutter: win.shutter, shutterOpen: 1, sillMat: trim }); }
      } else { const [bx, bz] = f(0, -D / 2 + t / 2); B.box(wall, W, fh, t, bx, y, bz, ry); ctx.colBox(bx, bz, W, t, ry, y - 1, y + fh); }
      /* hai hồi */
      for (const sd of [-1, 1]) sideWall(sd, -D / 2 + t, zf - t, y, fh, o.sideWin != null ? o.sideWin : Math.max(1, Math.round((zf + D / 2) / 4)), true);
      /* lòng nhà tối (nhìn qua cửa) */
      if (!(ground && o.noDark0)) { const [cx, cz] = f(0, (zf - D / 2) / 2); B.box(dark, W - 2 * t - 0.06, fh - 0.04, zf + D / 2 - 2 * t - 0.06, cx, y + 0.02, cz, ry, { noShadow: true }); }
      /* hiên vòm tầng trệt */
      if (ground && V > 0) {
        const pier = o.pier || 0.75;
        const span = (W - (bays + 1) * pier) / bays;
        const [cx, cz] = f(0, D / 2 - t / 2);
        A.arcadeWall(B, o.arcadeMat || wall, { x: cx, z: cz, y, ry, n: bays, span, pier, h: fh, spring: fh - 0.45 - span / 2, t });
        for (let i = 0; i <= bays; i++) { const [px, pz] = f(-W / 2 + pier / 2 + i * (span + pier), D / 2 - t / 2); ctx.colBox(px, pz, pier, t, ry, y - 1, y + fh); }
        const sp2 = V - t - 2 * 0.6;
        for (const sd of [-1, 1]) {
          const [ax2, az2] = f(sd * (W / 2 - t / 2), D / 2 - t - (V - t) / 2);
          A.arcadeWall(B, o.arcadeMat || wall, { x: ax2, z: az2, y, ry: ry + Math.PI / 2, n: 1, span: sp2, pier: 0.6, h: fh, spring: fh - 0.45 - sp2 / 2, t });
        }
        const [qx, qz] = f(0, D / 2 - V / 2); B.box(o.ceilMat || trim, W - 0.1, 0.25, V - 0.1, qx, y + fh - 0.25, qz, ry);
      }
      /* gờ tầng */
      if (k > 0) {
        const [gx, gz] = f(0, D / 2 + 0.06); B.box(trim, W + 0.14, 0.24, 0.18, gx, y - 0.12, gz, ry);
        for (const sd of [-1, 1]) { const [sx, sz] = f(sd * (W / 2 + 0.06), 0); B.box(trim, 0.18, 0.24, D + 0.14, sx, y - 0.12, sz, ry); }
      }
      /* trụ áp tường ở góc */
      for (const sd of [-1, 1]) { const [px, pz] = f(sd * (W / 2 - 0.1), D / 2 + 0.02); B.box(trim, 0.55, fh, 0.12, px, y, pz, ry); }
      y += fh;
    });
    /* phào đỉnh bốn phía */
    let top = y;
    { const [gx, gz] = f(0, D / 2); top = A.cornice(B, trim, gx, y, gz, W + 0.1, ry, o.corniceD || 0.34); }
    { const [gx, gz] = f(0, -D / 2); A.cornice(B, trim, gx, y, gz, W + 0.1, ry + Math.PI, o.corniceD || 0.34); }
    for (const sd of [-1, 1]) { const [gx, gz] = f(sd * W / 2, 0); A.cornice(B, trim, gx, y, gz, D + 0.1, ry + sd * Math.PI / 2, o.corniceD || 0.34); }
    let ridge = top;
    if ((o.roof || 'hip') === 'hip') {
      const [rx, rz] = f(0, 0);
      ridge = top + (o.roofH || 3.2);
      A.hipRoof(B, o.roofMat || HT.mat('clay_roof_tiles_02', { tile: 1.3 }), { x: rx, z: rz, ry, w: W + 1.3, d: D + 1.3, eave: top - 0.05, ridge, ridgeLen: o.ridgeLen, thick: 0.16, kind: 'tile', pitch: 0.24, amp: 0.03, ridgeMat: o.ridgeMat || HT.solid(0x9a5a40, { rough: 0.7 }), ridgeR: 0.13 }, trim);
    } else if (o.roof === 'flat') {
      const [rx, rz] = f(0, 0); B.box(trim, W, 0.9, D, rx, top - 0.2, rz, ry);
      ridge = top + 0.7;
    }
    return { f, y0, top, ridge, W, D, yb };
  };
})();
