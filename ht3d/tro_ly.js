/* =====================================================================================================
   HƯỚNG DẪN VIÊN AI — chạy hoàn toàn trên máy (WebGPU), trả lời dựa trên tư liệu của bảo tàng.
   · Tra cứu: BM25 (từ đơn + cặp từ, có/không dấu) trên kho tư liệu ht3d/ai/kien_thuc.json
   · Sinh câu trả lời: WebLLM + mô hình Qwen2.5 / Gemma 2 đặt sẵn trong ht3d/ai/models (không cần mạng)
   · Không có WebGPU/mô hình: trả lời bằng chính các đoạn tư liệu tìm được (luôn đúng nguồn)
   · Nói: Whisper small (ONNX, chạy tại máy) — dự phòng: nhận giọng nói của trình duyệt
   ===================================================================================================== */
const BASE = new URL('./', import.meta.url);              // .../ht3d/
const AI = new URL('ai/', BASE);
const MODELS = [
  { id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC', lib: 'Qwen2-7B-Instruct-q4f16_1_cs1k-webgpu.wasm', ten: 'Qwen2.5 7B · chất lượng cao', vram: 5200, gb: '4,3' },
  { id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', lib: 'Qwen2.5-3B-Instruct-q4f16_1_cs1k-webgpu.wasm', ten: 'Qwen2.5 3B · nhanh, nhẹ', vram: 2600, gb: '1,8' },
  { id: 'gemma-2-2b-it-q4f16_1-MLC', lib: 'gemma-2-2b-it-q4f16_1_cs1k-webgpu.wasm', ten: 'Gemma 2 2B (Google)', vram: 1900, gb: '1,5' },
  { id: 'tra_cuu', ten: 'Chỉ tra cứu tư liệu (không dùng AI)' },
];
const S = { kb: null, idx: null, engine: null, loading: null, model: null, asr: null, busy: false, hist: [] };
const LSg = (k, d) => { try { const v = localStorage.getItem('kgvh_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const LSs = (k, v) => { try { localStorage.setItem('kgvh_' + k, JSON.stringify(v)); } catch (e) {} };
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

/* ---------------------------------------------- tra cứu ---------------------------------------------- */
const STOP = new Set(('và của là có được cho các những một này đó thì mà với trong khi đã đang sẽ ra vào lên xuống tại từ đến như nào gì ai đâu '
  + 'bao nhiêu sao vì thế không chưa rất cũng nhưng hay hoặc để về theo bị do nên ông bà hãy kể tôi mình bạn biết lúc năm ngày tháng '
  + 'the of and in to what why how when where who is are was did does').split(' '));
const bo_dau = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
const tuRieng = (s) => String(s || '').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean);
function tok(s) {
  const w = tuRieng(s), out = [];
  for (let i = 0; i < w.length; i++) {
    const a = w[i]; if (STOP.has(a)) continue;
    out.push(a); const b = bo_dau(a); if (b !== a) out.push('~' + b);
    const c = w[i + 1]; if (c && !STOP.has(c)) { const bg = a + '_' + c; out.push(bg); out.push('~' + bo_dau(bg)); }
  }
  return out;
}
/* mở rộng câu hỏi bằng cách gọi khác của cùng một người, nơi, sự kiện */
const BI_DANH = [
  [/\b(bác|bác hồ|người|chủ tịch|hcm|hồ chủ tịch)\b/, ' hồ chí minh nguyễn ái quốc nguyễn tất thành'],
  [/(đi pháp|sang pháp|ra đi|ra nước ngoài|xuất dương|rời.{0,12}(nhà rồng|tổ quốc|quê hương)|tìm đường cứu nước)/, ' ra đi tìm đường cứu nước 1911 bến nhà rồng tàu amiral latouche tréville văn ba phụ bếp'],
  [/(lấy tên|tên hồ chí minh|đổi tên|bí danh|tên gọi)/, ' tên gọi hồ chí minh bí danh nguyễn ái quốc 1942'],
  [/(quê|sinh ra|sinh ở|nơi sinh|ra đời)/, ' làng sen hoàng trù kim liên nam đàn nghệ an 19 5 1890'],
  [/(tuyên ngôn|độc lập|2\/9|ba đình)/, ' tuyên ngôn độc lập 2 9 1945 quảng trường ba đình'],
  [/(mất|qua đời|từ trần|hy sinh)/, ' từ trần 2 9 1969 nhà 67 di chúc'],
  [/(về nước|trở về|pác bó|pác pó)/, ' về nước 28 1 1941 cột mốc 108 pác bó cốc bó'],
  [/(thành lập đảng|đảng cộng sản|hợp nhất)/, ' thành lập đảng cộng sản việt nam hợp nhất 1930 cửu long hương cảng'],
  [/(^|\s)mẹ(\s|$)|thân mẫu/, ' hoàng thị loan'],
  [/(^|\s)(cha|bố)(\s|$)|thân sinh|phụ thân/, ' nguyễn sinh sắc phó bảng'],
  [/(anh chị|chị gái|anh trai|gia đình)/, ' nguyễn thị thanh nguyễn sinh khiêm hoàng thị loan nguyễn sinh sắc'],
  [/(làm nghề|nghề gì|làm gì để sống|kiếm sống|công việc)/, ' nghề làm việc dệt vải làm ruộng phụ bếp sửa ảnh'],
  [/(london|luân đôn|anh quốc|nước anh)/, ' london luân đôn nước anh carlton haymarket'],
  [/(paris|pa ri|pa-ri|nước pháp)/, ' paris pa ri nước pháp'],
  [/(moscow|mátxcơva|mát xcơ va|moskva|liên xô|nga)/, ' mátxcơva moskva liên xô quốc tế cộng sản'],
  [/(hồng kông|hương cảng|cửu long)/, ' hồng kông hương cảng cửu long'],
  [/(quảng châu|canton|trung quốc)/, ' quảng châu trung quốc'],
  [/(thái lan|xiêm)/, ' thái lan xiêm thầu chín'],
  [/(mỹ|boston|new york|niu oóc|hoa kỳ)/, ' mỹ boston new york'],
  [/(sài gòn|nhà rồng)/, ' sài gòn bến nhà rồng'],
  [/(vì sao|tại sao|lý do|để làm gì|mục đích)/, ' để muốn nhằm mục đích tìm hiểu'],
];
/* so câu hỏi với câu hỏi mẫu: giữ cả từ để hỏi (vì sao, khi nào, ở đâu…), gộp các cách gọi Bác, các động từ đi lại */
const KHAI = [
  [/ (chủ tịch hồ chí minh|hồ chủ tịch|bác hồ|hồ chí minh|nguyễn ái quốc|nguyễn tất thành|nguyễn sinh cung|chủ tịch|bác|người|anh ba|văn ba)(?= )/g, ' @hcm'],
  [/ (khi nào|năm nào|lúc nào|bao giờ|ngày nào|tháng nào|năm bao nhiêu|thời gian nào)(?= )/g, ' @khi'],
  [/ (vì sao|tại sao|lý do gì|lý do|vì lẽ gì|do đâu|để làm gì|mục đích gì)(?= )/g, ' @visao'],
  [/ (ở đâu|nơi nào|chỗ nào|đâu)(?= )/g, ' @dau'],
  [/ (là ai|người nào|những ai|ai)(?= )/g, ' @ai'],
  [/ (nghĩa là gì|là gì|cái gì|gì)(?= )/g, ' @gi'],
  [/ (như thế nào|thế nào|ra sao|bằng cách nào|cách nào)(?= )/g, ' @nao'],
  [/ (đi|sang|tới|đến|qua|ra đi)(?= )/g, ' @di'],
];
const NHO = new Set('là của và có được thì mà cho các những một ấy này đó nào ở với trong đã đang sẽ lại cũng ra'.split(' '));
function tuHoi(s) { let t = ' ' + String(s || '').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}@]+/gu, ' ').trim() + ' '; for (const [re, r] of KHAI) { let t2; do { t2 = t; t = t.replace(re, r); } while (t !== t2); } return [...new Set(t.split(/\s+/).filter((w) => w && !NHO.has(w)))]; }
function simQ(q, h) { const A = tuHoi(q), B = new Set(tuHoi(h)); let n = 0, m = 0; for (const w of A) { const k = w[0] === '@' ? 0.5 : 1; m += k; if (B.has(w)) n += k; } return m ? n / m : 0; }
function moRong(q) { let t = ' ' + String(q || '').toLowerCase().normalize('NFC') + ' '; let x = ''; for (const [re, add] of BI_DANH) if (re.test(t)) x += add; return q + x; }
function buildIndex(kb) {
  const df = new Map(), docs = [];
  let tot = 0;
  for (const c of kb) {
    const tf = new Map(); const tk = tok(c.tieu_de + ' ' + c.tieu_de + ' ' + c.text);
    for (const t of tk) tf.set(t, (tf.get(t) || 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1);
    docs.push({ tf, len: tk.length }); tot += tk.length;
  }
  return { df, docs, N: kb.length, avg: tot / Math.max(1, kb.length) };
}
const idf = (t) => { const n = S.idx.df.get(t) || 0; return Math.log(1 + (S.idx.N - n + 0.5) / (n + 0.5)); };
function search(q, ma, k) {
  const I = S.idx, qt = [...new Set(tok(moRong(q)))], goc = new Set(tok(q)); const k1 = 1.4, b = 0.7;
  const sc = [];
  I.docs.forEach((d, i) => {
    let s = 0;
    for (const t of qt) { const f = d.tf.get(t); if (!f) continue; s += idf(t) * (f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / I.avg)) * (t.includes('_') ? 1.4 : 1) * (goc.has(t) ? 1.6 : 0.55); }
    if (s > 0) { const c = S.kb[i]; if (ma && c.ma === ma) s *= 1.15; if (c.loai === 'faq' || c.loai === 'hoi_dap') s *= 0.5 + 3 * simQ(q, c.hoi || c.tieu_de) ** 3; sc.push([s, i]); }
  });
  sc.sort((a, b2) => b2[0] - a[0]);
  return sc.slice(0, k || 6).map(([s, i]) => Object.assign({ diem: s }, S.kb[i]));
}
/* trả lời không cần AI: câu hỏi mẫu khớp → đáp án đã hiệu đính; nếu không, chọn 2–3 câu sát nhất trong các đoạn tư liệu */
function traLoiTraCuu(q, found) {
  const qt = new Set(tok(moRong(q))), goc = new Set(tok(q));
  const hopQ = (h) => { const a = new Set(tok(h)); let n = 0, m = 0; for (const t of goc) { if (t.startsWith('~') || t.includes('_')) continue; m++; if (a.has(t)) n++; } return m ? n / m : 0; };
  const hoiSao = /(^|\s)(vì sao|tại sao|lý do|vì lẽ gì|để làm gì|mục đích)(\s|$)/i.test(String(q).toLowerCase());
  const mau = found.filter((c) => (c.loai === 'faq' || c.loai === 'hoi_dap') && c.dap).map((c) => [simQ(q, c.hoi || c.tieu_de), c]).filter(([v, c]) => v >= 0.7 && hopQ(c.hoi || c.tieu_de) >= 0.5).sort((a, b) => b[0] - a[0]);
  for (const [, c] of mau.slice(0, 1)) {
    const them = found.find((x) => x !== c && x.loai !== 'faq' && x.loai !== 'hoi_dap');
    const moi = (x) => { const A = new Set(tuRieng(x)), B = new Set(tuRieng(c.dap)); let n = 0; for (const t of A) if (B.has(t)) n++; return 1 - n / Math.max(1, A.size); };
    const du = (x) => { const w = new Set(tok(x)); let k = 0; for (const t of goc) if (!t.startsWith('~') && !t.includes('_') && w.has(t)) k++; return k; };
    const cau = them ? chonCau(them.text, qt, 2).filter((x) => moi(x) > 0.6 && du(x) >= 2).slice(0, 1) : [];
    return { text: c.dap + (cau.length ? ' ' + cau.join(' ') : ''), nguon: [c].concat(them ? [them] : []) };
  }
  /* đoạn có tiêu đề chính là câu hỏi (ví dụ “Vì sao Lăng được xây ở đây”) → lấy phần đầu đoạn đó */
  for (const c of found.slice(0, 4)) {
    if (c.loai === 'faq' || c.loai === 'hoi_dap') continue;
    const h = String(c.tieu_de || '').split(' — ').pop();
    if (h && simQ(q, h) >= 0.6 && hopQ(h) >= 0.5) { const cs = String(c.text).split(/(?<=[.!?…])\s+/).slice(0, 3).join(' '); return { text: cs, nguon: [c] }; }
  }
  const cand = [];
  found.slice(0, 4).forEach((c, r) => { if (c.loai === 'hoi_dap' || c.loai === 'faq') return; String(c.text).split(/(?<=[.!?…])\s+/).forEach((cau, j) => { const w = new Set(tok(cau)); let s = 0; for (const t of qt) if (w.has(t)) s += idf(t) * (goc.has(t) ? 1.6 : 0.55); if (hoiSao && /(^|\s)(muốn|để|vì|nhằm|mục đích|bởi|do đó|lý do)(\s|$)/i.test(cau)) s *= 1.8; if (s > 0) cand.push({ cau, s: s / (1 + r * 0.15), r, j, c }); }); });
  cand.sort((a, b) => b.s - a.s);
  const chon = [], jac = (x, y) => { const A = new Set(tuRieng(x)), B = new Set(tuRieng(y)); let n = 0; for (const t of A) if (B.has(t)) n++; return n / Math.max(1, Math.min(A.size, B.size)); };
  for (const c of cand) { if (chon.length >= 3) break; if (chon.some((x) => jac(x.cau, c.cau) > 0.55)) continue; chon.push(c); }
  chon.sort((a, b) => a.r - b.r || a.j - b.j);
  if (!chon.length) return null;
  return { text: chon.map((x) => x.cau.trim()).join(' '), nguon: [...new Set(chon.map((x) => x.c))] };
}
function chonCau(text, qt, n) {
  return String(text).split(/(?<=[.!?…])\s+/).map((cau, j) => { const w = new Set(tok(cau)); let s = 0; for (const t of qt) if (w.has(t)) s += idf(t); return { cau, s, j }; }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n).sort((a, b) => a.j - b.j).map((x) => x.cau.trim());
}

/* ---------------------------------------------- mô hình ngôn ngữ ---------------------------------------------- */
async function coTep(u) { try { const r = await fetch(u, { method: 'HEAD', cache: 'no-store' }); return r.ok; } catch (e) { return false; } }
/* bản chạy trên mạng không kèm mô hình: tải thẳng từ Hugging Face (chỉ lần đầu, trình duyệt lưu lại) */
const HF = 'https://huggingface.co/mlc-ai/', LIBR = 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/';
async function coTaiMay(m) { return (await coTep(new URL('models/' + m.id + '/resolve/main/mlc-chat-config.json', AI).href)) && (await coTep(new URL('wasm/' + m.lib, AI).href)); }
async function chonMacDinh() {
  const saved = LSg('ai_model', null); if (saved && MODELS.some((m) => m.id === saved)) return saved;
  if (!navigator.gpu) return 'tra_cuu';
  S.taiMay = await coTaiMay(MODELS[1]);
  if (!S.taiMay) return 'tra_cuu';
  try {
    const ad = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    const inf = ad && (ad.info || (ad.requestAdapterInfo ? await ad.requestAdapterInfo() : {}));
    const v = ((inf && (inf.vendor + ' ' + inf.architecture + ' ' + inf.description)) || '').toLowerCase();
    if (/nvidia|amd|ati|radeon|geforce/.test(v)) return MODELS[0].id;
  } catch (e) {}
  return MODELS[1].id;
}
async function napMoHinh(id, st) {
  if (id === 'tra_cuu') { S.engine = null; S.model = id; st('Chế độ tra cứu: trả lời bằng chính các đoạn tư liệu của bảo tàng.'); return; }
  if (!navigator.gpu) { S.model = 'tra_cuu'; st('Trình duyệt này chưa bật WebGPU → dùng chế độ tra cứu tư liệu.'); return; }
  const m = MODELS.find((x) => x.id === id);
  const local = await coTaiMay(m);
  const murl = local ? new URL('models/' + m.id + '/', AI).href : HF + m.id;
  const lurl = local ? new URL('wasm/' + m.lib, AI).href : LIBR + m.lib;
  st(local ? 'Đang nạp ' + m.ten + ' vào card đồ họa…' : 'Đang tải ' + m.ten + ' (≈ ' + m.gb + ' GB, chỉ lần đầu, trình duyệt sẽ lưu lại)…', 0.01);
  const webllm = await import(new URL('lib/web-llm.js', AI).href);
  if (S.engine) { try { await S.engine.unload(); } catch (e) {} S.engine = null; }
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
  const prog = (r) => st('Nạp ' + m.ten + ': ' + Math.round((r.progress || 0) * 100) + '% — ' + String(r.text || '').replace(/\[.*?\]\s*/, '').slice(0, 90), r.progress || 0);
  let loi = null;
  for (const cacheBackend of ['cache', 'opfs', 'indexeddb']) {
    const appConfig = { cacheBackend, model_list: [{ model: murl, model_id: m.id, model_lib: lurl, overrides: { context_window_size: 4096 } }] };
    try { S.engine = await webllm.CreateMLCEngine(m.id, { appConfig, initProgressCallback: prog }); loi = null; break; }
    catch (e) { loi = e; if (!/quota|storage|space/i.test(String(e && e.message))) break; st('Bộ nhớ đệm “' + cacheBackend + '” không đủ chỗ, thử cách lưu khác…'); }
  }
  if (loi) throw new Error(/quota/i.test(String(loi.message)) ? 'trình duyệt không cho lưu thêm dữ liệu (cửa sổ ẩn danh hoặc ổ đĩa gần đầy) — mở bằng cửa sổ thường' : loi.message);
  S.model = id; st('Sẵn sàng · ' + m.ten + ' · chạy tại máy, không gửi dữ liệu ra ngoài.', 1);
}

const HE_THONG = 'Bạn là hướng dẫn viên của "Bảo tàng Hành trình" — bảo tàng số về cuộc đời Chủ tịch Hồ Chí Minh. ' +
  'QUY TẮC: (1) Chỉ dùng thông tin có trong phần TƯ LIỆU được cung cấp; tuyệt đối không bịa thêm ngày tháng, con số, tên người, địa danh, lời trích. ' +
  '(2) Nếu tư liệu không đủ để trả lời, hãy nói rõ: "Tư liệu của bảo tàng chưa đề cập điều này" rồi gợi ý điều liên quan mà tư liệu có. ' +
  '(3) Trả lời bằng tiếng Việt chuẩn mực, trang trọng, dễ hiểu, 2–6 câu; gọi Chủ tịch Hồ Chí Minh là "Bác" hoặc "Người" khi phù hợp. ' +
  '(4) Ghi số nguồn trong ngoặc vuông sau ý lấy từ tư liệu, ví dụ [1], [2]. (5) Nếu người hỏi dùng tiếng Anh thì trả lời bằng tiếng Anh.';

/* ---------------------------------------------- nhận giọng nói ---------------------------------------------- */
async function ghiAm(btn, st) {
  if (S.rec) { S.rec.stop(); return null; }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream); const parts = []; S.rec = rec;
  btn.classList.add('rec'); st('Đang nghe… bấm micro lần nữa để dừng.');
  const done = new Promise((res) => { rec.ondataavailable = (e) => parts.push(e.data); rec.onstop = () => res(); });
  rec.start(); const to = setTimeout(() => rec.state === 'recording' && rec.stop(), 20000);
  await done; clearTimeout(to); stream.getTracks().forEach((t) => t.stop()); S.rec = null; btn.classList.remove('rec');
  const buf = await new Blob(parts).arrayBuffer();
  const ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  const ab = await ac.decodeAudioData(buf); const x = ab.getChannelData(0).slice(); ac.close();
  return x;
}
async function nhanDang(audio, st) {
  if (!S.asr) {
    st('Đang nạp bộ nhận giọng nói Whisper (lần đầu hơi lâu)…');
    const tf = await import(new URL('lib/transformers.min.js', AI).href);
    const coWhisper = await coTep(new URL('models/onnx-community/whisper-small/config.json', AI).href);
    tf.env.allowRemoteModels = !coWhisper; tf.env.allowLocalModels = coWhisper;
    if (coWhisper) tf.env.localModelPath = new URL('models/', AI).href;
    else st('Đang tải bộ nhận giọng nói Whisper từ Hugging Face (≈ 400 MB, chỉ lần đầu)…');
    tf.env.backends.onnx.wasm.wasmPaths = new URL('lib/ort/', AI).href;
    const gpu = !!navigator.gpu;
    S.asr = await tf.pipeline('automatic-speech-recognition', 'onnx-community/whisper-small', gpu
      ? { device: 'webgpu', dtype: { encoder_model: 'fp16', decoder_model_merged: 'q4' } }
      : { device: 'wasm', dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' } });
  }
  st('Đang chuyển lời nói thành chữ…');
  const r = await S.asr(audio, { language: 'vietnamese', task: 'transcribe', chunk_length_s: 30 });
  return String((r && r.text) || '').trim();
}
function nghe_trinh_duyet(st) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return Promise.reject(new Error('no-sr'));
  return new Promise((res, rej) => { const r = new SR(); r.lang = 'vi-VN'; r.interimResults = false; r.onresult = (e) => res(e.results[0][0].transcript); r.onerror = (e) => rej(e.error); st('Đang nghe (nhận giọng nói của trình duyệt)…'); r.start(); });
}

/* ---------------------------------------------- giao diện ---------------------------------------------- */
export async function mount(p, api) {
  const st = (t, pr) => { const s = p.querySelector('.st'); s.innerHTML = ''; s.append(document.createTextNode(t)); if (pr != null) { const b = el('div', 'pb'); const i = el('i'); i.style.width = Math.round(pr * 100) + '%'; b.append(i); s.append(b); } };
  const msgs = p.querySelector('.msgs'), ta = p.querySelector('textarea'), form = p.querySelector('form'), sel = p.querySelector('select'), mic = p.querySelector('.mic');
  const sugBox = p.querySelector('.sug');
  const goiY = () => {
    sugBox.innerHTML = ''; const ma = api.cur();
    const qs = S.kb.filter((c) => c.loai === 'hoi_dap' && c.ma === ma).slice(0, 3).map((c) => c.tieu_de);
    for (const q of qs.concat(['Vì sao Bác lấy tên Hồ Chí Minh?', 'Kể một câu chuyện ít người biết ở nơi này'])) { const b = el('button', '', q); b.onclick = () => hoi(q); sugBox.append(b); }
  };
  if (api.prefill) ta.value = api.prefill ? 'Kể thêm cho tôi về: ' + api.prefill : '';
  if (p._init) { goiY(); ta.focus(); return; }
  p._init = true;
  st('Đang nạp kho tư liệu…');
  S.kb = await (await fetch(new URL('kien_thuc.json', AI).href)).json();
  S.idx = buildIndex(S.kb);
  for (const m of MODELS) { const o = el('option', '', m.ten); o.value = m.id; sel.append(o); }
  const def = await chonMacDinh(); sel.value = def;
  goiY();
  const add = (cls, txt) => { const m = el('div', 'm ' + cls); m.append(document.createTextNode(txt)); msgs.append(m); msgs.scrollTop = msgs.scrollHeight; return m; };
  add('a', 'Xin chào! Tôi là hướng dẫn viên AI của Bảo tàng Hành trình. Bạn có thể hỏi bằng chữ hoặc bấm micro để nói. Mọi câu trả lời đều dựa trên ' + S.kb.length + ' đoạn tư liệu của bảo tàng, kèm nguồn để bạn kiểm chứng.');
  if (S.taiMay === false && navigator.gpu && def === 'tra_cuu') {
    const m = add('a', 'Hiện tôi trả lời bằng chính các đoạn tư liệu đã hiệu đính. Muốn trò chuyện tự nhiên hơn, bấm nút dưới đây: máy của bạn sẽ tải mô hình AI Qwen2.5 3B (khoảng 1,8 GB, chỉ một lần) và chạy ngay trên card đồ họa — không gửi câu hỏi ra ngoài.');
    const bt = el('button', '', '✨ Bật AI trò chuyện (tải 1,8 GB một lần)'); bt.style.cssText = 'display:block;margin-top:10px;padding:8px 14px;border-radius:999px;border:1px solid var(--gold);background:linear-gradient(180deg,#d7b35d,#a9812f);color:#1a140a;font:700 13px var(--sans);cursor:pointer';
    bt.onclick = () => { sel.value = MODELS[1].id; LSs('ai_model', sel.value); load(sel.value); bt.remove(); };
    m.append(bt);
  }
  const load = (id) => { S.dangNap = true; S.loading = napMoHinh(id, st).catch((e) => { S.engine = null; S.model = 'tra_cuu'; st('Không nạp được mô hình (' + e.message + ') → dùng chế độ tra cứu.'); }).finally(() => { S.dangNap = false; }); return S.loading; };
  sel.onchange = () => { LSs('ai_model', sel.value); load(sel.value); };
  load(def);

  async function hoi(q) {
    q = String(q || '').trim(); if (!q || S.busy) return;
    S.busy = true; ta.value = '';
    add('u', q);
    const ma = api.cur();
    const gi = (window.HT && HT.DATA && HT.DATA.gian[ma]) || null;
    const qTim = gi && /(ở đây|gian này|nơi này|chỗ này|tại đây|nơi đây|ngôi nhà này|căn phòng này|here|this (hall|place|room))/i.test(q) ? q + ' ' + gi.ten + ' ' + gi.noi : q;
    let found = search(qTim, ma, 6);
    if ((!found.length || found[0].diem < 4) && S.lastQ) found = search(q + ' ' + S.lastQ, ma, 6);
    S.lastQ = q;
    const a = add('a', '…');
    const nguon = (list) => {
      const box = el('div', 'srcs');
      for (const c of list) {
        const ten = String(c.tieu_de || '').replace(/^Hiện vật: /, '✦ ');
        const b = el('button', '', (c.ma === 'G00' ? 'Sảnh' : 'Gian ' + c.ma.slice(1)) + ' · ' + (ten.length > 46 ? ten.slice(0, 45) + '…' : ten)); b.title = c.text.slice(0, 300);
        /* nguồn là chuyên đề của một bảng → mở đúng chuyên đề, cuộn tới đoạn trích; là đồ vật → mở câu chuyện đồ vật */
        b.onclick = () => {
          let x = c;
          if ((c.loai === 'faq' || c.loai === 'hoi_dap') && api.moChuDe) x = search((c.dap || c.text || '') + ' ' + (c.hoi || ''), c.ma, 10).find((y) => y.loai === 'cd' && y.ma === c.ma && Array.isArray(y.ref)) || c;
          const r = x.ref;
          if (x.loai === 'cd' && Array.isArray(r) && r[0] === 'dv' && api.moDoVat) api.moDoVat(x.ma, r[1]);
          else if (x.loai === 'cd' && Array.isArray(r) && api.moChuDe) api.moChuDe(x.ma, r[0], r[1]);
          else api.openReader(x.ma, x.doc);
        };
        box.append(b);
      }
      a.append(box);
    };
    try {
      if (!found.length || found[0].diem < 3) {
        a.textContent = 'Tư liệu của bảo tàng chưa đề cập điều này. Bạn thử hỏi về một nơi Bác từng sống và hoạt động (làng Sen, bến Nhà Rồng, Paris, Pác Bó, Tân Trào, Ba Đình…), hoặc một sự kiện, hiện vật trong gian.';
      } else {
        /* mô hình còn đang nạp: không bắt người hỏi chờ — trả lời ngay bằng đoạn tư liệu, ghi rõ */
        const choNap = S.dangNap;
        if (!choNap) await S.loading;
        if (S.engine && !choNap) {
          const tl = found.map((c, i) => '[' + (i + 1) + '] (' + (c.ma === 'G00' ? 'Sảnh' : 'Gian ' + c.ma.slice(1)) + ' – ' + c.tieu_de + ') ' + c.text.slice(0, 900)).join('\n\n');
          const messages = [{ role: 'system', content: HE_THONG }];
          for (const h of S.hist.slice(-4)) messages.push(h);
          messages.push({ role: 'user', content: 'TƯ LIỆU:\n' + tl + '\n\nCÂU HỎI: ' + q });
          const it = await S.engine.chat.completions.create({ messages, stream: true, temperature: 0.2, top_p: 0.9, max_tokens: 480 });
          let out = ''; a.textContent = '';
          for await (const ch of it) { const d = ch.choices[0] && ch.choices[0].delta && ch.choices[0].delta.content; if (d) { out += d; a.textContent = out; msgs.scrollTop = msgs.scrollHeight; } }
          out = out.trim(); a.textContent = out;
          S.hist.push({ role: 'user', content: q }, { role: 'assistant', content: out });
          const used = [...new Set((out.match(/\[(\d)\]/g) || []).map((x) => +x[1] - 1))].filter((i) => found[i]);
          nguon((used.length ? used.map((i) => found[i]) : found.slice(0, 3)));
        } else {
          const tl = traLoiTraCuu(qTim, found);
          if (tl) { a.textContent = tl.text; if (choNap) a.append(el('div', 'ghi', 'Mô hình AI đang nạp — câu trả lời này trích nguyên văn từ tư liệu của bảo tàng.')); nguon(tl.nguon.concat(found.filter((x) => !tl.nguon.includes(x))).slice(0, 3)); }
          else { a.textContent = 'Tư liệu của bảo tàng chưa đề cập điều này.'; }
        }
      }
      if (api.G.on) { const spk = a.firstChild ? a.firstChild.textContent || a.textContent : a.textContent; api.G._who = 'ai'; api.G.speak([spk.replace(/\[\d\]/g, '').replace(/[•\n]+/g, ' ').slice(0, 1500)], { nhan: 'Hướng dẫn viên AI đang trả lời' }); }
      const sp = el('button', 'spk', '🔊'); sp.title = 'Đọc to'; sp.onclick = () => { api.G._who = 'ai'; api.G.speak([a.childNodes[1] ? a.childNodes[1].textContent : a.textContent].map((t) => t.replace(/\[\d\]/g, '')), { nhan: 'Hướng dẫn viên AI đang trả lời' }); }; a.prepend(sp);
    } catch (e) { a.textContent = 'Có lỗi khi trả lời: ' + e.message; }
    S.busy = false; msgs.scrollTop = msgs.scrollHeight;
  }
  form.onsubmit = (e) => { e.preventDefault(); hoi(ta.value); };
  ta.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); hoi(ta.value); } e.stopPropagation(); };
  ta.onkeyup = (e) => e.stopPropagation();
  mic.onclick = async () => {
    try {
      if (S.rec) { S.rec.stop(); return; }
      let text = '';
      try { const audio = await ghiAm(mic, st); if (!audio) return; text = await nhanDang(audio, st); }
      catch (e) { console.warn('whisper', e); text = await nghe_trinh_duyet(st); }
      st(S.engine ? 'Sẵn sàng.' : 'Chế độ tra cứu tư liệu.');
      if (text) { ta.value = text; hoi(text); }
    } catch (e) { st('Không dùng được micro: ' + (e.message || e)); mic.classList.remove('rec'); }
  };
  ta.focus();
}

/* kiểm thử: nhận dạng một tệp âm thanh (MP3 thuyết minh) bằng Whisper tại máy */
export async function thuNhanDang(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  const ab = await ac.decodeAudioData(buf); const x = ab.getChannelData(0).slice(0, 16000 * 12); ac.close();
  const t0 = performance.now(); const text = await nhanDang(x, () => {});
  return { text, giay: Math.round((performance.now() - t0) / 100) / 10 };
}
