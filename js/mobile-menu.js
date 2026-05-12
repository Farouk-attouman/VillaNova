// Menu mobile hamburger
(function () {
  const hamburger = document.querySelector('.hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!hamburger || !menu) return;

  const overlay = menu.querySelector('.mobile-menu__overlay');
  const closeBtn = menu.querySelector('.mobile-menu__close');

  function openMenu() {
    menu.hidden = false;
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menu.hidden = true;
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  // Fermer avec Echap
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) {
      closeMenu();
    }
  });
})();
