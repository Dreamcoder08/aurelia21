export function initAmbient() {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(90, Math.floor(innerWidth / 13));
    stars = Array.from({ length: count }, (_, i) => ({
      x: (i * 97.7) % innerWidth,
      y: (i * 53.1) % innerHeight,
      r: .25 + ((i * 17) % 8) / 13,
      a: .11 + ((i * 29) % 10) / 33
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    stars.forEach(s => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(246,202,91,${s.a})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  resize();
  draw();
  window.addEventListener('resize', () => { resize(); draw(); });

  const root = document.documentElement;
  const cursorRing = document.getElementById('cursor-ring');

  // Both listeners drive cursor-following visuals only: --mx/--my position the
  // body's spotlight gradient, and #cursor-ring is styled solely inside
  // @media (pointer:fine) (components.css). Guarding at attach time rather
  // than inside the handler means touch devices do no per-event work at all,
  // and reduced-motion users don't get the spotlight teleporting around —
  // the CSS media block can only strip the transition, not stop the updates.
  const wantsCursorEffects = matchMedia(
    '(pointer:fine) and (prefers-reduced-motion: no-preference)'
  ).matches;

  if (wantsCursorEffects) {
    addEventListener('pointermove', e => {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
      if (cursorRing) {
        cursorRing.style.left = e.clientX + 'px';
        cursorRing.style.top = e.clientY + 'px';
      }
    }, { passive: true });

    document.addEventListener('pointerover', e => {
      if (!cursorRing) return;
      cursorRing.classList.toggle('hot', !!e.target.closest('a,button,.record,.spec-card'));
    });
  }
}
