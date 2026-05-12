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

  // formulaire de recherche du hero
  if (heroSearch) {
    heroSearch.addEventListener('submit', function (e) {
      e.preventDefault();
      const formData = new FormData(heroSearch);
      const search = formData.get('category') || formData.get('date') || '';
      loadFeaturedEvents({ search: search });

      // scroll vers les resultats
      const section = document.getElementById('evenements');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

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

  // lancement au chargement de la page
  loadFeaturedEvents();

})();
