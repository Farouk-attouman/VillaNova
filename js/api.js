// appels API OpenAgenda

window.VillaNova = window.VillaNova || {};

(function () {
  'use strict';

  const API_BASE = 'https://api.openagenda.com/v2/agendas/69319016';
  const API_KEY = '9b8456d08b924cd68820a420f3360c85';

  function buildUrl(path, params) {
    const url = new URL(path);
    for (const key in params) {
      const val = params[key];
      if (val === undefined || val === null || val === '') continue;
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) url.searchParams.append(key, val[i]);
      } else {
        url.searchParams.set(key, val);
      }
    }
    return url.toString();
  }

  async function fetchEvents(params) {
    params = params || {};
    const hasTimings = params['timings[gte]'] || params['timings[lte]'];

    const query = {
      key: API_KEY,
      detailed: 1,
      limit: params.limit || 10,
      offset: params.offset || 0
    };

    if (!hasTimings) query['relative[]'] = ['current', 'upcoming'];

    for (const key in params) {
      if (key !== 'limit' && key !== 'offset') query[key] = params[key];
    }

    const response = await fetch(buildUrl(API_BASE + '/events', query));
    if (!response.ok) throw new Error('Erreur API : ' + response.status);
    return response.json();
  }

  async function fetchEvent(uid) {
    const url = buildUrl(API_BASE + '/events/' + uid, { key: API_KEY, detailed: 1 });
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur API : ' + response.status);
    const data = await response.json();
    return data.event || data;
  }

  VillaNova.api = { fetchEvents: fetchEvents, fetchEvent: fetchEvent };
})();
