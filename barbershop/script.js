const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ===== Data =====
const SERVICES = [
  { id: 'cut', name: 'Haircut', price: 38, dur: 45, desc: 'Scissor or clipper cut, hot towel, shampoo, and style.', main: true },
  { id: 'fade', name: 'Skin fade', price: 42, dur: 45, desc: 'Finished with a straight-razor line-up.', main: true },
  { id: 'shave', name: 'Hot towel shave', price: 45, dur: 45, desc: 'Straight razor, hot towels, the whole thing.', main: true },
  { id: 'combo', name: 'Haircut + shave', price: 75, dur: 75, desc: 'Both of the above. Saves you $8.', main: true },
  { id: 'kids', name: 'Kids cut (12 and under)', price: 26, dur: 30, desc: 'Lollipop included.', main: true },
  { id: 'beard', name: 'Beard trim', price: 24, dur: 20, desc: 'Shape-up, line-up, hot towel, oil.', main: false },
  { id: 'brows', name: 'Eyebrows', price: 10, dur: 10, desc: 'Quick clean-up.', main: false },
  { id: 'scalp', name: 'Scalp scrub', price: 18, dur: 15, desc: 'Peppermint scrub and a few minutes of massage.', main: false },
];
const BARBERS = [
  { id: 'marcus', name: 'Marcus', role: 'Owner', img: 'marcus.jpg', bio: 'Opened the shop in 2014. Classic cuts, shaves, and the occasional lecture about conditioner.', days: [2, 3, 4, 5, 6] },
  { id: 'tony', name: 'Tony', role: 'Barber since 2016', img: 'tony.jpg', bio: 'Fades and kids cuts. Will talk your ear off about the Bears if you let him.', days: [2, 3, 4, 5, 6, 0] },
  { id: 'jay', name: 'Jay', role: 'Barber since 2020', img: 'jay.jpg', bio: 'Beards, curly hair, and textured cuts. Usually has the first opening of the day.', days: [3, 4, 5, 6, 0] },
  { id: 'ray', name: 'Ray', role: 'Barber since 1989', img: 'ray.jpg', bio: 'Semi-retired, works three days a week. Best straight-razor shave in the county.', days: [2, 4, 6] },
];
// day index -> [open, close] in minutes, null = closed
const HOURS = { 0: [600, 900], 1: null, 2: [540, 1140], 3: [540, 1140], 4: [540, 1200], 5: [540, 1200], 6: [480, 960] };
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const fmtTime = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const dateKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }

// Is barber free for a slot? (deterministic fake schedule ~45% booked)
function isFree(barberId, day, minute) {
  const b = BARBERS.find((x) => x.id === barberId);
  if (!b.days.includes(day.getDay())) return false;
  const now = new Date();
  if (dateKey(day) === dateKey(now) && minute <= now.getHours() * 60 + now.getMinutes() + 30) return false;
  return hash(barberId + dateKey(day) + minute) > 0.45;
}
function slotsFor(day, barberId, duration) {
  const hrs = HOURS[day.getDay()]; if (!hrs) return [];
  const out = [];
  for (let m = hrs[0]; m + duration <= hrs[1]; m += 30) {
    const ids = barberId === 'any' ? BARBERS.map((b) => b.id) : [barberId];
    const free = ids.filter((id) => isFree(id, day, m));
    out.push({ m, free });
  }
  return out;
}

// ===== Services list =====
$('#servicesList').innerHTML = SERVICES.map((s) => `
  <div class="svc">
    <h3>${s.name}</h3>
    <span class="price">$${s.price}</span>
    <p>${s.desc}</p>
    <span class="dur">${s.dur} min</span>
    <button class="svc-book" data-svc="${s.id}">${s.main ? 'Book this' : 'Add to booking'}</button>
  </div>`).join('');
$('#servicesList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-svc]'); if (!b) return;
  const svc = SERVICES.find((s) => s.id === b.dataset.svc);
  if (svc.main) state.main = svc.id; else if (!state.addons.includes(svc.id)) state.addons.push(svc.id);
  state.step = 1; render(); $('#book').scrollIntoView();
});

