/* =====================================================================================================
   LỚP TRẢI NGHIỆM — Bảo tàng Hành trình 3D
   · Điểm đến: danh sách bảng, ảnh, hiện vật, cổng trong gian → dịch chuyển tức thì (phím 1–9, G)
   · Bài viết: trang tạp chí cho mỗi gian (chữ – ảnh xen kẽ, “Bạn có biết”, trích dẫn, mốc thời gian)
   · Giọng đọc: MP3 tạo sẵn (ht3d/am) → máy chủ /tts → giọng máy của trình duyệt
   · Điểm sáng trên hiện vật, bấm đồ vật để xem thẻ; Đố vui + Hộ chiếu đóng dấu; Hỏi đáp AI (tro_ly.js)
   ===================================================================================================== */
(function () {
  'use strict';
  const HT = window.HT, C = HT.core, D = HT.DATA, ui = HT.ui, T = window.THREE;
  const $ = (id) => document.getElementById(id);
  const tr = (vi, en) => (HT.lang === 'en' && en ? en : vi);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('kgvh_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('kgvh_' + k, JSON.stringify(v)); } catch (e) {} },
  };
  const BAI = () => HT.BAI || {};
  const cur = () => (C.hall && C.hall() ? C.hall().ma : null);
  const svg = (d) => '<svg viewBox="0 0 24 24">' + d + '</svg>';

  /* ============================================ GIỌNG ĐỌC ============================================ */
  const norm = (t) => String(t || '').replace(/\s+/g, ' ').trim();
  function bam(s) {
    let o = '';
    for (const seed of [0x811c9dc5, (0x01000193 ^ 0x5bd1e995) >>> 0]) {
      let h = seed >>> 0;
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
      o += h.toString(16).padStart(8, '0');
    }
    return o;
  }
  const G = HT.giong = {
    on: LS.get('giong_bat', true), voice: LS.get('giong2', 'vn_ngoclinh'), rate: LS.get('giong_toc', 1),
    audio: new Audio(), playing: false, _gen: 0,
    file(t, v) { return (window.HT_AM || 'ht3d/am/') + bam((v || G.voice) + '|' + norm(t)) + '.mp3'; },   /* bản mạng: giọng đọc ở trang riêng (HT_AM) */
    tourText(info) {
      if (!info) return '';
      const p = (info.paras || []).filter(Boolean);
      const tt = String(info.title || '').replace(/[.:;!?…\s]+$/, '');
      return norm([tt, p[0], p[1]].filter(Boolean).join('. '));
    },
    stop() { G._gen++; G.playing = false; G.paused = false; try { G.audio.pause(); } catch (e) {} try { speechSynthesis.cancel(); } catch (e) {} G._btn(); },
    pause() {
      if (!G.playing) return;
      G.paused = !G.paused;
      if (G.paused) { try { G.audio.pause(); } catch (e) {} try { speechSynthesis.pause(); } catch (e) {} }
      else { try { const p = G.audio.play(); p && p.catch(() => {}); } catch (e) {} try { speechSynthesis.resume(); } catch (e) {} }
      G._btn();
    },
    async speak(texts, opt) {
      opt = opt || {}; G.stop();
      G.nhan = opt.nhan || tr('Đang đọc thuyết minh', 'Narrating');
      const gen = G._gen; G.playing = true; G._btn();
      for (let i = 0; i < texts.length; i++) {
        if (gen !== G._gen) return;
        opt.onItem && opt.onItem(i);
        await G._one(texts[i], gen);
      }
      if (gen === G._gen) { G.playing = false; G._btn(); opt.onEnd && opt.onEnd(); }
    },
    _one(t, gen) {
      t = norm(t);
      return new Promise((res) => {
        if (!t) return res();
        const a = G.audio; const srcs = [G.file(t)]; if (G.voice === 'vn_thienminh') srcs.push(G.file(t, 'vn_ngoclinh')); if (G.voice !== 'nu') srcs.push(G.file(t, 'nu'));
        if (location.protocol.startsWith('http')) srcs.push('/tts?v=' + G.voice + '&t=' + encodeURIComponent(t.slice(0, 3900)));
        let k = 0;
        const next = () => {
          if (gen !== G._gen) return res();
          if (k >= srcs.length) return G._synth(t, gen).then(res);
          a.src = srcs[k++]; a.playbackRate = G.rate;
          a.play().catch(() => next());
        };
        a.onended = () => res(); a.onerror = () => next();
        next();
      });
    },
    _synth(t, gen) {
      return new Promise((res) => {
        try {
          const vs = speechSynthesis.getVoices().filter((v) => /^vi/i.test(v.lang));
          if (!vs.length || gen !== G._gen) return res();
          const u = new SpeechSynthesisUtterance(t); u.voice = vs[0]; u.lang = 'vi-VN'; u.rate = G.rate;
          u.onend = u.onerror = () => res(); speechSynthesis.speak(u);
        } catch (e) { res(); }
      });
    },
    _btn() {
      const b = $('bVoice'); if (b) b.classList.toggle('on', G.on);
      document.querySelectorAll('[data-nghe]').forEach((x) => { const on = G.playing && x.dataset.nghe === G._who; x.classList.toggle('on', on); if (x.dataset.nhan0 == null) x.dataset.nhan0 = x.textContent; x.textContent = on ? '■ ' + tr('Dừng đọc', 'Stop') : x.dataset.nhan0; });
      const pl = $('player'); if (!pl) return;
      pl.classList.toggle('on', !!G.playing); pl.classList.toggle('dung', !!G.paused);
      pl.querySelector('.t').textContent = G.nhan || '';
      pl.querySelector('.pp').innerHTML = G.paused ? '▶' : '❚❚'; pl.querySelector('.pp').title = G.paused ? tr('Đọc tiếp', 'Resume') : tr('Tạm dừng', 'Pause');
    },
  };
  try { speechSynthesis.getVoices(); } catch (e) {}
  ui.dangDoc = () => G.playing;
  /* thanh đang đọc: luôn thấy nút Tạm dừng / Dừng khi có giọng đọc */
  { const pl = el('div', 'gl'); pl.id = 'player';
    pl.innerHTML = '<span class="eq"><i></i><i></i><i></i><i></i></span><span class="t"></span><button class="pp" title="Tạm dừng">❚❚</button><button class="st" title="Dừng đọc (Esc)">■ ' + tr('Dừng', 'Stop') + '</button>';
    document.body.append(pl);
    pl.querySelector('.pp').onclick = () => G.pause();
    pl.querySelector('.st').onclick = () => G.stop(); }

  /* ============================================ THANH CÔNG CỤ ============================================ */
  function btn(id, icon, vi, en, before) {
    const b = el('button'); b.id = id; b.title = vi; b.innerHTML = svg(icon) + '<span data-vi="' + vi + '" data-en="' + en + '">' + tr(vi, en) + '</span>';
    const bar = $('bar'); bar.insertBefore(b, before || null); return b;
  }
  const bTour = $('bTour');
  const bJump = btn('bJump', '<circle cx="12" cy="10" r="3"/><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/>', 'Điểm đến', 'Places', bTour);
  const bRead = $('bInfo'); bRead.innerHTML = svg('<path d="M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4z"/><path d="M20 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z"/>') + '<span data-vi="Bài viết" data-en="Story">Bài viết</span>'; bRead.title = 'Bài viết về gian này';
  const sep2 = $('bQual').previousElementSibling;
  const bQuiz = btn('bQuiz', '<path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.4 6.7 19.1l1-5.8-4.2-4.1 5.9-.9z"/>', 'Đố vui', 'Quiz', sep2);
  const bAsk = btn('bAsk', '<path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 9.5h7M8.5 12.5h4"/>', 'Hỏi đáp', 'Ask', sep2);
  const bVoice = btn('bVoice', '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>', 'Giọng đọc', 'Voice', $('bShot'));
  bVoice.classList.toggle('on', G.on);
  /* chọn giọng: VieNeu-TTS (mã nguồn mở, chạy tại máy) hoặc Microsoft Edge */
  const GIONG = [
    ['vn_ngoclinh', 'Ngọc Linh', 'Nữ · giọng Bắc · kể chuyện — VieNeu-TTS'],
    ['vn_thienminh', 'Thiện Minh', 'Nam · giọng Bắc · kể chuyện — VieNeu-TTS'],
    ['nu', 'Hoài My', 'Nữ · Microsoft Edge (giọng cũ)'],
  ];
  const vm = el('div', 'gl'); vm.id = 'vmenu'; document.body.append(vm);
  const CHAO = 'Xin chào quý khách, chào mừng đến với Bảo tàng Hành trình.';
  function veMenu() {
    vm.innerHTML = '';
    vm.append(el('div', 'k', tr('Giọng đọc thuyết minh', 'Narration voice')));
    const bt = el('button', 'vi' + (G.on ? '' : ' on'), G.on ? tr('Tắt giọng đọc', 'Turn off') : tr('Giọng đọc đang tắt — bấm để bật', 'Off — tap to turn on'));
    bt.onclick = () => { G.on = !G.on; LS.set('giong_bat', G.on); if (!G.on) G.stop(); G._btn(); veMenu(); };
    vm.append(bt);
    for (const [k, ten, mo] of GIONG) {
      const b = el('button', 'vi' + (G.on && G.voice === k ? ' on' : '')); b.append(el('b', '', ten)); b.append(el('small', '', mo));
      b.onclick = () => { G.voice = k; G.on = true; LS.set('giong2', k); LS.set('giong_bat', true); G._btn(); veMenu(); G._who = 'thu'; G.speak([CHAO]); };
      vm.append(b);
    }
  }
  bVoice.onclick = (e) => { e.stopPropagation(); if (G.playing) { G.stop(); ui.toast(tr('Đã dừng giọng đọc', 'Narration stopped')); return; } const on = !vm.classList.contains('on'); if (on) { veMenu(); const r = bVoice.getBoundingClientRect(); vm.style.left = Math.max(10, r.left + r.width / 2 - 150) + 'px'; } vm.classList.toggle('on', on); };
  document.addEventListener('click', (e) => { if (!vm.contains(e.target) && e.target !== bVoice) vm.classList.remove('on'); });

  /* ============================================ ĐIỂM ĐẾN ============================================ */
  const jump = el('aside', 'gl'); jump.id = 'jump';
  jump.innerHTML = '<div class="top"><div class="k">' + tr('Điểm đến trong gian', 'Places in this hall') + '</div><button class="x" title="Đóng" style="background:transparent;border:0;font-size:22px;color:var(--ink2)">×</button></div><input placeholder="' + tr('Tìm bảng, hiện vật, cổng…', 'Search…') + '"><div class="list"></div>';
  document.body.append(jump);
  const jList = jump.querySelector('.list'), jIn = jump.querySelector('input');
  jump.querySelector('.x').onclick = () => jump.classList.remove('on');
  const LOAI = { bang: ['Bảng giới thiệu & trích dẫn', '◆'], anh: ['Ảnh tư liệu', '▣'], chuyen: ['Câu chuyện', '✦'], noi: ['Hiện vật & nơi chốn', '●'], cong: ['Cổng sang gian khác', '➜'] };
  function goPoi(p) {
    if (p.gate) { jump.classList.remove('on'); C.goHall(p.gate, { from: cur() }); return; }
    C.jumpTo(p, true);
    if (window.innerWidth < 900) jump.classList.remove('on');
  }
  function buildJump() {
    const q = khongDauJ(norm(jIn.value));
    const ps = C.pois ? C.pois() : []; jList.innerHTML = '';
    for (const p of ps) { const h = p.info ? ui.timChuDe(p.info) : null; p._A = h ? HT.CD[h.ma].bang.find((x) => x.i === h.i) : null; p._tim = khongDauJ([p.ten, p._A && p._A.tieu_de_bang, p._A && p._A.tieu_de].filter(Boolean).join(' ')); }
    const hop = (p) => !q || p._tim.includes(q);
    let n = 0; ui._jumpOrder = [];
    for (const k of ['bang', 'chuyen', 'anh', 'noi', 'cong']) {
      const items = ps.filter((p) => p.loai === k && hop(p));
      if (!items.length) continue;
      jList.append(el('div', 'grp', LOAI[k][0]));
      for (const p of items) {
        n++; ui._jumpOrder.push(p);
        const b = el('button', 'it'); const ic = el('span', 'ic', n <= 9 ? String(n) : LOAI[k][1]);
        const nm = p._A ? p._A.tieu_de_bang : (p.loai === 'chuyen' && p.info && (p.info.paras || [])[0]) ? p.info.paras[0].replace(/\s+/g, ' ').slice(0, 72) + '…' : (p.ten || '—');
        const tx = el('span', 'tx', nm); if (p._A) tx.append(el('small', '', p._A.tieu_de)); else if (p.info && p.info.kicker) tx.append(el('small', '', p.info.kicker));
        b.append(ic, tx); b.onclick = () => goPoi(p); jList.append(b);
        p._n = n;
      }
    }
    const ma = cur(); const dv = (HT.CD && ma && HT.CD[ma] ? HT.CD[ma].do_vat : []).filter((d) => !q || khongDauJ(d.ten + ' ' + d.tieu_de).includes(q));
    if (dv.length) {
      jList.append(el('div', 'grp', tr('Đồ vật kể chuyện', 'Objects with stories')));
      for (const d of dv) { n++; const b = el('button', 'it'); b.append(el('span', 'ic', '✦')); const tx = el('span', 'tx', d.ten); tx.append(el('small', '', d.tieu_de)); b.append(tx); b.onclick = () => { ui.diToiDoVat(ma, d.id); if (window.innerWidth < 900) jump.classList.remove('on'); }; jList.append(b); }
    }
    if (!n) jList.append(el('div', 'grp', tr('Không tìm thấy', 'Nothing found')));
  }
  const khongDauJ = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  jIn.oninput = buildJump;
  bJump.onclick = () => { const on = !jump.classList.contains('on'); if (on) { buildJump(); jIn.value = ''; } jump.classList.toggle('on', on); bJump.classList.toggle('on', on); };

  /* ============================================ TẠP CHÍ TRONG TỜ THÔNG TIN ============================================
     Mỗi bảng trong gian mở một chuyên đề riêng (HT.CD — ht3d/chuyen_de.js): ảnh bìa, tít, sapo, các đoạn có tiêu đề,
     ảnh tư liệu xen giữa chữ, “Bạn có biết?”, trích dẫn, mốc thời gian, nguồn. Nút “Bài viết” mở bài tổng quan của gian
     (HT.BAI) cùng mục lục các chuyên đề. Đồ vật trong nhà có câu chuyện riêng gắn với sự thật về Người. */
  let cdP = null;
  function taiCD() {
    if (HT.CD) return Promise.resolve(HT.CD);
    if (!cdP) cdP = new Promise((res) => {
      const s = document.createElement('script'); s.src = 'ht3d/chuyen_de.js?v=' + (HT.BUILD || 1); s.async = true;
      s.onload = () => res(HT.CD || null); s.onerror = () => { cdP = null; res(null); };
      document.head.append(s);
    });
    return cdP;
  }
  ui.taiCD = taiCD; taiCD();
  const tenGian = (ma) => (ma === 'G00' ? tr('Sảnh', 'Lobby') : tr('Gian ', 'Hall ') + ma.slice(1));
  const khoaInfo = (i) => (i ? [i.label || '', i.title || '', ((i.paras || [])[0] || '').slice(0, 60), i.img || ''].join('|') : '');
  function dsBang(ma) { const h = C.hall && C.hall(); return h && h.ma === ma ? h.tour.filter((s) => s.info) : []; }
  function timChuDe(info) {
    const ma = cur(); if (!ma || !info || typeof info !== 'object' || !HT.CD || !HT.CD[ma]) return null;
    const k = khoaInfo(info); const L = dsBang(ma);
    const i = L.findIndex((s) => s.info === info || khoaInfo(s.info) === k);
    if (i >= 0 && HT.CD[ma].bang.some((x) => x.i === i)) return { ma, i };
    /* bản đồ hành trình 1911 – 1941 ở Sảnh → chuyên đề ba mươi năm bôn ba */
    if (/bản đồ hành trình/i.test(info.title || '')) { const b = HT.CD[ma].bang.find((x) => /1911/.test(x.tieu_de_bang)); if (b) return { ma, i: b.i }; }
    /* xe trong nhà để xe (Phủ Chủ tịch) → chuyên đề “Nhà để xe” */
    if (/^Xe /.test(info.title || '')) { const b = HT.CD[ma].bang.find((x) => /nhà để xe/i.test(x.tieu_de_bang)); if (b) return { ma, i: b.i }; }
    /* ảnh tư liệu của gian khác bày ở Sảnh: mở chuyên đề của chính tấm ảnh ấy ở gian gốc */
    if (info.img && info.title) for (const m of D.thu_tu) { const b = HT.CD[m] && HT.CD[m].bang.find((x) => x.tieu_de_bang === info.title); if (b) return { ma: m, i: b.i }; }
    return null;
  }
  ui.timChuDe = timChuDe;
  function light(src, cap) { $('lImg').src = src; $('lCap').textContent = cap || ''; $('light').classList.add('on'); }
  function hinh(src, cap, credit, cls, p3d) {
    const f = el('figure', cls || '');
    const im = el('img'); im.loading = 'lazy'; im.decoding = 'async'; im.src = src; im.alt = cap || '';
    im.onclick = () => light(src, (cap || '') + (credit ? ' — ' + credit : ''));
    const fc = el('figcaption'); if (p3d) fc.append(el('span', 'b3', tr('PHỤC DỰNG 3D', '3D RECONSTRUCTION')));
    fc.append(document.createTextNode(cap || '')); if (credit) fc.append(el('small', '', credit));
    f.append(im, fc); return f;
  }
  function soChu(A) { let n = String(A.sapo || '').split(/\s+/).length; for (const b of A.khoi || []) n += String(b.text || '').split(/\s+/).length; return n; }
  /* dựng thân bài: đoạn, ảnh, bạn có biết, trích dẫn, mốc thời gian */
  function veKhoi(art, khoi) {
    let dau = true, fig = 0;
    for (const b of khoi || []) {
      let n = null;
      if (b.loai === 'doan') {
        n = el('section', 'md'); if (b.tieu_de) n.append(el('h3', '', b.tieu_de));
        String(b.text || '').split(/\n\s*\n/).filter(Boolean).forEach((t) => { n.append(el('p', dau ? 'drop' : '', t)); dau = false; });
      } else if (b.loai === 'anh') {
        fig++; n = hinh(b.src, b.chu_thich, b.credit, fig === 1 ? 'mf rong' : (fig % 2 ? 'mf trai' : 'mf phai'), b.p3d);
      } else if (b.loai === 'ban_co_biet') {
        n = el('aside', 'mbiet'); n.append(el('b', '', tr('Bạn có biết?', 'Did you know?'))); n.append(el('p', '', b.text));
        const ng = b.nguon || b.nguon_ten; if (ng) n.append(el('small', '', tr('Nguồn: ', 'Source: ') + ng));
      } else if (b.loai === 'trich') {
        n = el('blockquote', 'mq'); n.append(el('p', '', b.text)); n.append(el('cite', '', [b.nguoi, b.nguon || b.nguon_ten].filter(Boolean).join(' · ')));
      } else if (b.loai === 'moc') {
        n = el('div', 'mtl'); n.append(el('b', '', tr('Mốc thời gian', 'Timeline'))); const ol = el('ol');
        for (const it of b.items || []) { const li = el('li'); li.append(el('span', '', it[0])); li.append(document.createTextNode(it[1])); ol.append(li); }
        n.append(ol);
      }
      if (n) { if (b.doc != null) n.dataset.doc = b.doc; art.append(n); }
    }
    art.append(el('div', 'mclr'));
  }
  function nguonBox(list) {
    const s = el('div', 'mnguon'); s.append(el('b', '', tr('Nguồn tư liệu', 'Sources'))); const ul = el('ul');
    for (const u of list || []) {
      const li = el('li'); const url = u && u.url; const ten = typeof u === 'string' ? u : (u.ten || url || '');
      if (url && /^https?:/.test(url)) { const a = el('a', '', ten); a.href = url; a.target = '_blank'; a.rel = 'noopener'; li.append(a); } else li.textContent = ten;
      ul.append(li);
    }
    s.append(ul); return s;
  }
  /* mở tờ thông tin ở chế độ tạp chí */
  function moTo(kicker) {
    const s = $('sheet'); s.classList.add('tc'); s.classList.remove('rong');
    $('sK').textContent = kicker || '';
    const b = $('sB'); b.innerHTML = ''; b.scrollTop = 0;
    const pr = el('div', 'mprog'); pr.append(el('i')); b.append(pr);
    b.onscroll = () => { const m = b.scrollHeight - b.clientHeight; pr.firstChild.style.width = (m > 0 ? (100 * b.scrollTop) / m : 0) + '%'; };
    s.classList.add('on'); return b;
  }
  function hanhDong(art, o) {
    const row = el('div', 'macts');
    const nghe = el('button', 'g', '▶ ' + tr('Nghe bài', 'Listen')); nghe.dataset.nghe = o.who;
    nghe.onclick = () => docBai(art, o.doc, o.who, o.nhan);
    row.append(nghe);
    if (o.hoi) { const h = el('button', '', '💬 ' + tr('Hỏi AI', 'Ask AI')); h.onclick = () => openAI(o.hoi); row.append(h); }
    if (o.quiz) { const q = el('button', '', '★ ' + tr('Đố vui', 'Quiz')); q.onclick = () => openQuiz(o.quiz); row.append(q); }
    const r = el('button', 'rg'); const dat = () => { r.textContent = $('sheet').classList.contains('full') ? '⤡ ' + tr('Thu gọn', 'Narrow') : '⤢ ' + tr('Mở rộng', 'Wide'); };
    r.onclick = () => { $('sheet').classList.toggle('full'); LS.set('to_rong', $('sheet').classList.contains('full')); dat(); }; dat(); row.append(r);
    if (o.toi) row.append(o.toi);
    if (o.phut) row.append(el('span', 'mt', '≈ ' + o.phut + tr(' phút đọc', ' min read')));
    art.append(row); return nghe;
  }
  function docBai(host, doc, who, nhan) {
    if (G.playing && G._who === who) { G.stop(); return; }
    G._who = who;
    G.speak((doc || []).map((d) => d.t), {
      nhan,
      onItem: (k) => { host.querySelectorAll('.doc-on').forEach((x) => x.classList.remove('doc-on')); const n = host.querySelector('[data-doc="' + k + '"]'); if (n) { n.classList.add('doc-on'); n.scrollIntoView({ behavior: 'smooth', block: 'center' }); } },
      onEnd: () => host.querySelectorAll('.doc-on').forEach((x) => x.classList.remove('doc-on')),
    });
    G._btn();
  }
  function nhayDoc(host, k) {
    if (k == null) return;
    setTimeout(() => { const n = host.querySelector('[data-doc="' + k + '"]'); if (n) { n.scrollIntoView({ block: 'center' }); n.classList.add('doc-on'); setTimeout(() => n.classList.remove('doc-on'), 2600); } }, 80);
  }
  /* đi tới bảng trong không gian 3D rồi mở chuyên đề của nó */
  function diToiChuDe(ma, i) {
    if (ma === cur()) { const s = dsBang(ma)[i]; if (s) C.jumpTo(s, false); moChuDe(ma, i); }
    else C.goHall(ma, { from: cur() }).then(() => { const s = dsBang(ma)[i]; if (s) C.jumpTo(s, false); moChuDe(ma, i); });
  }
  function theChuDe(ma, tru) {
    const g = el('div', 'mcards');
    for (const x of HT.CD[ma].bang) {
      if (x.i === tru) continue;
      const c = el('button', 'mc');
      if (x.bia && x.bia.src) { const im = el('img'); im.loading = 'lazy'; im.decoding = 'async'; im.src = x.bia.src; im.alt = ''; c.append(im); }
      const t = el('span', 'tx'); t.append(el('b', '', x.tieu_de_bang)); t.append(el('small', '', x.tieu_de)); c.append(t);
      c.onclick = () => diToiChuDe(ma, x.i); g.append(c);
    }
    return g;
  }
  function theDoVat(ma, tru) {
    const g = el('div', 'mchips');
    for (const d of HT.CD[ma].do_vat) { if (d.id === tru) continue; const b = el('button', '', '✦ ' + d.ten); b.onclick = () => diToiDoVat(ma, d.id); g.append(b); }
    return g;
  }
  function moChuDe(ma, i, o) {
    o = o || {};
    const T0 = HT.CD && HT.CD[ma]; const A = T0 && T0.bang.find((x) => x.i === i); if (!A) return false;
    if (G.playing && G._who !== 'ai') G.stop();
    const all = T0.bang, k = all.indexOf(A);
    const b = moTo(tenGian(ma) + ' · ' + tr('Chuyên đề ', 'Topic ') + (k + 1) + '/' + all.length);
    const art = el('article', 'mz');
    const hero = el('header', 'mh');
    if (A.bia && A.bia.src) { hero.style.backgroundImage = 'url("' + A.bia.src + '")'; hero.onclick = () => light(A.bia.src, A.tieu_de + (A.bia.credit ? ' — ' + A.bia.credit : '')); }
    const hin = el('div', 'in'); hin.append(el('div', 'kk', A.tieu_de_bang)); hin.append(el('h2', '', A.tieu_de)); hero.append(hin);
    if (A.bia && A.bia.credit) hero.append(el('span', 'cr', A.bia.credit));
    art.append(hero);
    let toi = null;
    if (ma !== cur()) { toi = el('button', '', '➜ ' + tr('Tới bảng này trong 3D', 'Go there in 3D')); toi.onclick = () => diToiChuDe(ma, i); }
    hanhDong(art, { who: 'cd', doc: A.doc, nhan: A.tieu_de_bang, hoi: A.tieu_de_bang, toi, phut: Math.max(1, Math.round(soChu(A) / 200)) });
    const sp = el('p', 'msapo', A.sapo); sp.dataset.doc = 0; art.append(sp);
    veKhoi(art, A.khoi);
    if ((A.nguon || []).length) art.append(nguonBox(A.nguon));
    const nav = el('div', 'mnav');
    for (const [j, lab] of [[k - 1, '← ' + tr('Chuyên đề trước', 'Previous')], [k + 1, tr('Chuyên đề tiếp', 'Next') + ' →']]) {
      const x = all[j]; const bt = el('button', j > k ? 'sau' : ''); if (!x) { bt.style.visibility = 'hidden'; nav.append(bt); continue; }
      bt.append(el('small', '', lab)); bt.append(document.createTextNode(x.tieu_de_bang)); bt.onclick = () => diToiChuDe(ma, x.i); nav.append(bt);
    }
    art.append(nav);
    art.append(el('h4', 'mh4', tr('Các chuyên đề khác trong ', 'More topics in ') + tenGian(ma).toLowerCase()));
    art.append(theChuDe(ma, i));
    if (T0.do_vat.length) { art.append(el('h4', 'mh4', tr('Đồ vật kể chuyện', 'Objects with stories'))); art.append(theDoVat(ma)); }
    b.append(art);
    if (o.fromTour && G.on) { G._who = 'cd'; G.speak([A.doc[0].t], { nhan: A.tieu_de_bang }); }
    nhayDoc(art, o.doc);
    G._btn();
    return true;
  }
  ui.moChuDe = moChuDe;
  /* câu chuyện của một đồ vật trong nhà */
  function moDoVat(ma, id, o) {
    o = o || {};
    const T0 = HT.CD && HT.CD[ma]; const d = T0 && T0.do_vat.find((x) => x.id === id); if (!d) return false;
    if (G.playing && G._who !== 'ai') G.stop();
    const b = moTo(tenGian(ma) + ' · ' + tr('Đồ vật kể chuyện', 'Object story'));
    const art = el('article', 'mz dv');
    const hd = el('header', 'mdh'); hd.append(el('div', 'kk', '✦ ' + d.ten)); hd.append(el('h2', '', d.tieu_de)); art.append(hd);
    let toi = null;
    if (ma !== cur()) { toi = el('button', '', '➜ ' + tr('Xem đồ vật trong 3D', 'See it in 3D')); toi.onclick = () => diToiDoVat(ma, id); }
    hanhDong(art, { who: 'dv', doc: d.doc, nhan: d.ten, hoi: d.ten, toi });
    const box = el('section', 'md'); box.dataset.doc = 0;
    String(d.text || '').split(/\n\s*\n/).filter(Boolean).forEach((t, j) => box.append(el('p', j ? '' : 'drop', t)));
    art.append(box);
    if (d.nguon) art.append(nguonBox([d.nguon]));
    const gan = bangGan(ma, id);
    if (gan != null && T0.bang.find((x) => x.i === gan)) {
      const x = T0.bang.find((y) => y.i === gan);
      art.append(el('h4', 'mh4', tr('Đọc thêm ở bảng gần đó', 'Read more nearby')));
      const g = el('div', 'mcards mot'); const c = el('button', 'mc');
      if (x.bia && x.bia.src) { const im = el('img'); im.loading = 'lazy'; im.src = x.bia.src; im.alt = ''; c.append(im); }
      const t = el('span', 'tx'); t.append(el('b', '', x.tieu_de_bang)); t.append(el('small', '', x.tieu_de)); c.append(t);
      c.onclick = () => diToiChuDe(ma, x.i); g.append(c); art.append(g);
    }
    if (T0.do_vat.length > 1) { art.append(el('h4', 'mh4', tr('Đồ vật khác trong gian', 'Other objects'))); art.append(theDoVat(ma, id)); }
    b.append(art);
    if (o.fromTour && G.on) { G._who = 'dv'; G.speak([d.doc[0].t], { nhan: d.ten }); }
    G._btn();
    return true;
  }
  ui.moDoVat = moDoVat; ui.diToiDoVat = (ma, id) => diToiDoVat(ma, id);
  /* vị trí đồ vật (được gắn lúc dựng gian) → bảng gần nhất và điểm đứng gần nhất */
  const DVP = ui._dvPos = {};
  function bangGan(ma, id) {
    const p = (DVP[ma] || {})[id]; const L = dsBang(ma); if (!p || !L.length) return null;
    let best = null, bd = 1e9; L.forEach((s, i) => { const l = s.look || [s.x, 0, s.z]; const d = Math.hypot(l[0] - p.x, l[2] - p.z); if (d < bd) { bd = d; best = i; } });
    return bd < 14 ? best : null;
  }
  /* chỗ đứng để nhìn đồ vật: quanh đồ vật 1,3–2,8 m, không vướng tường/đồ đạc, cùng mặt sàn, nhìn thẳng tới được */
  function vuong(h, x, z, feet) {
    const lo = feet + 0.3, hi = feet + 1.75, R = 0.36;
    for (const c of h.colliders) {
      if (c.y1 < lo || c.y0 > hi) continue;
      if (c.t === 0) { const dx = x - c.x, dz = z - c.z, lx = c.c * dx - c.s * dz, lz = c.s * dx + c.c * dz; if (Math.abs(lx) < c.hx + R && Math.abs(lz) < c.hz + R) return true; }
      else if (Math.hypot(x - c.x, z - c.z) < c.r + R) return true;
    }
    return false;
  }
  function diemNhin(p) {
    const h = C.hall && C.hall(); if (!h || !T) return null;
    const san = h.groundAt ? h.groundAt(p.x, p.z, p.y + 0.5) : 0;
    if (!h._chan) { h._chan = []; h.root.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.material !== HITMAT && o.visible) h._chan.push(o); }); }
    const rc = new T.Raycaster(), eye = new T.Vector3(), to = new T.Vector3(p.x, p.y, p.z), dir = new T.Vector3();
    let a0 = 0; { let bd = 1e9; for (const s of h.tour) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < bd) { bd = d; a0 = Math.atan2(s.z - p.z, s.x - p.x); } } }
    for (const r of [2.0, 2.6, 1.5, 3.2]) for (const k of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6]) {
      const a = a0 + (k * Math.PI) / 6, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      const g = h.groundAt ? h.groundAt(x, z, san + 1.2) : 0;
      if (!isFinite(g) || Math.abs(g - san) > 0.45 || vuong(h, x, z, g)) continue;
      eye.set(x, g + 1.6, z); dir.copy(to).sub(eye); const L = dir.length(); dir.normalize();
      rc.set(eye, dir); rc.far = Math.max(0.1, L - 0.45);
      if (rc.intersectObjects(h._chan, false).length) continue;
      return { x, z };
    }
    return null;
  }
  function diToiDoVat(ma, id) {
    const go = () => {
      const p = (DVP[ma] || {})[id];
      if (p) { const d = diemNhin(p); if (d) C.jumpTo({ x: d.x, z: d.z, look: [p.x, p.y, p.z] }, false); else ui.toast(tr('Đồ vật ở trong nhà — hãy đi vào để xem gần hơn', 'The object is indoors — walk in to see it')); }
      moDoVat(ma, id);
    };
    if (ma === cur()) go(); else C.goHall(ma, { from: cur() }).then(go);
  }
  /* bài tổng quan của gian (nút “Bài viết”) — cùng khuôn tạp chí, kèm mục lục các chuyên đề */
  function moBaiGian(ma, o) {
    o = o || {};
    const A = BAI()[ma]; if (!A) { ui.toast(tr('Gian này chưa có bài viết', 'No story yet')); return; }
    if (G.playing && G._who !== 'ai') G.stop();
    const gi = D.gian[ma] || {};
    const b = moTo(tenGian(ma) + ' · ' + tr('Bài viết tổng quan', 'Overview story'));
    const art = el('article', 'mz');
    const hero = el('header', 'mh');
    if (A.bia && A.bia.src) { hero.style.backgroundImage = 'url("' + A.bia.src + '")'; hero.onclick = () => light(A.bia.src, A.tieu_de + (A.bia.credit ? ' — ' + A.bia.credit : '')); }
    const hin = el('div', 'in'); hin.append(el('div', 'kk', [tenGian(ma), gi.nam, gi.noi].filter(Boolean).join(' · '))); hin.append(el('h2', '', A.tieu_de)); hero.append(hin);
    if (A.bia && A.bia.credit) hero.append(el('span', 'cr', A.bia.credit));
    art.append(hero);
    hanhDong(art, { who: 'bai', doc: A.doc, nhan: A.tieu_de, hoi: gi.ten, quiz: ma, phut: Math.max(2, Math.round((A.so_chu || soChu(A)) / 200)) });
    const sp = el('p', 'msapo', tr(A.sapo, A.sapo_en)); sp.dataset.doc = 0; art.append(sp);
    const muc = el('div', 'mmuc'); art.append(muc);
    veKhoi(art, A.khoi);
    if ((A.hien_vat || []).length) {
      art.append(el('h4', 'mh4', tr('Hiện vật & dấu tích', 'Objects & traces')));
      const g = el('div', 'mhv'); for (const h of A.hien_vat) { const d = el('div'); d.append(el('b', '', h.ten)); d.append(document.createTextNode(h.mo_ta || '')); g.append(d); } art.append(g);
    }
    if ((A.nguon || []).length) art.append(nguonBox(A.nguon));
    const cd = el('div'); art.append(cd);
    taiCD().then((CD) => {
      if (!CD || !CD[ma]) return;
      const n = CD[ma].bang.length;
      muc.append(el('b', '', tr('Gian này có ', 'This hall has ') + n + tr(' chuyên đề chuyên sâu — mỗi bảng một chủ đề riêng', ' in-depth topics — one per board')));
      const bt = el('button', '', tr('Xem mục lục ↓', 'See all ↓')); bt.onclick = () => cd.scrollIntoView({ behavior: 'smooth', block: 'start' }); muc.append(bt);
      cd.append(el('h4', 'mh4', tr('Đi sâu từng chuyên đề', 'Go deeper, topic by topic'))); cd.append(theChuDe(ma, -1));
      if (CD[ma].do_vat.length) { cd.append(el('h4', 'mh4', tr('Đồ vật kể chuyện', 'Objects with stories'))); cd.append(theDoVat(ma)); }
    });
    const L = D.thu_tu, i = L.indexOf(ma); const nav = el('div', 'mnav');
    for (const [j, lab] of [[i - 1, '← ' + tr('Gian trước', 'Previous hall')], [i + 1, tr('Gian tiếp', 'Next hall') + ' →']]) {
      const m = L[j]; const bt = el('button', j > i ? 'sau' : ''); if (!m || !BAI()[m]) { bt.style.visibility = 'hidden'; nav.append(bt); continue; }
      bt.append(el('small', '', lab)); bt.append(document.createTextNode(BAI()[m].tieu_de)); bt.onclick = () => moBaiGian(m); nav.append(bt);
    }
    art.append(el('h4', 'mh4', tr('Đọc tiếp', 'Keep reading'))); art.append(nav);
    b.append(art);
    nhayDoc(art, o.doc);
    G._btn();
  }
  ui.moBaiGian = moBaiGian;
  /* đồ vật minh họa không có câu chuyện riêng: gợi ý chuyên đề của bảng gần nhất */
  function phuGan(b, g) {
    const ma = cur(); if (!HT.CD || !HT.CD[ma] || ma !== g.ma) return;
    const L = dsBang(ma); let best = -1, bd = 1e9; L.forEach((s, i) => { const l = s.look || [s.x, 0, s.z]; const d = Math.hypot(l[0] - g.x, l[2] - g.z); if (d < bd) { bd = d; best = i; } });
    const x = HT.CD[ma].bang.find((y) => y.i === best); if (!x || bd > 16) return;
    b.append(el('div', 'k2', tr('Chuyện gắn với nơi này', 'The story of this place')));
    const c = el('button', 'goi'); c.append(el('b', '', x.tieu_de_bang)); c.append(el('span', '', x.tieu_de)); c.onclick = () => diToiChuDe(ma, x.i); b.append(c);
  }
  ui.openReader = (ma, atDoc) => moBaiGian(ma, { doc: atDoc });
  bRead.onclick = () => moBaiGian(cur() || 'G00');
  if (LS.get('to_rong', false)) $('sheet').classList.add('full');

  /* bấm bảng / điểm sáng / đồ vật → mở đúng chuyên đề của nó */
  const _open = ui.openInfo;
  ui.openInfo = function (info, fromTour) {
    if (info && info._dv) { if (moDoVat(info._dv.ma, info._dv.id, { fromTour })) return; }
    const hit = timChuDe(info);
    if (hit && moChuDe(hit.ma, hit.i, { fromTour })) return;
    $('sheet').classList.remove('tc');
    _open.call(ui, info, fromTour);
    const b = $('sB'); if (!b || !info) return;
    b.onscroll = null;
    const acts = el('div', 'acts');
    const n = el('button', '', '▶ ' + tr('Nghe', 'Listen')); n.dataset.nghe = 'to';
    n.onclick = () => { if (G.playing && G._who === 'to') { G.stop(); return; } G._who = 'to'; G.speak([G.tourText(info)], { nhan: info.title }); G._btn(); };
    acts.append(n);
    const q = el('button', '', '💬 ' + tr('Hỏi AI về điều này', 'Ask AI about this')); q.onclick = () => openAI(info.title || ''); acts.append(q);
    const h3 = b.querySelector('h3'); if (h3 && h3.nextSibling) b.insertBefore(acts, h3.nextSibling); else b.append(acts);
    if (info._gan) taiCD().then(() => phuGan(b, info._gan));
    if (fromTour && G.on) { G._who = 'to'; G.speak([G.tourText(info)], { nhan: info.title }); }
    else if (!HT.CD) taiCD().then(() => { const h2 = timChuDe(info); if (h2 && $('sheet').classList.contains('on') && $('sK').textContent === (info.kicker || '')) moChuDe(h2.ma, h2.i); });
  };
  const _close = ui.closeInfo;
  ui.closeInfo = function (fromTour) { if (G.playing && G._who !== 'ai') G.stop(); _close.call(ui, fromTour); };
  $('sX').addEventListener('click', () => { if (G.playing && G._who !== 'ai') G.stop(); });
  const _tourState = ui.tourState;
  ui.tourState = function (on) { _tourState.call(ui, on); if (!on && (G._who === 'to' || G._who === 'cd' || G._who === 'dv')) G.stop(); };

  /* ============================================ ĐỐ VUI & HỘ CHIẾU ============================================ */
  const qz = el('div', 'ov'); qz.id = 'quiz'; qz.innerHTML = '<div class="box"></div>'; document.body.append(qz);
  const ps = el('div', 'ov'); ps.id = 'pass'; ps.innerHTML = '<div class="box"></div>'; document.body.append(ps);
  qz.onclick = (e) => { if (e.target === qz) qz.classList.remove('on'); };
  ps.onclick = (e) => { if (e.target === ps) ps.classList.remove('on'); };
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function openQuiz(ma) {
    const A = BAI()[ma]; const Q0 = (A && A.hoi_dap || []).filter((q) => q.hoi && q.dap && (q.sai || []).length);
    if (!Q0.length) { ui.toast(tr('Gian này chưa có câu đố', 'No quiz here')); return; }
    const Qs = shuffle(Q0).slice(0, 5); let k = 0, ok = 0; const res = [];
    const box = qz.querySelector('.box');
    const gi = D.gian[ma] || {};
    const draw = () => {
      box.innerHTML = '';
      box.append(el('div', 'k', tr('Đố vui · ', 'Quiz · ') + (ma === 'G00' ? tr('Sảnh', 'Lobby') : tr('Gian ', 'Hall ') + ma.slice(1) + ' · ' + gi.ten)));
      if (k >= Qs.length) return finish();
      const q = Qs[k];
      box.append(el('h3', '', q.hoi));
      const fb = el('div', 'fb');
      const opts = shuffle([q.dap].concat(q.sai.slice(0, 3)));
      for (const o of opts) {
        const b = el('button', 'opt', o);
        b.onclick = () => {
          if (box.dataset.done) return; box.dataset.done = 1;
          const right = o === q.dap; if (right) ok++; res[k] = right;
          box.querySelectorAll('.opt').forEach((x) => { if (x.textContent === q.dap) x.classList.add('ok'); else if (x === b) x.classList.add('no'); });
          fb.textContent = (right ? tr('Chính xác! ', 'Correct! ') : tr('Chưa đúng. Đáp án: ', 'Not quite. Answer: ') + q.dap + '. ');
          nx.style.visibility = 'visible';
        };
        box.append(b);
      }
      box.append(fb);
      const row = el('div', 'row'); const dots = el('div', 'dots');
      Qs.forEach((_, i) => { const d = el('i', res[i] === true ? 'ok' : res[i] === false ? 'no' : i === k ? 'cur' : ''); dots.append(d); });
      const nx = el('button', 'rb gold', k + 1 < Qs.length ? tr('Câu tiếp →', 'Next →') : tr('Xem kết quả', 'See result')); nx.style.visibility = 'hidden';
      nx.onclick = () => { k++; delete box.dataset.done; draw(); };
      row.append(dots, nx); box.append(row);
    };
    const finish = () => {
      const pass = ok / Qs.length >= 0.6;
      box.append(el('h3', '', tr('Bạn trả lời đúng ', 'You got ') + ok + '/' + Qs.length + tr(' câu', '')));
      if (pass) {
        const hc = LS.get('ho_chieu', {}); const prev = hc[ma]; hc[ma] = { d: Math.max(ok, prev ? prev.d : 0), n: Qs.length, t: Date.now() }; LS.set('ho_chieu', hc);
        const st = el('div', 'stamp'); st.innerHTML = (ma === 'G00' ? tr('SẢNH', 'LOBBY') : tr('GIAN ', 'HALL ') + ma.slice(1)) + '<br><span style="font-size:12px">' + (gi.ten || '') + '</span><br>' + new Date().toLocaleDateString('vi-VN');
        const w = el('div'); w.style.textAlign = 'center'; w.append(st); box.append(w);
        box.append(el('div', 'fb', tr('Đã đóng dấu vào Hộ chiếu Hành trình của bạn.', 'Stamped into your Journey Passport.')));
      } else box.append(el('div', 'fb', tr('Cần đúng từ 60% để nhận dấu. Đọc lại bài viết rồi thử lần nữa nhé!', 'Score 60% to earn a stamp — read the story and try again!')));
      const row = el('div', 'row');
      const again = el('button', 'rb', tr('Làm lại', 'Retry')); again.onclick = () => openQuiz(ma);
      const pp = el('button', 'rb', tr('Xem hộ chiếu', 'Passport')); pp.onclick = () => { qz.classList.remove('on'); openPass(); };
      const cl = el('button', 'rb gold', tr('Đóng', 'Close')); cl.onclick = () => qz.classList.remove('on');
      row.append(again, pp, cl); box.append(row);
    };
    draw(); qz.classList.add('on');
  }
  function openPass() {
    const box = ps.querySelector('.box'); box.innerHTML = '';
    const hc = LS.get('ho_chieu', {}); const n = Object.keys(hc).length;
    box.append(el('div', 'k', tr('Hộ chiếu Hành trình', 'Journey Passport')));
    box.append(el('h3', '', tr('Bạn đã có ', 'You have ') + n + '/' + D.thu_tu.length + tr(' con dấu', ' stamps')));
    const g = el('div', 'grid');
    for (const m of D.thu_tu) {
      const d = el('div', hc[m] ? 'co' : ''); d.append(el('b', '', m === 'G00' ? '★' : m.slice(1))); d.append(document.createTextNode(D.gian[m].ten)); if (hc[m]) d.append(el('div', '', hc[m].d + '/' + hc[m].n));
      d.style.cursor = 'pointer'; d.onclick = () => { ps.classList.remove('on'); openQuiz(m); };
      g.append(d);
    }
    box.append(g);
    const row = el('div', 'row'); row.append(el('span', 'fb', tr('Bấm vào một gian để làm bài đố vui của gian đó.', 'Tap a hall to take its quiz.')));
    const cl = el('button', 'rb gold', tr('Đóng', 'Close')); cl.onclick = () => ps.classList.remove('on'); row.append(cl); box.append(row);
    ps.classList.add('on');
  }
  ui.openQuiz = openQuiz; ui.openPass = openPass;
  bQuiz.onclick = () => openQuiz(cur() || 'G00');

  /* ============================================ ĐIỂM SÁNG & THẺ ĐỒ VẬT ============================================ */
  const DO = {
    ArmChair_01: ['Ghế bành', 'Armchair'], Barrel_01: ['Thùng tô nô gỗ', 'Wooden barrel'], alarm_clock_01: ['Đồng hồ báo thức', 'Alarm clock'],
    binder_notebook: ['Sổ ghi chép', 'Notebook'], book_encyclopedia_set_01: ['Bộ sách', 'Set of books'], brass_pan_01: ['Chảo đồng', 'Copper pan'],
    brass_pot_01: ['Nồi đồng', 'Copper pot'], brass_pot_02: ['Nồi đồng', 'Copper pot'], caged_hanging_light: ['Đèn treo có lồng bảo vệ', 'Caged lamp'],
    chinese_sofa: ['Tràng kỷ gỗ', 'Wooden settee'], desk_lamp_arm_01: ['Đèn bàn', 'Desk lamp'], fancy_picture_frame_01: ['Khung ảnh', 'Picture frame'],
    hanging_picture_frame_01: ['Khung ảnh treo tường', 'Hanging frame'], jug_01: ['Bình nước', 'Jug'], mantel_clock_01: ['Đồng hồ để bàn', 'Mantel clock'],
    metal_jug: ['Ca nước kim loại', 'Metal jug'], old_bed_frame: ['Giường sắt cũ', 'Old bed frame'], painted_wooden_chair_01: ['Ghế gỗ', 'Wooden chair'],
    pot_enamel_01: ['Nồi tráng men', 'Enamel pot'], round_wooden_table_01: ['Bàn tròn gỗ', 'Round table'], rusted_spade_01: ['Xẻng', 'Spade'],
    side_table_01: ['Bàn nhỏ', 'Side table'], tea_set_01: ['Bộ ấm chén', 'Tea set'], treasure_chest: ['Hòm gỗ', 'Wooden chest'],
    vintage_day_bed: ['Giường nghỉ', 'Day bed'], vintage_grandfather_clock_01: ['Đồng hồ quả lắc đứng', 'Grandfather clock'], vintage_oil_lamp: ['Đèn dầu', 'Oil lamp'],
    vintage_radio_transceiver: ['Máy thu phát vô tuyến', 'Radio transceiver'], vintage_suitcase: ['Va li', 'Suitcase'], wicker_basket_01: ['Thúng mây', 'Wicker basket'],
    wicker_basket_02: ['Giỏ mây', 'Wicker basket'], wooden_barrels_01: ['Thùng gỗ', 'Wooden barrels'], wooden_bowl_01: ['Bát gỗ', 'Wooden bowl'],
    wooden_broom: ['Chổi', 'Broom'], wooden_bucket_01: ['Thùng gỗ múc nước', 'Wooden bucket'], wooden_bucket_02: ['Thùng gỗ', 'Wooden bucket'],
    wooden_crate_01: ['Kiện hàng gỗ', 'Wooden crate'], wooden_crate_02: ['Kiện hàng gỗ', 'Wooden crate'], wooden_ladder: ['Thang gỗ', 'Wooden ladder'],
    modular_wooden_pier: ['Cầu tàu gỗ', 'Wooden pier'],
  };
  function markerTex() {
    if (ui._mk) return ui._mk;
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(240,200,110,.95)'); gr.addColorStop(0.5, 'rgba(228,180,80,.35)'); gr.addColorStop(1, 'rgba(228,180,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(255,245,215,.95)'; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 30, 0, 6.283); g.stroke();
    g.fillStyle = '#5a3c10'; g.font = 'bold 40px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('i', 64, 67);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; ui._mk = t; return t;
  }
  /* điểm sáng đồ vật kể chuyện: ngôi sao bốn cánh màu son, khác điểm “i” của bảng */
  function markerTex2() {
    if (ui._mk2) return ui._mk2;
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,225,200,1)'); gr.addColorStop(0.3, 'rgba(230,120,80,.85)'); gr.addColorStop(0.55, 'rgba(200,80,50,.3)'); gr.addColorStop(1, 'rgba(200,80,50,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#fff4e2'; g.beginPath();
    for (let k = 0; k < 8; k++) { const r = k % 2 ? 11 : 30, a = (k * Math.PI) / 4 - Math.PI / 2; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); }
    g.closePath(); g.fill();
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; ui._mk2 = t; return t;
  }
  /* ghi lại vị trí đồ đạc dựng bằng mã (HT.props) để gắn câu chuyện vào đúng đồ vật */
  const PLOG = [];
  (function bocProps() {
    const P = HT.props; if (!P) return;
    for (const k of Object.keys(P)) {
      const f = P[k]; if (typeof f !== 'function' || /Tex$/.test(k) || f._boc) continue;
      const g = function () {
        const n = []; for (let a = 0; a < arguments.length && n.length < 3; a++) if (typeof arguments[a] === 'number') n.push(arguments[a]);
        if (n.length === 3 && PLOG.length < 5000) PLOG.push({ fn: k, x: n[0], y: n[1], z: n[2] });
        return f.apply(this, arguments);
      };
      g._boc = true; P[k] = g;
    }
  })();
  const CAO = { phan: 0.8, table: 1.1, altar: 1.5, hoanhPhi: 0.55, cauDoi: 1.3, loom: 1.85, pestle: 0.8, blackboard: 1.2, schoolDesk: 1.05, well: 1.3, bookshelf: 2.1, jar: 1.0, typewriter: 0.5, hearth: 0.8, cabinet: 1.75 };
  const BK = { phan: 0.95, table: 0.7, altar: 0.85, hoanhPhi: 0.55, cauDoi: 0.4, loom: 0.95, pestle: 0.5, blackboard: 0.8, schoolDesk: 0.65, well: 0.85, bookshelf: 0.65, jar: 0.45, typewriter: 0.32, hearth: 0.55, cabinet: 0.65 };
  let HITMAT = null;
  function ganDoVat(ctx, list, log) {
    if (!list || !list.length) return;
    HITMAT = HITMAT || new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 });
    ctx.root.updateMatrixWorld(true);
    const v = new T.Vector3(), cands = log.slice();
    ctx.root.traverse((o) => { if (o.userData && o.userData.model) { o.getWorldPosition(v); cands.push({ o, fn: o.userData.model, x: v.x, y: v.y, z: v.z }); } });
    /* ghép mỗi câu chuyện với đồ vật cùng loại gần nhất (đồ đạc có thể đã dời chỗ khi sửa bố cục) */
    const pairs = [];
    list.forEach((d, a) => cands.forEach((e, b) => { if (e.fn !== d.loai) return; const dd = Math.hypot(e.x - d.x, e.z - d.z) + Math.abs(e.y - d.y) * 0.5; if (dd < 6) pairs.push([dd, a, b]); }));
    pairs.sort((p, q) => p[0] - q[0]);
    const dD = new Set(), dE = new Set(), hit = new Map();
    for (const [, a, b] of pairs) { if (dD.has(a) || dE.has(b)) continue; dD.add(a); dE.add(b); hit.set(a, cands[b]); }
    const pos = (DVP[ctx.ma] = {}), sps = [];
    list.forEach((d, a) => {
      const e = hit.get(a) || { fn: d.loai, x: d.x, y: d.y, z: d.z };
      const info = { kicker: tr('Đồ vật kể chuyện', 'Object story'), label: '✦ ' + d.ten, title: d.ten, _dv: { ma: ctx.ma, id: d.id } };
      let top;
      if (e.o) { ctx.click(e.o, info); const bb = new T.Box3().setFromObject(e.o); top = bb.max.y + 0.2; }
      else {
        const h = CAO[d.loai] || 1.1;
        const m = new T.Mesh(new T.SphereGeometry(BK[d.loai] || 0.5, 12, 8), HITMAT); m.position.set(e.x, e.y + h * 0.55, e.z);
        m.userData.noAO = true; m.frustumCulled = false; m.renderOrder = -1;
        ctx.root.add(m); ctx.click(m, info); m.updateMatrixWorld(true);
        top = e.y + h + 0.12;
      }
      pos[d.id] = { x: e.x, y: top - 0.35, z: e.z };
      const sp = new T.Sprite(new T.SpriteMaterial({ map: markerTex2(), transparent: true, depthWrite: false, toneMapped: false, fog: false }));
      sp.material.color.setRGB(1.35, 1.25, 1.15);
      sp.position.set(e.x, top, e.z); sp.scale.setScalar(0.14); sp.renderOrder = 6;
      sp.userData.click = info; sp.userData.noAO = true; sp.userData.y0 = top; sp.userData.ph = Math.random() * 6.28;
      ctx.root.add(sp); ctx.clickables.push(sp); sp.updateMatrixWorld(true); sps.push(sp);
    });
    ctx.onUpdate((dt, t, P) => {
      for (const sp of sps) {
        sp.position.y = sp.userData.y0 + Math.sin(t * 2.2 + sp.userData.ph) * 0.03;
        const dd = P ? Math.hypot(P.x - sp.position.x, P.z - sp.position.z) : 5;
        sp.visible = dd > 0.8 && dd < 13; sp.material.opacity = Math.min(1, Math.max(0, (dd - 0.8) / 1.4), Math.max(0, (13 - dd) / 3));
        sp.scale.setScalar(0.1 + Math.min(0.12, dd * 0.012));
      }
    });
  }
  ui.decorate = function (ctx) {
    const log = PLOG.splice(0);
    if (!T || /[?&]sach=1/.test(location.search)) return;   /* ?sach=1: chụp ảnh minh họa không có điểm sáng */
    const tex = markerTex(); const sps = [];
    for (const s of ctx.tour || []) {
      if (!s.info || !s.look) continue;
      const lx = s.look[0], ly = s.look[1], lz = s.look[2];
      let dx = s.x - lx, dz = s.z - lz; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
      const m = new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, fog: false });
      m.color.setRGB(1.6, 1.45, 1.2);
      const sp = new T.Sprite(m); sp.position.set(lx + dx * 0.35, ly + 0.62, lz + dz * 0.35); sp.scale.setScalar(0.26); sp.renderOrder = 6;
      sp.userData.click = s.info; sp.userData.noAO = true; sp.userData.y0 = sp.position.y; sp.userData.ph = Math.random() * 6.28;
      ctx.root.add(sp); ctx.clickables.push(sp); sps.push(sp);
    }
    ctx.onUpdate((dt, t, P) => {
      for (const sp of sps) {
        sp.position.y = sp.userData.y0 + Math.sin(t * 2 + sp.userData.ph) * 0.05;
        const d = P ? Math.hypot(P.x - sp.position.x, P.z - sp.position.z) : 5;
        sp.visible = d > 2.2 && d < 28; sp.material.opacity = Math.min(1, Math.max(0, (d - 2.2) / 3)); const s = 0.15 + Math.min(0.2, d * 0.011); sp.scale.setScalar(s * (1 + 0.08 * Math.sin(t * 3 + sp.userData.ph)));
      }
    });
    const gi = D.gian[ctx.ma] || {};
    const v = new T.Vector3();
    ctx.root.traverse((o) => {
      const slug = o.userData && o.userData.model; if (!slug || !DO[slug]) return;
      let has = false; o.traverse((c) => { if (c.userData && c.userData.click) has = true; }); if (has) return;
      const n = DO[slug]; o.updateMatrixWorld(true); o.getWorldPosition(v);
      ctx.click(o, { kicker: tr('Đồ vật trong gian', 'Object'), label: tr(n[0], n[1]), title: tr(n[0], n[1]), place: gi.noi || '',
        paras: [tr('Đồ dùng được đặt vào không gian để gợi lại nếp sinh hoạt, làm việc ở ', 'An object recreating everyday life at ') + (gi.noi || '') + (gi.nam ? ' (' + gi.nam + ')' : '') + tr('. Đây là mô hình minh họa, không phải hiện vật gốc.', '. An illustrative model, not an original artefact.')],
        credit: tr('Mô hình 3D: Poly Haven (CC0)', '3D model: Poly Haven (CC0)'), khongBai: true, _gan: { ma: ctx.ma, x: v.x, z: v.z } });
    });
    /* câu chuyện đồ vật (chuyen_de.js): gắn ngay nếu đã nạp, không thì gắn khi nạp xong */
    const gan = (CD) => { try { ganDoVat(ctx, CD && CD[ctx.ma] ? CD[ctx.ma].do_vat : [], log); } catch (e) { console.warn('do_vat', e); } };
    if (HT.CD) gan(HT.CD); else taiCD().then(gan);
  };

  /* ============================================ HỎI ĐÁP AI ============================================ */
  let aiMod = null;
  function openAI(prefill) {
    let p = $('ai');
    if (!p) {
      p = el('aside', 'gl'); p.id = 'ai';
      p.innerHTML = '<div class="top"><div class="k">' + tr('Hướng dẫn viên AI', 'AI guide') + '</div><select title="Mô hình"></select><button class="x" title="Đóng" style="background:transparent;border:0;font-size:22px;color:var(--ink2)">×</button></div>' +
        '<div class="st"></div><div class="msgs"></div><div class="sug"></div>' +
        '<form><textarea placeholder="' + tr('Hỏi về cuộc đời Bác Hồ, về gian này…', 'Ask about Ho Chi Minh’s life, this hall…') + '"></textarea>' +
        '<button type="button" class="mic" title="' + tr('Nói (nhận giọng nói)', 'Speak') + '">' + svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>') + '</button>' +
        '<button type="submit" title="Gửi">' + svg('<path d="M4 12l16-8-6 16-2-7z"/>') + '</button></form>' +
        '<div class="note">' + tr('AI chạy ngay trên máy này, chỉ trả lời dựa trên tư liệu của bảo tàng và luôn dẫn nguồn. Bấm vào nguồn để mở đoạn bài viết gốc.', 'Runs locally; answers only from museum sources, with citations.') + '</div>';
      document.body.append(p);
      p.querySelector('.x').onclick = () => { p.classList.remove('on'); bAsk.classList.remove('on'); if (G._who === 'ai') G.stop(); };
    }
    p.classList.add('on'); bAsk.classList.add('on');
    const an = () => { p.classList.remove('on'); bAsk.classList.remove('on'); };
    const go = (m) => { aiMod = m; m.mount(p, { cur, tr, G, prefill, openReader: (ma, doc) => { an(); moBaiGian(ma, { doc }); }, moChuDe: (ma, i, doc) => { an(); taiCD().then(() => moChuDe(ma, i, { doc })); }, moDoVat: (ma, id) => { an(); taiCD().then(() => moDoVat(ma, id)); } }); };
    if (aiMod) go(aiMod);
    else import('./tro_ly.js?v=' + (HT.BUILD || 1)).then(go).catch((e) => { p.querySelector('.st').textContent = 'Không nạp được trợ lý: ' + e.message; });
  }
  ui.openAI = openAI;
  bAsk.onclick = () => { const p = $('ai'); if (p && p.classList.contains('on')) { p.classList.remove('on'); bAsk.classList.remove('on'); } else openAI(); };

  /* ============================================ PHÍM TẮT, MENU, NGÔN NGỮ ============================================ */
  window.addEventListener('keydown', (e) => {
    const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT')) return;
    if (e.key === 'Escape') { qz.classList.remove('on'); ps.classList.remove('on'); jump.classList.remove('on'); bJump.classList.remove('on'); G.stop(); return; }
    if (qz.classList.contains('on') || ps.classList.contains('on')) return;
    if (/^[1-9]$/.test(e.key)) { if (!ui._jumpOrder) buildJump(); const p = (ui._jumpOrder || [])[+e.key - 1]; if (p) goPoi(p); }
    else if (e.key === 'g' || e.key === 'G') bJump.click();
    else if (e.key === 'r' || e.key === 'R') bRead.click();
    else if (e.key === 'k' || e.key === 'K') bAsk.click();
  }, true);
  const _hc = ui.hallChanged;
  ui.hallChanged = function (ma, prev) { _hc.call(ui, ma, prev); ui._jumpOrder = null; if (jump.classList.contains('on')) buildJump(); G.stop(); };
  const _closeAll = ui.closeAll;
  ui.closeAll = function () { _closeAll.call(ui); jump.classList.remove('on'); qz.classList.remove('on'); ps.classList.remove('on'); $('sheet').classList.remove('tc'); };
  const _modal = ui.modal;
  ui.modal = function () { return _modal.call(ui) || qz.classList.contains('on') || ps.classList.contains('on'); };
  /* nút Hộ chiếu trong danh sách gian */
  const mhd = document.querySelector('#menu .hd'); if (mhd) { const b = el('button', 'btn o', tr('Hộ chiếu Hành trình', 'Journey Passport')); b.style.marginRight = '10px'; b.onclick = () => { $('menu').classList.remove('on'); openPass(); }; mhd.insertBefore(b, $('mX')); }
  /* hướng dẫn: thêm phím mới */
  const hb = document.querySelector('#help .box'); if (hb) { const d = el('div'); d.innerHTML = '<kbd>G</kbd> điểm đến · <kbd>1</kbd>–<kbd>9</kbd> dịch chuyển tới điểm · <kbd>R</kbd> bài viết · <kbd>K</kbd> hỏi đáp AI · điểm sáng <b style="color:var(--gold2)">i</b> — bấm để đọc'; hb.insertBefore(d, hb.children[5] || null); }
})();
