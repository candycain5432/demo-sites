const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(val));
  } catch { return null; }
}

// ===== Nav =====
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll); onScroll();
$('#menuToggle').onclick = () => { $('#navLinks').classList.toggle('open'); nav.classList.add('scrolled'); };
$('#navLinks').addEventListener('click', (e) => { if (e.target.tagName === 'A') $('#navLinks').classList.remove('open'); });

// ===== Service countdown =====
const SERVICE_TIMES = [[9, 0], [11, 0]];
const SERVICE_LEN = 75; // minutes
function nextService(now = new Date()) {
  for (let add = 0; add < 8; add++) {
    const d = new Date(now); d.setDate(now.getDate() + add);
    if (d.getDay() !== 0) continue;
    for (const [h, m] of SERVICE_TIMES) {
      const start = new Date(d); start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + SERVICE_LEN * 60000);
      if (end > now) return { start, live: start <= now };
    }
  }
}
function tick() {
  const { start, live } = nextService();
  const day = start.toDateString() === new Date().toDateString() ? 'Today' : 'Sunday';
  const time = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (live) {
    $('#nextServiceLabel').innerHTML = `<span class="live-now">Live now · ${time} service</span>`;
    $('#countdown').style.display = 'none';
    return;
  }
  $('#countdown').style.display = '';
  $('#nextServiceLabel').textContent = `${day}, ${time}`;
  let diff = Math.max(0, start - new Date()) / 1000;
  const d = Math.floor(diff / 86400); diff -= d * 86400;
  const h = Math.floor(diff / 3600); diff -= h * 3600;
  const m = Math.floor(diff / 60);
  const s = Math.floor(diff - m * 60);
  $('#cdD').textContent = d; $('#cdH').textContent = h; $('#cdM').textContent = m; $('#cdS').textContent = s;
}
tick(); setInterval(tick, 1000);

