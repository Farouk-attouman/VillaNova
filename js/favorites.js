// gestion des favoris via Supabase

window.VillaNova = window.VillaNova || {};

(function () {
  'use strict';

  // Liste locale des favoris (des uid), pour éviter de réinterroger la base sans arrêt.
  const favSet = new Set();

  // --- Chargement initial ---

  // Récupère les favoris de l'utilisateur connecté et remplit favSet.
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
    data.forEach(function (row) {
      favSet.add(row.event_uid);
    });

    updateAllHearts();
  }

  // --- Ajout / retrait ---

  // Ajoute ou retire un favori selon qu'il y est déjà ou non.
  async function toggle(uid) {
    const session = await VillaNova.auth.getSession();
    if (!session) {
      window.location.href = 'connexion.html';
      return;
    }

    uid = String(uid);

    if (favSet.has(uid)) {
      await removeFavorite(session.user.id, uid);
    } else {
      await addFavorite(session.user.id, uid);
    }

    updateAllHearts();
  }

  // Enregistre un favori dans la base.
  async function addFavorite(userId, uid) {
    const { error } = await VillaNova.supabase
      .from('favorites')
      .insert({ user_id: userId, event_uid: uid });

    if (!error) favSet.add(uid);
  }

  // Supprime un favori de la base.
  async function removeFavorite(userId, uid) {
    const { error } = await VillaNova.supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('event_uid', uid);

    if (!error) favSet.delete(uid);
  }

  // --- Lecture ---

  // Vrai si l'événement est en favori (lecture locale, sans requête).
  function isInList(uid) {
    return favSet.has(String(uid));
  }

  // Renvoie la liste de tous les uid en favori.
  function getAll() {
    return Array.from(favSet);
  }

  // --- Affichage des cœurs ---

  // Met chaque bouton cœur de la page dans le bon état (plein / vide).
  function updateAllHearts() {
    const buttons = document.querySelectorAll('.event-card__fav');
    buttons.forEach(function (btn) {
      const isFav = favSet.has(btn.getAttribute('data-uid'));

      btn.classList.toggle('event-card__fav--active', isFav);
      btn.textContent = isFav ? '♥' : '♡';
      btn.setAttribute('aria-label', isFav ? 'Retirer des favoris' : 'Ajouter aux favoris');
    });
  }

  // On charge les favoris au démarrage.
  loadUserFavorites();

  VillaNova.favorites = {
    toggle: toggle,
    isInList: isInList,
    getAll: getAll,
    updateAllHearts: updateAllHearts,
    loadUserFavorites: loadUserFavorites
  };
})();