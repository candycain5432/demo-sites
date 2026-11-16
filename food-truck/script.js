// ===== Data =====
const MENU = [
  { id: 'brisket', cat: 'Tacos', name: 'Smoked Brisket Taco', price: 5.5, emoji: '🌮', bg: '#ffe2c4', tag: 'Best seller', hot: true, desc: '14-hr post-oak brisket, pickled onion, cotija, salsa verde on a hand-pressed corn tortilla.', custom: true },
  { id: 'birria', cat: 'Tacos', name: 'Smoked Birria Taco', price: 5.75, emoji: '🌮', bg: '#ffd3c2', tag: 'Spicy', desc: 'Slow-braised beef, melty Oaxaca cheese, crispy griddled tortilla. Comes with consomé for dipping.', custom: true },
  { id: 'pork', cat: 'Tacos', name: 'Pulled Pork al Pastor', price: 4.75, emoji: '🌮', bg: '#fff0b8', desc: 'Smoked shoulder, charred pineapple, cilantro, onion, guajillo glaze.', custom: true },
  { id: 'veg', cat: 'Tacos', name: 'Fire-Roasted Veggie', price: 4.5, emoji: '🥑', bg: '#d9f2d0', tag: 'Vegan', desc: 'Charred poblano, sweet potato, black beans, avocado crema.', custom: true },
  { id: 'plate', cat: 'Plates', name: 'Pitmaster Plate', price: 16.5, emoji: '🍖', bg: '#ffd9c7', tag: 'Feeds 1 hungry', hot: true, desc: 'Half-pound brisket, two sides, tortillas, pickles and our house BBQ salsa.' },
  { id: 'bowl', cat: 'Plates', name: 'Burrito Bowl', price: 12.5, emoji: '🥗', bg: '#e1f3d8', desc: 'Cilantro-lime rice, beans, your choice of smoked meat, pico, queso fresco.' },
  { id: 'nachos', cat: 'Plates', name: 'Loaded Brisket Nachos', price: 13, emoji: '🧀', bg: '#fff1c2', desc: 'House chips, chopped brisket, queso, jalapeños, sour cream, pico.' },
  { id: 'elote', cat: 'Sides', name: 'Street Elote', price: 4.5, emoji: '🌽', bg: '#fff3b0', desc: 'Grilled corn, chipotle mayo, cotija, tajín, lime.' },
  { id: 'chips', cat: 'Sides', name: 'Chips & 3 Salsas', price: 5, emoji: '🌶️', bg: '#ffd6cc', desc: 'Roja, verde and our smoky habanero. Warning: the habanero bites.' },
  { id: 'beans', cat: 'Sides', name: 'Charro Beans', price: 3.75, emoji: '🫘', bg: '#efdccb', desc: 'Pinto beans simmered with brisket ends and bacon.' },
  { id: 'horchata', cat: 'Drinks', name: 'Horchata', price: 4, emoji: '🥛', bg: '#f6efe4', desc: 'Housemade with cinnamon and vanilla.' },
  { id: 'agua', cat: 'Drinks', name: 'Agua Fresca', price: 4, emoji: '🍉', bg: '#ffd9df', desc: 'Watermelon-lime or hibiscus. Ask what\'s fresh today!' },
  { id: 'soda', cat: 'Drinks', name: 'Mexican Coke', price: 3.25, emoji: '🥤', bg: '#e8e1db', desc: 'Real cane sugar, glass bottle.' },
  { id: 'churro', cat: 'Sweets', name: 'Churro Bites', price: 5.5, emoji: '🍩', bg: '#fbe1c3', tag: 'New', desc: 'Cinnamon sugar, warm cajeta dipping sauce.' },
];

const TACO_OPTIONS = {
  tortilla: { label: 'Tortilla', type: 'radio', choices: [['Corn (hand-pressed)', 0], ['Flour', 0], ['Lettuce wrap', 0]] },
  extras: { label: 'Add-ons', type: 'checkbox', choices: [['Extra meat', 2], ['Guacamole', 1.25], ['Queso', 1], ['Pickled jalapeños', 0.5]] },
};

