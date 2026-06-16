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

  async function init() {
    try {
      const event = await VillaNova.api.fetchEvent(uid);
      renderEvent(event);
      loadRelatedEvents();
    } catch (err) {
      console.error('Erreur chargement evenement:', err);
      showError();
    }
  }

  function renderEvent(event) {
    const title = getText(event.title);
    document.title = title + ' — VillaNova';

    // meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', getText(event.description));

    // breadcrumb
    const breadcrumbCurrent = document.querySelector('.breadcrumb li[aria-current="page"]');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = title;

    // image de couverture
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

    // tags
    const tagsContainer = document.getElementById('event-tags');
    if (tagsContainer) {
      VillaNova.clearChildren(tagsContainer);
      const keywords = (event.keywords && event.keywords.fr) || [];
      keywords.slice(0, 3).forEach(function (kw) {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = kw;
        tagsContainer.appendChild(span);
      });
    }

    // titre
    const titleEl = document.getElementById('event-title');
    if (titleEl) titleEl.textContent = title;

    // date
    const dateEl = document.getElementById('event-date');
    if (dateEl && event.firstTiming) {
      VillaNova.clearChildren(dateEl);
      const timeEl = document.createElement('time');
      timeEl.setAttribute('datetime', event.firstTiming.begin);
      timeEl.textContent = VillaNova.formatEventDate(event.firstTiming);
      dateEl.appendChild(timeEl);
    }

    // lieu + tarif
    const lieuEl = document.getElementById('event-lieu');
    if (lieuEl) lieuEl.textContent = (event.location && event.location.name) || 'Lieu à confirmer';

    const tarifEl = document.getElementById('event-tarif');
    if (tarifEl) tarifEl.textContent = VillaNova.extractPrice(event).label;

    // description longue
    const descSection = document.getElementById('event-description');
    if (descSection) {
      const longDesc = getText(event.longDescription) || getText(event.description);
      if (longDesc) {
        VillaNova.clearChildren(descSection);
        const h2 = document.createElement('h2');
        h2.id = 'presentation-title';
        h2.textContent = 'L\'événement';
        descSection.appendChild(h2);

        const contentNodes = markdownToDOM(longDesc);
        for (let i = 0; i < contentNodes.length; i++) {
          descSection.appendChild(contentNodes[i]);
        }
        descSection.removeAttribute('hidden');
      }
    }

    // adresse sidebar
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

    // masquer le loading, afficher la page
    if (loadingEl) loadingEl.hidden = true;
    if (pageArticle) pageArticle.removeAttribute('hidden');
  }

  async function loadRelatedEvents() {
    const relatedList = document.getElementById('event-related');
    if (!relatedList) return;

    try {
      const data = await VillaNova.api.fetchEvents({ limit: 4 });
      VillaNova.clearChildren(relatedList);

      for (let i = 0; i < data.events.length; i++) {
        const ev = data.events[i];
        if (String(ev.uid) === String(uid)) continue;

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
      }
    } catch (err) {
      console.error('Erreur evenements lies:', err);
    }
  }

  function getText(field) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.fr || field.en || '';
  }

  // markdown basique → DOM
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
    const children = doc.body.childNodes;
    for (let i = 0; i < children.length; i++) {
      if (children[i].nodeType === Node.ELEMENT_NODE) {
        nodes.push(document.importNode(children[i], true));
      }
    }
    return nodes;
  }

  function showError() {
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) { errorEl.hidden = false; errorEl.focus(); }
    if (pageArticle) pageArticle.hidden = true;
  }
})();
