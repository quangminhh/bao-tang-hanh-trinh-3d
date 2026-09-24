/* ============== ĐIỆN THOẠI / MÁY TÍNH BẢNG: cần điều khiển ảo, nút Xem – Bảng tiếp, thanh công cụ gọn, bài viết toàn màn hình ==============
   Tự bật khi màn hình cảm ứng (hoặc thêm ?didong=1 vào địa chỉ để thử trên máy tính).
   · Cần điều khiển bên trái: đẩy nhẹ đi chậm, đẩy hết cỡ đi nhanh (theo hướng đang nhìn).
   · Vuốt ở phần còn lại của màn hình để nhìn quanh; chụm / mở hai ngón để phóng to; chạm xuống nền để tự đi tới.
   · Nút “Xem” sáng lên khi giữa màn hình có bảng, ảnh hay đồ vật kể chuyện — bấm để đọc. “Bảng tiếp” đưa tới bảng kế tiếp.
   · Thanh công cụ còn 6 nút chính; nút “Thêm” mở đủ các nút còn lại. */
(function () {
  const HT = window.HT; if (!HT || !HT.core || !HT.ui) return;
  const C = HT.core, ui = HT.ui, $ = (id) => document.getElementById(id);
  const qs = new URLSearchParams(location.search);
  const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const DD = qs.has('didong') || (coarse && Math.min(screen.width, screen.height) < 1100) || /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent);
  if (!DD) return;
  const tr = (vi, en) => (HT.lang === 'en' && en ? en : vi);
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  document.body.classList.add('didong');

  /* ---------------- giao diện ---------------- */
  const css = el('style');
  css.textContent = `
body.didong{-webkit-tap-highlight-color:transparent;overscroll-behavior:none;-webkit-user-select:none;user-select:none}
body.didong button{touch-action:manipulation}
body.didong #sheet .body,body.didong #sheet .body *{-webkit-user-select:text;user-select:text}
#joy{position:fixed;left:calc(16px + env(safe-area-inset-left));bottom:calc(84px + env(safe-area-inset-bottom));width:136px;height:136px;border-radius:50%;z-index:12;touch-action:none;
  background:radial-gradient(circle,rgba(24,20,14,.18) 0,rgba(24,20,14,.5) 70%);border:1.5px solid rgba(201,162,74,.6);box-shadow:0 6px 22px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
#joy .m{position:absolute;inset:10px;border-radius:50%;border:1px dashed rgba(233,210,150,.25);pointer-events:none}
#joy .h{position:absolute;color:rgba(240,220,170,.7);font:700 13px/1 var(--sans);pointer-events:none}
#joy .h.u{left:50%;top:9px;transform:translateX(-50%)}#joy .h.d{left:50%;bottom:9px;transform:translateX(-50%)}
#joy .h.l{top:50%;left:10px;transform:translateY(-50%)}#joy .h.r{top:50%;right:10px;transform:translateY(-50%)}
#joy i{position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle at 36% 30%,#f3dc9c,#c49a3e 60%,#9a7428);box-shadow:0 4px 12px rgba(0,0,0,.5),inset 0 -3px 6px rgba(0,0,0,.25);transition:transform .15s ease-out}
#joy.dang i{transition:none}
#joy .lb{position:absolute;left:0;right:0;bottom:-20px;text-align:center;font:600 10.5px var(--sans);color:rgba(240,228,200,.85);text-shadow:0 1px 3px #000;pointer-events:none}
#ddAct{position:fixed;right:calc(14px + env(safe-area-inset-right));bottom:calc(86px + env(safe-area-inset-bottom));z-index:12;display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:none}
#ddAct > *{pointer-events:auto}
#ddNhan{max-width:min(58vw,320px);padding:7px 12px;border-radius:999px;font:600 12.5px/1.3 var(--sans);color:#f3ead6;background:rgba(18,15,10,.78);border:1px solid rgba(201,162,74,.45);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0;transform:translateY(6px);transition:opacity .2s,transform .2s;pointer-events:none}
#ddNhan.on{opacity:1;transform:none}
#ddAct .r{display:flex;gap:10px;align-items:flex-end}
#ddTiep,#ddLui{width:54px;height:54px;border-radius:50%;border:1px solid rgba(201,162,74,.55);background:rgba(20,17,12,.62);color:#f0e4c8;font:700 11px/1.1 var(--sans);
  -webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);box-shadow:0 4px 14px rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
#ddTiep b,#ddLui b{font-size:18px;line-height:1}
#ddXem{width:78px;height:78px;border-radius:50%;border:0;background:linear-gradient(180deg,#e0bd63,#a9812f);color:#1a140a;font:800 14px/1.1 var(--sans);letter-spacing:.02em;
  box-shadow:0 6px 18px rgba(0,0,0,.45),inset 0 -3px 0 rgba(0,0,0,.18);opacity:.5;filter:saturate(.6);transition:opacity .2s,filter .2s,transform .1s;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
#ddXem b{font-size:22px;line-height:1}
#ddXem.co{opacity:1;filter:none;animation:ddNhip 1.8s ease-in-out infinite}
#ddXem:active,#ddTiep:active,#ddLui:active{transform:scale(.94)}
@keyframes ddNhip{0%,100%{box-shadow:0 6px 18px rgba(0,0,0,.45),0 0 0 0 rgba(224,189,99,.55)}50%{box-shadow:0 6px 18px rgba(0,0,0,.45),0 0 0 12px rgba(224,189,99,0)}}
#ddTam{position:fixed;left:50%;top:48%;width:18px;height:18px;margin:-9px 0 0 -9px;z-index:7;pointer-events:none;border-radius:50%;border:2px solid rgba(255,244,214,.55);box-shadow:0 0 0 1px rgba(0,0,0,.35)}
#ddTam.co{border-color:#f0cf7a;transform:scale(1.25)}
body.didong.dd-an #joy,body.didong.dd-an #ddAct,body.didong.dd-an #ddTam{display:none}
/* thanh công cụ gọn */
body.didong #bar{left:calc(6px + env(safe-area-inset-left));right:calc(6px + env(safe-area-inset-right));bottom:calc(6px + env(safe-area-inset-bottom));transform:none;justify-content:space-between;gap:0;padding:4px}
body.didong #bar .sep{display:none}
body.didong #bar > button{display:none;min-width:0;flex:1 1 0;padding:7px 1px 6px}
body.didong #bar > button.chinh{display:flex}
body.didong #bar button span{display:block!important;font-size:10px;letter-spacing:0}
body.didong #bar button svg{width:22px;height:22px}
body.didong #bar.mo{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:12px 10px;max-height:72vh;overflow:auto}
body.didong #bar.mo > button{display:flex;padding:10px 2px}
body.didong #bar.mo > button#bMore{order:99}
/* tiêu đề gian, bản đồ, thanh đọc, chú thích */
body.didong #hud{left:calc(8px + env(safe-area-inset-left));top:calc(8px + env(safe-area-inset-top));padding:7px 12px;max-width:64vw}
body.didong #hud .ten{font-size:16px;margin:2px 0 0}body.didong #hud .meta{display:none}body.didong #hud .no{font-size:9.5px;letter-spacing:.2em}
body.didong #map{right:calc(8px + env(safe-area-inset-right));top:calc(8px + env(safe-area-inset-top));bottom:auto;width:128px;height:128px}
body.didong #player{left:8px;right:8px;bottom:calc(66px + env(safe-area-inset-bottom));transform:translateY(20px);max-width:none}
body.didong #player.on{transform:none}
body.didong #cap{bottom:auto;top:calc(64px + env(safe-area-inset-top));font-size:15px;max-width:92vw}
body.didong #tip{display:none}
body.didong #vmenu{left:8px!important;right:8px;width:auto;bottom:calc(66px + env(safe-area-inset-bottom))}
/* tờ bài viết, điểm đến, hỏi đáp: kéo lên từ dưới, gần toàn màn hình */
body.didong #sheet,body.didong #sheet.tc,body.didong #ai{left:0;right:0;top:auto;bottom:0;width:100%;height:calc(100% - 40px - env(safe-area-inset-top));max-height:none;border-radius:16px 16px 0 0;transform:translateY(105%)}
body.didong #sheet.on,body.didong #ai.on{transform:none}
body.didong #sheet .top{padding:10px 8px 6px 16px}
body.didong #sheet .x{font-size:30px;padding:4px 12px;min-width:48px;min-height:44px}
body.didong #sheet .body{padding-bottom:calc(26px + env(safe-area-inset-bottom))}
body.didong #sheet .macts .rg{display:none}
body.didong #sheet .mz .macts button{min-height:40px}
body.didong #sheet .mz .mh{height:clamp(200px,30vh,300px)}
body.didong #sheet .mz .mh h2{font-size:22px}
body.didong #jump{left:0;right:0;top:auto;bottom:0;width:100%;height:78%;border-radius:16px 16px 0 0;transform:translateY(105%)}
body.didong #jump.on{transform:none}
body.didong #jump .list button{min-height:46px}
body.didong #menu{padding:20px 12px 90px}body.didong #menu .grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
body.didong .card{height:130px}
body.didong #start .box{padding:24px 18px}body.didong #start p{font-size:14px;margin-bottom:18px}
body.didong #help .box{max-height:86vh;overflow:auto;margin:0 10px;padding:20px}
#ddXoay{position:fixed;left:50%;top:calc(58px + env(safe-area-inset-top));transform:translateX(-50%);z-index:13;padding:8px 14px;border-radius:999px;font:600 12.5px var(--sans);color:#f3ead6;background:rgba(18,15,10,.82);border:1px solid rgba(201,162,74,.45);display:none}
@media (orientation:portrait){body.didong:not(.dd-an) #ddXoay.on{display:block}}
@media (orientation:landscape) and (max-height:500px){
  #joy{width:112px;height:112px;bottom:calc(76px + env(safe-area-inset-bottom))}#joy i{width:50px;height:50px;margin:-25px 0 0 -25px}
  #ddAct{bottom:calc(76px + env(safe-area-inset-bottom))}#ddXem{width:64px;height:64px}#ddTiep,#ddLui{width:50px;height:50px}
  body.didong #sheet .mz .mh{height:min(58vh,210px)}
  body.didong #hud{max-width:40vw}
  body.didong #bar{left:50%;right:auto;transform:translateX(-50%);width:min(520px,70vw)}
  body.didong #bar.mo{width:min(620px,92vw)}
  body.didong #sheet,body.didong #sheet.tc,body.didong #ai{height:100%;border-radius:0}
  body.didong #map{display:none!important}
}`;
  document.head.append(css);

  /* ---------------- cần điều khiển ---------------- */
  const joy = el('div', '', '<div class="m"></div><span class="h u">▲</span><span class="h d">▼</span><span class="h l">◀</span><span class="h r">▶</span><i></i><div class="lb">' + tr('Kéo để đi', 'Drag to walk') + '</div>');
  joy.id = 'joy'; document.body.append(joy);
  const nut = joy.querySelector('i'); let jid = null, R = 50;
  C.joy = { x: 0, y: 0 };
  const dat = (cx, cy) => {
    const r = joy.getBoundingClientRect(); R = r.width * 0.37;
    let dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
    nut.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    let x = dx / R, y = -dy / R; const m = Math.hypot(x, y);
    if (m < 0.14) { x = 0; y = 0; }                     /* vùng chết giữa tâm */
    C.joy.x = x; C.joy.y = y;
  };
  const tha = () => { jid = null; joy.classList.remove('dang'); nut.style.transform = ''; C.joy.x = C.joy.y = 0; };
  joy.addEventListener('pointerdown', (e) => {
    e.preventDefault(); jid = e.pointerId; joy.setPointerCapture(e.pointerId); joy.classList.add('dang');
    if (C._tour) C.tourStop();
    dat(e.clientX, e.clientY); daDung();
  });
  joy.addEventListener('pointermove', (e) => { if (e.pointerId === jid) { e.preventDefault(); dat(e.clientX, e.clientY); } });
  joy.addEventListener('pointerup', (e) => { if (e.pointerId === jid) tha(); });
  joy.addEventListener('pointercancel', tha);
  joy.addEventListener('lostpointercapture', tha);
  window.addEventListener('blur', tha);

  /* ---------------- nút Xem · Bảng tiếp · Bảng trước ---------------- */
  const act = el('div'); act.id = 'ddAct';
  act.innerHTML = '<div id="ddNhan"></div><div class="r"><button id="ddLui" title="' + tr('Bảng trước', 'Previous board') + '"><b>‹</b>' + tr('Trước', 'Prev') + '</button>'
    + '<button id="ddTiep" title="' + tr('Bảng tiếp theo', 'Next board') + '"><b>›</b>' + tr('Bảng tiếp', 'Next') + '</button>'
    + '<button id="ddXem"><b>👁</b>' + tr('Xem', 'View') + '</button></div>';
  document.body.append(act);
  const tam = el('div'); tam.id = 'ddTam'; document.body.append(tam);
  const nhan = $('ddNhan'), xem = $('ddXem');
  let dich = null;   /* { h } vật ở giữa màn hình, hoặc { s } bảng gần trước mặt */
  const tenCua = (info) => {
    if (!info) return '';
    if (typeof info === 'function') return tr('Mở', 'Open');
    return String(info.title || info.label || info.ten || info.kicker || '').replace(/\s+/g, ' ').trim();
  };
  function dsBang() { const h = C.hall && C.hall(); return h ? h.tour.filter((s) => s.info) : []; }
  function banGanTruoc() {
    const P = C.player; let best = null, bd = 6.5;
    for (const s of dsBang()) {
      const lx = s.look ? s.look[0] : s.x, lz = s.look ? s.look[2] : s.z;
      const dx = lx - P.x, dz = lz - P.z, d = Math.hypot(dx, dz); if (d > bd || d < 0.01) continue;
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      if ((dx * fx + dz * fz) / d < 0.55) continue;           /* phải ở phía trước mặt */
      best = s; bd = d;
    }
    return best;
  }
  function capNhat() {
    if (document.body.classList.contains('dd-an')) return;
    let h = null; try { h = C.pickCenter && C.pickCenter(14); } catch (e) {}
    let t = '';
    if (h) { dich = { h }; t = tenCua(h.object.userData.click); }
    else { const s = banGanTruoc(); if (s) { dich = { s }; t = tenCua(s.info); } else dich = null; }
    xem.classList.toggle('co', !!dich); tam.classList.toggle('co', !!dich);
    nhan.textContent = dich ? tr('Xem: ', 'View: ') + (t || tr('tư liệu', 'item')) : '';
    nhan.classList.toggle('on', !!dich);
  }
  xem.onclick = () => {
    capNhat();
    if (!dich) { ui.toast(tr('Hướng tâm màn hình vào bảng, ảnh hoặc đồ vật có dấu ✦ rồi bấm Xem', 'Aim the centre of the screen at a board or a ✦ object, then tap View'), 3200); return; }
    if (dich.h) C.openClick(dich.h); else ui.openInfo(dich.s.info);
  };
  function toiBang(buoc) {
    const L = dsBang(); if (!L.length) return;
    const P = C.player; let k = 0, bd = 1e9;
    L.forEach((s, i) => { const d = Math.hypot(s.x - P.x, s.z - P.z); if (d < bd) { bd = d; k = i; } });
    const j = bd > 2.5 ? (buoc > 0 ? k : (k - 1 + L.length) % L.length) : (k + buoc + L.length) % L.length;
    C.jumpTo(L[j], false);
    setTimeout(capNhat, 700);
  }
  $('ddTiep').onclick = () => toiBang(1);
  $('ddLui').onclick = () => toiBang(-1);

  /* ---------------- thanh công cụ gọn ---------------- */
  const bar = $('bar');
  for (const id of ['bMenu', 'bJump', 'bTour', 'bVoice', 'bAsk']) { const b = $(id); if (b) b.classList.add('chinh'); }
  const more = el('button', 'chinh', '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg><span>' + tr('Thêm', 'More') + '</span>');
  more.id = 'bMore'; more.title = tr('Thêm chức năng', 'More'); bar.append(more);
  more.onclick = (e) => { e.stopPropagation(); bar.classList.toggle('mo'); more.querySelector('span').textContent = bar.classList.contains('mo') ? tr('Đóng', 'Close') : tr('Thêm', 'More'); };
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b === more || !bar.classList.contains('mo')) return;
    setTimeout(() => { bar.classList.remove('mo'); more.querySelector('span').textContent = tr('Thêm', 'More'); }, 60);
  });
  document.addEventListener('pointerdown', (e) => { if (bar.classList.contains('mo') && !bar.contains(e.target)) { bar.classList.remove('mo'); more.querySelector('span').textContent = tr('Thêm', 'More'); } }, true);

  /* ---------------- ẩn cần điều khiển khi đang đọc bài, xem danh sách, hỏi đáp… ---------------- */
  const on = (id) => { const x = $(id); return !!(x && x.classList.contains('on')); };
  function daDung() { try { localStorage.setItem('dd_da_dung', '1'); } catch (e) {} joy.querySelector('.lb').style.display = 'none'; }
  try { if (localStorage.getItem('dd_da_dung')) joy.querySelector('.lb').style.display = 'none'; } catch (e) {}
  let dem = 0;
  setInterval(() => {
    const st = $('start'); const chuaVao = !bar.classList.contains('on') || (st && st.style.display !== 'none');
    const an = chuaVao || (ui.modal && ui.modal()) || on('sheet') || on('jump') || on('ai') || on('menu') || on('help') || on('light') || bar.classList.contains('mo')
      || !!document.querySelector('.ov.on');
    document.body.classList.toggle('dd-an', !!an);
    if (an && jid == null) { C.joy.x = C.joy.y = 0; }
    if (!an && ++dem % 1 === 0) capNhat();
  }, 280);

  /* ---------------- chữ hướng dẫn cho màn hình cảm ứng ---------------- */
  const keys = document.querySelector('#start .keys');
  if (keys) keys.innerHTML = tr('Kéo <b style="color:var(--gold2)">cần điều khiển</b> bên trái để đi · vuốt màn hình để nhìn quanh · chụm hai ngón để phóng to<br>Hướng tâm màn hình vào bảng rồi bấm <b style="color:var(--gold2)">Xem</b> để đọc · <b style="color:var(--gold2)">Bảng tiếp</b> để tới bảng kế tiếp',
    'Drag the <b>joystick</b> to walk · swipe to look around · pinch to zoom<br>Aim at a board and tap <b>View</b> to read · <b>Next</b> jumps to the next board');
  const hb = document.querySelector('#help .box h3');
  if (hb) {
    const d = el('div', '', '<div style="margin:0 0 10px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:rgba(201,162,74,.08)"><b style="color:var(--gold2)">' + tr('Trên điện thoại', 'On a phone') + '</b><br>'
      + tr('Kéo cần điều khiển bên trái để đi (đẩy hết cỡ để đi nhanh) · vuốt phần còn lại của màn hình để nhìn · chụm/mở hai ngón để phóng to · chạm xuống nền để tự đi tới chỗ đó.<br>Nút <b>Xem</b> sáng lên khi giữa màn hình có bảng hay đồ vật — bấm để đọc; <b>Bảng tiếp</b>/<b>Trước</b> đưa tới bảng kế bên. Nút <b>Thêm</b> ở thanh dưới mở các chức năng còn lại.',
        'Drag the left joystick to walk · swipe to look · pinch to zoom · tap the ground to walk there.<br><b>View</b> lights up when a board or object is in the centre; <b>Next</b>/<b>Prev</b> jump between boards; <b>More</b> opens the other tools.') + '</div>');
    hb.after(d);
  }
  /* gợi ý xoay ngang một lần */
  const xoay = el('div', '', tr('Mẹo: xoay ngang điện thoại để xem rộng hơn', 'Tip: rotate your phone for a wider view')); xoay.id = 'ddXoay'; document.body.append(xoay);
  try { if (!localStorage.getItem('dd_xoay')) { xoay.classList.add('on'); setTimeout(() => { xoay.classList.remove('on'); try { localStorage.setItem('dd_xoay', '1'); } catch (e) {} }, 7000); } } catch (e) {}
  HT.didong = true;
})();
