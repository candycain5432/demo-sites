const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(val));
  } catch { return null; }
}
const timeStr = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(' AM', 'am').replace(' PM', 'pm');

// ===== Nav =====
$('#menuToggle').onclick = () => $('#navLinks').classList.toggle('open');
$('#navLinks').addEventListener('click', (e) => { if (e.target.tagName === 'A') $('#navLinks').classList.remove('open'); });

// ===== Next service =====
const SERVICE_TIMES = [[9, 0], [11, 0]];
function nextService(now = new Date()) {
  for (let add = 0; add < 8; add++) {
    const d = new Date(now); d.setDate(now.getDate() + add);
    if (d.getDay() !== 0) continue;
    for (const [h, m] of SERVICE_TIMES) {
      const start = new Date(d); start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + 75 * 60000);
      if (end > now) return { start, live: start <= now };
    }
  }
}
function updateNext() {
  const { start, live } = nextService();
  const el = $('#nextService');
  if (live) { el.innerHTML = `<span class="live">Happening now (${timeStr(start)})</span>`; return; }
  const now = new Date();
  const days = Math.round((new Date(start).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86400000);
  const when = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'Sunday';
  const hrs = Math.floor((start - now) / 3600000);
  el.textContent = days === 0 && hrs < 3
    ? `Today at ${timeStr(start)}, in ${hrs ? hrs + ' hr ' : ''}${Math.ceil(((start - now) % 3600000) / 60000)} min`
    : `${when} at ${timeStr(start)}${days > 1 ? ` (in ${days} days)` : ''}`;
}
updateNext(); setInterval(updateNext, 30000);

// ===== Plan a visit =====
(function fillSundays() {
  const sel = $('#visitDate');
  const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  for (let i = 0; i < 4; i++) {
    const opt = document.createElement('option');
    opt.textContent = d.toLocaleDateString([], { month: 'long', day: 'numeric' });
    sel.appendChild(opt);
    d.setDate(d.getDate() + 7);
  }
})();
$('#kidsInput').addEventListener('input', (e) => $('#kidsAges').classList.toggle('hidden', !(Number(e.target.value) > 0)));
$('#visitForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const kids = Number(f.get('kids'));
  e.target.innerHTML = `<div class="success"><h3>Thanks, ${esc(f.get('name'))}. See you ${esc(f.get('date'))}.</h3>
    <p>We'll have someone at the front door before the ${esc(f.get('time'))} service. Pull into the main lot and look for the spots marked "Guest."</p>
    ${kids ? `<p>We'll let the kids team know you're bringing ${kids === 1 ? 'one' : kids} so they can get things ready.</p>` : ''}
    <p class="muted">You'll get a short email from Jenna on our welcome team this week.</p></div>`;
});

// ===== Sermons =====
const SERIES = ['Unshaken', 'The Way of Jesus', 'Psalms of Summer', 'Rooted'];
const SERMONS = [
  { title: 'When the Ground Shakes', series: 'Unshaken', speaker: 'James Whitfield', ref: 'Psalm 46', date: 'Nov 9', dur: '38:12', secs: 2292 },
  { title: 'An Anchor for the Soul', series: 'Unshaken', speaker: 'James Whitfield', ref: 'Hebrews 6:13-20', date: 'Nov 2', dur: '41:05', secs: 2465 },
  { title: 'Do Not Be Anxious', series: 'Unshaken', speaker: 'Maria Delgado', ref: 'Philippians 4:4-9', date: 'Oct 26', dur: '35:47', secs: 2147 },
  { title: 'Who Is My Neighbor?', series: 'The Way of Jesus', speaker: 'James Whitfield', ref: 'Luke 10:25-37', date: 'Oct 19', dur: '39:30', secs: 2370 },
  { title: 'Blessed Are the Poor in Spirit', series: 'The Way of Jesus', speaker: 'Maria Delgado', ref: 'Matthew 5:1-12', date: 'Oct 12', dur: '42:18', secs: 2538 },
  { title: 'Come to Me', series: 'The Way of Jesus', speaker: 'Ken Osei (guest)', ref: 'Matthew 11:28-30', date: 'Oct 5', dur: '33:55', secs: 2035 },
  { title: 'The Lord Is My Shepherd', series: 'Psalms of Summer', speaker: 'James Whitfield', ref: 'Psalm 23', date: 'Aug 24', dur: '36:40', secs: 2200 },
  { title: 'Search Me, O God', series: 'Psalms of Summer', speaker: 'Maria Delgado', ref: 'Psalm 139', date: 'Aug 17', dur: '37:22', secs: 2242 },
  { title: 'Walk in Him', series: 'Rooted', speaker: 'James Whitfield', ref: 'Colossians 2:6-7', date: 'Jun 8', dur: '40:02', secs: 2402 },
];
let activeSeries = 'All';
let query = '';

