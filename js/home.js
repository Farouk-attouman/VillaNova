// =========================================================
// VillaNova - Homepage (index.html)
// Chargement dynamique de la section "A l'affiche",
// filtres categorie, recherche hero.
// =========================================================

(function () {
  'use strict';

  var featuredGrid = document.querySelector('.featured-grid');
  var catFilters = document.querySelectorAll('.cat-filter');
  var heroSearch = document.getElementById('hero-search');
  var loadMoreBtn = document.getElementById('load-more');
  var countLink = document.querySelector('.section__header--featured .link-btn');

  var currentOffset = 0;
  var currentSearch = '';
  var PAGE_SIZE = 5;

  if (!featuredGrid) return;

  // ---- Chargement des evenements ----

  async function loadFeaturedEvents(params) {
    params = params || {};
    currentOffset = 0;
    currentSearch = params.search || '';

    featuredGrid.setAttribute('aria-busy', 'true');
    VillaNova.clearChildren(featuredGrid);

    // Placeholder de chargement
    var loadingLi = document.createElement('li');
    loadingLi.className = 'featured-grid__loading';
    var loadingP = document.createElement('p');
    loadingP.textContent = 'Chargement des événements…';
    loadingLi.appendChild(loadingP);
    featuredGrid.appendChild(loadingLi);

    try {
      var data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE,
        offset: 0,
        search: params.search || undefined
      });

      VillaNova.clearChildren(featuredGrid);
      renderEvents(data.events, true);

      // Mettre a jour le compteur
      if (countLink && data.total) {
        VillaNova.clearChildren(countLink);
        countLink.appendChild(document.createTextNode('Voir les ' + data.total + ' événements '));
        var arrow = document.createElement('img');
        arrow.src = 'assets/icons/arrow-right.svg';
        arrow.alt = '';
        arrow.width = 14;
        arrow.height = 14;
        arrow.setAttribute('aria-hidden', 'true');
        countLink.appendChild(arrow);
      }

      // Bouton "Voir plus"
      if (loadMoreBtn) {
        loadMoreBtn.hidden = data.events.length >= data.total;
      }

      // Annonce accessibilite
      announceToSR(data.events.length + ' événements chargés');

    } catch (err) {
      VillaNova.clearChildren(featuredGrid);
      showGridError('Impossible de charger les événements. Veuillez réessayer.');
      console.error('VillaNova API:', err);
    } finally {
      featuredGrid.setAttribute('aria-busy', 'false');
    }
  }

  /**
   * Rend les cartes evenement dans la grille.
   * @param {Array} events
   * @param {boolean} firstLarge - la premiere carte est grande
   */
  function renderEvents(events, firstLarge) {
    events.forEach(function (event, i) {
      var card = VillaNova.createEventCard(event, {
        large: firstLarge && i === 0
      });
      featuredGrid.appendChild(card);
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

      renderEvents(data.events, false);

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
      // Toggle actif
      var active = document.querySelector('.cat-filter--active');
      if (active) active.classList.remove('cat-filter--active');
      btn.classList.add('cat-filter--active');

      var category = btn.textContent.trim();
      if (category === 'Tout') {
        loadFeaturedEvents();
      } else {
        loadFeaturedEvents({ search: category });
      }
    });
  });

  // ---- Recherche hero ----

  if (heroSearch) {
    heroSearch.addEventListener('submit', function (e) {
      e.preventDefault();
      var formData = new FormData(heroSearch);
      var search = formData.get('category') || formData.get('date') || '';
      loadFeaturedEvents({ search: search });

      // Scroll vers la section featured
      var section = document.getElementById('evenements');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ---- Bouton "Voir plus" ----

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMore);
  }

  // ---- Helpers ----

  function showGridError(message) {
    var li = document.createElement('li');
    li.className = 'featured-grid__loading';
    li.setAttribute('role', 'alert');
    var p = document.createElement('p');
    p.textContent = message;
    li.appendChild(p);
    featuredGrid.appendChild(li);
  }

  function announceToSR(message) {
    var el = document.createElement('p');
    el.className = 'visually-hidden';
    el.setAttribute('role', 'status');
    el.textContent = message;
    featuredGrid.appendChild(el);
    // Retirer apres annonce
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

  // ---- Init ----
  loadFeaturedEvents();

})();
