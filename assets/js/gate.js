export function initGate() {
  const gate = document.getElementById('gate');
  const enterButton = document.getElementById('enter-button');
  const site = document.getElementById('site');
  const body = document.body;
  const skipLink = document.querySelector('.skip-link');
  body.classList.add('no-scroll');

  // The gate is a modal dialog (role="dialog" aria-modal="true" in
  // index.html). Per the ARIA APG modal pattern, content outside an open
  // modal must not be operable: while the gate is showing, the skip-link's
  // target (#inicio) sits inside `main#site.locked{visibility:hidden}` and
  // is not meaningfully reachable anyway, so activating the link would
  // silently do nothing. Rather than making the link dismiss the gate as a
  // side effect (surprising for a "skip to content" control, and it would
  // have to duplicate/couple to the enter-button's unlock flow), the
  // skip-link is pulled out of the tab order for the duration and restored
  // once the gate is dismissed. This guard checks the gate's actual
  // visibility state (not a session flag — nothing in this codebase persists
  // an "already entered" skip across loads, so #site is always locked and
  // #gate always visible at init time today) and is applied here in JS, not
  // as a static HTML attribute, so a no-JS visit (where the gate never
  // renders — see index.html's <noscript> block) never loses the skip-link.
  const gateIsOpen = site.classList.contains('locked') && !gate.classList.contains('hidden');
  if (gateIsOpen) {
    if (skipLink) skipLink.setAttribute('tabindex', '-1');
    enterButton.focus();
  }

  enterButton.addEventListener('click', () => {
    gate.classList.add('hidden');
    site.classList.remove('locked');
    body.classList.remove('no-scroll');
    if (skipLink) skipLink.removeAttribute('tabindex');
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