// ===== Team =====
$('#teamList').innerHTML = BARBERS.map((b) => `
  <div class="member">
    <img src="img/${b.img}" alt="${b.name}" loading="lazy">
    <h3>${b.name}</h3>
    <div class="role">${b.role}</div>
    <p>${b.bio}</p>
    <button data-barber="${b.id}">Book with ${b.name}</button>
  </div>`).join('');
$('#teamList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-barber]'); if (!b) return;
  state.barber = b.dataset.barber; state.date = null; state.time = null;
  state.step = state.main ? 3 : 1; render(); $('#book').scrollIntoView();
});

// ===== Booking wizard =====
const state = { step: 1, main: null, addons: [], barber: null, date: null, time: null, assigned: null };
const chosen = () => [state.main, ...state.addons].filter(Boolean).map((id) => SERVICES.find((s) => s.id === id));
const totalPrice = () => chosen().reduce((s, x) => s + x.price, 0);
const totalDur = () => chosen().reduce((s, x) => s + x.dur, 0);
const barberName = (id) => id === 'any' ? 'First available' : BARBERS.find((b) => b.id === id)?.name;

function render() {
  document.querySelectorAll('#steps li').forEach((li) => {
    const n = Number(li.dataset.step);
    li.classList.toggle('active', n === state.step);
    li.classList.toggle('done', n < state.step && state.step < 5);
  });
  const main = $('#bookingMain');
  main.style.animation = 'none'; void main.offsetWidth; main.style.animation = '';
  ({ 1: stepService, 2: stepBarber, 3: stepTime, 4: stepDetails, 5: stepDone })[state.step](main);
  renderSummary();
}

function stepService(el) {
  const pick = (s, multi) => {
    const sel = multi ? state.addons.includes(s.id) : state.main === s.id;
    return `<button class="pick ${multi ? '' : 'radio'} ${sel ? 'selected' : ''}" data-${multi ? 'addon' : 'main'}="${s.id}">
      <span class="check">${sel ? '✓' : ''}</span>
      <span><strong>${s.name}</strong><small>${s.desc}</small></span>
      <span class="pp">$${s.price}<small>${s.dur} min</small></span></button>`;
  };
  el.innerHTML = `<h3>What are you getting?</h3><p class="sub">Pick one, then add extras if you want.</p>
    <div class="pick-list">${SERVICES.filter((s) => s.main).map((s) => pick(s, false)).join('')}</div>
    <p class="sub-label">Extras</p>
    <div class="pick-list">${SERVICES.filter((s) => !s.main).map((s) => pick(s, true)).join('')}</div>
    <div class="booking-nav"><span></span><button class="btn btn-brass" data-next ${state.main ? '' : 'disabled'}>Next</button></div>`;
}

function stepBarber(el) {
  el.innerHTML = `<h3>Who do you want?</h3><p class="sub">Or pick "No preference" and we'll put you in the first open chair.</p>
    <div class="barber-picks">
      <button class="bpick ${state.barber === 'any' ? 'selected' : ''}" data-pick-barber="any"><div class="any">Whoever's free</div><strong>No preference</strong><small>Most openings</small></button>
      ${BARBERS.map((b) => `
      <button class="bpick ${state.barber === b.id ? 'selected' : ''}" data-pick-barber="${b.id}">
        <img src="img/${b.img}" alt=""><strong>${b.name}</strong><small>${b.role}</small>
      </button>`).join('')}</div>
    <div class="booking-nav"><button class="back" data-back>Back</button><button class="btn btn-brass" data-next ${state.barber ? '' : 'disabled'}>Next</button></div>`;
}