function renderFeatured() {
  const s = SERMONS[0];
  $('#featured').innerHTML = `
    <img src="img/bible.jpg" alt="">
    <div class="featured-info">
      <span class="kicker">Last Sunday · ${s.series}, part 4</span>
      <h3>${s.title}</h3>
      <p>${s.speaker} · ${s.ref} · ${s.dur}</p>
      <div class="featured-actions">
        <button class="btn btn-light" data-play="0">Listen</button>
        <button class="btn btn-outline-light" data-notes>Sermon notes</button>
      </div>
    </div>`;
}
function renderFilters() {
  $('#seriesFilters').innerHTML = ['All', ...SERIES].map((s) => `<button class="pill ${s === activeSeries ? 'active' : ''}" data-series="${s}">${s === 'All' ? 'All sermons' : s}</button>`).join('');
}
function renderSermons() {
  const q = query.toLowerCase();
  const list = SERMONS.map((s, i) => ({ ...s, i })).filter((s) =>
    (activeSeries === 'All' || s.series === activeSeries) &&
    (!q || [s.title, s.speaker, s.ref, s.series].join(' ').toLowerCase().includes(q)));
  $('#sermonList').innerHTML = list.length ? list.map((s) => {
    const on = playing && playing.i === s.i;
    return `<div class="sermon ${on ? 'playing' : ''}" data-play="${s.i}" role="button" tabindex="0">
      <span class="pbtn">${on && !paused ? '❚❚' : '▶'}</span>
      <div><h4>${s.title}</h4><small>${s.speaker} · ${s.date}</small></div>
      <span class="ref">${s.ref}</span>
      <span class="dur">${s.dur}</span>
    </div>`;
  }).join('') : `<p class="no-results">Nothing matches "${esc(query)}".</p>`;
}
$('#seriesFilters').addEventListener('click', (e) => {
  const b = e.target.closest('.pill'); if (!b) return;
  activeSeries = b.dataset.series; renderFilters(); renderSermons();
});
$('#sermonSearch').addEventListener('input', (e) => { query = e.target.value; renderSermons(); });

// ===== Player (simulated audio) =====
let playing = null, paused = false, pos = 0, timer = null;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function play(i) {
  if (playing && playing.i === i) return togglePause();
  const first = !playing;
  playing = { ...SERMONS[i], i }; pos = 0; paused = false;
  $('#pTitle').textContent = playing.title;
  $('#pMeta').textContent = `${playing.speaker} · ${playing.ref}`;
  $('#player').classList.add('show'); document.body.classList.add('player-open');
  clearInterval(timer);
  timer = setInterval(() => { if (!paused) { pos = Math.min(playing.secs, pos + 1); updatePlayer(); } }, 1000);
  updatePlayer(); renderSermons();
  if (first) toast('Demo: the player works, but there\'s no real audio file behind it.');
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
  if (e.target.closest('[data-notes]')) openModal(`<h3>When the Ground Shakes</h3><p class="muted">Psalm 46 · Notes</p>
    <ol style="padding-left:20px;display:grid;gap:8px"><li>God is a refuge, a place to run <em>to</em>, not just a way to escape.</li><li>"Be still" isn't telling you to stop feeling things. It's telling you to stop fighting.</li><li>Being unshaken doesn't mean you're unaffected. It means you're anchored to something.</li></ol>
    <p><strong>For your group this week:</strong> What are you trying to hold together on your own right now?</p>
    <div class="modal-actions"><button class="btn btn-dark" data-close>Close</button></div>`);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('.sermon')) play(Number(e.target.dataset.play));
  if (e.key === 'Escape') closeModal();
});

