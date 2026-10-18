(() => {
  'use strict';
  const tableMode = document.documentElement.classList.contains('table-menu');
  const nav = document.querySelector('.site-nav');
  const categoryNav = document.querySelector('.category-nav');
  const links = [...categoryNav.querySelectorAll('a')];
  const sections = links.map(link => document.querySelector(link.hash));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (tableMode) {
    document.title = 'Cardápio para consulta — Pepe Nero';
    const exit = document.querySelector('.site-nav__brand');
    exit.href = 'index.html#cardapio'; exit.textContent = 'Site completo ↗';
    const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex'; document.head.append(robots);
  }
  new ResizeObserver(() => document.documentElement.style.setProperty('--nav-height', `${nav.offsetHeight}px`)).observe(nav);
  let queued = false;
  function markCategory() {
    queued = false;
    const top = nav.getBoundingClientRect().bottom + 35;
    let active = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top <= top) active = section;
    links.forEach(link => {
      const current = link.hash === `#${active.id}`;
      if (current && link.getAttribute('aria-current') !== 'location') {
        link.setAttribute('aria-current', 'location');
        const rect = link.getBoundingClientRect(), bounds = categoryNav.getBoundingClientRect();
        if (rect.left < bounds.left || rect.right > bounds.right) categoryNav.scrollTo({ left: link.offsetLeft - categoryNav.offsetLeft - 16, behavior: reduced.matches ? 'instant' : 'smooth' });
      } else if (!current) link.removeAttribute('aria-current');
    });
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(markCategory); } }, { passive: true });
  markCategory();

  // Local, payload-free interest hooks. No analytics provider, network requests or customer data.
  // These indicate intent/clicks only. They never represent confirmed orders or reservations.
  document.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    const link = event.target.closest('a[href]');
    if (!link) return;
    let name;
    if (link.id === 'cart-send') name = 'order_whatsapp_open';
    else if (link.id === 'reservation-send') name = 'reservation_whatsapp_open';
    else if (link.href.startsWith('https://wa.me/')) name = 'whatsapp_click';
    else if (link.id === 'location-directions' || link.hasAttribute('data-directions')) name = 'directions_click';
    if (name) document.dispatchEvent(new CustomEvent('pepenero:interest', { detail: Object.freeze({ name, confirmed: false }) }));
  });

  // Prepare an approved selection only when all three real catalog identifiers are supplied.
  const selection = window.PepeNeroCommercial?.eveningForTwo;
  if (selection?.approved === true) {
    const lookup = (id, category) => typeof id === 'string' ? [...document.querySelectorAll(category.split(',').map(part => `${part.trim()} .dish`).join(','))].find(card => card.dataset.product === id) : null;
    const cards = [lookup(selection.starter, '#cardapio'), lookup(selection.sharedDish, '#pratos-principais, #pratos-exclusivos'), lookup(selection.dessert, '#sobremesas')];
    if (cards.every(Boolean)) {
      const block = document.createElement('section'); block.className = 'evening-selection';
      const heading = document.createElement('h2'); heading.textContent = 'Uma noite para dois';
      const note = document.createElement('p'); note.textContent = 'Seleção aprovada pelo restaurante. Cada item mantém seu preço individual; disponibilidade sujeita à confirmação.';
      const list = document.createElement('ul');
      cards.forEach(card => { const li = document.createElement('li'), link = document.createElement('a'); if (!card.id) card.id = `produto-${card.dataset.product}`; link.href = `#${card.id}`; link.textContent = `${card.querySelector('h3').textContent} · ${card.querySelector('.dish__heading span').textContent}`; li.append(link); list.append(li); });
      block.append(heading, note, list); document.querySelector('#cardapio').before(block);
    }
  }
})();
