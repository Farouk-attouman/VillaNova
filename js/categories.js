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

  // clic sur une carte categorie
  catCards.forEach(function (card) {
    card.addEventListener('click', function () {
      // etat actif
      const active = document.querySelector('.cat-card--active');
      if (active) active.classList.remove('cat-card--active');
      card.classList.add('cat-card--active');

      // charger les evenements de cette categorie
      const category = card.getAttribute('data-category');
      loadCategoryEvents(category);
    });
  });

  // charge les evenements d'une categorie
  async function loadCategoryEvents(category) {
    currentCategory = category;
    currentOffset = 0;

    // afficher la section resultats
    resultsSection.hidden = false;
    resultsTitle.textContent = 'Événements : ' + category;

    resultsGrid.setAttribute('aria-busy', 'true');
    VillaNova.clearChildren(resultsGrid);

    // message de chargement
    const loadingLi = document.createElement('li');
    loadingLi.className = 'listing-grid__loading';
    const loadingP = document.createElement('p');
    loadingP.textContent = 'Chargement des événements…';
    loadingLi.appendChild(loadingP);
    resultsGrid.appendChild(loadingLi);

    // scroll vers les resultats
    resultsSection.scrollIntoView({ behavior: 'smooth' });

    try {
      const data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE,
        offset: 0,
        search: category
      });

      VillaNova.clearChildren(resultsGrid);
      renderEvents(data.events);

      // compteur
      if (resultsCount) {
        resultsCount.textContent = data.total + ' événement' + (data.total > 1 ? 's' : '');
      }

      // bouton voir plus
      if (loadMoreBtn) {
        loadMoreBtn.hidden = data.events.length >= data.total;
      }

      announceToSR(data.events.length + ' événements chargés pour ' + category);

    } catch (err) {
      VillaNova.clearChildren(resultsGrid);
      showGridError('Impossible de charger les événements. Veuillez réessayer.');
      console.error('Erreur chargement catégorie:', err);
    } finally {
      resultsGrid.setAttribute('aria-busy', 'false');
    }
  }

  // affiche les cartes
  function renderEvents(events) {
    for (let i = 0; i < events.length; i++) {
      const card = VillaNova.createEventCard(events[i], { large: false });
      resultsGrid.appendChild(card);
    }
  }

  // pagination
  async function loadMore() {
    currentOffset += PAGE_SIZE;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Chargement…';

    try {
      const data = await VillaNova.api.fetchEvents({
        limit: PAGE_SIZE,
        offset: currentOffset,
        search: currentCategory
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

  // bouton tout afficher
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      resultsSection.hidden = true;
      const active = document.querySelector('.cat-card--active');
      if (active) active.classList.remove('cat-card--active');
      currentCategory = '';
      currentOffset = 0;
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMore);
  }

  // pre-filtrage via parametre URL ?cat=
  var urlParams = new URLSearchParams(window.location.search);
  var catParam = urlParams.get('cat');
  if (catParam) {
    // chercher la carte correspondante et l'activer
    var matched = false;
    catCards.forEach(function (card) {
      if (card.getAttribute('data-category') === catParam) {
        card.classList.add('cat-card--active');
        loadCategoryEvents(catParam);
        matched = true;
      }
    });
    // si aucune carte ne correspond, charger quand meme
    if (!matched) {
      loadCategoryEvents(catParam);
    }
  }

  // affiche un message d'erreur
  function showGridError(message) {
    const li = document.createElement('li');
    li.className = 'listing-grid__loading';
    li.setAttribute('role', 'alert');
    const p = document.createElement('p');
    p.textContent = message;
    li.appendChild(p);
    resultsGrid.appendChild(li);
  }

  // annonce pour les lecteurs d'ecran
  function announceToSR(message) {
    const el = document.createElement('p');
    el.className = 'visually-hidden';
    el.setAttribute('role', 'status');
    el.textContent = message;
    resultsGrid.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

})();
