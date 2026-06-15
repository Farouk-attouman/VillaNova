// section "Gratuit cette semaine" - chargement dynamique

(function () {
  'use strict';

  var freeList = document.getElementById('free-list');
  if (!freeList) return;

  // formate la date courte : "Mer. 13 mai"
  function formatShortDate(timing) {
    if (!timing || !timing.begin) return '';
    var date = new Date(timing.begin);
    var str = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long'
    }).format(date);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // formate la date ISO pour l'attribut datetime
  function toISODate(timing) {
    if (!timing || !timing.begin) return '';
    return timing.begin.substring(0, 10);
  }

  // verifie si un evenement est gratuit
  function isFree(event) {
    var conditions = (event.conditions && event.conditions.fr) || '';
    if (!conditions) return false;
    var lower = conditions.toLowerCase();
    return lower.includes('gratuit') || lower.includes('libre') || lower.includes('free');
  }

  // trouve la categorie de l'evenement
  function getCategory(event) {
    var textes = [];
    if (event.keywords && event.keywords.fr) {
      textes = textes.concat(event.keywords.fr);
    }
    if (event.title && event.title.fr) textes.push(event.title.fr);

    var combined = textes.join(' ').toLowerCase();
    var categories = [
      'concert', 'musique', 'exposition', 'expo', 'théâtre', 'theatre',
      'danse', 'atelier', 'festival', 'cinéma', 'cinema', 'conférence',
      'patrimoine', 'visite', 'littérature', 'spectacle'
    ];

    for (var i = 0; i < categories.length; i++) {
      if (combined.includes(categories[i])) {
        return categories[i].charAt(0).toUpperCase() + categories[i].slice(1);
      }
    }
    return 'Événement';
  }

  // cree un element de la liste
  function createFreeItem(event, index) {
    var li = document.createElement('li');

    var a = document.createElement('a');
    a.href = 'evenements.html?uid=' + event.uid;
    a.className = 'free-list__item';

    // numero
    var num = document.createElement('span');
    num.className = 'free-list__num';
    num.textContent = (index + 1 < 10 ? '0' : '') + (index + 1);
    a.appendChild(num);

    // corps
    var body = document.createElement('div');
    body.className = 'free-list__body';

    var h3 = document.createElement('h3');
    h3.textContent = VillaNova.truncate((event.title && event.title.fr) || 'Événement', 45);
    body.appendChild(h3);

    var p = document.createElement('p');
    var category = getCategory(event);
    var location = (event.location && event.location.name) || '';
    p.textContent = category + (location ? ' · ' + location : '');
    body.appendChild(p);

    a.appendChild(body);

    // date
    if (event.firstTiming) {
      var time = document.createElement('time');
      time.setAttribute('datetime', toISODate(event.firstTiming));
      time.className = 'free-list__date';
      time.textContent = formatShortDate(event.firstTiming);
      a.appendChild(time);
    }

    // fleche
    var arrow = document.createElement('span');
    arrow.className = 'free-list__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    a.appendChild(arrow);

    li.appendChild(a);
    return li;
  }

  // calcule le lundi et dimanche de la semaine en cours
  function getCurrentWeekRange() {
    var now = new Date();
    var day = now.getDay(); // 0 = dimanche, 1 = lundi ...
    var diffToMonday = day === 0 ? -6 : 1 - day;

    var monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // format YYYY-MM-DD
    function toISO(d) {
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }

    return { start: toISO(monday), end: toISO(sunday) };
  }

  // charge les evenements gratuits de la semaine
  async function loadFreeEvents() {
    VillaNova.clearChildren(freeList);

    // message de chargement
    var loadingLi = document.createElement('li');
    loadingLi.className = 'free-list__loading';
    loadingLi.textContent = 'Chargement…';
    freeList.appendChild(loadingLi);

    try {
      var week = getCurrentWeekRange();

      // on recupere les evenements gratuits de la semaine en cours
      var data = await VillaNova.api.fetchEvents({
        limit: 50,
        offset: 0,
        search: 'gratuit',
        'timings[gte]': week.start,
        'timings[lte]': week.end
      });

      var freeEvents = [];
      for (var i = 0; i < data.events.length; i++) {
        if (isFree(data.events[i])) {
          freeEvents.push(data.events[i]);
        }
        if (freeEvents.length >= 4) break;
      }

      VillaNova.clearChildren(freeList);

      if (freeEvents.length === 0) {
        var emptyLi = document.createElement('li');
        emptyLi.className = 'free-list__loading';
        emptyLi.textContent = 'Aucun événement gratuit cette semaine.';
        freeList.appendChild(emptyLi);
        return;
      }

      for (var j = 0; j < freeEvents.length; j++) {
        freeList.appendChild(createFreeItem(freeEvents[j], j));
      }

    } catch (err) {
      VillaNova.clearChildren(freeList);
      var errorLi = document.createElement('li');
      errorLi.className = 'free-list__loading';
      errorLi.textContent = 'Impossible de charger les événements gratuits.';
      freeList.appendChild(errorLi);
      console.error('Erreur chargement gratuits:', err);
    }
  }

  loadFreeEvents();
})();
