// menu mobile
(function () {
  const hamburger = document.querySelector('.hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!hamburger || !menu) return;

  const overlay = menu.querySelector('.mobile-menu__overlay');
  const closeBtn = menu.querySelector('.mobile-menu__close');

  function open() {
    menu.hidden = false;
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    menu.hidden = true;
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) close();
  });
})();
