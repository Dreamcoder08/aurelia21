export function initNav() {
  const progress = document.getElementById('experience-progress-fill');
  const timelineLabel = document.getElementById('timeline-label');
  const navLinks = [...document.querySelectorAll('.chapter-nav a')];
  const sections = [...document.querySelectorAll('main > section[id]')];
  const sectionNames = {
    inicio: '00 · first light',
    flor: '01 · aurelia',
    universos: '02 · universos',
    choko: '03 · choko',
    'moshi-choko': '04 · nosotros',
    archivo: '05 · archive',
    secreto: '06 · private',
    final: '07 · forever'
  };

  const setProgress = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max));
    if (progress) progress.style.transform = 'scaleX(' + p + ')';
  };

  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      setProgress();
      if (matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)').matches) {
        const media = document.querySelector('.hero-media');
        if (media && scrollY < innerHeight * 1.15) {
          media.style.transform = 'scale(1.025) translate3d(0,' + (scrollY * .055) + 'px,0)';
        }
      }
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  setProgress();

  if ('IntersectionObserver' in window) {
    // IntersectionObserver callbacks only report entries whose ratio crossed a
    // threshold SINCE THE LAST callback, not the current state of every observed
    // section. Picking the top of just this batch races: near a scroll's resting
    // position two adjacent sections can each cross a threshold in separate
    // animation frames, and whichever fires LAST would otherwise "win" even if it
    // is no longer the most visible one. Track every section's latest known ratio
    // instead, and always choose the current global maximum.
    const ratios = new Map();
    const chapterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });
      let id = null;
      let bestRatio = 0;
      ratios.forEach((ratio, sectionId) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          id = sectionId;
        }
      });
      if (!id) return;
      navLinks.forEach(link => {
        const active = link.dataset.section === id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      if (timelineLabel) timelineLabel.textContent = sectionNames[id] || 'AURELIA';
    }, { rootMargin: '-22% 0px -45% 0px', threshold: [.08, .22, .45, .7] });
    sections.forEach(section => chapterObserver.observe(section));
  }

  navLinks.forEach(link => link.addEventListener('click', () => {
    if (navigator.vibrate && matchMedia('(pointer:coarse)').matches) navigator.vibrate(8);
  }, { passive: true }));
}
