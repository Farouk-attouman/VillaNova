// gestion des favoris via Supabase

window.VillaNova = window.VillaNova || {};

(function () {
  // set local pour eviter des requetes repetees
  const favSet = new Set();
  let loaded = false;

  // charge tous les favoris de l'utilisateur au demarrage
  async function loadUserFavorites() {
    const session = await VillaNova.auth.getSession();
    if (!session) return;

    const { data, error } = await VillaNova.supabase
      .from('favorites')
      .select('event_uid')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Erreur chargement favoris:', error);
      return;
    }

    favSet.clear();
    for (let i = 0; i < data.length; i++) {
      favSet.add(data[i].event_uid);
    }
    loaded = true;

    // met a jour les boutons coeur deja affiches
    updateAllHearts();
  }

  // ajoute ou retire un favori
  async function toggle(uid) {
    const session = await VillaNova.auth.getSession();
    if (!session) {
      window.location.href = 'connexion.html';
      return;
    }

    uid = String(uid);

    if (favSet.has(uid)) {
      // retirer
      const { error } = await VillaNova.supabase
        .from('favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('event_uid', uid);

      if (!error) favSet.delete(uid);
    } else {
      // ajouter
      const { error } = await VillaNova.supabase
        .from('favorites')
        .insert({ user_id: session.user.id, event_uid: uid });

      if (!error) favSet.add(uid);
    }

    updateAllHearts();
  }

  // verifie si un evenement est en favori (lecture locale)
  function isInList(uid) {
    return favSet.has(String(uid));
  }

  // retourne tous les UIDs en favori
  function getAll() {
    return Array.from(favSet);
  }

  // met a jour l'apparence de tous les boutons coeur sur la page
  function updateAllHearts() {
    const buttons = document.querySelectorAll('.event-card__fav');
    for (let i = 0; i < buttons.length; i++) {
      const uid = buttons[i].getAttribute('data-uid');
      if (favSet.has(uid)) {
        buttons[i].classList.add('event-card__fav--active');
        buttons[i].textContent = '♥';
        buttons[i].setAttribute('aria-label', 'Retirer des favoris');
      } else {
        buttons[i].classList.remove('event-card__fav--active');
        buttons[i].textContent = '♡';
        buttons[i].setAttribute('aria-label', 'Ajouter aux favoris');
      }
    }
  }

  // on charge les favoris au demarrage
  loadUserFavorites();

  VillaNova.favorites = {
    toggle: toggle,
    isInList: isInList,
    getAll: getAll,
    updateAllHearts: updateAllHearts,
    loadUserFavorites: loadUserFavorites
  };
})();
