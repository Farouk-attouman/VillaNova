// page tous les evenements

(function () {
  'use strict';

  const listingGrid = document.querySelector('.listing-grid');
  const loadMoreBtn = document.getElementById('load-more');
  const countEl = document.getElementById('listing-count');

  if (!listingGrid) return;

  const PAGE_SIZE = 12;
  let currentOffset = 0;
  let currentParams = {};

  // --- Petits utilitaires ---

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  // Met une majuscule à la première lettre.
  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Formate une date au format "AAAA-MM-JJ".
  function toYMD(date) {
    return date.toISOString().substring(0, 10);
  }

  // Renvoie une nouvelle date décalée de n jours.
  function addDays(date, n) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + n);
    return copy;
  }

  // --- Lecture des filtres dans l'URL ---

  // Calcule la période (début / fin) selon le mot-clé de date choisi.
  function getDateRange(keyword) {
    const now = new Date();

    if (keyword === 'aujourdhui') {
      return { start: now, end: now };
    }
    if (keyword === 'demain') {
      const demain = addDays(now, 1);
      return { start: demain, end: demain };
    }
    if (keyword === 'semaine') {
      const day = now.getDay();
      // Lundi de la semaine en cours (dimanche = 0, d'où le cas particulier).
      const monday = addDays(now, day === 0 ? -6 : 1 - day);
      const sunday = addDays(monday, 6);
      return { start: monday, end: sunday };
    }
    if (keyword === 'weekend') {
      const day = now.getDay();
      let daysToSat = (6 - day + 7) % 7;
      if (day === 6) daysToSat = 0;   // on est déjà samedi
      if (day === 0) daysToSat = -1;  // dimanche : le samedi était hier
      const saturday = addDays(now, daysToSat);
      const sunday = addDays(saturday, 1);
      return { start: saturday, end: sunday };
    }
    return null;
  }

  // Transforme les paramètres de l'URL en filtres pour l'API.
  function getSearchParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};

    const category = urlParams.get('category');
    const location = urlParams.get('location');
    const date = urlParams.get('date');
    const search = urlParams.get('search');

    // On regroupe recherche + catégorie + lieu en une seule recherche texte.
    const searchParts = [];
    if (search) searchParts.push(search);
    if (category) searchParts.push(category);
    if (location) searchParts.push(location);
    if (searchParts.length) params.search = searchParts.join(' ');

    // Filtre de date éventuel.
    if (date) {
      const range = getDateRange(date);
      if (range) {
        params['timings[gte]'] = toYMD(range.start);
        params['timings[lte]'] = toYMD(range.end);
      }
    }

    return params;
  }

  // --- Affichage des événements ---

  function showLoading() {
    VillaNova.clearChildren(listingGrid);
    const loadingLi = createEl('li', 'listing-grid__loading');
    loadingLi.innerHTML = '<p>Chargement des événements…</p>';
    listingGrid.appendChild(loadingLi);
  }

  function renderEvents(events) {
    for (const event of events) {
      listingGrid.appendChild(VillaNova.createEventCard(event, { large: false }));
    }
  }

  // Premier chargement : on repart de zéro avec de nouveaux filtres.
  async function loadEvents(params) {
    params = params || {};
    currentOffset = 0;
    currentParams = params;

    listingGrid.setAttribute('aria-busy', 'true');
    showLoading();

    try {
      const data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE, offset: 0, ...params
      });

      VillaNova.clearChildren(listingGrid);
      renderEvents(data.events);

      if (countEl) {
        countEl.textContent = data.total + ' événement' + (data.total > 1 ? 's' : '');
      }
      if (loadMoreBtn) {
        loadMoreBtn.hidden = data.events.length >= data.total;
      }

      VillaNova.announceToSR(listingGrid, data.events.length + ' événements chargés');
    } catch (err) {
      VillaNova.clearChildren(listingGrid);
      VillaNova.showGridError(listingGrid, 'Impossible de charger les événements. Veuillez réessayer.');
      console.error('Erreur chargement:', err);
    } finally {
      listingGrid.setAttribute('aria-busy', 'false');
    }
  }

  // Bouton "Voir plus" : page suivante, mêmes filtres.
  async function loadMore() {
    currentOffset += PAGE_SIZE;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Chargement…';

    try {
      const data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE, offset: currentOffset, ...currentParams
      });

      renderEvents(data.events);
      if (currentOffset + PAGE_SIZE >= data.total) loadMoreBtn.hidden = true;

      VillaNova.announceToSR(listingGrid, data.events.length + ' événements supplémentaires chargés');
    } catch (err) {
      console.error('Erreur pagination:', err);
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Voir plus d\'événements';
    }
  }

  // --- Filtres combinables (catégorie + rapide) ---

  // Séparer les deux rangées de filtres
  var quickBtns = document.querySelectorAll('[data-quick]');
  var categoryBtns = document.querySelectorAll('.cat-filter:not([data-quick])');

  // Construit les paramètres API à partir des filtres actifs des deux rangées.
  function buildFilterParams() {
    var params = {};
    var searchParts = [];

    // Filtre catégorie actif ?
    var activeCat = document.querySelector('.cat-filter--active:not([data-quick])');
    if (activeCat) {
      var catText = activeCat.textContent.trim();
      if (catText !== 'Tout') searchParts.push(catText);
    }

    // Filtre rapide actif ?
    var activeQuick = document.querySelector('[data-quick].cat-filter--active');
    if (activeQuick) {
      var key = activeQuick.getAttribute('data-quick');

      if (key === 'aujourdhui' || key === 'semaine') {
        var range = getDateRange(key);
        if (range) {
          params['timings[gte]'] = toYMD(range.start);
          params['timings[lte]'] = toYMD(range.end);
        }
      } else {
        searchParts.push(key === 'eco' ? 'éco' : key);
      }
    }

    if (searchParts.length) params.search = searchParts.join(' ');
    return params;
  }

  // Clic sur un filtre catégorie (Tout, Concerts, Expos…)
  categoryBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      // Un seul actif dans cette rangée
      categoryBtns.forEach(function (el) { el.classList.remove('cat-filter--active'); });
      btn.classList.add('cat-filter--active');
      loadEvents(buildFilterParams());
    });
  });

  // Clic sur un filtre rapide (Aujourd'hui, Gratuit…)
  quickBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wasActive = btn.classList.contains('cat-filter--active');

      // Un seul actif dans cette rangée (ou aucun si on re-clique)
      quickBtns.forEach(function (el) { el.classList.remove('cat-filter--active'); });
      if (!wasActive) btn.classList.add('cat-filter--active');

      loadEvents(buildFilterParams());
    });
  });

  if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMore);

  // --- Bandeau "Filtres actifs" au-dessus de la grille ---

  function showActiveFilters() {
    const existing = document.querySelector('.active-filters');
    if (existing) existing.remove();

    const urlParams = new URLSearchParams(window.location.search);
    const dateLabels = {
      'aujourdhui': "Aujourd'hui",
      'demain': 'Demain',
      'semaine': 'Cette semaine',
      'weekend': 'Ce week-end'
    };

    const date = urlParams.get('date');
    const category = urlParams.get('category');
    const location = urlParams.get('location');

    // Liste des libellés à afficher.
    const labels = [];
    if (date && dateLabels[date]) labels.push(dateLabels[date]);
    if (category) labels.push(capitalize(category));
    if (location) labels.push(capitalize(location));

    if (!labels.length) return;

    const container = createEl('div', 'active-filters');
    container.appendChild(createEl('span', 'active-filters__label', 'Filtres actifs : '));

    labels.forEach(function (label) {
      container.appendChild(createEl('span', 'active-filters__badge', label));
    });

    const clearBtn = createEl('a', 'active-filters__clear', '\u2715 Effacer');
    clearBtn.href = 'tous-les-evenements.html';
    container.appendChild(clearBtn);

    listingGrid.parentNode.insertBefore(container, listingGrid);
  }

  // --- Démarrage ---

  const initialParams = getSearchParams();
  showActiveFilters();
  loadEvents(initialParams);
})();