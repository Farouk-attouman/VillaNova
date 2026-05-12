//page tous les evenements

(function () {
  'use strict';

  const listingGrid = document.querySelector('.listing-grid');
  const catFilters = document.querySelectorAll('.cat-filter');
  const loadMoreBtn = document.getElementById('load-more');
  const countEl = document.getElementById('listing-count');

  let currentOffset = 0;
  let currentSearch = '';
  const PAGE_SIZE = 12;

  if (!listingGrid) return;

  // charge les evenements
  async function loadEvents(params) {
    params = params || {};
    currentOffset = 0;
    currentSearch = params.search || '';

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
      const data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE,
        offset: 0,
        search: params.search || undefined
      });

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
      const data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE,
        offset: currentOffset,
        search: currentSearch || undefined
      });

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

  loadEvents();

})();