const SCHEDULE = [
  { day: 'Sun', place: 'Brewer\'s Row', addr: '412 Mill St · in front of Hopworks', hours: '12 – 7 PM' },
  { day: 'Mon', off: true },
  { day: 'Tue', place: 'Downtown Plaza', addr: '1 Civic Center Dr · east side', hours: '11 AM – 3 PM' },
  { day: 'Wed', place: 'Tech Park', addr: '880 Innovation Way · lot C', hours: '11 AM – 2 PM' },
  { day: 'Thu', place: 'Riverside Park', addr: '200 River Rd · north lot by the splash pad', hours: '11 AM – 9 PM' },
  { day: 'Fri', place: 'Riverside Park', addr: '200 River Rd · north lot by the splash pad', hours: '11 AM – 9 PM' },
  { day: 'Sat', place: 'Farmers Market', addr: 'Oak & 5th · the original spot', hours: '9 AM – 2 PM' },
];

const TAX = 0.0825;
const $ = (s) => document.querySelector(s);
const money = (n) => '$' + n.toFixed(2);

// ===== State =====
let cart = load('ss_cart', []);
let activeCat = 'All';
let view = 'cart'; // cart | checkout | confirm
let pickup = 'ASAP';

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save() {
  try { localStorage.setItem('ss_cart', JSON.stringify(cart)); } catch {}
}

