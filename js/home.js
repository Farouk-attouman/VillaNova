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

  // charge les evenements a l'affiche
  async function loadFeaturedEvents(params) {
    params = params || {};
    currentOffset = 0;
    currentSearch = params.search || '';

    featuredGrid.setAttribute('aria-busy', 'true');
    VillaNova.clearChildren(featuredGrid);

    // message de chargement
    const loadingLi = document.createElement('li');
    loadingLi.className = 'featured-grid__loading';
    const loadingP = document.createElement('p');
    loadingP.textContent = 'Chargement des événements…';
    loadingLi.appendChild(loadingP);
    featuredGrid.appendChild(loadingLi);

    try {
      const data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE,
        offset: 0,
        search: params.search || undefined
      });

      VillaNova.clearChildren(featuredGrid);
      renderEvents(data.events, true);

      // mise a jour du compteur total
      if (countLink && data.total) {
        VillaNova.clearChildren(countLink);
        countLink.appendChild(document.createTextNode('Voir les ' + data.total + ' événements '));
        const arrow = document.createElement('img');
        arrow.src = 'assets/icons/arrow-right.svg';
        arrow.alt = '';
        arrow.width = 14;
        arrow.height = 14;
        arrow.setAttribute('aria-hidden', 'true');
        countLink.appendChild(arrow);
      }

      // on cache le bouton si tout est deja affiche
      if (loadMoreBtn) {
        loadMoreBtn.hidden = data.events.length >= data.total;
      }

      announceToSR(data.events.length + ' événements chargés');

    } catch (err) {
      VillaNova.clearChildren(featuredGrid);
      showGridError('Impossible de charger les événements. Veuillez réessayer.');
      console.error('Erreur chargement:', err);
    } finally {
      featuredGrid.setAttribute('aria-busy', 'false');
    }
  }

  // affiche les cartes dans la grille
  function renderEvents(events, firstLarge) {
    for (let i = 0; i < events.length; i++) {
      const card = VillaNova.createEventCard(events[i], {
        large: firstLarge && i === 0
      });
      featuredGrid.appendChild(card);
    }
  }

  // pagination : charger la suite
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

      announceToSR(data.events.length + ' événements supplémentaires chargés');

    } catch (err) {
      console.error('Erreur pagination:', err);
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Voir plus d\'événements';
    }
  }

  // gestion des filtres de categorie
  catFilters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const active = document.querySelector('.cat-filter--active');
      if (active) active.classList.remove('cat-filter--active');
      btn.classList.add('cat-filter--active');

      const category = btn.textContent.trim();
      if (category === 'Tout') {
        loadFeaturedEvents();
      } else {
        loadFeaturedEvents({ search: category });
      }
    });
  });

  // formulaire de recherche du hero → redirige vers tous-les-evenements.html
  if (heroSearch) {
    heroSearch.addEventListener('submit', function (e) {
      e.preventDefault();
      var formData = new FormData(heroSearch);
      var params = new URLSearchParams();

      var date = formData.get('date');
      var category = formData.get('category');
      var location = formData.get('location');

      if (date) params.set('date', date);
      if (category) params.set('category', category);
      if (location) params.set('location', location);

      var query = params.toString();
      window.location.href = 'tous-les-evenements.html' + (query ? '?' + query : '');
    });
  }

  // filtres rapides du hero
  var quickFilters = document.querySelectorAll('.quick-filter');
  quickFilters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var label = btn.textContent.trim();
      var params = new URLSearchParams();

      if (label === "Aujourd'hui") {
        params.set('date', 'aujourdhui');
      } else if (label === 'Cette semaine') {
        params.set('date', 'semaine');
      } else if (label === 'Gratuit') {
        params.set('category', 'gratuit');
      } else if (label === 'En famille') {
        params.set('category', 'famille');
      } else if (label === 'Éco-responsable') {
        params.set('category', 'eco');
      }

      window.location.href = 'tous-les-evenements.html?' + params.toString();
    });
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMore);
  }

  // affiche un message d'erreur dans la grille
  function showGridError(message) {
    const li = document.createElement('li');
    li.className = 'featured-grid__loading';
    li.setAttribute('role', 'alert');
    const p = document.createElement('p');
    p.textContent = message;
    li.appendChild(p);
    featuredGrid.appendChild(li);
  }

  // annonce pour les lecteurs d'ecran
  function announceToSR(message) {
    const el = document.createElement('p');
    el.className = 'visually-hidden';
    el.setAttribute('role', 'status');
    el.textContent = message;
    featuredGrid.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

  // met a jour le compteur d'evenements en cours (hero + lien)
  async function updateEventCount() {
    try {
      var data = await VillaNova.api.fetchEvents({ limit: 1, offset: 0 });
      var total = data.total || 0;

      var heroCount = document.getElementById('hero-event-count');
      if (heroCount) {
        heroCount.textContent = total + ' événement' + (total > 1 ? 's' : '') + ' en cours';
      }

      if (countLink && total) {
        VillaNova.clearChildren(countLink);
        countLink.appendChild(document.createTextNode('Voir les ' + total + ' événements '));
        var arrow = document.createElement('img');
        arrow.src = 'assets/icons/arrow-right.svg';
        arrow.alt = '';
        arrow.width = 14;
        arrow.height = 14;
        arrow.setAttribute('aria-hidden', 'true');
        countLink.appendChild(arrow);
      }
    } catch (err) {
      console.error('Erreur compteur:', err);
    }
  }

  // affiche la semaine actuelle dans le hero
  function updateHeroWeek() {
    var el = document.getElementById('hero-week');
    if (!el) return;

    var now = new Date();
    var day = now.getDay();
    var diffToMonday = day === 0 ? -6 : 1 - day;
    var monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    var mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

    var text = 'Semaine du ' + monday.getDate();
    if (monday.getMonth() !== sunday.getMonth()) {
      text += ' ' + mois[monday.getMonth()];
    }
    text += ' au ' + sunday.getDate() + ' ' + mois[sunday.getMonth()];

    el.textContent = text;
  }

  // lancement au chargement de la page
  updateHeroWeek();
  loadFeaturedEvents();
  updateEventCount();

})();
