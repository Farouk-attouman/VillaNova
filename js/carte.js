// carte interactive Leaflet

(function () {
  'use strict';

  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  const map = L.map('map', { scrollWheelZoom: false })
    .setView([43.2965, 5.3698], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  const eventIcon = L.divIcon({
    className: 'map-marker',
    html: '<span class="map-marker__dot"></span>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });

  const countEl = document.getElementById('map-count');

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function buildPopup(event) {
    const title = (event.title && event.title.fr) || 'Événement';
    const loc = (event.location && event.location.name) || '';
    const date = event.firstTiming ? VillaNova.formatEventDate(event.firstTiming) : '';
    const price = VillaNova.extractPrice(event);

    let html = '<div class="map-popup">';
    html += '<h3 class="map-popup__title">' + escapeHtml(title) + '</h3>';
    if (loc) html += '<p class="map-popup__location">' + escapeHtml(loc) + '</p>';
    if (date) html += '<p class="map-popup__date">' + escapeHtml(date) + '</p>';
    if (price.free) html += '<span class="map-popup__free">Gratuit</span>';
    html += '<a href="evenements.html?uid=' + event.uid + '" class="map-popup__link">Voir l\'événement ↗</a>';
    html += '</div>';
    return html;
  }

  async function loadMarkers() {
    try {
      const data = await VillaNova.api.fetchEvents({ limit: 100, offset: 0 });
      const markers = [];

      for (let i = 0; i < data.events.length; i++) {
        const ev = data.events[i];
        const loc = ev.location;
        if (!loc || !loc.latitude || !loc.longitude) continue;

        const marker = L.marker([loc.latitude, loc.longitude], { icon: eventIcon }).addTo(map);
        marker.bindPopup(buildPopup(ev), { maxWidth: 280, className: 'map-popup-wrapper' });
        markers.push(marker);
      }

      if (markers.length > 1) {
        map.fitBounds(L.featureGroup(markers).getBounds().pad(0.1));
      }

      if (countEl) {
        countEl.textContent = markers.length + ' lieu' + (markers.length > 1 ? 'x' : '') + ' sur la carte';
      }
    } catch (err) {
      console.error('Erreur chargement carte:', err);
      if (countEl) countEl.textContent = 'Impossible de charger les événements.';
    }
  }

  loadMarkers();
})();
