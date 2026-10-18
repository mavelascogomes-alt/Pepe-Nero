// Scoped checkout UI. Personal details stay only in the current form/closure.
'use strict';
window.createPepeNeroOrderFlow = ({ getRows, getTotals, currency }) => {
  const $ = selector => document.querySelector(selector);
  const form = $('#order-details-form');
  const dialog = $('#cart-dialog');
  const cartSection = $('#cart-selection');
  const dataSection = $('#order-data');
  const reviewSection = $('#cart-review');
  const primary = $('#cart-review-button');
  const send = $('#cart-send');
  const cartNotes = $('#cart-notes');
  const dataNotes = $('#order-notes');
  const mode = $('#order-mode');
  const payment = $('#order-payment');
  const fields = Object.fromEntries(['name','street','number','neighborhood','city','complement','reference','no-number','change','cash-value'].map(key => [key, $(`#order-${key}`)]));
  const config = window.PepeNeroCommercial?.order || {};
  const modes = [...new Set((Array.isArray(config.modes) ? config.modes : []).filter(item => item?.confirmed === true && ['delivery','pickup'].includes(item.id)).map(item => item.id))];
  const payments = (Array.isArray(config.paymentMethods) ? config.paymentMethods : []).filter(item => item?.confirmed === true && typeof item.id === 'string' && /^[a-z][a-z-]*$/.test(item.id) && item.id !== 'arrange' && typeof item.label === 'string' && item.label.trim()).filter((item,index,all) => all.findIndex(other => other.id === item.id) === index);
  const areas = config.delivery?.confirmed === true && Array.isArray(config.delivery.areas) ? config.delivery.areas.filter(area => typeof area?.city === 'string' && area.city.trim() && typeof area.neighborhood === 'string' && area.neighborhood.trim()) : [];
  const modeName = value => ({ delivery: 'Entrega', pickup: 'Retirada', arrange: 'A combinar pelo WhatsApp' })[value] || 'A combinar pelo WhatsApp';
  const normalize = value => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
  let step = 'cart';
  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function options(select, choices, fallback) {
    const placeholder = element('option', '', 'Selecione'); placeholder.value = ''; select.append(placeholder);
    choices.forEach(item => { const option = element('option', '', item.label); option.value = item.id; select.append(option); });
    const arrange = element('option', '', fallback); arrange.value = 'arrange'; select.append(arrange);
    select.disabled = choices.length === 0; select.required = choices.length > 0;
    if (!choices.length) select.value = 'arrange';
  }
  options(mode, modes.map(id => ({ id, label: modeName(id) })), 'Combinar atendimento pelo WhatsApp');
  options(payment, payments, 'Combinar pagamento pelo WhatsApp');
  $('#order-mode-choice').hidden = !modes.length;
  $('#order-mode-fallback').hidden = Boolean(modes.length);
  $('#order-payment-choice').hidden = !payments.length;
  $('#order-payment-fallback').hidden = Boolean(payments.length);

  const restaurantAddress = $('#restaurant-address');
  const pickupAddress = restaurantAddress.cloneNode(true); pickupAddress.removeAttribute('id');
  $('#order-pickup-address').append(pickupAddress);
  $('#order-pickup-directions').href = $('#location-directions').href;

  function cents(text) {
    let value = text.trim();
    if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(value)) value = value.replaceAll('.', '');
    if (!/^\d+(?:[,.]\d{1,2})?$/.test(value)) return null;
    const [units,fraction=''] = value.replace(',', '.').split('.');
    const amount = Number(units) * 100 + Number(fraction.padEnd(2,'0'));
    return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
  }
  function read() {
    const method = payments.find(item => item.id === payment.value);
    return {
      name: fields.name.value.trim(), mode: modes.includes(mode.value) ? mode.value : 'arrange',
      street: fields.street.value.trim(), number: fields['no-number'].checked ? 'Sem número' : fields.number.value.trim(),
      neighborhood: fields.neighborhood.value.trim(), city: fields.city.value.trim(),
      complement: fields.complement.value.trim(), reference: fields.reference.value.trim(),
      payment: method?.id || 'arrange', paymentLabel: method?.label || 'A combinar pelo WhatsApp',
      needsChange: fields.change.value, cashCents: cents(fields['cash-value'].value), notes: dataNotes.value.trim()
    };
  }
  function amounts(data) {
    const products = getTotals();
    const delivery = data.mode === 'delivery';
    const matched = delivery ? areas.find(area => normalize(area.city) === normalize(data.city) && normalize(area.neighborhood) === normalize(data.neighborhood)) : null;
    const fee = data.mode === 'pickup' ? 0 : matched && Number.isSafeInteger(matched.feeCents) && matched.feeCents >= 0 && Number.isSafeInteger(matched.feeCents + products.total) ? matched.feeCents : null;
    const outside = delivery && areas.length > 0 && data.city && data.neighborhood && !matched;
    const knownSum = products.total + (fee ?? 0);
    return { ...products, fee, outside, areaPending: delivery && !areas.length,
      final: !products.hasConsult && fee !== null && data.mode !== 'arrange' ? knownSum : null,
      minimum: knownSum };
  }
  function subtotalLabel(value, data) {
    const base = value.hasConsult ? 'Subtotal parcial dos produtos' : 'Subtotal dos produtos';
    return data.mode === 'delivery' && value.fee === null ? `${base} — entrega a confirmar` : base;
  }
  function productAmount(value) {
    return value.hasConsult ? (value.total ? `${currency(value.total)} + a consultar` : 'A consultar') : currency(value.total);
  }
  function syncFields() {
    const data = read();
    const delivery = data.mode === 'delivery', cash = data.payment === 'cash', change = cash && fields.change.value === 'yes';
    $('#order-delivery').hidden = !delivery; $('#order-pickup').hidden = data.mode !== 'pickup';
    for (const key of ['street','number','neighborhood','city','complement','reference']) {
      fields[key].disabled = !delivery || key === 'number' && fields['no-number'].checked;
      fields[key].required = delivery && !['complement','reference'].includes(key) && !(key === 'number' && fields['no-number'].checked);
    }
    fields['no-number'].disabled = !delivery;
    $('#order-cash').hidden = !cash;
    fields.change.disabled = !cash; fields.change.required = cash;
    $('#order-cash-amount').hidden = !change;
    fields['cash-value'].disabled = !change; fields['cash-value'].required = change;
    const value = amounts(data);
    $('#order-delivery-hint').textContent = value.outside ? 'Bairro e cidade fora da área cadastrada. Confira o endereço ou escolha combinar o atendimento pelo WhatsApp.' : value.areaPending ? 'Área de entrega e taxa a confirmar pelo WhatsApp.' : value.fee === null ? 'Taxa de entrega a confirmar pelo WhatsApp.' : `Taxa de entrega: ${currency(value.fee)}.`;
    $('#order-cash-help').textContent = change && value.final === null ? 'O valor final e o troco serão confirmados pelo restaurante.' : '';
    updateFooter();
  }
  function updateFooter() {
    const data = read(), value = amounts(data);
    $('.cart-total').hidden = step === 'review';
    $('#cart-total-label').textContent = step === 'cart' ? (value.hasConsult ? 'Subtotal parcial dos produtos' : 'Subtotal dos produtos') : subtotalLabel(value,data);
    $('#cart-total').textContent = productAmount(value);
    $('#cart-consult').hidden = !value.hasConsult || step !== 'cart';
    primary.disabled = !value.count;
    $('.order-steps').hidden = !value.count;
    $('#cart-order-fields').hidden = !value.count;
  }
  function show(next, focus=true) {
    step = next;
    cartSection.hidden = step !== 'cart'; dataSection.hidden = step !== 'data'; reviewSection.hidden = step !== 'review';
    primary.hidden = step === 'review'; primary.textContent = step === 'data' ? 'Revisar pedido' : 'Continuar';
    send.hidden = step !== 'review'; if (step !== 'review') send.removeAttribute('href');
    $('#order-confirmation').hidden = step !== 'review';
    $('#order-back').hidden = step === 'cart'; $('#order-back').textContent = step === 'review' ? 'Voltar aos dados' : 'Voltar ao carrinho';
    dialog.querySelector('.cart-continue[data-close-cart]').hidden = step !== 'cart';
    $('#cart-title').textContent = step === 'cart' ? 'Seu carrinho' : step === 'data' ? 'Dados do pedido' : 'Revisão do pedido';
    document.querySelectorAll('.order-steps [data-step]').forEach(item => {
      if (item.dataset.step === step) item.setAttribute('aria-current','step'); else item.removeAttribute('aria-current');
    });
    updateFooter();
    $('.cart-body').scrollTop = 0;
    if (focus && dialog.open) (step === 'data' ? fields.name : step === 'review' ? $('#cart-review-title') : dialog.querySelector('.cart-close')).focus();
  }
  function validate() {
    const data = read(), value = amounts(data);
    [...form.elements].forEach(field => field.setCustomValidity?.(''));
    fields.name.setCustomValidity(data.name ? '' : 'Informe seu nome.');
    if (!mode.disabled && !mode.value) mode.setCustomValidity('Escolha como deseja combinar o atendimento.');
    if (!payment.disabled && !payment.value) payment.setCustomValidity('Escolha sua preferência de pagamento ou combine pelo WhatsApp.');
    if (data.mode === 'delivery') {
      for (const [key,label] of [['street','a rua'],['number','o número ou marque sem número'],['neighborhood','o bairro'],['city','a cidade']]) {
        if (!fields[key].disabled && !fields[key].value.trim()) fields[key].setCustomValidity(`Informe ${label}.`);
      }
      if (value.outside) fields.neighborhood.setCustomValidity('O endereço está fora da área de entrega cadastrada. Confira bairro e cidade ou escolha atendimento a combinar pelo WhatsApp.');
    }
    if (data.payment === 'cash') {
      if (!data.needsChange) fields.change.setCustomValidity('Informe se precisa de troco.');
      if (data.needsChange === 'yes') {
        if (data.cashCents === null || data.cashCents <= 0) fields['cash-value'].setCustomValidity('Informe um valor válido em dinheiro, como 100,00.');
        else if (data.cashCents < value.minimum) fields['cash-value'].setCustomValidity(value.final !== null ? `Informe um valor igual ou maior que ${currency(value.final)}.` : `O valor precisa cobrir pelo menos ${currency(value.minimum)}, que já está no subtotal. O restante será confirmado.`);
      }
    }
    if (!form.checkValidity() && dataSection.hidden) show('data',false);
    const valid = form.reportValidity();
    $('#order-validation').textContent = valid ? '' : 'Confira os campos indicados antes de continuar.';
    return valid;
  }
  function row(list, label, value) {
    list.append(element('dt','',label), element('dd','',value));
  }
  function address(data) {
    return [`${data.street}, ${data.number}`, `${data.neighborhood} · ${data.city}`, data.complement ? `Complemento: ${data.complement}` : '', data.reference ? `Referência: ${data.reference}` : ''].filter(Boolean).join('\n');
  }
  function changeText(data,value) {
    if (data.needsChange === 'no') return 'Sem troco';
    return `Troco para ${currency(data.cashCents)}${value.final !== null ? ` · troco de ${currency(data.cashCents - value.final)}` : ' · troco a confirmar'}`;
  }
  function pending(data,value) {
    const lines = [];
    if (value.hasConsult) lines.push('Preço da pizza com dois sabores a consultar; não incluído no subtotal conhecido.');
    if (data.mode === 'delivery' && value.areaPending) lines.push('Área de entrega a confirmar.');
    if (data.mode === 'delivery' && value.fee === null) lines.push('Taxa de entrega a confirmar; não é entrega gratuita.');
    if (data.mode === 'arrange') lines.push('Forma de atendimento e valores finais a combinar.');
    if (data.payment === 'arrange') lines.push('Forma de pagamento a combinar.');
    return lines;
  }
  function message(data,value) {
    const lines = ['Olá! Gostaria de solicitar estes itens ao Pepe Nero.', '', `Cliente: ${data.name}`, '', 'Produtos:'];
    getRows().forEach(item => {
      lines.push(`${item.quantity} × ${item.name}`);
      lines.push(item.price === null ? '  Preço da combinação: a consultar.' : `  Unitário: ${currency(item.price)} · Subtotal: ${currency(item.price * item.quantity)}`);
    });
    lines.push('', `Atendimento: ${modeName(data.mode)}${value.areaPending ? ' — área a confirmar' : ''}`);
    if (data.mode === 'delivery') lines.push('Endereço de entrega:', address(data));
    if (data.mode === 'pickup') lines.push('Endereço de retirada:', restaurantAddress.innerText);
    lines.push(`Pagamento (preferência): ${data.paymentLabel}`);
    if (data.payment === 'cash') lines.push(changeText(data,value));
    lines.push('', `${subtotalLabel(value,data)}: ${productAmount(value)}`);
    if (data.mode === 'delivery') lines.push(`Taxa de entrega: ${value.fee === null ? 'A confirmar' : currency(value.fee)}`);
    lines.push(`Total: ${value.final === null ? 'A confirmar com o restaurante' : currency(value.final)}`);
    const waiting = pending(data,value); if (waiting.length) lines.push('', 'A combinar:', ...waiting.map(text => `- ${text}`));
    if (data.notes) lines.push('', `Observações: ${data.notes}`);
    lines.push('', 'A solicitação será confirmada pelo restaurante no WhatsApp.');
    return lines.join('\n');
  }
  function prepare() {
    if (!getTotals().count) { show('cart'); return false; }
    if (!validate()) { show('data',false); return false; }
    const destination = $('#reservation-form').dataset.whatsapp;
    if (!/^\d{10,15}$/.test(destination)) { send.removeAttribute('href'); $('#order-validation').textContent = 'Não foi possível preparar o contato. Tente novamente mais tarde.'; show('data',false); return false; }
    const data = read(), value = amounts(data);
    const products = $('#order-review-items'); products.replaceChildren();
    getRows().forEach(item => {
      const li = element('li');
      const copy = element('div'); copy.append(element('strong','',`${item.quantity} × ${item.name}`));
      if (item.price !== null) copy.append(element('small','',`${currency(item.price)} por unidade`));
      li.append(copy, element('span','',item.price === null ? 'A consultar' : currency(item.price * item.quantity))); products.append(li);
    });
    const details = $('#order-review-data'); details.replaceChildren();
    row(details,'Nome',data.name); row(details,'Atendimento',`${modeName(data.mode)}${value.areaPending ? ' — área a confirmar' : ''}`);
    if (data.mode === 'delivery') row(details,'Endereço',address(data));
    if (data.mode === 'pickup') row(details,'Retirada',restaurantAddress.innerText);
    row(details,'Pagamento',data.paymentLabel);
    if (data.payment === 'cash') row(details,'Troco',changeText(data,value));
    if (data.notes) row(details,'Observações',data.notes);
    const costs = $('#order-review-amounts'); costs.replaceChildren();
    row(costs,subtotalLabel(value,data),productAmount(value));
    if (data.mode === 'delivery') row(costs,'Taxa de entrega',value.fee === null ? 'A confirmar' : currency(value.fee));
    row(costs,'Total',value.final === null ? 'A confirmar' : currency(value.final));
    send.href = `https://wa.me/${destination}?text=${encodeURIComponent(message(data,value))}`;
    return true;
  }
  primary.addEventListener('click', () => {
    if (!getTotals().count) return;
    if (step === 'cart') { dataNotes.value = cartNotes.value; syncFields(); show('data'); }
    else form.requestSubmit();
  });
  form.addEventListener('submit', event => { event.preventDefault(); if (prepare()) show('review'); });
  $('#cart-edit').addEventListener('click', () => show('cart'));
  $('#order-edit-data').addEventListener('click', () => show('data'));
  $('#order-back').addEventListener('click', () => show(step === 'review' ? 'data' : 'cart'));
  cartNotes.addEventListener('input', () => { dataNotes.value = cartNotes.value; });
  dataNotes.addEventListener('input', () => { cartNotes.value = dataNotes.value; });
  form.addEventListener('input', event => { event.target.setCustomValidity?.(''); $('#order-validation').textContent = ''; syncFields(); });
  form.addEventListener('change', () => { [...form.elements].forEach(field => field.setCustomValidity?.('')); syncFields(); });
  send.addEventListener('click', event => { if (!prepare()) event.preventDefault(); });
  syncFields(); show('cart',false);
  return Object.freeze({ cartChanged() { const restoreFocus = step !== 'cart' && dialog.open; show('cart',restoreFocus); reviewSection.querySelectorAll('ul,dl').forEach(list => list.replaceChildren()); } });
};
