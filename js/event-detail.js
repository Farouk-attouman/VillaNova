// page detail evenement

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');

  const loadingEl = document.getElementById('event-loading');
  const errorEl = document.getElementById('event-error');
  const pageArticle = document.querySelector('.event-page');

  if (!uid) { showError(); return; }

  init();

  // --- Démarrage ---

  async function init() {
    try {
      const event = await VillaNova.api.fetchEvent(uid);
      renderEvent(event);
      setupFavButton(uid);
      loadRelatedEvents();
    } catch (err) {
      console.error('Erreur chargement evenement:', err);
      showError();
    }
  }

  // --- Petit utilitaire pour créer un élément HTML ---

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  // --- Affichage de l'événement (découpé par zone) ---

  function renderEvent(event) {
    const title = getText(event.title);

    renderMeta(event, title);
    renderCover(event, title);
    renderTags(event);
    renderHeader(event, title);
    renderRegistration(event);
    renderDescription(event);
    renderAddress(event);

    // On masque le chargement et on affiche la page.
    if (loadingEl) loadingEl.hidden = true;
    if (pageArticle) pageArticle.removeAttribute('hidden');
  }

  // Titre de l'onglet, meta description, fil d'ariane.
  function renderMeta(event, title) {
    document.title = title + ' — VillaNova';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', getText(event.description));

    const breadcrumbCurrent = document.querySelector('.breadcrumb li[aria-current="page"]');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = title;
  }

  // Image de couverture.
  function renderCover(event, title) {
    const coverImg = document.getElementById('event-cover-img');
    const coverFigure = document.getElementById('event-cover');
    if (!coverImg) return;

    const imgUrl = VillaNova.getImageUrl(event, 'full');
    if (imgUrl) {
      coverImg.src = imgUrl;
      coverImg.alt = title;
    } else if (coverFigure) {
      coverFigure.style.display = 'none';
    }
  }

  // Étiquettes (3 mots-clés max).
  function renderTags(event) {
    const tagsContainer = document.getElementById('event-tags');
    if (!tagsContainer) return;

    VillaNova.clearChildren(tagsContainer);
    const keywords = (event.keywords && event.keywords.fr) || [];
    keywords.slice(0, 3).forEach(function (kw) {
      tagsContainer.appendChild(createEl('span', 'tag', kw));
    });
  }

  // Titre, date, lieu, tarif.
  function renderHeader(event, title) {
    const titleEl = document.getElementById('event-title');
    if (titleEl) titleEl.textContent = title;

    const dateEl = document.getElementById('event-date');
    if (dateEl && event.firstTiming) {
      VillaNova.clearChildren(dateEl);
      const timeEl = createEl('time', null, VillaNova.formatEventDate(event.firstTiming));
      timeEl.setAttribute('datetime', event.firstTiming.begin);
      dateEl.appendChild(timeEl);
    }

    const lieuEl = document.getElementById('event-lieu');
    if (lieuEl) lieuEl.textContent = (event.location && event.location.name) || 'Lieu à confirmer';

    const tarifEl = document.getElementById('event-tarif');
    if (tarifEl) tarifEl.textContent = VillaNova.extractPrice(event).label;
  }

  // Vérifie si une chaîne est une URL valide (http ou https).
  function isUrl(str) {
    return /^https?:\/\//i.test(str);
  }

  // Bouton d'inscription / réservation (lien externe fourni par OpenAgenda).
  function renderRegistration(event) {
    const container = document.getElementById('event-registration');
    if (!container) return;

    // L'API peut renvoyer des URLs, des téléphones ou des emails dans registration.
    // On ne garde que les vraies URLs.
    var url = null;
    var phone = null;
    var email = null;

    if (event.registration && event.registration.length) {
      for (var i = 0; i < event.registration.length; i++) {
        var val = event.registration[i].value;
        if (!val) continue;

        if (isUrl(val)) {
          url = val;
          break;
        } else if (!phone && /^\+?[\d\s.\-()]+$/.test(val)) {
          phone = val.replace(/\s+/g, '');
        } else if (!email && val.includes('@')) {
          email = val;
        }
      }
    }

    if (!url && event.onlineAccessLink && isUrl(event.onlineAccessLink)) {
      url = event.onlineAccessLink;
    }

    // Rien à afficher si aucun contact trouvé.
    if (!url && !phone && !email) return;

    // Bouton principal : lien web, téléphone ou email selon ce qui est dispo.
    var btn = createEl('a', 'btn btn--primary event-registration__btn');

    if (url) {
      btn.href = url;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.textContent = VillaNova.extractPrice(event).free
        ? 'S\'inscrire gratuitement'
        : 'Réserver / S\'inscrire';
    } else if (phone) {
      btn.href = 'tel:' + phone;
      btn.textContent = 'Appeler pour réserver';
    } else {
      btn.href = 'mailto:' + email;
      btn.textContent = 'Contacter par email';
    }

    container.appendChild(btn);
    container.removeAttribute('hidden');
  }

  // Description longue (mise en forme depuis du markdown).
  function renderDescription(event) {
    const descSection = document.getElementById('event-description');
    if (!descSection) return;

    const longDesc = getText(event.longDescription) || getText(event.description);
    if (!longDesc) return;

    VillaNova.clearChildren(descSection);

    const h2 = createEl('h2', null, 'L\'événement');
    h2.id = 'presentation-title';
    descSection.appendChild(h2);

    markdownToDOM(longDesc).forEach(function (node) {
      descSection.appendChild(node);
    });

    descSection.removeAttribute('hidden');
  }

  // Adresse dans la barre latérale.
  function renderAddress(event) {
    const addressEl = document.getElementById('event-address');
    if (!addressEl || !event.location) return;

    VillaNova.clearChildren(addressEl);

    addressEl.appendChild(createEl('strong', null, event.location.name || ''));

    if (event.location.address) {
      addressEl.appendChild(document.createElement('br'));
      addressEl.appendChild(document.createTextNode(event.location.address));
    }
    if (event.location.city) {
      addressEl.appendChild(document.createElement('br'));
      addressEl.appendChild(document.createTextNode(
        (event.location.postalCode || '') + ' ' + event.location.city
      ));
    }
  }

  // --- Événements liés (en bas de page) ---

  async function loadRelatedEvents() {
    const relatedList = document.getElementById('event-related');
    if (!relatedList) return;

    try {
      const data = await VillaNova.api.fetchEvents({ limit: 4 });
      VillaNova.clearChildren(relatedList);

      for (const ev of data.events) {
        // On ne propose pas l'événement qu'on est déjà en train de regarder.
        if (String(ev.uid) === String(uid)) continue;
        relatedList.appendChild(buildRelatedItem(ev));
      }
    } catch (err) {
      console.error('Erreur evenements lies:', err);
    }
  }

  function buildRelatedItem(ev) {
    const li = document.createElement('li');
    const a = createEl('a');
    a.href = 'evenements.html?uid=' + ev.uid;

    if (ev.firstTiming) {
      const time = createEl('time', null, VillaNova.formatEventDate(ev.firstTiming));
      time.setAttribute('datetime', ev.firstTiming.begin);
      a.appendChild(time);
    }

    a.appendChild(createEl('span', null, getText(ev.title)));

    li.appendChild(a);
    return li;
  }

  // --- Utilitaires ---

  // Récupère le texte d'un champ (chaîne directe, ou objet { fr, en }).
  function getText(field) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.fr || field.en || '';
  }

  // Convertit un markdown basique en éléments DOM.
  function markdownToDOM(text) {
    if (!text) return [];

    let html = text
      .replace(/^[_\-]{3,}$/gm, '<hr>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>');

    html = '<p>' + html + '</p>';
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*<hr>\s*<\/p>/g, '<hr>');

    const doc = new DOMParser().parseFromString(html, 'text/html');

    const nodes = [];
    for (const child of doc.body.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        nodes.push(document.importNode(child, true));
      }
    }
    return nodes;
  }

  // Bouton favori : état initial + clic.
  function setupFavButton(eventUid) {
    const btn = document.getElementById('event-fav-btn');
    if (!btn || !VillaNova.favorites) return;

    btn.setAttribute('data-uid', String(eventUid));

    // Apparence initiale si l'événement est déjà en favori.
    if (VillaNova.favorites.isInList(eventUid)) {
      btn.classList.add('event-card__fav--active');
      btn.textContent = '♥';
      btn.setAttribute('aria-label', 'Retirer des favoris');
    }

    btn.addEventListener('click', function () {
      VillaNova.favorites.toggle(eventUid);
    });
  }

  // Affiche le message d'erreur et cache la page.
  function showError() {
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) { errorEl.hidden = false; errorEl.focus(); }
    if (pageArticle) pageArticle.hidden = true;
  }
})();