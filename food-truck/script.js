// ===== Data =====
const MENU = [
  { id: 'brisket', cat: 'Tacos', name: 'Brisket Taco', price: 5.5, img: 'brisket-taco.jpg', note: 'Most ordered', desc: 'Chopped brisket, pickled onion, cilantro, salsa verde, corn tortilla.', custom: true },
  { id: 'birria', cat: 'Tacos', name: 'Birria Taco', price: 5.75, img: 'birria.jpg', desc: 'Braised beef and Oaxaca cheese, griddled crispy. Comes with a cup of consomé.', custom: true },
  { id: 'pork', cat: 'Tacos', name: 'Smoked Pork al Pastor', price: 4.75, img: 'pastor.jpg', desc: 'Pork shoulder, charred pineapple, onion, guajillo glaze.', custom: true },
  { id: 'shrimp', cat: 'Tacos', name: 'Chipotle Shrimp Taco', price: 6, img: 'shrimp.jpg', note: 'Fridays only', desc: 'Grilled shrimp, avocado, slaw, chipotle crema, flour tortilla.', custom: true },
  { id: 'plate', cat: 'Plates', name: 'Brisket Plate', price: 16.5, img: 'brisket-plate.jpg', desc: 'Half pound of sliced brisket, two sides, tortillas, pickles.' },
  { id: 'ribs', cat: 'Plates', name: 'Half Rack of Ribs', price: 18, img: 'ribs.jpg', note: 'Sells out by 6', desc: 'Pork spare ribs, ancho rub, one side. We only make so many.' },
  { id: 'burrito', cat: 'Plates', name: 'Brisket Burrito', price: 12.5, img: 'burrito.jpg', desc: 'Brisket, rice, charro beans, cheese, slaw. Big enough to split, but you won\'t.' },
  { id: 'nachos', cat: 'Plates', name: 'Brisket Nachos', price: 13, img: 'nachos.jpg', desc: 'House chips, chopped brisket, queso, jalapeños, crema, pico.' },
];
const SIDES = [
  { id: 'elote', name: 'Street corn', price: 4.5, desc: 'Chipotle mayo, cotija, tajín' },
  { id: 'chips', name: 'Chips & salsa', price: 5, desc: 'Roja, verde, and habanero (careful)' },
  { id: 'beans', name: 'Charro beans', price: 3.75, desc: 'Cooked with brisket ends and bacon' },
  { id: 'slaw', name: 'Lime slaw', price: 3.25, desc: 'Cabbage, cilantro, lime, a little jalapeño' },
];
const DRINKS = [
  { id: 'horchata', name: 'Horchata', price: 4, desc: 'Ana\'s recipe' },
  { id: 'agua', name: 'Agua fresca', price: 4, desc: 'Watermelon or hibiscus, depends on the day' },
  { id: 'soda', name: 'Mexican Coke', price: 3.25, desc: 'Glass bottle' },
  { id: 'churro', name: 'Churro bites', price: 5.5, desc: 'With cajeta for dipping' },
];
const ALL = [...MENU, ...SIDES, ...DRINKS];

const TACO_OPTIONS = {
  tortilla: { label: 'Tortilla', type: 'radio', choices: [['Corn', 0], ['Flour', 0]] },
  extras: { label: 'Extras', type: 'checkbox', choices: [['Extra meat', 2], ['Guacamole', 1.25], ['Queso', 1], ['Pickled jalapeños', 0.5]] },
};

const SCHEDULE = [
  { day: 'Sun', place: 'Brewer\'s Row', addr: 'Outside Hopworks, 412 Mill St', hours: '12 – 7pm' },
  { day: 'Mon', off: true },
  { day: 'Tue', place: 'Downtown Plaza', addr: 'East side of the courthouse', hours: '11am – 3pm' },
  { day: 'Wed', place: 'Tech Park', addr: 'Lot C, 880 Innovation Way', hours: '11am – 2pm' },
  { day: 'Thu', place: 'Riverside Park', addr: 'North lot by the splash pad', hours: '11am – 9pm' },
  { day: 'Fri', place: 'Riverside Park', addr: 'North lot by the splash pad', hours: '11am – 9pm' },
  { day: 'Sat', place: 'Farmers Market', addr: 'Oak & 5th, our original spot', hours: '9am – 2pm' },
];

const TAX = 0.0825;
const $ = (s) => document.querySelector(s);
const money = (n) => '$' + n.toFixed(2);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ===== State =====
let cart = load('ss_cart', []);
let activeCat = 'Everything';
let view = 'cart';
let pickup = 'ASAP';
let currentOrder = null;
let trackerTimer = null;

function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save() { try { localStorage.setItem('ss_cart', JSON.stringify(cart)); } catch {} }

