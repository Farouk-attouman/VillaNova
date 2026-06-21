// section "Gratuit cette semaine"

(function () {
  'use strict';

  const freeList = document.getElementById('free-list');
  if (!freeList) return;

  // --- Petits utilitaires ---

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Affiche un message unique dans la liste (chargement, vide, erreur).
  function showMessage(text) {
    VillaNova.clearChildren(freeList);
    freeList.appendChild(createEl('li', 'free-list__loading', text));
  }

  // --- Mise en forme / déductions ---

  // Date courte : "Sam. 12 octobre".
  function formatShortDate(timing) {
    if (!timing || !timing.begin) return '';
    const date = new Date(timing.begin);
    const str = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'long'
    }).format(date);
    return capitalize(str);
  }

  // Date au format "AAAA-MM-JJ" pour l'attribut datetime.
  function toISODate(timing) {
    if (!timing || !timing.begin) return '';
    return timing.begin.substring(0, 10);
  }

  // L'événement est-il gratuit (d'après ses conditions) ?
  function isFree(event) {
    const cond = (event.conditions && event.conditions.fr) || '';
    if (!cond) return false;
    const lower = cond.toLowerCase();
    return lower.includes('gratuit') || lower.includes('libre') || lower.includes('free');
  }

  // Devine la catégorie à partir des mots-clés / titre.
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

    for (const cat of cats) {
      if (combined.includes(cat)) return capitalize(cat);
    }
    return 'Événement';
  }

  // --- Construction d'un élément de la liste ---

  function createFreeItem(event, index) {
    const li = document.createElement('li');

    const a = createEl('a', 'free-list__item');
    a.href = 'evenements.html?uid=' + event.uid;

    // Numéro (01, 02, …).
    const number = String(index + 1).padStart(2, '0');
    a.appendChild(createEl('span', 'free-list__num', number));

    // Corps : titre + (catégorie · lieu).
    const body = createEl('div', 'free-list__body');
    body.appendChild(createEl('h3', null,
      VillaNova.truncate((event.title && event.title.fr) || 'Événement', 45)));

    const loc = (event.location && event.location.name) || '';
    body.appendChild(createEl('p', null, getCategory(event) + (loc ? ' · ' + loc : '')));
    a.appendChild(body);

    // Date (si connue).
    if (event.firstTiming) {
      const time = createEl('time', 'free-list__date', formatShortDate(event.firstTiming));
      time.setAttribute('datetime', toISODate(event.firstTiming));
      a.appendChild(time);
    }

    // Flèche décorative.
    const arrow = createEl('span', 'free-list__arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    a.appendChild(arrow);

    li.appendChild(a);
    return li;
  }

  // --- Période de la semaine en cours ---

  function toLocalYMD(date) {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  function getCurrentWeekRange() {
    const now = new Date();
    const day = now.getDay();

    // Lundi de cette semaine (dimanche = 0, d'où le cas particulier).
    const monday = new Date(now);
    monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
    monday.setHours(0, 0, 0, 0);

    // Dimanche = lundi + 6 jours.
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: toLocalYMD(monday), end: toLocalYMD(sunday) };
  }

  // --- Chargement ---

  async function loadFreeEvents() {
    showMessage('Chargement…');

    try {
      const week = getCurrentWeekRange();
      const data = await VillaNova.api.fetchEvents({
        limit: 50, offset: 0, search: 'gratuit',
        'timings[gte]': week.start,
        'timings[lte]': week.end
      });

      // On garde les 4 premiers événements réellement gratuits.
      const freeEvents = [];
      for (const event of data.events) {
        if (freeEvents.length >= 4) break;
        if (isFree(event)) freeEvents.push(event);
      }

      if (!freeEvents.length) {
        showMessage('Aucun événement gratuit cette semaine.');
        return;
      }

      VillaNova.clearChildren(freeList);
      freeEvents.forEach(function (event, index) {
        freeList.appendChild(createFreeItem(event, index));
      });
    } catch (err) {
      showMessage('Impossible de charger les événements gratuits.');
      console.error('Erreur chargement gratuits:', err);
    }
  }

  loadFreeEvents();
})();