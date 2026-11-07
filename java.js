// QURANA v0.1 — Sumber data: api.alquran.cloud (teks Uthmani, terjemahan Kemenag/Indonesian,
// transliterasi, audio Mishary Alafasy) dan api.aladhan.com (jadwal salat, metode Kemenag).
const API = 'https://api.alquran.cloud/v1';
const $ = s => document.querySelector(s);
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = s => s.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '').replace(/\u0671/g, '\u0627');
// API menempelkan Basmalah di depan ayat 1 (kecuali Al-Fatihah & At-Taubah).
// Fungsi ini hanya MEMOTONG 4 kata pertama jika cocok dengan Basmalah; huruf & harakat tidak diubah sama sekali.
function splitBasmala(text, surah, ayah) {
  if (ayah !== 1 || surah === 1 || surah === 9) return { basmala: '', text };
  const w = text.split(' ');
  if (w.length > 4 && norm(w.slice(0, 4).join(' ')) === 'بسم الله الرحمن الرحيم')
    return { basmala: w.slice(0, 4).join(' '), text: w.slice(4).join(' ') };
  return { basmala: '', text };
}
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
let surahs = [], current = null, audio = new Audio(), playingIdx = -1, repeat = false;
let state = { theme: store.get('theme', 'light'), last: store.get('last', null), bm: store.get('bm', []),
  days: store.get('days', 30), city: store.get('city', 'Jakarta'), arabOnly: store.get('arabOnly', false), speed: store.get('speed', 1), qari: store.get('qari', 'ar.alafasy') };

function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1800); }
async function getJSON(u) { const r = await fetch(u); if (!r.ok) throw new Error(r.status); return (await r.json()).data; }

/* ---------- Navigasi ---------- */
function go(p) {
  hideVerseBar();
  document.querySelectorAll('.page').forEach(x => x.classList.toggle('active', x.id === 'page-' + p));
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.go === p));
  if (p === 'quran') { $('#listView').hidden = false; $('#readView').hidden = true; stopAudio(); }
  if (p === 'bookmarks') renderBookmarks();
  scrollTo(0, 0);
}
document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });

/* ---------- Tema ---------- */
function applyArab() { const b = $('#arabBtn'); b.classList.toggle('on', state.arabOnly); b.setAttribute('aria-pressed', state.arabOnly); }
$('#arabBtn').onclick = () => { state.arabOnly = !state.arabOnly; store.set('arabOnly', state.arabOnly); applyArab(); renderReader(); toast(state.arabOnly ? 'Mode Arab saja: ayat bersambung' : 'Terjemahan & Latin ditampilkan'); };
function applyTheme() { document.documentElement.dataset.theme = state.theme; $('#themeBtn').textContent = state.theme === 'dark' ? '☀️' : '🌙'; }
$('#themeBtn').onclick = () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; store.set('theme', state.theme); applyTheme(); };

/* ---------- Beranda ---------- */
function header() {
  const d = new Date(), h = d.getHours();
  $('#greeting').textContent = `Assalamu'alaikum — ${h < 11 ? 'selamat pagi' : h < 15 ? 'selamat siang' : h < 18 ? 'selamat sore' : 'selamat malam'}`;
  const bulan = ['Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Syaban', 'Ramadan', 'Syawal', 'Zulkaidah', 'Zulhijah'];
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d).map(x => [x.type, x.value]));
  $('#hijri').textContent = `${p.day} ${bulan[+p.month - 1]} ${p.year} H`;
  $('#masehi').textContent = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
