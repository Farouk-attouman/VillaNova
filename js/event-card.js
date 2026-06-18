// fabrique de cartes evenement + utilitaires partages

window.VillaNova = window.VillaNova || {};

(function () {
  'use strict';

  const TAG_MAP = {
    'concert': { css: 'tag--concert', label: 'Concert' },
    'musique': { css: 'tag--concert', label: 'Concert' },
    'exposition': { css: 'tag--expo', label: 'Exposition' },
    'expo': { css: 'tag--expo', label: 'Exposition' },
    'théâtre': { css: 'tag--theatre', label: 'Théâtre' },
    'theatre': { css: 'tag--theatre', label: 'Théâtre' },
    'danse': { css: 'tag--danse', label: 'Danse' },
    'atelier': { css: 'tag--atelier', label: 'Atelier' },
    'festival': { css: 'tag--concert', label: 'Festival' },
    'spectacle': { css: 'tag--theatre', label: 'Spectacle' },
    'cinéma': { css: 'tag--theatre', label: 'Cinéma' },
    'cinema': { css: 'tag--theatre', label: 'Cinéma' },
    'conférence': { css: 'tag--atelier', label: 'Conférence' },
    'salon': { css: 'tag--expo', label: 'Salon' },
    'patrimoine': { css: 'tag--expo', label: 'Patrimoine' },
    'visite': { css: 'tag--expo', label: 'Visite' }
  };

  function formatEventDate(timing) {
    if (!timing || !timing.begin) return '';
    const date = new Date(timing.begin);
    let dayStr = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short'
    }).format(date);
    dayStr = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);

    const h = date.getHours();
    const m = date.getMinutes();
    return dayStr + ' · ' + h + 'h' + (m < 10 ? '0' : '') + m;
  }

  function truncate(text, max) {
    if (!text || text.length <= max) return text || '';
    return text.substring(0, max).replace(/\s+\S*$/, '') + '…';
  }

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function resolveTag(event) {
    let textes = [];
    if (event.keywords && event.keywords.fr) textes = textes.concat(event.keywords.fr);
    if (event.title && event.title.fr) textes.push(event.title.fr);
    if (event.description && event.description.fr) textes.push(event.description.fr);

    const combined = textes.join(' ').toLowerCase();
    const keys = Object.keys(TAG_MAP);
    for (let i = 0; i < keys.length; i++) {
      if (combined.includes(keys[i])) return TAG_MAP[keys[i]];
    }
    return { css: 'tag--concert', label: 'Événement' };
  }

  function extractPrice(event) {
    const conditions = (event.conditions && event.conditions.fr) || '';
    if (!conditions) return { label: 'Voir tarifs', free: false };
    const lower = conditions.toLowerCase();
    if (lower.includes('gratuit') || lower.includes('libre') || lower.includes('free')) {
      return { label: 'Gratuit', free: true };
    }
    return { label: truncate(conditions, 20), free: false };
  }

  function getImageUrl(event, size) {
    if (!event.image || !event.image.base) return null;
    if (size === 'base' || !size) return event.image.base + event.image.filename;

    if (event.image.variants) {
      for (let i = 0; i < event.image.variants.length; i++) {
        if (event.image.variants[i].type === size) {
          return event.image.base + event.image.variants[i].filename;
        }
      }
    }
    return event.image.base + event.image.filename;
  }

  function createEventCard(event, options) {
    options = options || {};
    const large = options.large || false;

    const li = document.createElement('li');
    if (large) li.className = 'featured-grid__hero';

    const article = document.createElement('article');
    article.className = large ? 'event-card event-card--large' : 'event-card';

    // image
    const media = document.createElement('div');
    media.className = large ? 'event-card__media' : 'event-card__media event-card__media--small';

    const img = document.createElement('img');
    img.src = getImageUrl(event, large ? 'full' : 'base') || 'assets/img/featured/event-nuit-sons.webp';
    img.alt = (event.title && event.title.fr) || 'Événement';
    img.width = large ? 900 : 600;
    img.height = large ? 1100 : 400;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.appendChild(img);

    const tagInfo = resolveTag(event);
    const tag = document.createElement('span');
    tag.className = 'tag ' + tagInfo.css;
    tag.textContent = '● ' + tagInfo.label;
    media.appendChild(tag);

    // date sur l'image (carte large uniquement)
    if (large && event.firstTiming) {
      const dateSpan = document.createElement('span');
      dateSpan.className = 'event-card__date';
      dateSpan.textContent = formatEventDate(event.firstTiming);
      media.appendChild(dateSpan);
    }

    // bouton favori
    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = 'event-card__fav';
    favBtn.setAttribute('data-uid', String(event.uid));
    favBtn.textContent = '♡';
    favBtn.setAttribute('aria-label', 'Ajouter aux favoris');
    favBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (VillaNova.favorites) VillaNova.favorites.toggle(event.uid);
    });
    media.appendChild(favBtn);

    article.appendChild(media);

    // corps
    const body = document.createElement('div');
    body.className = 'event-card__body';

    if (!large && event.firstTiming) {
      const dateP = document.createElement('p');
      dateP.className = 'event-card__date';
      dateP.textContent = formatEventDate(event.firstTiming);
      body.appendChild(dateP);
    }

    const h3 = document.createElement('h3');
    const link = document.createElement('a');
    link.href = 'evenements.html?uid=' + event.uid;
    link.textContent = (event.title && event.title.fr) || 'Événement';
    h3.appendChild(link);
    body.appendChild(h3);

    if (large && event.description && event.description.fr) {
      const desc = document.createElement('p');
      desc.className = 'event-card__desc';
      desc.textContent = truncate(event.description.fr, 120);
      body.appendChild(desc);
    }

    // footer : lieu + prix
    const footer = document.createElement('p');
    footer.className = 'event-card__footer';

    const location = document.createElement('span');
    location.className = 'event-card__location';
    const locIcon = document.createElement('img');
    locIcon.src = 'assets/icons/location.svg';
    locIcon.alt = '';
    locIcon.width = 12;
    locIcon.height = 12;
    locIcon.setAttribute('aria-hidden', 'true');
    location.appendChild(locIcon);
    location.appendChild(document.createTextNode(' ' + ((event.location && event.location.name) || 'Lieu à confirmer')));
    footer.appendChild(location);

    const priceInfo = extractPrice(event);
    const price = document.createElement('span');
    price.className = priceInfo.free ? 'event-card__price event-card__price--free' : 'event-card__price';
    price.textContent = priceInfo.label;
    footer.appendChild(price);

    body.appendChild(footer);
    article.appendChild(body);
    li.appendChild(article);
    return li;
  }

  // utilitaires partages entre les pages (grilles)
  function showGridError(grid, message) {
    const li = document.createElement('li');
    li.className = 'listing-grid__loading';
    li.setAttribute('role', 'alert');
    const p = document.createElement('p');
    p.textContent = message;
    li.appendChild(p);
    grid.appendChild(li);
  }

  function announceToSR(container, message) {
    const el = document.createElement('p');
    el.className = 'visually-hidden';
    el.setAttribute('role', 'status');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

  VillaNova.createEventCard = createEventCard;
  VillaNova.formatEventDate = formatEventDate;
  VillaNova.clearChildren = clearChildren;
  VillaNova.getImageUrl = getImageUrl;
  VillaNova.extractPrice = extractPrice;
  VillaNova.truncate = truncate;
  VillaNova.showGridError = showGridError;
  VillaNova.announceToSR = announceToSR;
})();
