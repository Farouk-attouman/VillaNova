// page d'accueil

(function () {
  'use strict';

  const featuredGrid = document.querySelector('.featured-grid');
  const catFilters = document.querySelectorAll('.cat-filter');
  const heroSearch = document.getElementById('hero-search');
  const loadMoreBtn = document.getElementById('load-more');
  const countLink = document.querySelector('.section__header--featured .link-btn');

  if (!featuredGrid) return;

  const PAGE_SIZE = 5;
  let currentOffset = 0;
  let currentSearch = '';

  // --- Petits utilitaires ---

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function addDays(date, n) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + n);
    return copy;
  }

  function showLoading() {
    VillaNova.clearChildren(featuredGrid);
    const loadingLi = createEl('li', 'featured-grid__loading');
    loadingLi.innerHTML = '<p>Chargement des événements…</p>';
    featuredGrid.appendChild(loadingLi);
  }

  // --- Grille en vedette ---

  function renderEvents(events, firstLarge) {
    events.forEach(function (event, i) {
      featuredGrid.appendChild(VillaNova.createEventCard(event, {
        large: firstLarge && i === 0
      }));
    });
  }

  // Premier chargement (on repart de zéro).
  async function loadFeaturedEvents(params) {
    params = params || {};
    currentOffset = 0;
    currentSearch = params.search || '';

    featuredGrid.setAttribute('aria-busy', 'true');
    showLoading();

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

  // Bouton "Voir plus" : page suivante, même recherche.
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

  // Met à jour le lien "Voir les N événements".
  function updateCountLink(total) {
    if (!countLink || !total) return;

    VillaNova.clearChildren(countLink);
    countLink.appendChild(document.createTextNode('Voir les ' + total + ' événements '));

    const arrow = createEl('img');
    arrow.src = 'assets/icons/arrow-right.svg';
    arrow.alt = '';
    arrow.width = 14;
    arrow.height = 14;
    arrow.setAttribute('aria-hidden', 'true');
    countLink.appendChild(arrow);
  }

  function showFeaturedError(message) {
    const li = createEl('li', 'featured-grid__loading');
    li.setAttribute('role', 'alert');
    li.innerHTML = '<p>' + message + '</p>';
    featuredGrid.appendChild(li);
  }

  // --- Filtres par catégorie ---

  catFilters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const active = document.querySelector('.cat-filter--active');
      if (active) active.classList.remove('cat-filter--active');
      btn.classList.add('cat-filter--active');

      const category = btn.textContent.trim();
      loadFeaturedEvents(category === 'Tout' ? {} : { search: category });
    });
  });

  if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMore);

  // --- Recherche du hero : redirige vers la page "tous les événements" ---

  if (heroSearch) {
    heroSearch.addEventListener('submit', function (e) {
      e.preventDefault();

      const fd = new FormData(heroSearch);
      const p = new URLSearchParams();

      ['date', 'category', 'location'].forEach(function (field) {
        const value = fd.get(field);
        if (value) p.set(field, value);
      });

      const q = p.toString();
      window.location.href = 'tous-les-evenements.html' + (q ? '?' + q : '');
    });
  }

  // --- Filtres rapides du hero ---

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

  // --- Compteur d'événements (badge du hero) ---

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

  // --- Libellé "Semaine du … au …" ---

  function updateHeroWeek() {
    const el = document.getElementById('hero-week');
    if (!el) return;

    const now = new Date();
    const day = now.getDay();
    const monday = addDays(now, day === 0 ? -6 : 1 - day);
    const sunday = addDays(monday, 6);

    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

    let text = 'Semaine du ' + monday.getDate();
    // Si début et fin sont dans deux mois différents, on précise le mois de début.
    if (monday.getMonth() !== sunday.getMonth()) text += ' ' + mois[monday.getMonth()];
    text += ' au ' + sunday.getDate() + ' ' + mois[sunday.getMonth()];

    el.textContent = text;
  }

  // --- Démarrage ---

  updateHeroWeek();
  loadFeaturedEvents();
  updateEventCount();
})();