function stepTime(el) {
  const days = [];
  const d = new Date(); d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 21; i++) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  const avail = (day) => slotsFor(day, state.barber, totalDur()).some((s) => s.free.length);
  if (!state.date) { const first = days.find(avail); state.date = first ? dateKey(first) : null; }
  const day = state.date ? parseKey(state.date) : null;
  const slots = day ? slotsFor(day, state.barber, totalDur()) : [];
  const groups = [['Morning', (m) => m < 720], ['Afternoon', (m) => m >= 720 && m < 1020], ['Evening', (m) => m >= 1020]];
  const slotHtml = slots.some((s) => s.free.length)
    ? groups.map(([label, fn]) => {
      const g = slots.filter((s) => fn(s.m)); if (!g.length) return '';
      return `<p class="slot-group">${label}</p><div class="slots">${g.map((s) => `<button class="slot ${state.time === s.m ? 'selected' : ''}" data-time="${s.m}" ${s.free.length ? '' : 'disabled'}>${fmtTime(s.m)}</button>`).join('')}</div>`;
    }).join('')
    : `<p class="no-slots">Nothing open that day. Try another day${state.barber !== 'any' ? ' or go back and pick "No preference"' : ''}.</p>`;
  el.innerHTML = `<h3>Pick a time</h3><p class="sub">${totalDur()} minutes with ${state.barber === 'any' ? 'whoever is free' : barberName(state.barber)}. Grayed-out times are taken.</p>
    <div class="dates">${days.map((day) => {
      const ok = HOURS[day.getDay()] && avail(day);
      return `<button class="date ${state.date === dateKey(day) ? 'selected' : ''}" data-date="${dateKey(day)}" ${ok ? '' : 'disabled'} title="${ok ? '' : 'Unavailable'}">
        <span>${day.toLocaleDateString([], { weekday: 'short' })}</span><b>${day.getDate()}</b><span>${day.toLocaleDateString([], { month: 'short' })}</span></button>`;
    }).join('')}</div>
    ${slotHtml}
    <div class="booking-nav"><button class="back" data-back>Back</button><button class="btn btn-brass" data-next ${state.time != null ? '' : 'disabled'}>Next</button></div>`;
}

function stepDetails(el) {
  el.innerHTML = `<h3>Your info</h3><p class="sub">So we can text you a confirmation.</p>
    <form class="form" id="detailsForm">
      <div class="row">
        <label>First name<input required name="first" autocomplete="given-name"></label>
        <label>Last name<input required name="last" autocomplete="family-name"></label>
      </div>
      <div class="row">
        <label>Mobile<input required type="tel" name="phone" autocomplete="tel"></label>
        <label>Email<input required type="email" name="email" autocomplete="email"></label>
      </div>
      <label>Notes for your barber (optional)<textarea name="notes" rows="2" placeholder="e.g. growing it out, bringing a photo"></textarea></label>
      <label class="check"><input type="checkbox" name="sms" checked> Text me a reminder the day before</label>
      <label class="check"><input type="checkbox" name="first_visit"> First time here</label>
      <div class="booking-nav"><button type="button" class="back" data-back>Back</button><button class="btn btn-brass" id="confirmBtn">Book it</button></div>
    </form>`;
  $('#detailsForm').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const btn = $('#confirmBtn'); btn.disabled = true; btn.textContent = 'Booking…';
    setTimeout(() => {
      const day = parseKey(state.date);
      const barber = state.barber === 'any'
        ? slotsFor(day, 'any', totalDur()).find((s) => s.m === state.time).free[0]
        : state.barber;
      const booking = {
        code: 'OI-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
        name: f.get('first'), services: chosen().map((s) => s.name), price: totalPrice(), dur: totalDur(),
        barber, date: state.date, time: state.time, firstVisit: !!f.get('first_visit'),
      };
      store.set('oi_booking', booking);
      state.booking = booking; state.step = 5; render(); updateApptLink();
    }, 900);
  };
}

