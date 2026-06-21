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

  // --- Petit utilitaire pour créer un élément HTML ---

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  // --- Utilitaires de mise en forme ---

  // Transforme un horaire en texte du genre "Sam. 12 oct · 20h30".
  function formatEventDate(timing) {
    if (!timing || !timing.begin) return '';
    const date = new Date(timing.begin);

    let dayStr = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short'
    }).format(date);
    dayStr = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);

    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return dayStr + ' · ' + hours + 'h' + minutes;
  }

  // Coupe un texte trop long sans casser le dernier mot.
  function truncate(text, max) {
    if (!text || text.length <= max) return text || '';
    return text.substring(0, max).replace(/\s+\S*$/, '') + '…';
  }

  // Vide un élément de tous ses enfants.
  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  // --- Déductions à partir des données de l'événement ---

  // Devine la catégorie (Concert, Expo…) à partir des mots-clés / titre / description.
  function resolveTag(event) {
    let textes = [];
    if (event.keywords && event.keywords.fr) textes = textes.concat(event.keywords.fr);
    if (event.title && event.title.fr) textes.push(event.title.fr);
    if (event.description && event.description.fr) textes.push(event.description.fr);

    const combined = textes.join(' ').toLowerCase();

    for (const key of Object.keys(TAG_MAP)) {
      if (combined.includes(key)) return TAG_MAP[key];
    }
    return { css: 'tag--concert', label: 'Événement' };
  }

  // Détermine si l'événement est gratuit et le texte du prix à afficher.
  function extractPrice(event) {
    const conditions = (event.conditions && event.conditions.fr) || '';
    if (!conditions) return { label: 'Voir tarifs', free: false };

    const lower = conditions.toLowerCase();
    if (lower.includes('gratuit') || lower.includes('libre') || lower.includes('free')) {
      return { label: 'Gratuit', free: true };
    }
    return { label: truncate(conditions, 20), free: false };
  }

  // Construit l'URL de l'image dans la taille demandée.
  function getImageUrl(event, size) {
    if (!event.image || !event.image.base) return null;

    // Par défaut : l'image de base.
    if (size === 'base' || !size) {
      return event.image.base + event.image.filename;
    }

    // Sinon, on cherche la variante demandée (ex : "full").
    if (event.image.variants) {
      const variant = event.image.variants.find(function (v) {
        return v.type === size;
      });
      if (variant) return event.image.base + variant.filename;
    }

    // Variante introuvable : on retombe sur l'image de base.
    return event.image.base + event.image.filename;
  }

  // --- Construction d'une carte événement ---

  // Le bouton "cœur" pour mettre en favori.
  function buildFavButton(event) {
    const btn = createEl('button', 'event-card__fav', '♡');
    btn.type = 'button';
    btn.setAttribute('data-uid', String(event.uid));
    btn.setAttribute('aria-label', 'Ajouter aux favoris');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (VillaNova.favorites) VillaNova.favorites.toggle(event.uid);
    });
    return btn;
  }

  // La partie image : photo + étiquette + (date) + bouton favori.
  function buildMedia(event, large) {
    const media = createEl('div', large
      ? 'event-card__media'
      : 'event-card__media event-card__media--small');

    const img = createEl('img');
    img.src = getImageUrl(event, large ? 'full' : 'base') || 'assets/img/featured/event-nuit-sons.webp';
    img.alt = (event.title && event.title.fr) || 'Événement';
    img.width = large ? 900 : 600;
    img.height = large ? 1100 : 400;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.appendChild(img);

    const tagInfo = resolveTag(event);
    media.appendChild(createEl('span', 'tag ' + tagInfo.css, '● ' + tagInfo.label));

    // Date sur l'image : uniquement sur la grande carte.
    if (large && event.firstTiming) {
      media.appendChild(createEl('span', 'event-card__date', formatEventDate(event.firstTiming)));
    }

    media.appendChild(buildFavButton(event));
    return media;
  }

  // Le bas de carte : lieu + prix.
  function buildFooter(event) {
    const footer = createEl('p', 'event-card__footer');

    const location = createEl('span', 'event-card__location');
    const locIcon = createEl('img');
    locIcon.src = 'assets/icons/location.svg';
    locIcon.alt = '';
    locIcon.width = 12;
    locIcon.height = 12;
    locIcon.setAttribute('aria-hidden', 'true');
    location.appendChild(locIcon);
    const locName = (event.location && event.location.name) || 'Lieu à confirmer';
    location.appendChild(document.createTextNode(' ' + locName));
    footer.appendChild(location);

    const priceInfo = extractPrice(event);
    footer.appendChild(createEl('span',
      priceInfo.free ? 'event-card__price event-card__price--free' : 'event-card__price',
      priceInfo.label));

    return footer;
  }

  // La partie texte : (date) + titre + (description) + footer.
  function buildBody(event, large) {
    const body = createEl('div', 'event-card__body');

    // Date au-dessus du titre : uniquement sur la petite carte.
    if (!large && event.firstTiming) {
      body.appendChild(createEl('p', 'event-card__date', formatEventDate(event.firstTiming)));
    }

    const h3 = createEl('h3');
    const link = createEl('a', null, (event.title && event.title.fr) || 'Événement');
    link.href = 'evenements.html?uid=' + event.uid;
    h3.appendChild(link);
    body.appendChild(h3);

    // Description : uniquement sur la grande carte.
    if (large && event.description && event.description.fr) {
      body.appendChild(createEl('p', 'event-card__desc', truncate(event.description.fr, 120)));
    }

    body.appendChild(buildFooter(event));
    return body;
  }

  // Assemble la carte complète.
  function createEventCard(event, options) {
    options = options || {};
    const large = options.large || false;

    const li = createEl('li', large ? 'featured-grid__hero' : null);
    const article = createEl('article', large ? 'event-card event-card--large' : 'event-card');

    article.appendChild(buildMedia(event, large));
    article.appendChild(buildBody(event, large));
    li.appendChild(article);
    return li;
  }

  // --- Utilitaires partagés entre les pages (grilles) ---

  function showGridError(grid, message) {
    const li = createEl('li', 'listing-grid__loading');
    li.setAttribute('role', 'alert');
    li.appendChild(createEl('p', null, message));
    grid.appendChild(li);
  }

  function announceToSR(container, message) {
    const el = createEl('p', 'visually-hidden', message);
    el.setAttribute('role', 'status');
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