async function dailyVerse() {
  const d = new Date(), seed = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
  const n = (seed * 7919) % 6236 + 1;
  try {
    const [ar, id] = await getJSON(`${API}/ayah/${n}/editions/quran-uthmani,id.indonesian`);
    $('#vArab').textContent = splitBasmala(ar.text, ar.surah.number, ar.numberInSurah).text; $('#vId').textContent = id.text;
    $('#vRef').textContent = `QS ${sName(ar.surah.number)} (${ar.surah.number}): ${ar.numberInSurah}`;
  } catch { $('#vArab').textContent = ''; $('#vId').textContent = 'Tidak dapat memuat ayat. Periksa koneksi internet.'; }
}
async function prayers() {
  const box = $('#prayers'); $('#cityBtn').textContent = state.city;
  try {
    const r = await getJSON(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(state.city)}&country=Indonesia&method=20`);
    const names = [['Fajr', 'Subuh'], ['Dhuhr', 'Zuhur'], ['Asr', 'Asar'], ['Maghrib', 'Magrib'], ['Isha', 'Isya']];
    const now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
    const mins = t => { const [h, m] = t.slice(0, 5).split(':'); return +h * 60 + +m; };
    let next = names.findIndex(([k]) => mins(r.timings[k]) > cur); if (next < 0) next = 0;
    box.innerHTML = names.map(([k, n], i) => `<div class="${i === next ? 'next' : ''}">${n}<b>${r.timings[k].slice(0, 5)}</b></div>`).join('');
    $('#nextPrayer').textContent = `Berikutnya: ${names[next][1]} ${r.timings[names[next][0]].slice(0, 5)}`;
  } catch { box.textContent = 'Tidak dapat memuat jadwal. Coba ubah kota atau periksa koneksi.'; }
}
$('#cityBtn').onclick = () => { const c = prompt('Nama kota di Indonesia (contoh: Bandung):', state.city); if (c && c.trim()) { state.city = c.trim(); store.set('city', state.city); prayers(); } };
function khatam() {
  $('#khatamSel').value = state.days;
  const done = state.last ? state.last.global : 0, per = Math.ceil(6236 / state.days);
  $('#khatamBar').style.width = (done / 6236 * 100).toFixed(1) + '%';
  $('#khatamTxt').textContent = `${done} dari 6.236 ayat (${(done / 6236 * 100).toFixed(1)}%) · target ${per} ayat/hari`;
  $('#continueBtn').textContent = state.last ? `Lanjutkan: ${sName(state.last.surah)} ayat ${state.last.ayah}` : 'Mulai membaca';
}
$('#khatamSel').onchange = e => { state.days = +e.target.value; store.set('days', state.days); khatam(); toast(`Target khatam ${state.days} hari`); };
$('#continueBtn').onclick = () => openSurah(state.last ? state.last.surah : 1, state.last ? state.last.ayah : 1);

/* ---------- Daftar surah ---------- */
function renderList(q = '') {
  const nz = t => t.toLowerCase().replace(/[\s'’`\-]/g, ''), k = nz(q);
  const list = surahs.filter(s => !k || String(s.number) === q.trim() || nz(sName(s.number)).includes(k) || nz(sMean(s.number)).includes(k) || nz(s.englishName).includes(k));
  $('#surahList').innerHTML = list.length ? list.map(s => `<button class="surah" data-s="${s.number}"><span class="num">${s.number}</span>
    <span class="grow"><b>${sName(s.number)}</b><br><small class="muted">${sMean(s.number)} · ${s.numberOfAyahs} ayat · ${s.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah'}</small></span><span class="ar">${s.name.replace('سُورَةُ ', '')}</span></button>`).join('')
    : '<p class="muted">Surah tidak ditemukan.</p>';
}
$('#search').oninput = e => renderList(e.target.value);
$('#surahList').onclick = e => { const b = e.target.closest('[data-s]'); if (b) openSurah(+b.dataset.s); };

