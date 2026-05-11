// VillaNova - Event Card Builder
// Construit les cartes evenement via createElement (anti-XSS).

window.VillaNova = window.VillaNova || {};

(function () {
  'use strict';

  // Mapping mots-cles → classe CSS du tag
  var TAG_MAP = {
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

  /**
   * Formate une date ISO en format francais court.
   * Ex: "2026-05-09T20:00:00" → "Sam. 9 mai · 20h00"
   */
  function formatEventDate(timing) {
    if (!timing || !timing.begin) return '';

    var date = new Date(timing.begin);
    var dayStr = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date);

    // Capitaliser la premiere lettre
    dayStr = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);

    var hours = date.getHours();
    var minutes = date.getMinutes();
    var timeStr = hours + 'h' + (minutes < 10 ? '0' : '') + minutes;

    return dayStr + ' · ' + timeStr;
  }

  /**
   * Tronque un texte a N caracteres.
   */
  function truncate(text, max) {
    if (!text || text.length <= max) return text || '';
    return text.substring(0, max).replace(/\s+\S*$/, '') + '…';
  }

  /**
   * Vide tous les enfants d'un element.
   */
  function clearChildren(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  /**
   * Determine le tag (categorie) d'un evenement.
   * Cherche dans keywords, title, description.
   */
  function resolveTag(event) {
    var searchTexts = [];

    // Keywords
    if (event.keywords && event.keywords.fr) {
      searchTexts = searchTexts.concat(event.keywords.fr);
    }

    // Title et description
    if (event.title && event.title.fr) searchTexts.push(event.title.fr);
    if (event.description && event.description.fr) searchTexts.push(event.description.fr);

    var combined = searchTexts.join(' ').toLowerCase();

    var keys = Object.keys(TAG_MAP);
    for (var i = 0; i < keys.length; i++) {
      if (combined.indexOf(keys[i]) !== -1) {
        return TAG_MAP[keys[i]];
      }
    }

    return { css: 'tag--concert', label: 'Événement' };
  }

  /**
   * Extrait le prix depuis le champ conditions.
   * Retourne { label, free }.
   */
  function extractPrice(event) {
    var conditions = (event.conditions && event.conditions.fr) || '';
    if (!conditions) {
      return { label: 'Voir tarifs', free: false };
    }

    var lower = conditions.toLowerCase();
    if (lower.indexOf('gratuit') !== -1 || lower.indexOf('libre') !== -1 || lower.indexOf('free') !== -1) {
      return { label: 'Gratuit', free: true };
    }

    return { label: truncate(conditions, 20), free: false };
  }

  /**
   * Construit l'URL de l'image d'un evenement.
   * @param {Object} event
   * @param {string} size - 'base', 'full' ou 'thumbnail'
   */
  function getImageUrl(event, size) {
    if (!event.image || !event.image.base) return null;

    if (size === 'base' || !size) {
      return event.image.base + event.image.filename;
    }

    if (event.image.variants) {
      for (var i = 0; i < event.image.variants.length; i++) {
        if (event.image.variants[i].type === size) {
          return event.image.base + event.image.variants[i].filename;
        }
      }
    }

    return event.image.base + event.image.filename;
  }

  /**
   * Cree un element de carte evenement (DOM pur).
   * @param {Object} event
   * @param {Object} options
   * @returns {HTMLElement}
   */
  function createEventCard(event, options) {
    options = options || {};
    var large = options.large || false;

    var li = document.createElement('li');
    if (large) li.className = 'featured-grid__hero';

    var article = document.createElement('article');
    article.className = large ? 'event-card event-card--large' : 'event-card';

    // Media
    var media = document.createElement('div');
    media.className = large ? 'event-card__media' : 'event-card__media event-card__media--small';

    var img = document.createElement('img');
    var imgUrl = getImageUrl(event, large ? 'full' : 'base');
    img.src = imgUrl || 'assets/img/featured/event-nuit-sons.webp';
    img.alt = (event.title && event.title.fr) || 'Événement';
    img.width = large ? 900 : 600;
    img.height = large ? 1100 : 400;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.appendChild(img);

    // Tag categorie
    var tagInfo = resolveTag(event);
    var tag = document.createElement('span');
    tag.className = 'tag ' + tagInfo.css;
    tag.textContent = '● ' + tagInfo.label;
    media.appendChild(tag);

    // Date sur l'image (carte large uniquement)
    if (large && event.firstTiming) {
      var dateSpan = document.createElement('span');
      dateSpan.className = 'event-card__date';
      dateSpan.textContent = formatEventDate(event.firstTiming);
      media.appendChild(dateSpan);
    }

    article.appendChild(media);

    // Body
    var body = document.createElement('div');
    body.className = 'event-card__body';

    // Date dans le body
    if (!large && event.firstTiming) {
      var dateP = document.createElement('p');
      dateP.className = 'event-card__date';
      dateP.textContent = formatEventDate(event.firstTiming);
      body.appendChild(dateP);
    }

    // Titre avec lien
    var h3 = document.createElement('h3');
    var link = document.createElement('a');
    link.href = 'evenements.html?uid=' + event.uid;
    link.textContent = (event.title && event.title.fr) || 'Événement';
    h3.appendChild(link);
    body.appendChild(h3);

    // Description (carte large uniquement)
    if (large && event.description && event.description.fr) {
      var desc = document.createElement('p');
      desc.className = 'event-card__desc';
      desc.textContent = truncate(event.description.fr, 120);
      body.appendChild(desc);
    }

    // Footer : lieu + prix
    var footer = document.createElement('p');
    footer.className = 'event-card__footer';

    var location = document.createElement('span');
    location.className = 'event-card__location';

    var locIcon = document.createElement('img');
    locIcon.src = 'assets/icons/location.svg';
    locIcon.alt = '';
    locIcon.width = 12;
    locIcon.height = 12;
    locIcon.setAttribute('aria-hidden', 'true');
    location.appendChild(locIcon);
    location.appendChild(document.createTextNode(' ' + ((event.location && event.location.name) || 'Lieu à confirmer')));
    footer.appendChild(location);

    var priceInfo = extractPrice(event);
    var price = document.createElement('span');
    price.className = priceInfo.free ? 'event-card__price event-card__price--free' : 'event-card__price';
    price.textContent = priceInfo.label;
    footer.appendChild(price);

    body.appendChild(footer);
    article.appendChild(body);
    li.appendChild(article);

    return li;
  }

  // Expose
  VillaNova.createEventCard = createEventCard;
  VillaNova.formatEventDate = formatEventDate;
  VillaNova.clearChildren = clearChildren;
  VillaNova.getImageUrl = getImageUrl;
  VillaNova.extractPrice = extractPrice;
  VillaNova.truncate = truncate;
})();
