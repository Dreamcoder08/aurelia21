export function initGate() {
  const gate = document.getElementById('gate');
  const enterButton = document.getElementById('enter-button');
  const site = document.getElementById('site');
  const body = document.body;
  body.classList.add('no-scroll');

  enterButton.addEventListener('click', () => {
    gate.classList.add('hidden');
    site.classList.remove('locked');
    body.classList.remove('no-scroll');
    document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('visible'));
    setTimeout(() => gate.remove(), 1000);
  });

  const enter = document.getElementById('enter-button');
  if (enter) {
    enter.addEventListener('click', () => {
      body.classList.add('experience-live');
      sessionStorage.setItem('aurelia-entered', '1');
    }, { passive: true });
  }
}
