(() => {
  const hero = document.querySelector('.hero');
  const scene = document.querySelector('.hero__cinema');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let visible = true;
  const update = () => {
    frame = 0;
    if (preference.matches || !visible) return;
    const travel = Math.max(0, -hero.getBoundingClientRect().top);
    scene.style.setProperty('--scene-shift', `${Math.min(travel * 0.065, 42)}px`);
  };
  const onScroll = () => {
    if (!preference.matches && visible && !frame) frame = requestAnimationFrame(update);
  };
  addEventListener('scroll', onScroll, { passive: true });
  preference.addEventListener('change', () => {
    scene.style.removeProperty('--scene-shift');
    onScroll();
  });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) onScroll(); }).observe(hero);
  const video = document.querySelector('.introduction__video');
  if (video) {
    video.removeAttribute('autoplay');
    const syncVideo = () => { if (preference.matches) video.pause(); };
    preference.addEventListener('change', syncVideo);
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !preference.matches) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.1 }).observe(video);
    syncVideo();
  }
})();
