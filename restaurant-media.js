// Only real, identified photos explicitly confirmed as this restaurant belong here.
// Keep null until each photograph has been checked with the restaurant.
// Entry format (source describes the confirmation, never inferred from the filename):
// { confirmedReal: true, source: 'confirmation/provenance', src: 'assets/...',
//   alt: 'description of the actual photo', width: number, height: number,
//   variants: [{ src: 'assets/...', width: number }] }
window.PepeNeroMedia = Object.freeze({ salon: null, table: null, detail: null, facade: null });

(() => {
  const media = window.PepeNeroMedia;
  const localImage = value => typeof value === 'string' && /^assets\/(?!.*(?:\.\.|[?#\\]))[^:]+\.(?:jpe?g|png|webp|avif)$/i.test(value);
  function identified(photo) {
    return photo?.confirmedReal === true && typeof photo.source === 'string' && photo.source.trim() && localImage(photo.src) && typeof photo.alt === 'string' && photo.alt.trim() && Number.isInteger(photo.width) && photo.width > 0 && Number.isInteger(photo.height) && photo.height > 0;
  }
  function near(section) {
    return new Promise(resolve => {
      const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { observer.disconnect(); resolve(); } }, { rootMargin: '200px' });
      observer.observe(section);
    });
  }
  async function photo(photo, target) {
    if (!identified(photo)) return false;
    await near(target.closest('section'));
    const image = new Image();
    image.alt = photo.alt; image.width = photo.width; image.height = photo.height;
    // The section observer defers the request. A detached lazy image would never intersect.
    image.loading = 'eager'; image.decoding = 'async';
    if (Array.isArray(photo.variants)) {
      const variants = photo.variants.filter(item => localImage(item.src) && Number.isInteger(item.width) && item.width > 0);
      if (variants.length) image.srcset = variants.map(item => `${item.src} ${item.width}w`).join(', ');
    }
    image.sizes = '(max-width: 900px) 88vw, 42vw';
    image.src = photo.src;
    // Decode only near the section. Show nothing if the real asset cannot load.
    try { await image.decode(); } catch { return false; }
    if (!image.naturalWidth) return false;
    image.loading = 'lazy';
    target.replaceChildren(image); target.hidden = false;
    image.addEventListener('error', () => {
      target.hidden = true; target.replaceChildren();
      if (target.id === 'house-salon') { document.querySelector('#house-gallery').hidden = true; document.querySelector('.introduction').classList.remove('has-house-photos'); }
      if (target.id === 'location-facade') document.querySelector('.location').classList.remove('has-facade');
    }, { once: true });
    return true;
  }
  async function house() {
    if (await photo(media.salon, document.querySelector('#house-salon'))) {
      document.querySelector('#house-gallery').hidden = false;
      document.querySelector('.introduction').classList.add('has-house-photos');
      await Promise.all([photo(media.table, document.querySelector('#house-table')), photo(media.detail, document.querySelector('#house-detail'))]);
    }
  }
  house();
  photo(media.facade, document.querySelector('#location-facade')).then(loaded => { if (loaded) document.querySelector('.location').classList.add('has-facade'); });
})();