// ===== Menu =====
function renderTabs() {
  const cats = ['All', ...new Set(MENU.map((m) => m.cat))];
  $('#menuTabs').innerHTML = cats.map((c) => `<button class="tab ${c === activeCat ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('');
}
function renderMenu() {
  const items = MENU.filter((m) => activeCat === 'All' || m.cat === activeCat);
  $('#menuGrid').innerHTML = items.map((m, i) => `
    <article class="item" style="animation-delay:${i * 40}ms">
      <div class="item-art" style="background:${m.bg}">
        ${m.tag ? `<span class="item-tag ${m.hot ? 'hot' : ''}">${m.tag}</span>` : ''}${m.emoji}
      </div>
      <div class="item-body">
        <div class="item-top"><h3>${m.name}</h3><span class="price">${money(m.price)}</span></div>
        <p>${m.desc}</p>
        <button class="add-btn" data-id="${m.id}">+ Add${m.custom ? ' · customize' : ''}</button>
      </div>
    </article>`).join('');
}
$('#menuTabs').addEventListener('click', (e) => {
  const t = e.target.closest('.tab'); if (!t) return;
  activeCat = t.dataset.cat; renderTabs(); renderMenu();
});
$('#menuGrid').addEventListener('click', (e) => {
  const b = e.target.closest('.add-btn'); if (!b) return;
  const item = MENU.find((m) => m.id === b.dataset.id);
  if (item.custom) openCustomize(item); else addToCart(item, [], 1);
});

// ===== Customize modal =====
function openCustomize(item) {
  let qty = 1;
  const groups = Object.entries(TACO_OPTIONS).map(([key, g]) => `
    <div class="opt-group"><h4>${g.label}</h4>
      ${g.choices.map(([name, p], i) => `
        <label class="opt"><span><input type="${g.type}" name="${key}" value="${name}" data-price="${p}" ${g.type === 'radio' && i === 0 ? 'checked' : ''}>${name}</span><span>${p ? '+' + money(p) : ''}</span></label>`).join('')}
    </div>`).join('');
  $('#modalCard').innerHTML = `
    <div class="modal-art" style="background:${item.bg}">${item.emoji}<button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <div class="modal-body">
      <div class="item-top"><h3>${item.name}</h3><span class="price">${money(item.price)}</span></div>
      <p class="muted">${item.desc}</p>
      ${groups}
      <div class="modal-foot">
        <div class="qty"><button data-q="-1">−</button><span id="mq">1</span><button data-q="1">+</button></div>
        <button class="btn btn-primary" style="flex:1" id="modalAdd">Add · ${money(item.price)}</button>
      </div>
    </div>`;
  const card = $('#modalCard');
  const calc = () => {
    const opts = [...card.querySelectorAll('input:checked')];
    const unit = item.price + opts.reduce((s, o) => s + Number(o.dataset.price), 0);
    $('#modalAdd').textContent = `Add ${qty} · ${money(unit * qty)}`;
    return opts;
  };
  card.oninput = calc;
  card.onclick = (e) => {
    if (e.target.closest('[data-close]')) return closeModal();
    const q = e.target.closest('[data-q]');
    if (q) { qty = Math.max(1, qty + Number(q.dataset.q)); $('#mq').textContent = qty; calc(); }
    if (e.target.id === 'modalAdd') {
      const opts = calc().map((o) => ({ name: o.value, price: Number(o.dataset.price) }));
      addToCart(item, opts, qty); closeModal();
    }
  };
  $('#modal').classList.add('show');
}
function closeModal() { $('#modal').classList.remove('show'); }
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

// ===== Cart =====
function addToCart(item, opts, qty) {
  const key = item.id + '|' + opts.map((o) => o.name).join(',');
  const existing = cart.find((c) => c.key === key);
  if (existing) existing.qty += qty;
  else cart.push({ key, id: item.id, name: item.name, emoji: item.emoji, bg: item.bg, opts, unit: item.price + opts.reduce((s, o) => s + o.price, 0), qty });
  save(); updateCount();
  const btn = $('#cartBtn'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  toast(`Added ${qty}× ${item.name} 🔥`);
}
function updateCount() { $('#cartCount').textContent = cart.reduce((s, c) => s + c.qty, 0); }
function totals() {
  const sub = cart.reduce((s, c) => s + c.unit * c.qty, 0);
  const tax = sub * TAX;
  return { sub, tax, total: sub + tax };
}

function openDrawer() { if (view === 'confirm' && !currentOrder) view = 'cart'; renderDrawer(); $('#drawer').classList.add('open'); $('#overlay').classList.add('show'); }
function closeDrawer() { $('#drawer').classList.remove('open'); $('#overlay').classList.remove('show'); }
$('#cartBtn').onclick = openDrawer;
$('#closeDrawer').onclick = closeDrawer;
$('#overlay').onclick = closeDrawer;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDrawer(); closeModal(); } });

function renderDrawer() {
  const body = $('#drawerBody'), foot = $('#drawerFoot');
  if (view === 'confirm') return renderConfirm();
  if (!cart.length) {
    view = 'cart';
    $('#drawerTitle').textContent = 'Your Order';
    body.innerHTML = `<div class="empty"><div>🌮</div><p><strong>Your order is empty</strong></p><p>Add something delicious from the menu.</p></div>`;
    foot.innerHTML = `<a href="#menu" class="btn btn-primary btn-block" onclick="closeDrawer()">Browse the Menu</a>`;
    return;
  }
  const t = totals();
  const totalsHtml = `<div class="totals"><div><span>Subtotal</span><span>${money(t.sub)}</span></div><div><span>Tax</span><span>${money(t.tax)}</span></div><div class="grand"><span>Total</span><span>${money(t.total)}</span></div></div>`;

  if (view === 'cart') {
    $('#drawerTitle').textContent = 'Your Order';
    body.innerHTML = cart.map((c, i) => `
      <div class="line">
        <div class="line-art" style="background:${c.bg}">${c.emoji}</div>
        <div><h4>${c.name}</h4>${c.opts.length ? `<small>${c.opts.map((o) => o.name).join(' · ')}</small>` : ''}
          <div class="qty"><button data-i="${i}" data-d="-1" aria-label="Decrease">−</button><span>${c.qty}</span><button data-i="${i}" data-d="1" aria-label="Increase">+</button></div>
        </div>
        <div class="line-price">${money(c.unit * c.qty)}</div>
      </div>`).join('');
    foot.innerHTML = totalsHtml + `<button class="btn btn-primary btn-block" id="toCheckout">Checkout · ${money(t.total)}</button>`;
  } else {
    $('#drawerTitle').textContent = 'Checkout';
    const times = ['ASAP (~12 min)', '+30 min', '+45 min', '+1 hour'];
    body.innerHTML = `
      <form class="checkout-form" id="checkoutForm">
        <p class="section-label">Pickup at</p>
        <p><strong id="pickupSpot"></strong></p>
        <div class="pickup-times">${times.map((x) => `<button type="button" class="chip ${x.startsWith(pickup) ? 'active' : ''}" data-t="${x.split(' ')[0]}">${x}</button>`).join('')}</div>
        <p class="section-label">Your info</p>
        <label>Name for the order<input required name="name" placeholder="First name" autocomplete="given-name"></label>
        <label>Mobile number<input required name="phone" type="tel" placeholder="(555) 123-4567" autocomplete="tel"><small class="muted" style="font-weight:400">We'll text you when it's ready.</small></label>
        <label>Notes for the kitchen<input name="notes" placeholder="Allergies, extra napkins..."></label>
        <p class="section-label">Payment</p>
        <div class="pay-opts">
          <label class="pay-opt"><input type="radio" name="pay" value="card" checked> 💳 Pay now (Apple Pay, card)</label>
          <label class="pay-opt"><input type="radio" name="pay" value="window"> 🪟 Pay at the window</label>
        </div>
      </form>`;
    $('#pickupSpot').textContent = todaySpot().place ? `${todaySpot().place} — ${todaySpot().addr}` : 'Riverside Park — 200 River Rd';
    foot.innerHTML = totalsHtml + `<button class="btn btn-primary btn-block" id="placeOrder">Place Order · ${money(t.total)}</button><button class="btn btn-ghost btn-block" id="backToCart">← Back to cart</button>`;
  }
}

$('#drawer').addEventListener('click', (e) => {
  const q = e.target.closest('[data-d]');
  if (q) {
    const c = cart[q.dataset.i]; c.qty += Number(q.dataset.d);
    if (c.qty <= 0) cart.splice(q.dataset.i, 1);
    save(); updateCount(); renderDrawer();
  }
  const chip = e.target.closest('.chip');
  if (chip) { pickup = chip.dataset.t; document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === chip)); }
  if (e.target.id === 'toCheckout') { view = 'checkout'; renderDrawer(); }
  if (e.target.id === 'backToCart') { view = 'cart'; renderDrawer(); }
  if (e.target.id === 'placeOrder') placeOrder();
  if (e.target.id === 'newOrder') { currentOrder = null; view = 'cart'; renderDrawer(); closeDrawer(); }
});

// ===== Order + tracker =====
let currentOrder = null;
let trackerTimer = null;
function placeOrder() {
  const form = $('#checkoutForm');
  if (!form.reportValidity()) return;
  const btn = $('#placeOrder');
  btn.disabled = true; btn.textContent = 'Placing order…';
  setTimeout(() => {
    const data = new FormData(form);
    currentOrder = {
      no: 'SS-' + Math.floor(1000 + Math.random() * 9000),
      name: data.get('name'),
      total: totals().total,
      count: cart.reduce((s, c) => s + c.qty, 0),
      stage: 0,
      pickup,
    };
    cart = []; save(); updateCount();
    view = 'confirm'; renderDrawer();
    clearInterval(trackerTimer);
    trackerTimer = setInterval(() => {
      if (currentOrder.stage >= 3) return clearInterval(trackerTimer);
      currentOrder.stage++;
      if (view === 'confirm') renderConfirm();
      if (currentOrder.stage === 3) toast(`📲 "Hey ${currentOrder.name}, order ${currentOrder.no} is ready!"`);
    }, 3500);
  }, 900);
}
function renderConfirm() {
  const o = currentOrder;
  $('#drawerTitle').textContent = 'Order Placed';
  const steps = [['✓', 'Order received', 'We got it!'], ['🔥', 'On the grill', 'Your tacos are being made'], ['🛍️', 'Packing it up', 'Almost there'], ['✅', 'Ready for pickup', 'Head to the window']];
  $('#drawerBody').innerHTML = `
    <div class="confirm">
      <div class="big">${o.stage === 3 ? '🎉' : '👨‍🍳'}</div>
      <h3>${o.stage === 3 ? `It's ready, ${escapeHtml(o.name)}!` : `Thanks, ${escapeHtml(o.name)}!`}</h3>
      <div class="order-no">Order ${o.no}</div>
      <p class="muted">${o.count} item${o.count > 1 ? 's' : ''} · ${money(o.total)} · Pickup ${o.pickup === 'ASAP' ? 'ASAP' : o.pickup}</p>
    </div>
    <div class="tracker">${steps.map((s, i) => `
      <div class="step ${i < o.stage || o.stage === 3 ? 'done' : i === o.stage ? 'current' : ''}">
        <div class="ic">${i < o.stage || o.stage === 3 ? '✓' : s[0]}</div>
        <div><strong>${s[1]}</strong><br><small>${s[2]}</small></div>
      </div>`).join('')}
    </div>
    <p class="muted" style="font-size:13px;text-align:center">This is a demo — the tracker advances automatically to show how customers would see live updates.</p>`;
  $('#drawerFoot').innerHTML = `<button class="btn btn-ghost btn-block" id="newOrder">Done</button>`;
}

// ===== Schedule & live status =====
function todaySpot() { return SCHEDULE[new Date().getDay()]; }
function renderSchedule() {
  const today = new Date().getDay();
  $('#schedule').innerHTML = SCHEDULE.map((s, i) => `
    <div class="day ${i === today ? 'today' : ''} ${s.off ? 'off' : ''}">
      <h4>${s.day}${i === today ? ' · Today' : ''}</h4>
      ${s.off ? '<strong>Day off</strong><span>Resting the smoker</span>' : `<strong>${s.place}</strong><span>${s.hours}</span>`}
    </div>`).join('');
  const t = todaySpot();
  if (t.off) {
    $('#liveStatus').textContent = 'Closed today · back tomorrow at Downtown Plaza';
    document.querySelector('.live-pill .dot').classList.add('closed');
    $('#todayName').textContent = 'Today: Day off 😴';
    $('#todayAddr').textContent = 'Tomorrow: Downtown Plaza, 11 AM – 3 PM. Pre-orders open at 9 AM.';
  } else {
    $('#liveStatus').textContent = `Today at ${t.place} · ${t.hours}`;
    $('#todayName').textContent = `Today: ${t.place}`;
    $('#todayAddr').textContent = `${t.addr} · ${t.hours}`;
  }
}

// ===== Catering =====
const range = $('#guestRange');
function updateEstimate() {
  const g = Number(range.value);
  $('#guestOut').textContent = g;
  $('#estOut').textContent = '$' + Math.round(g * 15.5).toLocaleString();
}
range.addEventListener('input', updateEstimate);
$('#cateringForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = new FormData(e.target).get('name');
  e.target.innerHTML = `<div class="confirm"><div class="big">🎉</div><h3>Thanks, ${escapeHtml(name)}!</h3><p class="muted">We'll reply within 24 hours with a custom quote for your event.</p></div>`;
});

// ===== Misc =====
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
$('#menuToggle').onclick = () => $('#navLinks').classList.toggle('open');
$('#navLinks').addEventListener('click', (e) => { if (e.target.tagName === 'A') $('#navLinks').classList.remove('open'); });

renderTabs(); renderMenu(); renderSchedule(); updateEstimate(); updateCount();