// ===== Plan a visit =====
(function fillSundays() {
  const sel = $('#visitDate');
  const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  for (let i = 0; i < 4; i++) {
    const opt = document.createElement('option');
    opt.textContent = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) + (i === 0 ? ' (this Sunday)' : '');
    sel.appendChild(opt);
    d.setDate(d.getDate() + 7);
  }
})();
$('#kidsInput').addEventListener('input', (e) => $('#kidsAges').classList.toggle('hidden', !(Number(e.target.value) > 0)));
$('#visitForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const kids = Number(f.get('kids'));
  e.target.innerHTML = `<div class="success"><div class="big">🎉</div><h3>We can't wait to meet you, ${esc(f.get('name'))}!</h3>
    <p>You're all set for <strong>${esc(f.get('date').replace(' (this Sunday)', ''))} at ${esc(f.get('time'))}</strong>. Look for the gold "Guest" signs. Your parking spot is right by the front door.</p>
    ${kids ? `<p style="margin-top:10px">We'll have a host ready to walk your ${kids === 1 ? 'child' : kids + ' kids'} to their room. 🧸</p>` : ''}
    <p style="margin-top:10px">A confirmation email is on its way.</p></div>`;
});

// ===== Sermons =====
const SERIES_COLORS = { 'Unshaken': '#3b5683', 'The Way of Jesus': '#7a5a3a', 'Psalms of Summer': '#2f7a6a', 'Rooted': '#6a4a7a' };
const SERMONS = [
  { title: 'When the Ground Shakes', series: 'Unshaken', speaker: 'Pastor James Whitfield', ref: 'Psalm 46', date: 'Nov 9', dur: '38:12', secs: 2292 },
  { title: 'Anchored Hope', series: 'Unshaken', speaker: 'Pastor James Whitfield', ref: 'Hebrews 6:13-20', date: 'Nov 2', dur: '41:05', secs: 2465 },
  { title: 'Peace That Doesn\'t Make Sense', series: 'Unshaken', speaker: 'Pastor Maria Delgado', ref: 'Philippians 4:4-9', date: 'Oct 26', dur: '35:47', secs: 2147 },
  { title: 'Love Your Neighbor (Even That One)', series: 'The Way of Jesus', speaker: 'Pastor James Whitfield', ref: 'Luke 10:25-37', date: 'Oct 19', dur: '39:30', secs: 2370 },
  { title: 'The Upside-Down Kingdom', series: 'The Way of Jesus', speaker: 'Pastor Maria Delgado', ref: 'Matthew 5:1-12', date: 'Oct 12', dur: '42:18', secs: 2538 },
  { title: 'Rest for the Weary', series: 'The Way of Jesus', speaker: 'Guest: Dr. Ken Osei', ref: 'Matthew 11:28-30', date: 'Oct 5', dur: '33:55', secs: 2035 },
  { title: 'The Lord Is My Shepherd', series: 'Psalms of Summer', speaker: 'Pastor James Whitfield', ref: 'Psalm 23', date: 'Aug 24', dur: '36:40', secs: 2200 },
  { title: 'Search Me, O God', series: 'Psalms of Summer', speaker: 'Pastor Maria Delgado', ref: 'Psalm 139', date: 'Aug 17', dur: '37:22', secs: 2242 },
  { title: 'Deep Roots, Strong Faith', series: 'Rooted', speaker: 'Pastor James Whitfield', ref: 'Colossians 2:6-7', date: 'Jun 8', dur: '40:02', secs: 2402 },
];
let activeSeries = 'All';
let query = '';

function renderFeatured() {
  const s = SERMONS[0];
  $('#featured').innerHTML = `
    <div class="featured-art" style="background:linear-gradient(135deg, ${SERIES_COLORS[s.series]}, #1b2a44)">
      <div class="series-art">${s.series}</div>
      <button class="play-big" data-play="0" aria-label="Play latest sermon">▶</button>
    </div>
    <div class="featured-info">
      <span class="tag">Latest message · ${s.date}</span>
      <h3>${s.title}</h3>
      <p>${s.speaker} · ${s.ref} · ${s.dur}</p>
      <p>Part of our series <strong>${s.series}</strong>: finding steady ground when life feels anything but steady.</p>
      <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">
        <button class="btn btn-gold btn-sm" data-play="0">▶ Listen now</button>
        <button class="btn btn-outline-light btn-sm" data-notes>📝 Sermon notes</button>
      </div>
    </div>`;
}
function renderFilters() {
  const series = ['All', ...Object.keys(SERIES_COLORS)];
  $('#seriesFilters').innerHTML = series.map((s) => `<button class="pill ${s === activeSeries ? 'active' : ''}" data-series="${s}">${s}</button>`).join('');
}
function renderSermons() {
  const q = query.toLowerCase();
  const list = SERMONS.map((s, i) => ({ ...s, i })).filter((s) =>
    (activeSeries === 'All' || s.series === activeSeries) &&
    (!q || [s.title, s.speaker, s.ref, s.series].join(' ').toLowerCase().includes(q)));
  $('#sermonList').innerHTML = list.length ? list.map((s) => `
    <div class="sermon ${playing && playing.i === s.i ? 'playing' : ''}" data-play="${s.i}" role="button" tabindex="0">
      <div class="thumb" style="background:${SERIES_COLORS[s.series]}">${playing && playing.i === s.i && !paused ? '❚❚' : '▶'}</div>
      <div><h4>${s.title}</h4><small>${s.speaker} · ${s.date} · ${s.series}</small></div>
      <span class="ref">${s.ref}</span>
      <span class="dur">${s.dur}</span>
    </div>`).join('') : `<p class="no-results">No sermons match "${esc(query)}". Try another search.</p>`;
}
$('#seriesFilters').addEventListener('click', (e) => {
  const b = e.target.closest('.pill'); if (!b) return;
  activeSeries = b.dataset.series; renderFilters(); renderSermons();
});
$('#sermonSearch').addEventListener('input', (e) => { query = e.target.value; renderSermons(); });

// ===== Player (simulated) =====
let playing = null, paused = false, pos = 0, timer = null;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function play(i) {
  if (playing && playing.i === i) return togglePause();
  playing = { ...SERMONS[i], i }; pos = 0; paused = false;
  $('#pTitle').textContent = playing.title;
  $('#pMeta').textContent = `${playing.speaker} · ${playing.ref}`;
  $('#player').classList.add('show'); document.body.classList.add('player-open');
  startTimer(); updatePlayer(); renderSermons();
  toast('🎧 Demo player: audio is simulated');
}
function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => { if (!paused) { pos = Math.min(playing.secs, pos + 1); updatePlayer(); } }, 1000);
}
function togglePause() { paused = !paused; updatePlayer(); renderSermons(); }
function updatePlayer() {
  $('#playBtn').textContent = paused ? '▶' : '❚❚';
  $('#progressFill').style.width = (pos / playing.secs * 100) + '%';
  $('#pTime').textContent = `${fmt(pos)} / ${playing.dur}`;
}
$('#playBtn').onclick = togglePause;
$('#progress').onclick = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  pos = Math.floor((e.clientX - r.left) / r.width * playing.secs); updatePlayer();
};
$('#closePlayer').onclick = () => {
  clearInterval(timer); playing = null;
  $('#player').classList.remove('show'); document.body.classList.remove('player-open'); renderSermons();
};
document.addEventListener('click', (e) => {
  const p = e.target.closest('[data-play]');
  if (p) play(Number(p.dataset.play));
  if (e.target.closest('[data-notes]')) openModal(`<h3>Sermon Notes</h3><p class="muted"><strong>When the Ground Shakes</strong> · Psalm 46</p>
    <ol style="padding-left:20px;display:grid;gap:8px"><li>God is our refuge: a place to run <em>to</em>, not just away from.</li><li>"Be still" is an invitation, not a command to stop feeling.</li><li>Unshaken doesn't mean unaffected. It means anchored.</li></ol>
    <p class="muted" style="font-size:14px"><strong>This week:</strong> Read Psalm 46 each morning and write down one thing you're handing over to God.</p>
    <div class="modal-actions"><button class="btn btn-navy btn-sm" data-close>Close</button></div>`);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('.sermon')) play(Number(e.target.dataset.play));
  if (e.key === 'Escape') closeModal();
});

// ===== Events =====
function upcoming(offsetDays, hour, min) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays); d.setHours(hour, min, 0, 0); return d;
}
const EVENTS = [
  { id: 'e1', title: 'Community Thanksgiving Dinner', when: upcoming(4, 17, 30), where: 'Fellowship Hall', desc: 'A free, all-are-welcome meal with turkey and all the fixings. Bring a friend or a neighbor who could use a seat at the table.', going: 142, cap: 200 },
  { id: 'e2', title: 'Newcomers Lunch', when: upcoming(7, 12, 30), where: 'The Café', desc: 'New around here? Grab lunch on us, meet our pastors, and hear the Grace Harbor story. Childcare provided.', going: 18, cap: 40 },
  { id: 'e3', title: 'Christmas Choir Rehearsal', when: upcoming(10, 19, 0), where: 'Main Auditorium', desc: 'No audition required! Join the community choir for our Christmas Eve services.', going: 36, cap: 80 },
  { id: 'e4', title: 'Food Pantry Serve Day', when: upcoming(12, 9, 0), where: 'Outreach Center', desc: 'Sort, pack, and hand out groceries to 150+ local families. Great for families with kids 8+.', going: 27, cap: 40 },
  { id: 'e5', title: 'Men\'s Breakfast', when: upcoming(15, 7, 30), where: 'Fellowship Hall', desc: 'Pancakes, bacon, and real conversation. Guest speaker: Coach Darnell Brooks.', going: 51, cap: 90 },
  { id: 'e6', title: 'Christmas Eve Candlelight', when: upcoming(38, 17, 0), where: 'Main Auditorium', desc: 'Carols, the Christmas story, and candlelight. Services at 3, 5 & 7 PM. Invite everyone you know.', going: 318, cap: 900 },
].sort((a, b) => a.when - b.when);
let rsvps = store('gh_rsvps') || {};

function renderEvents() {
  $('#eventsList').innerHTML = EVENTS.map((ev) => {
    const r = rsvps[ev.id];
    const count = ev.going + (r || 0);
    return `
    <article class="event">
      <div class="event-top">
        <div class="date-box"><span>${ev.when.toLocaleDateString([], { month: 'short' })}</span><b>${ev.when.getDate()}</b></div>
        <div><h3>${ev.title}</h3><div class="meta">${ev.when.toLocaleDateString([], { weekday: 'long' })} · ${ev.when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}<br>📍 ${ev.where}</div></div>
      </div>
      <p class="desc">${ev.desc}</p>
      <div class="event-foot">
        <small>👥 ${count} going · ${ev.cap - count} spots left</small>
        <button class="rsvp-btn ${r ? 'going' : ''}" data-rsvp="${ev.id}">${r ? `✓ Going (${r})` : 'RSVP'}</button>
      </div>
    </article>`;
  }).join('');
}
$('#eventsList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-rsvp]'); if (!b) return;
  const ev = EVENTS.find((x) => x.id === b.dataset.rsvp);
  if (rsvps[ev.id]) {
    openModal(`<h3>Can't make it?</h3><p class="muted">Cancel your RSVP for <strong>${ev.title}</strong>?</p>
      <div class="modal-actions"><button class="btn btn-plain btn-sm" data-close>Keep it</button><button class="btn btn-navy btn-sm" data-cancel="${ev.id}">Cancel RSVP</button></div>`);
    return;
  }
  openModal(`<h3>${ev.title}</h3>
    <p class="muted">${ev.when.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} · ${ev.when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ${ev.where}</p>
    <form id="rsvpForm" class="form">
      <label>Your name<input required name="name" placeholder="Full name"></label>
      <label>Email<input required type="email" name="email" placeholder="you@email.com"></label>
      <label>How many people?<select name="n">${[1, 2, 3, 4, 5, 6].map((n) => `<option>${n}</option>`).join('')}</select></label>
      <div class="modal-actions"><button type="button" class="btn btn-plain btn-sm" data-close>Cancel</button><button class="btn btn-navy btn-sm">Confirm RSVP</button></div>
    </form>`);
  $('#rsvpForm').onsubmit = (f) => {
    f.preventDefault();
    const n = Number(new FormData(f.target).get('n'));
    rsvps[ev.id] = n; store('gh_rsvps', rsvps); renderEvents(); closeModal();
    toast(`🎉 You're going to ${ev.title}! A calendar invite is on its way.`);
  };
});