// ===== Events =====
function upcoming(offsetDays, hour, min) { const d = new Date(); d.setDate(d.getDate() + offsetDays); d.setHours(hour, min, 0, 0); return d; }
const EVENTS = [
  { id: 'e1', title: 'Community Thanksgiving Dinner', when: upcoming(4, 17, 30), where: 'Fellowship Hall', desc: 'Free dinner, open to anyone. We\'re cooking for 200, so bring a neighbor. If you can bring a pie, sign up at the welcome desk.', going: 142 },
  { id: 'e2', title: 'Newcomers Lunch', when: upcoming(7, 12, 30), where: 'Room 104', desc: 'Lunch with Pastor James and a few of our staff right after the 11am service. Childcare provided.', going: 18 },
  { id: 'e3', title: 'Christmas Choir Rehearsal', when: upcoming(10, 19, 0), where: 'Sanctuary', desc: 'No audition. If you can carry a tune (or want to try), come sing with us on Christmas Eve.', going: 36 },
  { id: 'e4', title: 'Food Pantry Serve Day', when: upcoming(12, 9, 0), where: 'Outreach Center, back of the building', desc: 'Sort and hand out groceries. Wear closed-toe shoes. We\'re usually done by noon.', going: 27 },
  { id: 'e5', title: 'Men\'s Breakfast', when: upcoming(15, 7, 30), where: 'Fellowship Hall', desc: 'Pancakes and a short talk from Darnell Brooks, who coaches football at Bayview High.', going: 51 },
  { id: 'e6', title: 'Christmas Eve Candlelight', when: upcoming(38, 17, 0), where: 'Sanctuary', desc: 'Services at 3, 5, and 7pm. Carols, the Christmas story, and candles. The 5pm fills up, so come early.', going: 318 },
].sort((a, b) => a.when - b.when);
let rsvps = store('gh_rsvps') || {};

function renderEvents() {
  $('#eventsList').innerHTML = EVENTS.map((ev) => {
    const r = rsvps[ev.id];
    return `
    <article class="event">
      <div class="date-box"><span>${ev.when.toLocaleDateString([], { month: 'short' })}</span><b>${ev.when.getDate()}</b></div>
      <div>
        <h3>${ev.title}</h3>
        <div class="meta">${ev.when.toLocaleDateString([], { weekday: 'long' })}, ${timeStr(ev.when)} · ${ev.where}</div>
        <p class="desc">${ev.desc}</p>
      </div>
      <div class="event-side">
        <button class="rsvp-btn ${r ? 'going' : ''}" data-rsvp="${ev.id}">${r ? `Going (${r})` : 'RSVP'}</button>
        <small>${ev.going + (r || 0)} going</small>
      </div>
    </article>`;
  }).join('');
}
$('#eventsList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-rsvp]'); if (!b) return;
  const ev = EVENTS.find((x) => x.id === b.dataset.rsvp);
  if (rsvps[ev.id]) {
    openModal(`<h3>Cancel your RSVP?</h3><p>${ev.title}</p>
      <div class="modal-actions"><button class="btn btn-plain" data-close>Never mind</button><button class="btn btn-dark" data-cancel="${ev.id}">Cancel RSVP</button></div>`);
    return;
  }
  openModal(`<h3>${ev.title}</h3>
    <p class="muted">${ev.when.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}, ${timeStr(ev.when)} · ${ev.where}</p>
    <form id="rsvpForm" class="form">
      <label>Name<input required name="name"></label>
      <label>Email<input required type="email" name="email"></label>
      <label>How many people?<select name="n">${[1, 2, 3, 4, 5, 6].map((n) => `<option>${n}</option>`).join('')}</select></label>
      <div class="modal-actions"><button type="button" class="btn btn-plain" data-close>Cancel</button><button class="btn btn-dark">RSVP</button></div>
    </form>`);
  $('#rsvpForm').onsubmit = (f) => {
    f.preventDefault();
    rsvps[ev.id] = Number(new FormData(f.target).get('n')); store('gh_rsvps', rsvps); renderEvents(); closeModal();
    toast(`You're on the list for ${ev.title}. We'll email you a reminder.`);
  };
});

