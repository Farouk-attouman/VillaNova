window.VillaNova = window.VillaNova || {};

(function () {
  const API_BASE = VillaNova.config.openAgendaBase;
  const API_KEY = VillaNova.config.openAgendaKey;

  // Construit une URL en ajoutant les paramètres un par un.
  function buildUrl(path, params) {
    const url = new URL(path);

    // On parcourt chaque paramètre sous la forme (clé, valeur).
    for (const [key, value] of Object.entries(params)) {
      // On ignore les valeurs vides.
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Un tableau = plusieurs valeurs pour la même clé.
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

  // Va chercher du JSON à une URL. Lève une erreur si la requête échoue.
  async function getJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Erreur API : ' + response.status);
    }

    return response.json();
  }

  // Récupère une liste d'événements.
  async function fetchEvents(params = {}) {
    // On part d'une copie des filtres reçus.
    const query = { ...params };

    // Paramètres qu'on envoie toujours.
    query.key = API_KEY;
    query.detailed = 1;
    query.limit = params.limit || 10;
    query.offset = params.offset || 0;

    // Sans filtre de date, on n'affiche que les événements en cours / à venir.
    const aUnFiltreDeDate = params['timings[gte]'] || params['timings[lte]'];
    if (!aUnFiltreDeDate) {
      query['relative[]'] = ['current', 'upcoming'];
    }

    const url = buildUrl(API_BASE + '/events', query);
    return getJson(url);
  }

  // Récupère un seul événement grâce à son identifiant (uid).
  async function fetchEvent(uid) {
    const url = buildUrl(API_BASE + '/events/' + uid, {
      key: API_KEY,
      detailed: 1
    });

    const data = await getJson(url);

    // L'API renvoie parfois { event: {...} }, parfois directement l'objet.
    return data.event || data;
  }

  // On rend ces deux fonctions accessibles aux autres fichiers.
  VillaNova.api = {
    fetchEvents: fetchEvents,
    fetchEvent: fetchEvent
  };
})();