function stepDone(el) {
  const b = state.booking; const day = parseKey(b.date);
  el.innerHTML = `<div class="confirm">
    <h3>See you ${day.toLocaleDateString([], { weekday: 'long' })}, ${esc(b.name)}.</h3>
    <p>We texted a confirmation to your phone. Your confirmation number is ${b.code}.</p>
    <div class="ticket">
      <div class="sum-row"><span>When</span><span>${day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}, ${fmtTime(b.time)}</span></div>
      <div class="sum-row"><span>Barber</span><span>${barberName(b.barber)}</span></div>
      <div class="sum-row"><span>Service</span><span>${b.services.join(' + ')}</span></div>
      <div class="sum-row"><span>Total</span><span>$${b.price}, pay at the shop</span></div>
    </div>
    ${b.firstVisit ? '<p style="margin-bottom:18px">First time? Your first drink is on us.</p>' : ''}
    <div class="confirm-actions">
      <button class="btn btn-brass btn-sm" data-ics>Add to calendar</button>
      <button class="btn btn-line btn-sm" data-restart>Book another</button>
    </div></div>`;
}

function renderSummary() {
  const s = chosen();
  const day = state.date ? parseKey(state.date) : null;
  $('#summary').innerHTML = `<h4>Your appointment</h4>
    ${s.length ? s.map((x) => `<div class="sum-row"><span>${x.name}</span><span>$${x.price}</span></div>`).join('') : '<p class="sum-empty">Nothing picked yet</p>'}
    ${state.barber ? `<div class="sum-row"><span>Barber</span><span>${barberName(state.barber)}</span></div>` : ''}
    ${day && state.step >= 3 ? `<div class="sum-row"><span>Date</span><span>${day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>` : ''}
    ${state.time != null ? `<div class="sum-row"><span>Time</span><span>${fmtTime(state.time)}</span></div>` : ''}
    ${s.length ? `<div class="sum-row"><span>Duration</span><span>${totalDur()} min</span></div><div class="sum-total"><span>Total</span><span>$${totalPrice()}</span></div>` : ''}
    <p class="sum-note">You pay at the shop. Cancel up to 2 hours ahead, no charge.</p>`;
}

$('#book').addEventListener('click', (e) => {
  const t = e.target;
  const m = t.closest('[data-main]');
  if (m) { state.main = m.dataset.main; render(); }
  const a = t.closest('[data-addon]');
  if (a) { const id = a.dataset.addon; state.addons = state.addons.includes(id) ? state.addons.filter((x) => x !== id) : [...state.addons, id]; state.time = null; render(); }
  const bp = t.closest('[data-pick-barber]');
  if (bp) { state.barber = bp.dataset.pickBarber; state.date = null; state.time = null; render(); }
  const d = t.closest('[data-date]');
  if (d && !d.disabled) { state.date = d.dataset.date; state.time = null; render(); }
  const tm = t.closest('[data-time]');
  if (tm && !tm.disabled) { state.time = Number(tm.dataset.time); render(); }
  if (t.closest('[data-next]')) { state.step++; render(); scrollToBooking(); }
  if (t.closest('[data-back]')) { state.step--; render(); }
  const li = t.closest('#steps li.done');
  if (li) { state.step = Number(li.dataset.step); render(); }
  if (t.closest('[data-ics]')) downloadIcs(state.booking);
  if (t.closest('[data-restart]')) { Object.assign(state, { step: 1, main: null, addons: [], barber: null, date: null, time: null }); render(); }
});
function scrollToBooking() {
  const top = $('.booking').getBoundingClientRect().top;
  if (top < 0) window.scrollTo({ top: window.scrollY + top - 90, behavior: 'smooth' });
}

// ===== Calendar file =====
function downloadIcs(b) {
  const start = parseKey(b.date); start.setMinutes(b.time);
  const end = new Date(start.getTime() + b.dur * 60000);
  const f = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Oak & Iron//Booking//EN', 'BEGIN:VEVENT', `UID:${b.code}@oakandiron.example`,
    `DTSTART:${f(start)}`, `DTEND:${f(end)}`, `SUMMARY:${b.services.join(' + ')} with ${barberName(b.barber)}`,
    'LOCATION:Oak & Iron Barber Co.\\, 218 Main St\\, Millbrook', `DESCRIPTION:Confirmation ${b.code}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'oak-and-iron-appointment.ics' });
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ===== Manage existing appointment =====
function updateApptLink() {
  const b = store.get('oi_booking');
  const valid = b && parseKey(b.date) >= new Date(new Date().setHours(0, 0, 0, 0));
  if (b && !valid) store.set('oi_booking', null);
  $('#myApptLink').classList.toggle('hidden', !valid);
  if (valid) {
    $('#nextAvail').innerHTML = `Your appointment: <strong>${parseKey(b.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${fmtTime(b.time)}</strong>`;
  } else showNextAvailable();
}
$('#myApptLink').onclick = (e) => {
  e.preventDefault(); $('#navLinks').classList.remove('open');
  const b = store.get('oi_booking'); if (!b) return;
  const day = parseKey(b.date);
  openModal(`<h3>Your appointment</h3>
    <div class="ticket" style="margin:0">
      <div class="sum-row"><span>Confirmation</span><span>${b.code}</span></div>
      <div class="sum-row"><span>When</span><span>${day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${fmtTime(b.time)}</span></div>
      <div class="sum-row"><span>Barber</span><span>${barberName(b.barber)}</span></div>
      <div class="sum-row"><span>Service</span><span>${b.services.join(' + ')}</span></div>
    </div>
    <div class="modal-actions"><button class="btn btn-line btn-sm" data-cancel-appt>Cancel it</button><button class="btn btn-brass btn-sm" data-close>Keep it</button></div>`);
};

function showNextAvailable() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    for (const b of BARBERS) {
      const slot = slotsFor(d, b.id, 45).find((s) => s.free.length);
      if (slot) {
        const label = i === 0 ? 'today' : i === 1 ? 'tomorrow' : DAY_NAMES[d.getDay()];
        $('#nextAvailText').textContent = `${label} at ${fmtTime(slot.m)}`;
        return;
      }
    }
    d.setDate(d.getDate() + 1);
  }
}

// ===== Hours / open status =====
(function hours() {
  const now = new Date(); const today = now.getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  $('#hoursTable').innerHTML = order.map((d) => `<tr class="${d === today ? 'today' : ''}"><td>${DAY_NAMES[d]}</td><td>${HOURS[d] ? `${fmtTime(HOURS[d][0])} – ${fmtTime(HOURS[d][1])}` : 'Closed'}</td></tr>`).join('');
  const mins = now.getHours() * 60 + now.getMinutes(); const h = HOURS[today];
  const el = $('#openStatus');
  if (h && mins >= h[0] && mins < h[1]) { el.className = 'open-status open'; el.textContent = `Open now, until ${fmtTime(h[1])}`; }
  else { el.className = 'open-status closed'; el.textContent = 'Closed right now. You can still book online.'; }
})();

// ===== Membership =====
document.querySelector('.plans').addEventListener('click', (e) => {
  const b = e.target.closest('[data-join]'); if (!b) return;
  openModal(`<h3>${b.dataset.join} membership</h3><p>Billed monthly. Cancel whenever. It starts with your next visit.</p>
    <form class="form" id="joinForm"><label>Name<input required></label><label>Email<input type="email" required></label>
    <div class="modal-actions"><button type="button" class="btn btn-line btn-sm" data-close>Not now</button><button class="btn btn-brass btn-sm">Continue to payment</button></div></form>`);
  $('#joinForm').onsubmit = (ev) => { ev.preventDefault(); closeModal(); toast('Demo only. A live site would go to Square or Stripe here.'); };
});

// ===== Modal / toast / nav =====
function openModal(html) { $('#modalCard').innerHTML = html; $('#modal').classList.add('show'); }
function closeModal() { $('#modal').classList.remove('show'); }
$('#modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal();
  if (e.target.closest('[data-cancel-appt]')) { store.set('oi_booking', null); updateApptLink(); closeModal(); toast('Cancelled. Hope to see you soon.'); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3200); }
$('#menuToggle').onclick = () => $('#navLinks').classList.toggle('open');
$('#navLinks').addEventListener('click', (e) => { if (e.target.tagName === 'A' && e.target.id !== 'myApptLink') $('#navLinks').classList.remove('open'); });

render(); updateApptLink();
