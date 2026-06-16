// page tous les evenements

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

  function getSearchParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};

    const category = urlParams.get('category');
    const location = urlParams.get('location');
    const date = urlParams.get('date');

    const searchParts = [];
    if (category) searchParts.push(category);
    if (location) searchParts.push(location);
    if (searchParts.length) params.search = searchParts.join(' ');

    if (date) {
      const now = new Date();
      const today = now.toISOString().substring(0, 10);

      if (date === 'aujourdhui') {
        params['timings[gte]'] = today;
        params['timings[lte]'] = today;
      } else if (date === 'demain') {
        const demain = new Date(now);
        demain.setDate(now.getDate() + 1);
        const demainStr = demain.toISOString().substring(0, 10);
        params['timings[gte]'] = demainStr;
        params['timings[lte]'] = demainStr;
      } else if (date === 'semaine') {
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        params['timings[gte]'] = monday.toISOString().substring(0, 10);
        params['timings[lte]'] = sunday.toISOString().substring(0, 10);
      } else if (date === 'weekend') {
        const dayOfWeek = now.getDay();
        let daysToSat = (6 - dayOfWeek + 7) % 7;
        if (dayOfWeek === 6) daysToSat = 0;
        if (dayOfWeek === 0) daysToSat = -1;
        const saturday = new Date(now);
        saturday.setDate(now.getDate() + daysToSat);
        const dimanche = new Date(saturday);
        dimanche.setDate(saturday.getDate() + 1);
        params['timings[gte]'] = saturday.toISOString().substring(0, 10);
        params['timings[lte]'] = dimanche.toISOString().substring(0, 10);
      }
    }
    return params;
  }

  async function loadEvents(params) {
    params = params || {};
    currentOffset = 0;
    currentParams = params;

    listingGrid.setAttribute('aria-busy', 'true');
    VillaNova.clearChildren(listingGrid);

    const loadingLi = document.createElement('li');
    loadingLi.className = 'listing-grid__loading';
    loadingLi.innerHTML = '<p>Chargement des événements…</p>';
    listingGrid.appendChild(loadingLi);

    try {
      const fetchParams = { limit: PAGE_SIZE, offset: 0 };
      for (const key in params) fetchParams[key] = params[key];

      const data = await VillaNova.api.fetchEvents(fetchParams);

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

  function renderEvents(events) {
    for (let i = 0; i < events.length; i++) {
      listingGrid.appendChild(VillaNova.createEventCard(events[i], { large: false }));
    }
  }

  async function loadMore() {
    currentOffset += PAGE_SIZE;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Chargement…';

    try {
      const fetchParams = { limit: PAGE_SIZE, offset: currentOffset };
      for (const key in currentParams) fetchParams[key] = currentParams[key];

      const data = await VillaNova.api.fetchEvents(fetchParams);
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

  catFilters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const active = document.querySelector('.cat-filter--active');
      if (active) active.classList.remove('cat-filter--active');
      btn.classList.add('cat-filter--active');

      const category = btn.textContent.trim();
      loadEvents(category === 'Tout' ? {} : { search: category });
    });
  });

  if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMore);

  // bandeau de filtres actifs au-dessus de la grille
  function showActiveFilters() {
    const existing = document.querySelector('.active-filters');
    if (existing) existing.remove();

    const urlParams = new URLSearchParams(window.location.search);
    const labels = [];
    const dateLabels = {
      'aujourdhui': "Aujourd'hui",
      'demain': 'Demain',
      'semaine': 'Cette semaine',
      'weekend': 'Ce week-end'
    };

    const date = urlParams.get('date');
    const category = urlParams.get('category');
    const location = urlParams.get('location');

    if (date && dateLabels[date]) labels.push(dateLabels[date]);
    if (category) labels.push(category.charAt(0).toUpperCase() + category.slice(1));
    if (location) labels.push(location.charAt(0).toUpperCase() + location.slice(1));

    if (!labels.length) return;

    const container = document.createElement('div');
    container.className = 'active-filters';

    const text = document.createElement('span');
    text.className = 'active-filters__label';
    text.textContent = 'Filtres actifs : ';
    container.appendChild(text);

    for (let i = 0; i < labels.length; i++) {
      const badge = document.createElement('span');
      badge.className = 'active-filters__badge';
      badge.textContent = labels[i];
      container.appendChild(badge);
    }

    const clearBtn = document.createElement('a');
    clearBtn.href = 'tous-les-evenements.html';
    clearBtn.className = 'active-filters__clear';
    clearBtn.textContent = '\u2715 Effacer';
    container.appendChild(clearBtn);

    listingGrid.parentNode.insertBefore(container, listingGrid);
  }

  const initialParams = getSearchParams();
  showActiveFilters();
  loadEvents(initialParams);
})();
