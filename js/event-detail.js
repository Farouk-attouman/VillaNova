// VillaNova - Page detail evenement (evenements.html)
// Lit ?uid= dans l'URL, fetch l'evenement, peuple le DOM.

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');

  const loadingEl = document.getElementById('event-loading');
  const errorEl = document.getElementById('event-error');
  const pageArticle = document.querySelector('.event-page');

  // Si pas de uid, afficher l'erreur
  if (!uid) {
    showError();
    return;
  }

  // Chargement

  init();

  async function init() {
    try {
      const event = await VillaNova.api.fetchEvent(uid);
      renderEvent(event);
      loadRelatedEvents();
    } catch (err) {
      console.error('VillaNova API:', err);
      showError();
    }
  }

  /**
   * Peuple tous les elements de la page avec les donnees de l'evenement.
   * Utilise try/finally pour TOUJOURS masquer le loading.
   */
  function renderEvent(event) {
    try {
      const title = getText(event.title);

      // Titre de la page
      document.title = title + ' \u2014 VillaNova';

      // Meta description
      try {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', getText(event.description));
      } catch (e) { console.warn('meta desc:', e); }

      // Breadcrumb : dernier element
      try {
        const breadcrumbCurrent = document.querySelector('.breadcrumb li[aria-current="page"]');
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = title;
      } catch (e) { console.warn('breadcrumb:', e); }

      // Image cover
      try {
        const coverImg = document.getElementById('event-cover-img');
        const coverFigure = document.getElementById('event-cover');
        if (coverImg) {
          const imgUrl = VillaNova.getImageUrl(event, 'full');
          if (imgUrl) {
            coverImg.src = imgUrl;
            coverImg.alt = title;
          } else if (coverFigure) {
            coverFigure.style.display = 'none';
          }
        }
      } catch (e) { console.warn('cover:', e); }

      // Tags
      try {
        const tagsContainer = document.getElementById('event-tags');
        if (tagsContainer) {
          VillaNova.clearChildren(tagsContainer);
          const keywords = (event.keywords && event.keywords.fr) || [];
          if (keywords.length > 0) {
            keywords.slice(0, 3).forEach(function (kw) {
              const span = document.createElement('span');
              span.className = 'tag';
              span.textContent = kw;
              tagsContainer.appendChild(span);
            });
          }
        }
      } catch (e) { console.warn('tags:', e); }

      // Titre principal
      try {
        const titleEl = document.getElementById('event-title');
        if (titleEl) titleEl.textContent = title;
      } catch (e) { console.warn('title:', e); }

      // Meta : Date
      try {
        const dateEl = document.getElementById('event-date');
        if (dateEl && event.firstTiming) {
          VillaNova.clearChildren(dateEl);
          const timeEl = document.createElement('time');
          timeEl.setAttribute('datetime', event.firstTiming.begin);
          timeEl.textContent = VillaNova.formatEventDate(event.firstTiming);
          dateEl.appendChild(timeEl);
        }
      } catch (e) { console.warn('date:', e); }

      // Meta : Lieu
      try {
        const lieuEl = document.getElementById('event-lieu');
        if (lieuEl) lieuEl.textContent = (event.location && event.location.name) || 'Lieu \u00e0 confirmer';
      } catch (e) { console.warn('lieu:', e); }

      // Meta : Tarif
      try {
        const tarifEl = document.getElementById('event-tarif');
        if (tarifEl) {
          const price = VillaNova.extractPrice(event);
          tarifEl.textContent = price.label;
        }
      } catch (e) { console.warn('tarif:', e); }

      // Description longue (avec support markdown)
      try {
        const descSection = document.getElementById('event-description');
        if (descSection) {
          const longDesc = getText(event.longDescription) || getText(event.description);
          if (longDesc) {
            VillaNova.clearChildren(descSection);
            const h2 = document.createElement('h2');
            h2.id = 'presentation-title';
            h2.textContent = 'L\'\u00e9v\u00e9nement';
            descSection.appendChild(h2);

            const contentNodes = markdownToDOM(longDesc);
            contentNodes.forEach(function (node) {
              descSection.appendChild(node);
            });

            descSection.removeAttribute('hidden');
          }
        }
      } catch (e) { console.warn('description:', e); }

      // Sidebar : adresse
      try {
        const addressEl = document.getElementById('event-address');
        if (addressEl && event.location) {
          VillaNova.clearChildren(addressEl);
          const strong = document.createElement('strong');
          strong.textContent = event.location.name || '';
          addressEl.appendChild(strong);

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
      } catch (e) { console.warn('address:', e); }

    } finally {
      // TOUJOURS masquer le loading et montrer le contenu
      if (loadingEl) loadingEl.hidden = true;
      if (pageArticle) pageArticle.removeAttribute('hidden');
    }
  }

  /**
   * Charge les evenements voisins pour la sidebar.
   */
  async function loadRelatedEvents() {
    const relatedList = document.getElementById('event-related');
    if (!relatedList) return;

    try {
      const data = await VillaNova.api.fetchEvents({ limit: 4 });
      VillaNova.clearChildren(relatedList);

      data.events.forEach(function (ev) {
        if (String(ev.uid) === String(uid)) return;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = 'evenements.html?uid=' + ev.uid;

        if (ev.firstTiming) {
          const time = document.createElement('time');
          time.setAttribute('datetime', ev.firstTiming.begin);
          time.textContent = VillaNova.formatEventDate(ev.firstTiming);
          a.appendChild(time);
        }

        const span = document.createElement('span');
        span.textContent = getText(ev.title);
        a.appendChild(span);

        li.appendChild(a);
        relatedList.appendChild(li);
      });
    } catch (err) {
      console.error('VillaNova related events:', err);
    }
  }

  // Helpers

  function getText(field) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.fr || field.en || '';
  }

  /**
   * Convertit du texte markdown en elements DOM securises.
   */
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

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const nodes = [];
    const children = doc.body.childNodes;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.nodeType === Node.ELEMENT_NODE) {
        nodes.push(document.importNode(node, true));
      }
    }

    return nodes;
  }

  function showError() {
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.focus();
    }
    if (pageArticle) pageArticle.hidden = true;
  }

})();