// ===== Prayer wall =====
const WALL = [
  { id: 'p1', name: 'Linda', text: 'For my husband\'s surgery on Thursday, and for peace for our family while we wait.', ago: '2 hours ago', count: 34 },
  { id: 'p2', name: 'Anonymous', text: 'Lost my job last week. Praying for provision and a new door to open.', ago: '5 hours ago', count: 51 },
  { id: 'p3', name: 'The Okafor family', text: 'PRAISE! Our adoption was finalized yesterday. Thank you all for praying with us for 2 years. 💛', ago: 'Yesterday', count: 112 },
  { id: 'p4', name: 'Marcus', text: 'For my son, who\'s heading off to basic training next month.', ago: '2 days ago', count: 47 },
];
let prayed = store('gh_prayed') || {};
function renderWall() {
  $('#wall').innerHTML = WALL.map((p) => `
    <div class="req">
      <p>${esc(p.text)}</p>
      <div class="req-foot"><span>— ${esc(p.name)} · ${p.ago}</span>
        <button class="pray-btn ${prayed[p.id] ? 'prayed' : ''}" data-pray="${p.id}">🙏 ${p.count + (prayed[p.id] ? 1 : 0)}</button></div>
    </div>`).join('');
}
$('#wall').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pray]'); if (!b) return;
  prayed[b.dataset.pray] = !prayed[b.dataset.pray]; store('gh_prayed', prayed); renderWall();
});
$('#prayerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = f.get('name').trim() || 'Anonymous';
  if (!f.get('private')) {
    const id = 'u' + Date.now();
    WALL.unshift({ id, name, text: f.get('request'), ago: 'Just now', count: 0 });
    renderWall();
  }
  e.target.innerHTML = `<div class="success"><div class="big">🙏</div><h3>We're praying with you${name !== 'Anonymous' ? ', ' + esc(name) : ''}.</h3>
    <p>${f.get('private') ? 'Your request was shared privately with our prayer team.' : 'Your request was added to the prayer wall.'}${f.get('contact') ? ' A pastor will reach out within 48 hours.' : ''}</p></div>`;
});

