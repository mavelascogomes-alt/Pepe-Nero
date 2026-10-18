(() => {
  const root = document.querySelector('.location');
  if (!root) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const presses = new WeakMap();
  root.querySelectorAll('.location__actions > a, .location__actions > button').forEach(button => {
    button.addEventListener('click', event => {
      if (motion.matches) return;
      presses.get(button)?.cancel();
      const press = button.animate([{ transform: 'scale(.96)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' });
      presses.set(button, press); animations.add(press);
      press.finished.catch(() => {}).finally(() => animations.delete(press));
      button.querySelectorAll('.location__ripple').forEach(element => element.remove());
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const ripple = document.createElement('span');
      ripple.className = 'location__ripple';
      ripple.setAttribute('aria-hidden', 'true');
      const x = event.detail ? event.clientX - rect.left : rect.width / 2;
      const y = event.detail ? event.clientY - rect.top : rect.height / 2;
      Object.assign(ripple.style, { width: `${size}px`, height: `${size}px`, left: `${x - size / 2}px`, top: `${y - size / 2}px` });
      button.append(ripple);
      const wave = ripple.animate([{ opacity: .45, transform: 'scale(0)' }, { opacity: 0, transform: 'scale(1)' }], { duration: 550, easing: 'cubic-bezier(.2,.6,.3,1)' });
      animations.add(wave);
      wave.finished.catch(() => {}).finally(() => { ripple.remove(); animations.delete(wave); });
    });
  });
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    animations.forEach(animation => animation.cancel()); animations.clear();
    root.querySelectorAll('.location__ripple').forEach(element => element.remove());
  });
})();