/* ---------- Pembaca ---------- */
async function openSurah(n, ayah = 1) {
  if (n < 1 || n > 114) return;
  go('quran'); stopAudio();
  $('#listView').hidden = true; $('#readView').hidden = false;
  $('#ayahs').innerHTML = '<p class="muted">Memuat…</p>';
  try {
    const [ar, id, tr, au] = await getJSON(`${API}/surah/${n}/editions/quran-uthmani,id.indonesian,en.transliteration,${state.qari}`);
    const N = ar.numberOfAyahs;
    if ([ar, id, tr, au].some(e => e.ayahs.length !== N || e.ayahs.some((a, i) => a.numberInSurah !== i + 1))) throw new Error('Data ayat tidak cocok');
    let basmala = '';
    current = { n, name: sName(n), ayahs: ar.ayahs.map((a, i) => {
      const sp = splitBasmala(a.text, n, a.numberInSurah); if (sp.basmala) basmala = sp.basmala;
      return { no: a.numberInSurah, global: a.number, ar: sp.text, id: id.ayahs[i].text, tr: tr.ayahs[i].text, audio: au.ayahs[i].audio };
    }) };
    $('#rName').textContent = `${sName(n)} — ${ar.name}`; $('#rMeta').textContent = `${ar.numberOfAyahs} ayat`;
    current.basmala = basmala; renderReader();
    if (ayah === 1) scrollTo(0, 0); else document.getElementById('a' + ayah)?.scrollIntoView({ block: 'start' });
  } catch { $('#ayahs').innerHTML = '<p class="muted">Gagal memuat surah. Periksa koneksi internet lalu coba lagi.</p>'; }
}
const arDigits = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
let selV = -1;
function renderReader() {
  const c = current; if (!c) return; hideVerseBar();
  const bas = c.basmala ? `<p class="arab basmala" dir="rtl" lang="ar">${esc(c.basmala)}</p>` : '';
  const src = `<div class="nav-surah">${c.n > 1 ? `<button class="chip" data-nav="-1">← ${esc(sName(c.n - 1))}</button>` : '<span></span>'}${c.n < 114 ? `<button class="chip" data-nav="1">${esc(sName(c.n + 1))} →</button>` : '<span></span>'}</div><p class="src muted">Teks: Tanzil (Uthmani) · Terjemahan: Kemenag RI · Audio: ${esc(QARI[state.qari] || state.qari)} · via alquran.cloud</p>`;
  $('#navPrev').disabled = c.n <= 1; $('#navNext').disabled = c.n >= 114;
  if (state.arabOnly) {
    $('#ayahs').innerHTML = bas + '<div class="mushaf arab" dir="rtl" lang="ar">' +
      c.ayahs.map((a, i) => `<span class="v" id="a${a.no}" data-v="${i}">${esc(a.ar)} <span class="mark">${arDigits(a.no)}</span></span> `).join('') + '</div>' + src;
  } else {
    $('#ayahs').innerHTML = bas + c.ayahs.map((a, i) => `<article class="ayah" id="a${a.no}"><div class="tools"><span class="num">${a.no}</span><span class="sp"></span>
      <button class="chip" data-play="${i}">▶ Putar</button><button class="chip" data-bm="${i}">${isBm(c.n, a.no) ? '🔖' : '🏷️'}</button><button class="chip" data-last="${i}">📍</button></div>
      <p class="arab" dir="rtl" lang="ar">${esc(a.ar)}</p><p class="translit">${esc(a.tr)}</p><p class="tr-id">${esc(a.id)}</p></article>`).join('') + src;
  }
  markPlaying();
}
function showVerseBar(i) {
  selV = i; const a = current.ayahs[i];
  $('#vbTitle').textContent = `Ayat ${a.no}`;
  $('#vbBm').textContent = isBm(current.n, a.no) ? '🔖 Tersimpan' : '🏷️ Simpan';
  $('#vbPlay').textContent = (playingIdx === i && !audio.paused) ? '⏸ Jeda' : '▶ Putar';
  $('#verseBar').hidden = false;
  document.querySelectorAll('.v').forEach((el, k) => el.classList.toggle('sel', k === i));
}
function hideVerseBar() { selV = -1; $('#verseBar').hidden = true; document.querySelectorAll('.v.sel').forEach(el => el.classList.remove('sel')); }
$('#vbPlay').onclick = () => { playAyah(selV); showVerseBar(selV); };
$('#vbBm').onclick = () => { toggleBm(selV, $('#vbBm')); showVerseBar(selV); };
$('#vbLast').onclick = () => setLast(selV, true);
$('#vbClose').onclick = hideVerseBar;
$('#backBtn').onclick = () => { hideVerseBar(); stopAudio(); $('#listView').hidden = false; $('#readView').hidden = true; };
$('#ayahs').onclick = e => {
  const p = e.target.closest('[data-play]'), b = e.target.closest('[data-bm]'), l = e.target.closest('[data-last]');
  const v = e.target.closest('[data-v]'); if (v) showVerseBar(+v.dataset.v);
  const nv = e.target.closest('[data-nav]'); if (nv) openSurah(current.n + +nv.dataset.nav);
  if (p) playAyah(+p.dataset.play);
  if (b) toggleBm(+b.dataset.bm, b);
  if (l) setLast(+l.dataset.last, true);
};
function setLast(i, say) {
  const a = current.ayahs[i]; state.last = { surah: current.n, name: current.name, ayah: a.no, global: a.global };
  store.set('last', state.last); khatam(); if (say) toast(`Penanda bacaan: ${current.name} ayat ${a.no}`);
}

