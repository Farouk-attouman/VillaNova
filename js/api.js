window.VillaNova = window.VillaNova || {};

(function () {
  const API_BASE = VillaNova.config.openAgendaBase;
  const API_KEY = VillaNova.config.openAgendaKey;

  // Construit une URL
  function buildUrl(path, params) {
    const url = new URL(path);

    // parcourt chaque paramètre sous la forme (clé, valeur)
    for (const [key, value] of Object.entries(params)) {
      // ignorer les valeurs vides.
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // plusieurs valeurs pour la même clé
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, item);
        }
      } else {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  //chercher du JSON à une URL, leve une erreur si la requete échoue
  async function getJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Erreur API : ' + response.status);
    }

    return response.json();
  }

  // récupère une liste d'événements.
  async function fetchEvents(params = {}) {
    // copie des filtres reçus
    const query = { ...params };

    // Paramètres
    query.key = API_KEY;
    query.detailed = 1;
    query.limit = params.limit || 10;
    query.offset = params.offset || 0;

    // affiche que les événements en cours / à venir
    const aUnFiltreDeDate = params['timings[gte]'] || params['timings[lte]'];
    if (!aUnFiltreDeDate) {
      query['relative[]'] = ['current', 'upcoming'];
    }

    const url = buildUrl(API_BASE + '/events', query);
    return getJson(url);
  }

  // Récupère un seul événement grâce à son identifiant uid
  async function fetchEvent(uid) {
    const url = buildUrl(API_BASE + '/events/' + uid, {
      key: API_KEY,
      detailed: 1
    });

    const data = await getJson(url);

    // L'API renvoie parfois { event: {...} }, parfois directement l'objet
    return data.event || data;
  }

  // rend ces deux fonctions accessibles aux autres fichiers.
  VillaNova.api = {
    fetchEvents: fetchEvents,
    fetchEvent: fetchEvent
  };
})();