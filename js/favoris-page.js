// page mes favoris

(function () {
  const grid = document.getElementById('favoris-grid');
  const countEl = document.getElementById('favoris-count');
  if (!grid) return;

  async function init() {
    const session = await VillaNova.auth.getSession();

    // pas connecte → message avec lien
    if (!session) {
      VillaNova.clearChildren(grid);
      const li = document.createElement('li');
      li.className = 'listing-grid__loading';
      li.innerHTML = '<p>Connectez-vous pour voir vos favoris.<br><a href="connexion.html" class="btn btn--primary" style="margin-top:1rem">Se connecter</a></p>';
      grid.appendChild(li);
      return;
    }

    // on attend que les favoris soient charges
    await VillaNova.favorites.loadUserFavorites();
    const uids = VillaNova.favorites.getAll();

    if (!uids.length) {
      VillaNova.clearChildren(grid);
      const li = document.createElement('li');
      li.className = 'listing-grid__loading';
      li.innerHTML = '<p>Vous n\'avez pas encore de favoris.<br><a href="tous-les-evenements.html" class="btn btn--ghost" style="margin-top:1rem">Explorer les événements</a></p>';
      grid.appendChild(li);
      if (countEl) countEl.textContent = '0 favori';
      return;
    }

    // charger chaque evenement favori depuis l'API
    VillaNova.clearChildren(grid);
    let loaded = 0;

    for (let i = 0; i < uids.length; i++) {
      try {
        const event = await VillaNova.api.fetchEvent(uids[i]);
        grid.appendChild(VillaNova.createEventCard(event));
        loaded++;
      } catch (err) {
        console.error('Erreur chargement favori ' + uids[i], err);
      }
    }

    if (countEl) {
      countEl.textContent = loaded + ' favori' + (loaded > 1 ? 's' : '');
    }

    // met a jour les coeurs apres le rendu
    VillaNova.favorites.updateAllHearts();
  }

  init();
})();
