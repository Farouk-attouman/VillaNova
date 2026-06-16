// page categories

(function () {
  'use strict';

  const catCards = document.querySelectorAll('.cat-card');
  const resultsSection = document.getElementById('categories-results');
  const resultsGrid = document.getElementById('results-grid');
  const resultsTitle = document.getElementById('results-title');
  const resultsCount = document.getElementById('results-count');
  const loadMoreBtn = document.getElementById('load-more');
  const resetBtn = document.getElementById('results-reset');

  if (!catCards.length || !resultsSection) return;

  let currentOffset = 0;
  let currentCategory = '';
  const PAGE_SIZE = 12;

  catCards.forEach(function (card) {
    card.addEventListener('click', function () {
      const active = document.querySelector('.cat-card--active');
      if (active) active.classList.remove('cat-card--active');
      card.classList.add('cat-card--active');
      loadCategoryEvents(card.getAttribute('data-category'));
    });
  });

  async function loadCategoryEvents(category) {
    currentCategory = category;
    currentOffset = 0;

    resultsSection.hidden = false;
    resultsTitle.textContent = 'Événements : ' + category;
    resultsGrid.setAttribute('aria-busy', 'true');
    VillaNova.clearChildren(resultsGrid);

    const loadingLi = document.createElement('li');
    loadingLi.className = 'listing-grid__loading';
    loadingLi.innerHTML = '<p>Chargement des événements…</p>';
    resultsGrid.appendChild(loadingLi);

    resultsSection.scrollIntoView({ behavior: 'smooth' });

    try {
      const data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE, offset: 0, search: category
      });

      VillaNova.clearChildren(resultsGrid);
      renderEvents(data.events);

      if (resultsCount) {
        resultsCount.textContent = data.total + ' événement' + (data.total > 1 ? 's' : '');
      }
      if (loadMoreBtn) {
        loadMoreBtn.hidden = data.events.length >= data.total;
      }

      VillaNova.announceToSR(resultsGrid, data.events.length + ' événements chargés pour ' + category);

    } catch (err) {
      VillaNova.clearChildren(resultsGrid);
      VillaNova.showGridError(resultsGrid, 'Impossible de charger les événements. Veuillez réessayer.');
      console.error('Erreur chargement catégorie:', err);
    } finally {
      resultsGrid.setAttribute('aria-busy', 'false');
    }
  }

  function renderEvents(events) {
    for (let i = 0; i < events.length; i++) {
      resultsGrid.appendChild(VillaNova.createEventCard(events[i], { large: false }));
    }
  }

  async function loadMore() {
    currentOffset += PAGE_SIZE;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Chargement…';

    try {
      const data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE, offset: currentOffset, search: currentCategory
      });

      renderEvents(data.events);
      if (currentOffset + PAGE_SIZE >= data.total) loadMoreBtn.hidden = true;

      VillaNova.announceToSR(resultsGrid, data.events.length + ' événements supplémentaires chargés');
    } catch (err) {
      console.error('Erreur pagination:', err);
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Voir plus d\'événements';
    }
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      resultsSection.hidden = true;
      const active = document.querySelector('.cat-card--active');
      if (active) active.classList.remove('cat-card--active');
      currentCategory = '';
      currentOffset = 0;
    });
  }

  if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMore);

  // pre-filtrage via ?cat= dans l'URL
  const catParam = new URLSearchParams(window.location.search).get('cat');
  if (catParam) {
    let matched = false;
    catCards.forEach(function (card) {
      if (card.getAttribute('data-category') === catParam) {
        card.classList.add('cat-card--active');
        loadCategoryEvents(catParam);
        matched = true;
      }
    });
    if (!matched) loadCategoryEvents(catParam);
  }
})();
