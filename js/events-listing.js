// =========================================================
// VillaNova - Page listing (tous-les-evenements.html)
// Chargement dynamique, filtres categorie, pagination.
// =========================================================

(function () {
  'use strict';

  var listingGrid = document.querySelector('.listing-grid');
  var catFilters = document.querySelectorAll('.cat-filter');
  var loadMoreBtn = document.getElementById('load-more');
  var countEl = document.getElementById('listing-count');

  var currentOffset = 0;
  var currentSearch = '';
  var PAGE_SIZE = 12;

  if (!listingGrid) return;

  // ---- Chargement des evenements ----

  async function loadEvents(params) {
    params = params || {};
    currentOffset = 0;
    currentSearch = params.search || '';

    listingGrid.setAttribute('aria-busy', 'true');
    VillaNova.clearChildren(listingGrid);

    // Placeholder de chargement
    var loadingLi = document.createElement('li');
    loadingLi.className = 'listing-grid__loading';
    var loadingP = document.createElement('p');
    loadingP.textContent = 'Chargement des événements…';
    loadingLi.appendChild(loadingP);
    listingGrid.appendChild(loadingLi);

    try {
      var data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE,
        offset: 0,
        search: params.search || undefined
      });

      VillaNova.clearChildren(listingGrid);
      renderEvents(data.events);

      // Compteur
      if (countEl) {
        countEl.textContent = data.total + ' événement' + (data.total > 1 ? 's' : '');
      }

      // Bouton "Voir plus"
      if (loadMoreBtn) {
        loadMoreBtn.hidden = data.events.length >= data.total;
      }

      // Annonce accessibilite
      announceToSR(data.events.length + ' événements chargés');

    } catch (err) {
      VillaNova.clearChildren(listingGrid);
      showGridError('Impossible de charger les événements. Veuillez réessayer.');
      console.error('VillaNova API:', err);
    } finally {
      listingGrid.setAttribute('aria-busy', 'false');
    }
  }

  /**
   * Rend les cartes evenement dans la grille (toutes en taille normale).
   */
  function renderEvents(events) {
    events.forEach(function (event) {
      var card = VillaNova.createEventCard(event, { large: false });
      listingGrid.appendChild(card);
    });
  }

  /**
   * Charge plus d'evenements (pagination).
   */
  async function loadMore() {
    currentOffset += PAGE_SIZE;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Chargement…';

    try {
      var data = await VillaNova.api.fetchEvents({
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
      console.error('VillaNova API:', err);
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Voir plus d\'événements';
    }
  }

  // ---- Filtres categorie ----

  catFilters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var active = document.querySelector('.cat-filter--active');
      if (active) active.classList.remove('cat-filter--active');
      btn.classList.add('cat-filter--active');

      var category = btn.textContent.trim();
      if (category === 'Tout') {
        loadEvents();
      } else {
        loadEvents({ search: category });
      }
    });
  });

  // ---- Bouton "Voir plus" ----

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMore);
  }

  // ---- Helpers ----

  function showGridError(message) {
    var li = document.createElement('li');
    li.className = 'listing-grid__loading';
    li.setAttribute('role', 'alert');
    var p = document.createElement('p');
    p.textContent = message;
    li.appendChild(p);
    listingGrid.appendChild(li);
  }

  function announceToSR(message) {
    var el = document.createElement('p');
    el.className = 'visually-hidden';
    el.setAttribute('role', 'status');
    el.textContent = message;
    listingGrid.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

  // ---- Init ----
  loadEvents();

})();
