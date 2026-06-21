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

  const PAGE_SIZE = 12;
  let currentOffset = 0;
  let currentCategory = '';

  // --- Sélection de la carte active ---

  // Enlève la carte active actuelle et active celle passée en paramètre.
  function setActiveCard(card) {
    const active = document.querySelector('.cat-card--active');
    if (active) active.classList.remove('cat-card--active');
    if (card) card.classList.add('cat-card--active');
  }

  // Clic sur une carte de catégorie.
  catCards.forEach(function (card) {
    card.addEventListener('click', function () {
      setActiveCard(card);
      loadCategoryEvents(card.getAttribute('data-category'));
    });
  });

  // --- Affichage des événements ---

  // Affiche un message "Chargement…" dans la grille.
  function showLoading() {
    VillaNova.clearChildren(resultsGrid);
    const loadingLi = document.createElement('li');
    loadingLi.className = 'listing-grid__loading';
    loadingLi.innerHTML = '<p>Chargement des événements…</p>';
    resultsGrid.appendChild(loadingLi);
  }

  // Ajoute une carte d'événement par événement reçu.
  function renderEvents(events) {
    for (const event of events) {
      resultsGrid.appendChild(VillaNova.createEventCard(event, { large: false }));
    }
  }

  // Premier chargement d'une catégorie (on repart de zéro).
  async function loadCategoryEvents(category) {
    currentCategory = category;
    currentOffset = 0;

    resultsSection.hidden = false;
    resultsTitle.textContent = 'Événements : ' + category;
    resultsGrid.setAttribute('aria-busy', 'true');
    showLoading();
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

  // Bouton "Voir plus" : ajoute la page suivante à la suite.
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

  // --- Boutons ---

  if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMore);

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      resultsSection.hidden = true;
      setActiveCard(null);
      currentCategory = '';
      currentOffset = 0;
    });
  }

  // --- Pré-filtrage via ?cat= dans l'URL ---

  const catParam = new URLSearchParams(window.location.search).get('cat');
  if (catParam) {
    const card = Array.from(catCards).find(function (c) {
      return c.getAttribute('data-category') === catParam;
    });
    setActiveCard(card || null);
    loadCategoryEvents(catParam);
  }
})();