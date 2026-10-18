(() => {
  'use strict';
  const zone = 'America/Sao_Paulo';
  const opening = 11 * 60, closing = 23 * 60 + 30;
  const clock = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const dateLabel = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const dialog = document.querySelector('#reservation-dialog');
  const form = document.querySelector('#reservation-form');
  const review = document.querySelector('#reservation-review');
  const name = document.querySelector('#reservation-name');
  const phone = document.querySelector('#reservation-phone');
  const date = document.querySelector('#reservation-date');
  const time = document.querySelector('#reservation-time');
  const guests = document.querySelector('#reservation-guests');
  const notes = document.querySelector('#reservation-notes');
  const occasion = document.querySelector('#reservation-occasion');
  const feedback = document.querySelector('#reservation-feedback');
  const timeHelp = document.querySelector('#reservation-time-help');
  const send = document.querySelector('#reservation-send');
  const copy = document.querySelector('#reservation-copy');
  const copyFallback = document.querySelector('#reservation-copy-fallback');
  let message = '', snapshot = null, previousFocus = null;
  function now() {
    const values = Object.fromEntries(clock.formatToParts(new Date()).map(part => [part.type, part.value]));
    return { day: `${values.year}-${values.month}-${values.day}`, minutes: Number(values.hour) * 60 + Number(values.minute) };
  }
  function refreshTimes() {
    const current = now(), selected = time.value;
    date.min = current.day;
    date.setCustomValidity(''); time.setCustomValidity('');
    const options = document.createDocumentFragment();
    const placeholder = document.createElement('option');
    placeholder.value = ''; placeholder.textContent = date.value ? 'Selecione um horário' : 'Escolha uma data primeiro';
    options.append(placeholder);
    let available = 0;
    if (date.value && date.value >= current.day) {
      for (let minutes = opening; minutes < closing; minutes += 15) {
        const option = document.createElement('option');
        option.value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
        option.textContent = option.value.replace(':', 'h');
        option.disabled = date.value === current.day && minutes <= current.minutes;
        if (!option.disabled) available++;
        options.append(option);
      }
    }
    time.replaceChildren(options);
    time.disabled = !date.value || !available;
    if ([...time.options].some(option => option.value === selected && !option.disabled)) time.value = selected;
    timeHelp.textContent = date.value === current.day && !available ? 'Os horários de hoje já passaram. Escolha outra data.' : '';
  }
  function validate() {
    const current = now(), digits = phone.value.replace(/\D/g, '');
    name.setCustomValidity(name.value.trim().length < 2 ? 'Informe seu nome.' : '');
    phone.setCustomValidity(!/^[+\d\s().-]+$/.test(phone.value) || digits.length < 10 || digits.length > 15 ? 'Informe um telefone válido com DDD.' : '');
    guests.setCustomValidity(!Number.isSafeInteger(Number(guests.value)) || Number(guests.value) < 1 ? 'Informe um número inteiro de pessoas, a partir de 1.' : '');
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date.value) && date.value >= current.day;
    date.setCustomValidity(!validDate ? 'Escolha uma data a partir de hoje.' : '');
    const parts = time.value.split(':').map(Number), minutes = parts[0] * 60 + parts[1];
    const validTime = /^\d{2}:\d{2}$/.test(time.value) && minutes >= opening && minutes < closing && minutes % 15 === 0 && (date.value !== current.day || minutes > current.minutes);
    time.setCustomValidity(!validTime ? 'Escolha um horário válido dentro do funcionamento do restaurante.' : '');
    if (time.disabled && validDate) {
      date.setCustomValidity('Escolha outra data: os horários de hoje já passaram.');
      date.reportValidity(); return false;
    }
    return form.reportValidity();
  }
  function buildReview() {
    const prettyDate = dateLabel.format(new Date(`${date.value}T12:00:00Z`));
    snapshot = { date: date.value, time: time.value };
    const rows = [['Nome', name.value.trim()], ['Telefone', phone.value.trim()], ['Data', prettyDate], ['Horário', `${time.value.replace(':', 'h')} (Brasília)`], ['Pessoas', guests.value]];
    if (occasion.value) rows.push(['Ocasião', occasion.value]);
    if (notes.value.trim()) rows.push(['Observações', notes.value.trim()]);
    const summary = document.querySelector('#reservation-summary');
    summary.replaceChildren();
    for (const [label, value] of rows) {
      const term = document.createElement('dt'), description = document.createElement('dd');
      term.textContent = label; description.textContent = value; summary.append(term, description);
    }
    message = `Olá! Gostaria de solicitar uma reserva no Pepe Nero.\n\n${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\nAguardo a confirmação da disponibilidade. Obrigado!`;
    const destination = (form.dataset.whatsapp || '').trim();
    const configured = /^\d{10,15}$/.test(destination);
    if (configured) send.href = `https://wa.me/${destination}?text=${encodeURIComponent(message)}`;
    else send.removeAttribute('href');
    send.hidden = !configured;
    document.querySelector('#reservation-unconfigured').hidden = configured;
    copy.hidden = configured;
    form.hidden = true; review.hidden = false;
    document.querySelector('#reservation-review-title').focus();
    dialog.scrollTop = 0;
  }
  function reviewStillCurrent() {
    const current = now();
    const [hours, minutes] = (snapshot?.time || '').split(':').map(Number);
    if (!snapshot || snapshot.date < current.day || (snapshot.date === current.day && hours * 60 + minutes <= current.minutes)) {
      form.hidden = false; review.hidden = true; refreshTimes();
      feedback.textContent = 'O horário escolhido já passou. Escolha uma nova data ou horário.';
      date.focus(); return false;
    }
    return true;
  }
  document.querySelectorAll('[data-open-reservation]').forEach(button => button.addEventListener('click', () => {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    refreshTimes();
    if (!review.hidden && !reviewStillCurrent()) review.hidden = true;
    dialog.showModal(); document.documentElement.classList.add('reservation-open');
  }));
  dialog.querySelectorAll('[data-close-reservation]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('reservation-open');
    previousFocus?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button,input,select,textarea,a[href]')].filter(element => !element.disabled && element.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  date.addEventListener('change', refreshTimes);
  form.addEventListener('input', event => { event.target.setCustomValidity?.(''); feedback.textContent = ''; });
  // Validate on submit rather than leaving stale custom errors after an edit.
  form.noValidate = true;
  form.addEventListener('submit', event => { event.preventDefault(); feedback.textContent = ''; if (validate()) buildReview(); });
  document.querySelector('#reservation-edit').addEventListener('click', () => {
    review.hidden = true; form.hidden = false; copyFallback.hidden = true;
    feedback.textContent = ''; refreshTimes(); name.focus();
  });
  send.addEventListener('click', event => { if (!reviewStillCurrent()) event.preventDefault(); });
  copy.addEventListener('click', async () => {
    if (!reviewStillCurrent()) return;
    try {
      await navigator.clipboard.writeText(message);
      feedback.textContent = 'Solicitação copiada. A reserva depende da confirmação do restaurante.';
    } catch {
      copyFallback.value = message; copyFallback.hidden = false; copyFallback.focus(); copyFallback.select();
      feedback.textContent = 'Selecione e copie a solicitação acima.';
    }
  });
  addEventListener('focus', () => { if (dialog.open && !form.hidden) refreshTimes(); });
  refreshTimes();
})();
