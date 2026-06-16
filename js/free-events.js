// section "Gratuit cette semaine"

(function () {
  'use strict';

  const freeList = document.getElementById('free-list');
  if (!freeList) return;

  function formatShortDate(timing) {
    if (!timing || !timing.begin) return '';
    const date = new Date(timing.begin);
    let str = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'long'
    }).format(date);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function toISODate(timing) {
    if (!timing || !timing.begin) return '';
    return timing.begin.substring(0, 10);
  }

  function isFree(event) {
    const cond = (event.conditions && event.conditions.fr) || '';
    if (!cond) return false;
    const lower = cond.toLowerCase();
    return lower.includes('gratuit') || lower.includes('libre') || lower.includes('free');
  }

  function getCategory(event) {
    let textes = [];
    if (event.keywords && event.keywords.fr) textes = textes.concat(event.keywords.fr);
    if (event.title && event.title.fr) textes.push(event.title.fr);

    const combined = textes.join(' ').toLowerCase();
    const cats = [
      'concert', 'musique', 'exposition', 'expo', 'théâtre', 'theatre',
      'danse', 'atelier', 'festival', 'cinéma', 'cinema', 'conférence',
      'patrimoine', 'visite', 'littérature', 'spectacle'
    ];
    for (let i = 0; i < cats.length; i++) {
      if (combined.includes(cats[i])) {
        return cats[i].charAt(0).toUpperCase() + cats[i].slice(1);
      }
    }
    return 'Événement';
  }

  function createFreeItem(event, index) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = 'evenements.html?uid=' + event.uid;
    a.className = 'free-list__item';

    // numero
    const num = document.createElement('span');
    num.className = 'free-list__num';
    num.textContent = (index + 1 < 10 ? '0' : '') + (index + 1);
    a.appendChild(num);

    // corps
    const body = document.createElement('div');
    body.className = 'free-list__body';
    const h3 = document.createElement('h3');
    h3.textContent = VillaNova.truncate((event.title && event.title.fr) || 'Événement', 45);
    body.appendChild(h3);
    const p = document.createElement('p');
    const loc = (event.location && event.location.name) || '';
    p.textContent = getCategory(event) + (loc ? ' · ' + loc : '');
    body.appendChild(p);
    a.appendChild(body);

    if (event.firstTiming) {
      const time = document.createElement('time');
      time.setAttribute('datetime', toISODate(event.firstTiming));
      time.className = 'free-list__date';
      time.textContent = formatShortDate(event.firstTiming);
      a.appendChild(time);
    }

    const arrow = document.createElement('span');
    arrow.className = 'free-list__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    a.appendChild(arrow);

    li.appendChild(a);
    return li;
  }

  function getCurrentWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    function pad(d) {
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }
    return { start: pad(monday), end: pad(sunday) };
  }

  async function loadFreeEvents() {
    VillaNova.clearChildren(freeList);

    const loadingLi = document.createElement('li');
    loadingLi.className = 'free-list__loading';
    loadingLi.textContent = 'Chargement…';
    freeList.appendChild(loadingLi);

    try {
      const week = getCurrentWeekRange();
      const data = await VillaNova.api.fetchEvents({
        limit: 50, offset: 0, search: 'gratuit',
        'timings[gte]': week.start,
        'timings[lte]': week.end
      });

      const freeEvents = [];
      for (let i = 0; i < data.events.length && freeEvents.length < 4; i++) {
        if (isFree(data.events[i])) freeEvents.push(data.events[i]);
      }

      VillaNova.clearChildren(freeList);

      if (!freeEvents.length) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'free-list__loading';
        emptyLi.textContent = 'Aucun événement gratuit cette semaine.';
        freeList.appendChild(emptyLi);
        return;
      }

      for (let j = 0; j < freeEvents.length; j++) {
        freeList.appendChild(createFreeItem(freeEvents[j], j));
      }
    } catch (err) {
      VillaNova.clearChildren(freeList);
      const errorLi = document.createElement('li');
      errorLi.className = 'free-list__loading';
      errorLi.textContent = 'Impossible de charger les événements gratuits.';
      freeList.appendChild(errorLi);
      console.error('Erreur chargement gratuits:', err);
    }
  }

  loadFreeEvents();
})();
