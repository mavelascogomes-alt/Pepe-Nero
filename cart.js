(() => {
  'use strict';
  const key = 'pepenero.cart.v1';
  const maxQuantity = 99;
  const catalog = new Map();
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const currency = cents => money.format(cents / 100);
  const dialog = document.querySelector('#cart-dialog');
  const toggle = document.querySelector('#cart-toggle');
  const list = document.querySelector('#cart-items');
  const empty = document.querySelector('#cart-empty');
  const status = document.querySelector('#cart-status');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let orderFlow = null;
  const pizzaDialog = document.querySelector('#pizza-dialog');
  const pizzaForm = document.querySelector('#pizza-form');
  let pizzaReturnFocus = null;
  const flights = new Set();
  const buttonFeedback = new WeakMap();
  let noticeTimer;
  let closeTimer;
  let closing = false;
  let returnFocus = toggle;

  document.querySelectorAll('.dish[data-product]').forEach(card => {
    const price = card.querySelector('.dish__heading span').textContent.match(/(\d[\d.]*)\s*,\s*(\d{2})/);
    if (!price) return;
    const cents = Number(price[1].replaceAll('.', '')) * 100 + Number(price[2]);
    if (!Number.isSafeInteger(cents) || cents < 0) return;
    const image = card.querySelector('.dish__image');
    const thumbnail = image?.getAttribute('srcset')?.split(',')[0].trim().split(' ')[0] || image?.getAttribute('src');
    catalog.set(card.dataset.product, {
      id: card.dataset.product,
      name: card.querySelector('h3').textContent.trim(),
      price: cents,
      image: thumbnail || 'assets/optimized/pizza-400.jpg',
      pizza: Boolean(card.closest('.specialties--pizzas')),
      drink: Boolean(card.closest('.specialties--drinks'))
    });
  });

  function resolveProduct(id) {
    if (catalog.has(id)) return catalog.get(id);
    if (typeof id !== 'string' || !id.startsWith('pizza-half:')) return null;
    const halves = id.slice(11).split('+');
    if (halves.length !== 2 || halves[0] === halves[1] || halves.join('+') !== [...halves].sort().join('+')) return null;
    const products = halves.map(half => catalog.get(half));
    if (!products.every(product => product?.pizza && product.price !== null)) return null;
    const product = { id, name: `Pizza meio a meio — ½ ${products[0].name} + ½ ${products[1].name}`, halves: products.map(product => product.name), price: null, image: 'assets/optimized/pizza-400.jpg', pizza: true };
    catalog.set(id, product); return product;
  }
  function totals() {
    let count = 0, total = 0, hasConsult = false;
    for (const [id, quantity] of items) {
      const product = resolveProduct(id);
      count += quantity;
      if (product.price === null) hasConsult = true;
      else total += quantity * product.price;
    }
    return { count, total, hasConsult };
  }
  function totalLabel(value) {
    return value.hasConsult ? (value.total ? `${currency(value.total)} + a consultar` : 'A consultar') : currency(value.total);
  }

  function read() {
    const restored = new Map();
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved?.version !== 1 || !Array.isArray(saved.items)) return restored;
      for (const item of saved.items) {
        if (!item || !resolveProduct(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > maxQuantity) continue;
        restored.set(item.id, Math.min(maxQuantity, (restored.get(item.id) || 0) + item.quantity));
      }
    } catch { /* The cart also works in memory when browser storage is unavailable. */ }
    return restored;
  }
  let items = read();
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify({ version: 1, items: [...items].map(([id, quantity]) => ({ id, quantity })) }));
    } catch { /* Keep the current order usable even without persistent storage. */ }
  }
  function announce(text) {
    clearTimeout(noticeTimer);
    status.textContent = text;
    document.querySelector('#cart-dialog-status').textContent = text;
    if (!motion.matches && !dialog.open) {
      status.getAnimations().forEach(animation => animation.cancel());
      status.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' });
    }
    noticeTimer = setTimeout(() => { status.textContent = ''; }, 3500);
  }
  function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function control(action, id, label, text) {
    const button = el('button', '', text);
    button.type = 'button';
    button.dataset.action = action;
    button.dataset.id = id;
    button.setAttribute('aria-label', label);
    return button;
  }
  function pulse(element, keyframes, duration) {
    if (motion.matches) return;
    element.getAnimations().forEach(animation => animation.cancel());
    element.animate(keyframes, { duration, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  function additionFeedback(button, product) {
    let feedback = buttonFeedback.get(button);
    if (!feedback) {
      feedback = { label: button.firstChild.textContent, icon: button.querySelector('span').textContent };
      buttonFeedback.set(button, feedback);
    }
    clearTimeout(feedback.timer);
    button.firstChild.textContent = 'Adicionado ';
    button.querySelector('span').textContent = '✓';
    button.classList.add('is-added');
    feedback.timer = setTimeout(() => {
      button.firstChild.textContent = feedback.label;
      button.querySelector('span').textContent = feedback.icon;
      button.classList.remove('is-added');
    }, 1400);
    if (motion.matches) return;
    pulse(button, [{ transform: 'scale(.97)' }, { transform: 'scale(1)' }], 280);
    pulse(document.querySelector('#cart-count'), [{ transform: 'scale(1)' }, { transform: 'scale(1.3)', offset: .35 }, { transform: 'scale(1)' }], 420);
    // A small thumbnail travels to the bag without shifting the product layout.
    if (flights.size >= 4) {
      const oldest = flights.values().next().value;
      oldest.getAnimations().forEach(animation => animation.cancel());
      oldest.remove(); flights.delete(oldest);
    }
    const buttonRect = button.getBoundingClientRect();
    const source = button.closest('.dish')?.querySelector('.dish__image')?.getBoundingClientRect() || buttonRect;
    const destination = toggle.getBoundingClientRect();
    const sourceVisible = source.bottom > 0 && source.top < innerHeight;
    const startX = Math.max(8, Math.min(innerWidth - 88, source.left + source.width / 2 - 40));
    const startY = Math.max(8, Math.min(innerHeight - 88, sourceVisible ? source.top + source.height / 2 - 40 : buttonRect.top - 40));
    const dx = destination.left + destination.width / 2 - startX - 40;
    const dy = destination.top + destination.height / 2 - startY - 40;
    const image = el('img', `cart-flight${product.drink ? ' cart-flight--drink' : ''}`);
    image.src = product.image; image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.style.left = `${startX}px`; image.style.top = `${startY}px`;
    document.body.append(image); flights.add(image);
    const animation = image.animate([
      { opacity: 1, transform: 'translate3d(0,0,0) scale(.9) rotate(0deg)' },
      { opacity: .95, transform: `translate3d(${dx * .4}px,${dy * .4 - 55}px,0) scale(.7) rotate(-8deg)`, offset: .4 },
      { opacity: 0, transform: `translate3d(${dx}px,${dy}px,0) scale(.12) rotate(5deg)` }
    ], { duration: 650, easing: 'cubic-bezier(.3,.55,.3,1)' });
    animation.finished.then(() => {
      if (!dialog.open) pulse(toggle, [{ transform: 'scale(1)' }, { transform: 'scale(1.045)', offset: .35 }, { transform: 'scale(1)' }], 320);
    }).catch(() => {}).finally(() => { image.remove(); flights.delete(image); });
  }
  function finishClose() {
    clearTimeout(closeTimer);
    if (dialog.open) dialog.close();
    dialog.classList.remove('is-closing');
    closing = false;
  }
  function requestClose() {
    if (!dialog.open || closing) return;
    if (motion.matches) { finishClose(); return; }
    closing = true;
    dialog.classList.add('is-closing');
    closeTimer = setTimeout(finishClose, 340);
  }
  function render(focus) {
    const fragment = document.createDocumentFragment();
    const value = totals();
    const { count, total, hasConsult } = value;
    for (const [id, quantity] of items) {
      const product = catalog.get(id);
      const row = el('li', 'cart-item');
      row.dataset.id = id;
      const image = el('img', `cart-item__image${product.drink ? ' cart-item__image--drink' : ''}`);
      image.src = product.image;
      image.alt = '';
      image.width = image.height = 72;
      const info = el('div', 'cart-item__info');
      info.append(el('h3', '', product.name), el('span', 'cart-item__price', product.price === null ? 'Preço da combinação sujeito à consulta' : `${currency(product.price)} por unidade`));
      const bottom = el('div', 'cart-item__bottom');
      const stepper = el('div', 'cart-quantity');
      stepper.setAttribute('role', 'group');
      stepper.setAttribute('aria-label', `Quantidade de ${product.name}`);
      const plus = control('increase', id, `Aumentar quantidade de ${product.name}`, '+');
      plus.disabled = quantity >= maxQuantity;
      stepper.append(control('decrease', id, `Diminuir quantidade de ${product.name}`, '−'), el('span', '', String(quantity)), plus);
      bottom.append(stepper, el('span', 'cart-item__subtotal', product.price === null ? 'A consultar' : currency(product.price * quantity)));
      const remove = control('remove', id, `Remover ${product.name} do carrinho`, 'Remover');
      remove.className = 'cart-remove';
      info.append(bottom, remove);
      row.append(image, info);
      fragment.append(row);
    }
    list.replaceChildren(fragment);
    empty.hidden = items.size > 0;
    document.querySelector('#cart-count').textContent = String(count);
    document.querySelector('#cart-total').textContent = totalLabel(value);
    document.querySelector('#cart-total-label').textContent = hasConsult ? 'Subtotal parcial' : 'Subtotal dos produtos';
    document.querySelector('#cart-consult').hidden = !hasConsult;
    const toggleTotal = document.querySelector('#cart-toggle-total');
    toggleTotal.textContent = totalLabel(value);
    toggleTotal.hidden = count === 0;
    toggle.setAttribute('aria-label', `Abrir carrinho, ${count} ${count === 1 ? 'item' : 'itens'}, subtotal ${totalLabel(value)}`);
    orderFlow?.cartChanged();
    if (focus && dialog.open) {
      const buttons = [...list.querySelectorAll('button')];
      const same = buttons.find(button => button.dataset.id === focus.id && button.dataset.action === focus.action && !button.disabled);
      const nearby = buttons.find(button => button.dataset.id === focus.id && !button.disabled);
      (same || nearby || buttons[0] || dialog.querySelector('[data-close-cart]')).focus();
    }
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-add-to-cart]');
    if (!button) return;
    const id = button.closest('[data-product]').dataset.product;
    const product = catalog.get(id);
    if (!product) return;
    const quantity = items.get(id) || 0;
    if (quantity >= maxQuantity) { announce(`Limite de ${maxQuantity} unidades para este produto.`); return; }
    items.set(id, quantity + 1);
    save(); render();
    additionFeedback(button, product);
    announce(`${product.name} adicionado ao carrinho.`);
  });

  const first = document.querySelector('#pizza-first'), second = document.querySelector('#pizza-second');
  [first, second].forEach(select => {
    const placeholder = el('option', '', 'Escolha um sabor'); placeholder.value = ''; select.append(placeholder);
    for (const product of catalog.values()) {
      if (!product.pizza || product.price === null) continue;
      const option = el('option', '', product.name); option.value = product.id; select.append(option);
    }
    select.addEventListener('change', () => { first.setCustomValidity(''); second.setCustomValidity(''); });
  });
  document.querySelectorAll('[data-open-pizza]').forEach(button => button.addEventListener('click', () => {
    pizzaReturnFocus = document.activeElement; pizzaDialog.showModal(); document.documentElement.classList.add('reservation-open');
  }));
  document.querySelector('[data-close-pizza]').addEventListener('click', () => pizzaDialog.close());
  pizzaDialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...pizzaDialog.querySelectorAll('button,select')].filter(element => !element.disabled && element.getClientRects().length);
    const firstControl = controls[0], lastControl = controls.at(-1);
    if (event.shiftKey && document.activeElement === firstControl) { event.preventDefault(); lastControl.focus(); }
    else if (!event.shiftKey && document.activeElement === lastControl) { event.preventDefault(); firstControl.focus(); }
  });
  pizzaDialog.addEventListener('close', () => { document.documentElement.classList.remove('reservation-open'); if (!dialog.open) pizzaReturnFocus?.focus({ preventScroll: true }); });
  pizzaDialog.addEventListener('click', event => {
    if (event.target !== pizzaDialog) return;
    const r = pizzaDialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) pizzaDialog.close();
  });
  pizzaForm.addEventListener('submit', event => {
    event.preventDefault();
    second.setCustomValidity(first.value === second.value ? 'Escolha dois sabores diferentes.' : '');
    if (!pizzaForm.reportValidity()) return;
    const id = `pizza-half:${[first.value, second.value].sort().join('+')}`;
    const product = resolveProduct(id);
    if (!product) return;
    const quantity = items.get(id) || 0;
    if (quantity >= maxQuantity) { announce(`Limite de ${maxQuantity} unidades para esta combinação.`); return; }
    items.set(id, quantity + 1); save(); render();
    pizzaDialog.close(); toggle.click();
    announce('Pizza com dois sabores adicionada. O preço será consultado com o restaurante.');
  });
  list.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const { id, action } = button.dataset;
    if (!items.has(id)) return;
    const name = catalog.get(id).name;
    let quantity = items.get(id);
    if (action === 'remove') quantity = 0;
    else if (action === 'increase') quantity = Math.min(maxQuantity, quantity + 1);
    else if (action === 'decrease') quantity -= 1;
    else return;
    if (quantity <= 0) items.delete(id);
    else items.set(id, quantity);
    save(); render({ id, action });
    announce(quantity <= 0 ? `${name} removido do carrinho.` : `${name}: ${quantity} ${quantity === 1 ? 'unidade' : 'unidades'}.`);
  });
  toggle.addEventListener('click', () => {
    if (dialog.open) return;
    clearTimeout(closeTimer);
    closing = false;
    dialog.classList.remove('is-closing');
    returnFocus = document.activeElement;
    dialog.showModal();
    document.documentElement.classList.add('cart-open');
  });
  dialog.querySelectorAll('[data-close-cart]').forEach(button => button.addEventListener('click', requestClose));
  dialog.addEventListener('cancel', event => { event.preventDefault(); requestClose(); });
  dialog.addEventListener('animationend', event => {
    if (event.target === dialog && event.animationName === 'cart-exit' && closing) finishClose();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const buttons = [...dialog.querySelectorAll('button:not(:disabled),a[href],textarea,input,select')].filter(element => element.getClientRects().length && !element.disabled);
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  dialog.addEventListener('close', () => {
    clearTimeout(closeTimer);
    closing = false;
    dialog.classList.remove('is-closing');
    document.documentElement.classList.remove('cart-open');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  // A backdrop click closes the panel; clicks inside its content remain active.
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
  });
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    for (const image of flights) { image.getAnimations().forEach(animation => animation.cancel()); image.remove(); }
    flights.clear();
    [toggle, status, document.querySelector('#cart-count'), ...document.querySelectorAll('.dish__add')].forEach(element => element.getAnimations().forEach(animation => animation.cancel()));
    if (closing) finishClose();
  });
  addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      const active = list.contains(document.activeElement) ? document.activeElement.dataset : null;
      items = read(); render(active);
    }
  });
  orderFlow = window.createPepeNeroOrderFlow({
    getRows: () => [...items].map(([id, quantity]) => ({ ...resolveProduct(id), quantity })),
    getTotals: totals, currency
  });
  render();
})();
