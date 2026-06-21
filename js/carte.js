// carte interactive Leaflet

(function () {
  'use strict';

  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  // Création de la carte, centrée sur Marseille.
  const map = L.map('map', { scrollWheelZoom: false })
    .setView([43.2965, 5.3698], 13);

  // Fond de carte OpenStreetMap.
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // Apparence d'un marqueur (un point stylé en CSS).
  const eventIcon = L.divIcon({
    className: 'map-marker',
    html: '<span class="map-marker__dot"></span>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });

  const countEl = document.getElementById('map-count');

  // Rend un texte sûr avant de l'insérer dans du HTML.
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // Construit le contenu de la bulle (popup) d'un événement.
  function buildPopup(event) {
    const title = (event.title && event.title.fr) || 'Événement';
    const loc = (event.location && event.location.name) || '';
    const date = event.firstTiming ? VillaNova.formatEventDate(event.firstTiming) : '';
    const price = VillaNova.extractPrice(event);

    let html = '<div class="map-popup">';
    html += `<h3 class="map-popup__title">${escapeHtml(title)}</h3>`;
    if (loc) html += `<p class="map-popup__location">${escapeHtml(loc)}</p>`;
    if (date) html += `<p class="map-popup__date">${escapeHtml(date)}</p>`;
    if (price.free) html += '<span class="map-popup__free">Gratuit</span>';
    html += `<a href="evenements.html?uid=${event.uid}" class="map-popup__link">Voir l'événement ↗</a>`;
    html += '</div>';
    return html;
  }

  // Crée un marqueur pour un événement, ou null s'il n'a pas de coordonnées.
  function createMarker(event) {
    const loc = event.location;
    if (!loc || !loc.latitude || !loc.longitude) return null;

    const marker = L.marker([loc.latitude, loc.longitude], { icon: eventIcon });
    marker.bindPopup(buildPopup(event), { maxWidth: 280, className: 'map-popup-wrapper' });
    marker.addTo(map);
    return marker;
  }

  // Recentre la carte pour voir tous les marqueurs.
  function fitMapToMarkers(markers) {
    if (markers.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  // Met à jour le petit texte "X lieux sur la carte".
  function updateCount(count) {
    if (!countEl) return;
    const mot = count > 1 ? 'lieux' : 'lieu';
    countEl.textContent = count + ' ' + mot + ' sur la carte';
  }

  // Va chercher les événements et place un marqueur pour chacun.
  async function loadMarkers() {
    try {
      const data = await VillaNova.api.fetchEvents({ limit: 100, offset: 0 });

      const markers = [];
      for (const event of data.events) {
        const marker = createMarker(event);
        if (marker) markers.push(marker);
      }

      fitMapToMarkers(markers);
      updateCount(markers.length);
    } catch (err) {
      console.error('Erreur chargement carte:', err);
      if (countEl) countEl.textContent = 'Impossible de charger les événements.';
    }
  }

  loadMarkers();
})();