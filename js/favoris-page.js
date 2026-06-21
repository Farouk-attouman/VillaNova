// page mes favoris

(function () {
  'use strict';

  const grid = document.getElementById('favoris-grid');
  const countEl = document.getElementById('favoris-count');
  if (!grid) return;

  // Affiche un message simple à la place de la grille.
  function showMessage(html) {
    VillaNova.clearChildren(grid);
    const li = document.createElement('li');
    li.className = 'listing-grid__loading';
    li.innerHTML = html;
    grid.appendChild(li);
  }

  // Met à jour le compteur "X favoris".
  function updateCount(count) {
    if (!countEl) return;
    countEl.textContent = count + ' favori' + (count > 1 ? 's' : '');
  }

  // Charge et affiche chaque événement favori, un par un.
  async function renderFavorites(uids) {
    VillaNova.clearChildren(grid);
    let loaded = 0;

    for (const uid of uids) {
      try {
        const event = await VillaNova.api.fetchEvent(uid);
        grid.appendChild(VillaNova.createEventCard(event));
        loaded++;
      } catch (err) {
        console.error('Erreur chargement favori ' + uid, err);
      }
    }

    updateCount(loaded);
    VillaNova.favorites.updateAllHearts();
  }

  async function init() {
    const session = await VillaNova.auth.getSession();

    // Cas 1 : pas connecté → on invite à se connecter.
    if (!session) {
      showMessage('<p>Connectez-vous pour voir vos favoris.<br><a href="connexion.html" class="btn btn--primary" style="margin-top:1rem">Se connecter</a></p>');
      return;
    }

    // On attend que la liste des favoris soit chargée.
    await VillaNova.favorites.loadUserFavorites();
    const uids = VillaNova.favorites.getAll();

    // Cas 2 : connecté mais aucun favori → on invite à explorer.
    if (!uids.length) {
      showMessage('<p>Vous n\'avez pas encore de favoris.<br><a href="tous-les-evenements.html" class="btn btn--ghost" style="margin-top:1rem">Explorer les événements</a></p>');
      updateCount(0);
      return;
    }

    // Cas 3 : on affiche les favoris.
    await renderFavorites(uids);
  }

  init();
})();