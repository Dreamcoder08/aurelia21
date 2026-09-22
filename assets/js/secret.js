export function initSecret() {
  const secretTrigger = document.getElementById('secret-trigger');
  const secretMessage = document.getElementById('secret-message');
  if (!secretTrigger || !secretMessage) return;

  secretTrigger.setAttribute('aria-expanded', 'false');
  secretTrigger.setAttribute('aria-controls', 'secret-message');
  secretMessage.setAttribute('aria-hidden', 'true');

  secretTrigger.addEventListener('click', () => {
    secretMessage.classList.toggle('open');
    requestAnimationFrame(() => {
      const open = secretMessage.classList.contains('open');
      secretTrigger.setAttribute('aria-expanded', String(open));
      secretMessage.setAttribute('aria-hidden', String(!open));
      if (open) {
        const label = secretTrigger.querySelector('small');
        if (label) label.textContent = 'Mensaje desbloqueado';
      }
    });
  });
}