// ===== Menu =====
function renderTabs() {
  const cats = ['Everything', 'Tacos', 'Plates'];
  $('#menuTabs').innerHTML = cats.map((c) => `<button class="tab ${c === activeCat ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('');
}
function renderMenu() {
  const items = MENU.filter((m) => activeCat === 'Everything' || m.cat === activeCat);
  $('#menuGrid').innerHTML = items.map((m) => `
    <article class="item">
      <img src="img/${m.img}" alt="${m.name}" loading="lazy">
      <div class="item-top"><h3>${m.name}</h3><span class="price">${money(m.price)}</span></div>
      <p>${m.note ? `<span class="note">${m.note}.</span> ` : ''}${m.desc}</p>
      <button class="add-btn" data-id="${m.id}">Add to order</button>
    </article>`).join('');
}
function renderBoard() {
  const li = (x) => `<li><span>${x.name}<small>${x.desc}</small></span><span>${money(x.price)}</span><button data-id="${x.id}" aria-label="Add ${x.name}">Add</button></li>`;
  $('#sidesList').innerHTML = SIDES.map(li).join('');
  $('#drinksList').innerHTML = DRINKS.map(li).join('');
}
$('#menuTabs').addEventListener('click', (e) => {
  const t = e.target.closest('.tab'); if (!t) return;
  activeCat = t.dataset.cat; renderTabs(); renderMenu();
});
$('#menu').addEventListener('click', (e) => {
  const b = e.target.closest('[data-id]'); if (!b || b.closest('#menuTabs')) return;
  const item = ALL.find((m) => m.id === b.dataset.id);
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
    <img src="img/${item.img}" alt="">
    <div class="modal-body">
      <div class="item-top"><h3>${item.name}</h3><button class="icon-btn" data-close aria-label="Close">✕</button></div>
      <p class="muted">${item.desc}</p>
      ${groups}
      <div class="modal-foot">
        <div class="qty"><button data-q="-1" aria-label="Fewer">−</button><span id="mq">1</span><button data-q="1" aria-label="More">+</button></div>
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
      const opts = calc().filter((o) => o.name !== 'tortilla' || o.value !== 'Corn').map((o) => ({ name: o.value, price: Number(o.dataset.price) }));
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
  else cart.push({ key, id: item.id, name: item.name, img: item.img || null, opts, unit: item.price + opts.reduce((s, o) => s + o.price, 0), qty });
  save(); updateCount();
  const btn = $('#cartBtn'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  toast(`Added ${qty > 1 ? qty + ' × ' : ''}${item.name}`);
}
function updateCount() { $('#cartCount').textContent = cart.reduce((s, c) => s + c.qty, 0); }
function totals() {
  const sub = cart.reduce((s, c) => s + c.unit * c.qty, 0);
  return { sub, tax: sub * TAX, total: sub * (1 + TAX) };
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
    $('#drawerTitle').textContent = 'Your order';
    body.innerHTML = `<p class="empty">Nothing in here yet.</p>`;
    foot.innerHTML = `<a href="#menu" class="btn btn-primary btn-block" onclick="closeDrawer()">See the menu</a>`;
    return;
  }
  const t = totals();
  const totalsHtml = `<div class="totals"><div><span>Subtotal</span><span>${money(t.sub)}</span></div><div><span>Tax</span><span>${money(t.tax)}</span></div><div class="grand"><span>Total</span><span>${money(t.total)}</span></div></div>`;

  if (view === 'cart') {
    $('#drawerTitle').textContent = 'Your order';
    body.innerHTML = cart.map((c, i) => `
      <div class="line">
        ${c.img ? `<img src="img/${c.img}" alt="">` : `<div class="ph">${c.name[0]}</div>`}
        <div><h4>${c.name}</h4>${c.opts.length ? `<small>${c.opts.map((o) => o.name).join(', ')}</small>` : ''}
          <div class="qty"><button data-i="${i}" data-d="-1" aria-label="Decrease">−</button><span>${c.qty}</span><button data-i="${i}" data-d="1" aria-label="Increase">+</button></div>
        </div>
        <div>${money(c.unit * c.qty)}</div>
      </div>`).join('');
    foot.innerHTML = totalsHtml + `<button class="btn btn-primary btn-block" id="toCheckout">Checkout</button>`;
  } else {
    $('#drawerTitle').textContent = 'Checkout';
    const times = [['ASAP', 'ASAP (about 12 min)'], ['+30', 'In 30 min'], ['+45', 'In 45 min'], ['+60', 'In an hour']];
    const spot = todaySpot().off ? SCHEDULE[2] : todaySpot();
    body.innerHTML = `
      <form class="checkout-form" id="checkoutForm">
        <p class="section-label">Pickup</p>
        <p>${spot.place}, ${spot.addr}</p>
        <div class="pickup-times">${times.map(([k, label]) => `<button type="button" class="chip ${k === pickup ? 'active' : ''}" data-t="${k}">${label}</button>`).join('')}</div>
        <label>Name for the order<input required name="name" autocomplete="given-name"></label>
        <label>Phone (we text you when it's ready)<input required name="phone" type="tel" autocomplete="tel"></label>
        <label>Notes<input name="notes" placeholder="Allergies, no onions, etc."></label>
        <p class="section-label">Payment</p>
        <div class="pay-opts">
          <label class="pay-opt"><input type="radio" name="pay" value="card" checked> Pay now with card or Apple Pay</label>
          <label class="pay-opt"><input type="radio" name="pay" value="window"> Pay at the window</label>
        </div>
      </form>`;
    foot.innerHTML = totalsHtml + `<button class="btn btn-primary btn-block" id="placeOrder">Place order · ${money(t.total)}</button><button class="btn btn-ghost btn-block" id="backToCart">Back</button>`;
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
function placeOrder() {
  const form = $('#checkoutForm');
  if (!form.reportValidity()) return;
  const btn = $('#placeOrder');
  btn.disabled = true; btn.textContent = 'Sending…';
  setTimeout(() => {
    const data = new FormData(form);
    currentOrder = { no: Math.floor(100 + Math.random() * 900), name: data.get('name'), total: totals().total, count: cart.reduce((s, c) => s + c.qty, 0), stage: 0, pickup };
    cart = []; save(); updateCount();
    view = 'confirm'; renderDrawer();
    clearInterval(trackerTimer);
    trackerTimer = setInterval(() => {
      if (currentOrder.stage >= 3) return clearInterval(trackerTimer);
      currentOrder.stage++;
      if (view === 'confirm') renderConfirm();
      if (currentOrder.stage === 3) toast(`Text sent: "${currentOrder.name}, order #${currentOrder.no} is ready at the window"`);
    }, 3500);
  }, 800);
}
function renderConfirm() {
  const o = currentOrder;
  $('#drawerTitle').textContent = `Order #${o.no}`;
  const steps = [['Got it', 'Your order is in the queue'], ['Cooking', 'On the flat top now'], ['Bagging it up', 'Almost there'], ['Ready', 'Come to the window and give your name']];
  $('#drawerBody').innerHTML = `
    <div class="confirm">
      <h3>${o.stage === 3 ? `It's ready, ${esc(o.name)}.` : `Thanks, ${esc(o.name)}.`}</h3>
      <p class="muted">${o.count} item${o.count > 1 ? 's' : ''}, ${money(o.total)}. Pickup ${o.pickup === 'ASAP' ? 'ASAP' : 'in ' + o.pickup.slice(1) + ' min'}.</p>
    </div>
    <div class="tracker">${steps.map((s, i) => `
      <div class="step ${i < o.stage || o.stage === 3 ? 'done' : i === o.stage ? 'current' : ''}">
        <div class="ic">${i < o.stage || o.stage === 3 ? '✓' : ''}</div>
        <div><strong>${s[0]}</strong><br><small>${s[1]}</small></div>
      </div>`).join('')}
    </div>
    <p class="muted" style="font-size:13px">Demo note: this tracker moves on its own so you can see what customers would see.</p>`;
  $('#drawerFoot').innerHTML = `<button class="btn btn-ghost btn-block" id="newOrder">Close</button>`;
}

// ===== Schedule =====
function todaySpot() { return SCHEDULE[new Date().getDay()]; }
function renderSchedule() {
  const today = new Date().getDay();
  const order = [0, 1, 2, 3, 4, 5, 6].map((n) => (today + n) % 7);
  $('#schedule').innerHTML = order.map((i) => {
    const s = SCHEDULE[i];
    return `<tr class="${i === today ? 'today' : ''} ${s.off ? 'off' : ''}">
      <td>${i === today ? 'Today' : s.day}</td>
      <td>${s.off ? 'Closed' : `${s.place}<small>${s.addr}</small>`}</td>
      <td>${s.off ? '' : s.hours}</td></tr>`;
  }).join('');
  const t = todaySpot();
  const el = $('#liveStatus');
  if (t.off) { el.textContent = 'Closed today. Back tomorrow at Downtown Plaza.'; el.classList.add('closed'); }
  else el.textContent = `Today: ${t.place}, ${t.hours}`;
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
  e.target.innerHTML = `<h3>Thanks, ${esc(name)}.</h3><p>We'll check the calendar and get back to you within a day or so.</p>`;
});

// ===== Misc =====
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
$('#menuToggle').onclick = () => $('#navLinks').classList.toggle('open');
$('#navLinks').addEventListener('click', (e) => { if (e.target.tagName === 'A') $('#navLinks').classList.remove('open'); });

renderTabs(); renderMenu(); renderBoard(); renderSchedule(); updateEstimate(); updateCount();