/* ---------- Bookmark ---------- */
const isBm = (s, a) => state.bm.some(b => b.s === s && b.a === a);
function toggleBm(i, btn) {
  const a = current.ayahs[i];
  if (isBm(current.n, a.no)) { state.bm = state.bm.filter(b => !(b.s === current.n && b.a === a.no)); btn.textContent = '🏷️'; toast('Bookmark dihapus'); }
  else { state.bm.push({ s: current.n, a: a.no, name: current.name }); btn.textContent = '🔖'; toast('Ayat disimpan'); }
  store.set('bm', state.bm);
}
function renderBookmarks() {
  $('#bmList').innerHTML = state.bm.length ? state.bm.map(b => `<button class="surah" data-bs="${b.s}" data-ba="${b.a}"><span class="num">${b.a}</span><span class="grow"><b>${sName(b.s)}</b><br><small class="muted">Ayat ${b.a}</small></span></button>`).join('')
    : '<div class="card soon">Belum ada bookmark. Buka sebuah surah lalu ketuk 🏷️ pada ayat.</div>';
}
$('#bmList').onclick = e => { const b = e.target.closest('[data-bs]'); if (b) openSurah(+b.dataset.bs, +b.dataset.ba); };

/* ---------- Audio ---------- */
function playAyah(i) {
  if (playingIdx === i && !audio.paused) { audio.pause(); markPlaying(); return; }
  if (playingIdx === i && audio.paused) { audio.play(); markPlaying(); return; }
  playingIdx = i; audio.src = current.ayahs[i].audio; audio.play().catch(() => toast('Audio gagal diputar')); markPlaying();
  setLast(i, false);
}
function markPlaying() {
  document.querySelectorAll('.ayah').forEach((el, i) => {
    el.classList.toggle('playing', i === playingIdx);
    const b = el.querySelector('[data-play]'); b.textContent = (i === playingIdx && !audio.paused) ? '⏸ Jeda' : '▶ Putar';
  });
  document.querySelectorAll('.v').forEach((el, i) => el.classList.toggle('playing', i === playingIdx));
  updatePlayer();
}
function stopAudio() { audio.pause(); playingIdx = -1; if (current) markPlaying(); }
audio.onended = () => {
  if (repeat) { audio.currentTime = 0; audio.play(); return; }
  const nx = playingIdx + 1;
  if (current && nx < current.ayahs.length) { playingIdx = -1; playAyah(nx); document.getElementById('a' + current.ayahs[nx].no).scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  else stopAudio();
};
$('#repeatBtn').onclick = e => { repeat = !repeat; e.target.textContent = '🔁 ' + (repeat ? 'On' : 'Off'); };

/* ---------- Pemutar & pindah surah ---------- */
const QARI = { 'ar.alafasy': 'Mishary Alafasy', 'ar.abdulbasitmurattal': 'Abdul Basit (Murattal)', 'ar.husary': 'Mahmoud Khalil Al-Husary', 'ar.minshawi': 'Mohamed Siddiq Al-Minshawi' };
$('#pQari').innerHTML = Object.entries(QARI).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
$('#pQari').value = state.qari; $('#pSpeed').value = String(state.speed);
audio.defaultPlaybackRate = audio.playbackRate = state.speed;
function updatePlayer() {
  if (!current) return;
  const on = playingIdx >= 0;
  $('#pPlay').textContent = on && !audio.paused ? '⏸ Jeda' : (on ? '▶ Lanjut' : '▶ Putar surah');
  $('#pInfo').textContent = `Ayat ${on ? current.ayahs[playingIdx].no : '–'}/${current.ayahs.length}`;
  if (!on) $('#pFill').style.width = '0%';
}
audio.ontimeupdate = () => { $('#pFill').style.width = audio.duration ? (audio.currentTime / audio.duration * 100) + '%' : '0%'; };
audio.onpause = audio.onplay = () => { if (current) markPlaying(); };
$('#pPlay').onclick = () => { if (!current) return; playAyah(playingIdx >= 0 ? playingIdx : (selV >= 0 ? selV : 0)); };
$('#pNext').onclick = () => { if (!current) return; const nx = playingIdx + 1; if (nx < current.ayahs.length) { playingIdx = -1; playAyah(nx); } else toast('Ini ayat terakhir'); };
$('#pPrev').onclick = () => { if (!current) return; const pv = Math.max(playingIdx - 1, 0); playingIdx = -1; playAyah(pv); };
$('#pSpeed').onchange = e => { state.speed = +e.target.value; store.set('speed', state.speed); audio.defaultPlaybackRate = audio.playbackRate = state.speed; toast(`Kecepatan ${state.speed}x`); };
$('#pQari').onchange = async e => {
  const q = e.target.value, old = state.qari; if (!current) return;
  try {
    const d = await getJSON(`${API}/surah/${current.n}/${q}`);
    if (d.ayahs.length !== current.ayahs.length || d.ayahs.some((a, i) => a.numberInSurah !== current.ayahs[i].no || !a.audio)) throw new Error('Audio tidak cocok');
    d.ayahs.forEach((a, i) => current.ayahs[i].audio = a.audio);
    state.qari = q; store.set('qari', q); stopAudio(); renderReader(); toast('Qari: ' + QARI[q]);
  } catch { e.target.value = old; toast('Qari tidak tersedia. Periksa koneksi internet.'); }
};
$('#navPrev').onclick = () => current && openSurah(current.n - 1);
$('#navNext').onclick = () => current && openSurah(current.n + 1);
// Geser layar: ke kiri = surah selanjutnya, ke kanan = surah sebelumnya
let sx = 0, sy = 0;
$('#readView').addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
$('#readView').addEventListener('touchend', e => {
  if (!current || e.target.closest('select,input') || String(getSelection()).length) return;
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) < 80 || Math.abs(dy) > 60 || Math.abs(dx) < Math.abs(dy) * 2) return;
  const n = current.n + (dx < 0 ? 1 : -1);
  if (n >= 1 && n <= 114) openSurah(n); else toast(n < 1 ? 'Ini surah pertama' : 'Ini surah terakhir');
}, { passive: true });

/* ---------- Mulai ---------- */
(async function init() {
  applyTheme(); applyArab(); header(); khatam(); dailyVerse(); prayers();
  try { surahs = await getJSON(`${API}/surah`); renderList(); }
  catch { $('#surahList').innerHTML = '<p class="muted">Gagal memuat daftar surah. Periksa koneksi internet.</p>'; }
})();