// ===== Give =====
let amount = 50, freq = 'once';
function updateGive() {
  const fee = $('#coverFees').checked ? amount * 0.029 : 0;
  const total = amount + fee;
  $('#giveBtn').textContent = amount > 0 ? `Give $${total.toFixed(fee ? 2 : 0)}${freq === 'monthly' ? ' / month' : ''}` : 'Enter an amount';
  $('#giveBtn').disabled = !(amount > 0);
}
$('#amounts').addEventListener('click', (e) => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  amount = Number(b.dataset.a); $('#customAmt').value = '';
  document.querySelectorAll('#amounts button').forEach((x) => x.classList.toggle('active', x === b)); updateGive();
});
$('#customAmt').addEventListener('input', (e) => {
  amount = Number(e.target.value) || 0;
  document.querySelectorAll('#amounts button').forEach((x) => x.classList.remove('active')); updateGive();
});
document.querySelector('.freq').addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]'); if (!b) return;
  freq = b.dataset.f; document.querySelectorAll('.freq button').forEach((x) => x.classList.toggle('active', x === b)); updateGive();
});
$('#coverFees').addEventListener('change', updateGive);
$('#giveForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!(amount > 0)) return;
  const btn = $('#giveBtn'); btn.disabled = true; btn.textContent = 'Processing…';
  setTimeout(() => {
    const fund = $('#fund').value;
    if (fund.startsWith('Building')) {
      const raised = 360000 + amount; const pct = Math.round(raised / 5000);
      $('#goalBar').style.width = pct + '%'; $('#goalPct').textContent = pct + '%';
      $('#goalRaised').textContent = '$' + raised.toLocaleString();
    }
    e.target.innerHTML = `<div class="success"><div class="big">💛</div><h3>Thank you for your generosity!</h3>
      <p>Your ${freq === 'monthly' ? 'monthly ' : ''}gift of <strong>$${amount.toLocaleString()}</strong> to the <strong>${fund}</strong> makes a real difference.</p>
      <p style="margin-top:8px;font-size:14px">(Demo only — no payment was processed. A live site would connect to a giving platform like Tithe.ly, Pushpay, or Stripe.)</p></div>`;
  }, 1100);
});

$('#newsForm').addEventListener('submit', (e) => { e.preventDefault(); e.target.innerHTML = '<p>✓ You\'re subscribed! Watch for our Friday email.</p>'; });

// ===== Modal & toast =====
function openModal(html) { $('#modalCard').innerHTML = html; $('#modal').classList.add('show'); }
function closeModal() { $('#modal').classList.remove('show'); }
$('#modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal();
  const c = e.target.closest('[data-cancel]');
  if (c) { delete rsvps[c.dataset.cancel]; store('gh_rsvps', rsvps); renderEvents(); closeModal(); toast('RSVP cancelled. Hope to see you another time!'); }
});
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3000); }

renderFeatured(); renderFilters(); renderSermons(); renderEvents(); renderWall(); updateGive();
