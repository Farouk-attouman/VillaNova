//page tous les evenements

(function () {
  'use strict';

  const listingGrid = document.querySelector('.listing-grid');
  const catFilters = document.querySelectorAll('.cat-filter');
  const loadMoreBtn = document.getElementById('load-more');
  const countEl = document.getElementById('listing-count');

  let currentOffset = 0;
  let currentParams = {};
  const PAGE_SIZE = 12;

  if (!listingGrid) return;

  // lit les parametres de recherche depuis l'URL
  function getSearchParams() {
    var urlParams = new URLSearchParams(window.location.search);
    var params = {};

    var category = urlParams.get('category');
    var location = urlParams.get('location');
    var date = urlParams.get('date');

    // recherche textuelle (categorie + lieu)
    var searchParts = [];
    if (category) searchParts.push(category);
    if (location) searchParts.push(location);
    if (searchParts.length) params.search = searchParts.join(' ');

    // filtre par date
    if (date) {
      var now = new Date();
      var today = now.toISOString().substring(0, 10);

      if (date === 'aujourdhui') {
        params['timings[gte]'] = today;
        params['timings[lte]'] = today;
      } else if (date === 'demain') {
        var demain = new Date(now);
        demain.setDate(now.getDate() + 1);
        var demainStr = demain.toISOString().substring(0, 10);
        params['timings[gte]'] = demainStr;
        params['timings[lte]'] = demainStr;
      } else if (date === 'semaine') {
        var day = now.getDay();
        var diffToMonday = day === 0 ? -6 : 1 - day;
        var monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        var sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        params['timings[gte]'] = monday.toISOString().substring(0, 10);
        params['timings[lte]'] = sunday.toISOString().substring(0, 10);
      } else if (date === 'weekend') {
        var dayOfWeek = now.getDay();
        var daysToSat = (6 - dayOfWeek + 7) % 7;
        if (dayOfWeek === 6) daysToSat = 0;
        if (dayOfWeek === 0) daysToSat = -1;
        var saturday = new Date(now);
        saturday.setDate(now.getDate() + daysToSat);
        var dimanche = new Date(saturday);
        dimanche.setDate(saturday.getDate() + 1);
        params['timings[gte]'] = saturday.toISOString().substring(0, 10);
        params['timings[lte]'] = dimanche.toISOString().substring(0, 10);
      }
    }

    return params;
  }

  // charge les evenements
  async function loadEvents(params) {
    params = params || {};
    currentOffset = 0;
    currentParams = params;

    listingGrid.setAttribute('aria-busy', 'true');
    VillaNova.clearChildren(listingGrid);

    // message de chargement
    const loadingLi = document.createElement('li');
    loadingLi.className = 'listing-grid__loading';
    const loadingP = document.createElement('p');
    loadingP.textContent = 'Chargement des événements…';
    loadingLi.appendChild(loadingP);
    listingGrid.appendChild(loadingLi);

    try {
      var fetchParams = {
        limit: PAGE_SIZE,
        offset: 0
      };

      for (var key in params) {
        fetchParams[key] = params[key];
      }

      const data = await VillaNova.api.fetchEvents(fetchParams);

      VillaNova.clearChildren(listingGrid);
      renderEvents(data.events);

      // compteur
      if (countEl) {
        countEl.textContent = data.total + ' événement' + (data.total > 1 ? 's' : '');
      }

      if (loadMoreBtn) {
        loadMoreBtn.hidden = data.events.length >= data.total;
      }

      announceToSR(data.events.length + ' événements chargés');

    } catch (err) {
      VillaNova.clearChildren(listingGrid);
      showGridError('Impossible de charger les événements. Veuillez réessayer.');
      console.error('Erreur chargement:', err);
    } finally {
      listingGrid.setAttribute('aria-busy', 'false');
    }
  }

  // affiche les cartes
  function renderEvents(events) {
    for (let i = 0; i < events.length; i++) {
      const card = VillaNova.createEventCard(events[i], { large: false });
      listingGrid.appendChild(card);
    }
  }

  // charger la suite
  async function loadMore() {
    currentOffset += PAGE_SIZE;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Chargement…';

    try {
      var fetchParams = {
        limit: PAGE_SIZE,
        offset: currentOffset
      };

      for (var key in currentParams) {
        fetchParams[key] = currentParams[key];
      }

      const data = await VillaNova.api.fetchEvents(fetchParams);

      renderEvents(data.events);

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

  // filtres categorie
  catFilters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const active = document.querySelector('.cat-filter--active');
      if (active) active.classList.remove('cat-filter--active');
      btn.classList.add('cat-filter--active');

      const category = btn.textContent.trim();
      if (category === 'Tout') {
        loadEvents();
      } else {
        loadEvents({ search: category });
      }
    });
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMore);
  }

  function showGridError(message) {
    const li = document.createElement('li');
    li.className = 'listing-grid__loading';
    li.setAttribute('role', 'alert');
    const p = document.createElement('p');
    p.textContent = message;
    li.appendChild(p);
    listingGrid.appendChild(li);
  }

  function announceToSR(message) {
    const el = document.createElement('p');
    el.className = 'visually-hidden';
    el.setAttribute('role', 'status');
    el.textContent = message;
    listingGrid.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

  // affiche les filtres actifs au-dessus de la grille
  function showActiveFilters(params) {
    var existing = document.querySelector('.active-filters');
    if (existing) existing.remove();

    var urlParams = new URLSearchParams(window.location.search);
    var labels = [];
    var category = urlParams.get('category');
    var location = urlParams.get('location');
    var date = urlParams.get('date');

    var dateLabels = {
      'aujourdhui': "Aujourd'hui",
      'demain': 'Demain',
      'semaine': 'Cette semaine',
      'weekend': 'Ce week-end'
    };

    if (date && dateLabels[date]) labels.push(dateLabels[date]);
    if (category) labels.push(category.charAt(0).toUpperCase() + category.slice(1));
    if (location) labels.push(location.charAt(0).toUpperCase() + location.slice(1));

    if (labels.length === 0) return;

    var container = document.createElement('div');
    container.className = 'active-filters';

    var text = document.createElement('span');
    text.className = 'active-filters__label';
    text.textContent = 'Filtres actifs : ';
    container.appendChild(text);

    for (var i = 0; i < labels.length; i++) {
      var badge = document.createElement('span');
      badge.className = 'active-filters__badge';
      badge.textContent = labels[i];
      container.appendChild(badge);
    }

    var clearBtn = document.createElement('a');
    clearBtn.href = 'tous-les-evenements.html';
    clearBtn.className = 'active-filters__clear';
    clearBtn.textContent = '✕ Effacer';
    container.appendChild(clearBtn);

    listingGrid.parentNode.insertBefore(container, listingGrid);
  }

  // au chargement : lire les parametres URL ou charger tout
  var initialParams = getSearchParams();
  showActiveFilters(initialParams);
  loadEvents(initialParams);

})();