// ===== Prayer wall =====
const WALL = [
  { id: 'p1', name: 'Linda', text: 'My husband Rob has surgery Thursday morning. Praying it goes smoothly and for peace for our family while we wait.', ago: '2 hours ago', count: 34 },
  { id: 'p2', name: 'Anonymous', text: 'I lost my job last week. Praying for a new door to open, and that I don\'t lose heart.', ago: '5 hours ago', count: 51 },
  { id: 'p3', name: 'The Okafors', text: 'Our adoption was finalized yesterday after two years! Thank you to everyone who prayed with us.', ago: 'Yesterday', count: 112 },
  { id: 'p4', name: 'Marcus', text: 'My son leaves for basic training next month. Pray for him, and honestly for his mom and me too.', ago: '2 days ago', count: 47 },
];
let prayed = store('gh_prayed') || {};
function renderWall() {
  $('#wall').innerHTML = WALL.map((p) => `
    <div class="req">
      <p>${esc(p.text)}</p>
      <div class="req-foot"><span>${esc(p.name)} · ${p.ago}</span>
        <button class="pray-btn ${prayed[p.id] ? 'prayed' : ''}" data-pray="${p.id}">${prayed[p.id] ? 'You prayed' : 'I prayed'} · ${p.count + (prayed[p.id] ? 1 : 0)}</button></div>
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
  if (!f.get('private')) { WALL.unshift({ id: 'u' + Date.now(), name, text: f.get('request'), ago: 'Just now', count: 0 }); renderWall(); }
  e.target.innerHTML = `<div class="success"><h3>Thank you${name !== 'Anonymous' ? ', ' + esc(name) : ''}.</h3>
    <p>${f.get('private') ? 'Your request went to the prayer team only.' : 'Your request is on the prayer wall.'}${f.get('contact') ? ' One of our pastors will call you in the next couple of days.' : ''}</p></div>`;
});

// ===== Give =====
let amount = 50, freq = 'once';
function updateGive() {
  const fee = $('#coverFees').checked ? Math.round(amount * 2.9) / 100 : 0;
  $('#giveBtn').textContent = amount > 0 ? `Give $${(amount + fee).toFixed(fee ? 2 : 0)}${freq === 'monthly' ? ' monthly' : ''}` : 'Enter an amount';
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
    if (fund === 'Kids wing') {
      const raised = 360000 + amount;
      $('#goalBar').style.width = Math.min(100, raised / 5000) + '%';
      $('#goalRaised').textContent = '$' + raised.toLocaleString();
    }
    e.target.innerHTML = `<div class="success"><h3>Thank you.</h3>
      <p>Your ${freq === 'monthly' ? 'monthly ' : ''}gift of $${amount.toLocaleString()} to the ${fund.toLowerCase()} went through. A receipt is on its way to your email.</p>
      <p class="muted small-text">Demo only. No money moved. A live site would hook into whatever giving platform the church already uses.</p></div>`;
  }, 1000);
});

$('#newsForm').addEventListener('submit', (e) => { e.preventDefault(); e.target.innerHTML = '<p>Thanks, you\'re signed up. It goes out Fridays.</p>'; });

// ===== Modal & toast =====
function openModal(html) { $('#modalCard').innerHTML = html; $('#modal').classList.add('show'); }
function closeModal() { $('#modal').classList.remove('show'); }
$('#modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal();
  const c = e.target.closest('[data-cancel]');
  if (c) { delete rsvps[c.dataset.cancel]; store('gh_rsvps', rsvps); renderEvents(); closeModal(); toast('Your RSVP was cancelled.'); }
});
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3200); }

renderFeatured(); renderFilters(); renderSermons(); renderEvents(); renderWall(); updateGive();
