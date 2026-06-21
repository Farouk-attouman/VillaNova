// menu mobile

(function () {
  'use strict';

  const hamburger = document.querySelector('.hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!hamburger || !menu) return;

  const overlay = menu.querySelector('.mobile-menu__overlay');
  const closeBtn = menu.querySelector('.mobile-menu__close');

  // Ouvre le menu.
  function open() {
    menu.hidden = false;
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // bloque le défilement de la page derrière
  }

  // Ferme le menu.
  function close() {
    menu.hidden = true;
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = ''; // rétablit le défilement
  }

  // Ce qui ouvre / ferme le menu.
  hamburger.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  // Touche Échap : ferme le menu s'il est ouvert.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) close();
  });
})();