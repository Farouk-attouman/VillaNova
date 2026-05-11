// VillaNova - API OpenAgenda
// Configuration et fonctions fetch async/await.

window.VillaNova = window.VillaNova || {};

(function () {
  'use strict';

  const API_BASE = 'https://api.openagenda.com/v2/agendas/69319016';
  const API_KEY = '9b8456d08b924cd68820a420f3360c85';

  /**
   * Construit une URL avec query params.
   * Gere les tableaux (ex: relative[] = ['current','upcoming']).
   */
  function buildUrl(path, params) {
    const url = new URL(path);
    Object.keys(params).forEach(function (key) {
      const val = params[key];
      if (val === undefined || val === null || val === '') return;
      if (Array.isArray(val)) {
        val.forEach(function (v) {
          url.searchParams.append(key, v);
        });
      } else {
        url.searchParams.set(key, val);
      }
    });
    return url.toString();
  }

  /**
   * Recupere une liste d'evenements.
   * @param {Object} params - Parametres optionnels :
   *   limit, offset, search, relative[], timings[gte], timings[lte]
   * @returns {Promise<{events: Array, total: number}>}
   */
  async function fetchEvents(params) {
    params = params || {};
    const defaults = {
      key: API_KEY,
      detailed: 1,
      'relative[]': ['current', 'upcoming'],
      limit: params.limit || 10,
      offset: params.offset || 0
    };

    // Merge avec les params passes (sauf limit/offset deja geres)
    const merged = Object.assign({}, defaults);
    Object.keys(params).forEach(function (key) {
      if (key !== 'limit' && key !== 'offset') {
        merged[key] = params[key];
      }
    });

    const url = buildUrl(API_BASE + '/events', merged);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Erreur API : ' + response.status + ' ' + response.statusText);
    }

    return response.json();
  }

  /**
   * Recupere un evenement par son UID.
   * @param {number|string} uid
   * @returns {Promise<Object>} L'objet evenement complet
   */
  async function fetchEvent(uid) {
    const url = buildUrl(API_BASE + '/events/' + uid, {
      key: API_KEY,
      detailed: 1
    });

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Erreur API : ' + response.status + ' ' + response.statusText);
    }

    const data = await response.json();
    return data.event || data;
  }

  // Expose sur le namespace
  VillaNova.api = {
    fetchEvents: fetchEvents,
    fetchEvent: fetchEvent
  };
})();
