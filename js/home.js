// page d'accueil

(function () {
  'use strict';

  const featuredGrid = document.querySelector('.featured-grid');
  const catFilters = document.querySelectorAll('.cat-filter');
  const heroSearch = document.getElementById('hero-search');
  const loadMoreBtn = document.getElementById('load-more');
  const countLink = document.querySelector('.section__header--featured .link-btn');

  let currentOffset = 0;
  let currentSearch = '';
  const PAGE_SIZE = 5;

  if (!featuredGrid) return;

  async function loadFeaturedEvents(params) {
    params = params || {};
    currentOffset = 0;
    currentSearch = params.search || '';

    featuredGrid.setAttribute('aria-busy', 'true');
    VillaNova.clearChildren(featuredGrid);

    const loadingLi = document.createElement('li');
    loadingLi.className = 'featured-grid__loading';
    loadingLi.innerHTML = '<p>Chargement des événements…</p>';
    featuredGrid.appendChild(loadingLi);

    try {
      const data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE,
        offset: 0,
        search: params.search || undefined
      });

      VillaNova.clearChildren(featuredGrid);
      renderEvents(data.events, true);
      updateCountLink(data.total);

      if (loadMoreBtn) {
        loadMoreBtn.hidden = data.events.length >= data.total;
      }

      VillaNova.announceToSR(featuredGrid, data.events.length + ' événements chargés');

    } catch (err) {
      VillaNova.clearChildren(featuredGrid);
      showFeaturedError('Impossible de charger les événements. Veuillez réessayer.');
      console.error('Erreur chargement:', err);
    } finally {
      featuredGrid.setAttribute('aria-busy', 'false');
    }
  }

  function renderEvents(events, firstLarge) {
    for (let i = 0; i < events.length; i++) {
      featuredGrid.appendChild(VillaNova.createEventCard(events[i], {
        large: firstLarge && i === 0
      }));
    }
  }

  function updateCountLink(total) {
    if (!countLink || !total) return;
    VillaNova.clearChildren(countLink);
    countLink.appendChild(document.createTextNode('Voir les ' + total + ' événements '));
    const arrow = document.createElement('img');
    arrow.src = 'assets/icons/arrow-right.svg';
    arrow.alt = '';
    arrow.width = 14;
    arrow.height = 14;
    arrow.setAttribute('aria-hidden', 'true');
    countLink.appendChild(arrow);
  }

  async function loadMore() {
    currentOffset += PAGE_SIZE;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Chargement…';

    try {
      const data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE,
        offset: currentOffset,
        search: currentSearch || undefined
      });

      renderEvents(data.events, false);

      if (currentOffset + PAGE_SIZE >= data.total) {
        loadMoreBtn.hidden = true;
      }

      VillaNova.announceToSR(featuredGrid, data.events.length + ' événements supplémentaires chargés');
    } catch (err) {
      console.error('Erreur pagination:', err);
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Voir plus d\'événements';
    }
  }

  // filtres categorie
  catFilters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const active = document.querySelector('.cat-filter--active');
      if (active) active.classList.remove('cat-filter--active');
      btn.classList.add('cat-filter--active');

      const category = btn.textContent.trim();
      loadFeaturedEvents(category === 'Tout' ? {} : { search: category });
    });
  });

  // recherche hero → redirige vers tous-les-evenements.html
  if (heroSearch) {
    heroSearch.addEventListener('submit', function (e) {
      e.preventDefault();
      const fd = new FormData(heroSearch);
      const p = new URLSearchParams();
      if (fd.get('date')) p.set('date', fd.get('date'));
      if (fd.get('category')) p.set('category', fd.get('category'));
      if (fd.get('location')) p.set('location', fd.get('location'));
      const q = p.toString();
      window.location.href = 'tous-les-evenements.html' + (q ? '?' + q : '');
    });
  }

  // filtres rapides du hero
  const quickFilters = document.querySelectorAll('.quick-filter');
  const quickMap = {
    "Aujourd'hui": 'date=aujourdhui',
    'Cette semaine': 'date=semaine',
    'Gratuit': 'category=gratuit',
    'En famille': 'category=famille',
    'Éco-responsable': 'category=eco'
  };
  quickFilters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const q = quickMap[btn.textContent.trim()];
      if (q) window.location.href = 'tous-les-evenements.html?' + q;
    });
  });

  if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMore);

  // erreur dans la grille featured (classe differente de listing-grid)
  function showFeaturedError(message) {
    const li = document.createElement('li');
    li.className = 'featured-grid__loading';
    li.setAttribute('role', 'alert');
    li.innerHTML = '<p>' + message + '</p>';
    featuredGrid.appendChild(li);
  }

  async function updateEventCount() {
    try {
      const data = await VillaNova.api.fetchEvents({ limit: 1, offset: 0 });
      const total = data.total || 0;

      const heroCount = document.getElementById('hero-event-count');
      if (heroCount) {
        heroCount.textContent = total + ' événement' + (total > 1 ? 's' : '') + ' en cours';
      }
      updateCountLink(total);
    } catch (err) {
      console.error('Erreur compteur:', err);
    }
  }

  function updateHeroWeek() {
    const el = document.getElementById('hero-week');
    if (!el) return;

    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    let text = 'Semaine du ' + monday.getDate();
    if (monday.getMonth() !== sunday.getMonth()) text += ' ' + mois[monday.getMonth()];
    text += ' au ' + sunday.getDate() + ' ' + mois[sunday.getMonth()];
    el.textContent = text;
  }

  updateHeroWeek();
  loadFeaturedEvents();
  updateEventCount();
})();
